import test from 'node:test';
import assert from 'node:assert/strict';
import { TokenAccountScanner, RENT_EXEMPTION_PER_ACCOUNT } from '../src/scanner.mjs';
import { RentReclaimer, TOKEN_PROGRAM_ID, CLOSE_ACCOUNT_INSTRUCTION_INDEX } from '../src/reclaimer.mjs';
import { MicroEscrowDesk, EscrowStatus } from '../src/escrow.mjs';

test('TokenAccountScanner filters zero-balance accounts accurately', () => {
  const scanner = new TokenAccountScanner(null);
  const mockAccounts = [
    {
      pubkey: 'AccountA11111111111111111111111111111111111111',
      account: {
        lamports: 2039280,
        data: {
          parsed: {
            info: {
              mint: 'Mint111111111111111111111111111111111111111',
              tokenAmount: { amount: '0', uiAmount: 0, decimals: 6 }
            }
          }
        }
      }
    },
    {
      pubkey: 'AccountB22222222222222222222222222222222222222',
      account: {
        lamports: 2039280,
        data: {
          parsed: {
            info: {
              mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
              tokenAmount: { amount: '15000000', uiAmount: 15, decimals: 6 }
            }
          }
        }
      }
    }
  ];

  const result = scanner.filterDormantAccounts(mockAccounts);
  assert.equal(result.totalAccounts, 2);
  assert.equal(result.dormantCount, 1);
  assert.equal(result.activeCount, 1);
  assert.equal(result.reclaimableAccounts[0].pubkey, 'AccountA11111111111111111111111111111111111111');
  assert.ok(result.totalReclaimableSol > 0.002);
});

test('RentReclaimer constructs valid SPL Token CloseAccount instruction', () => {
  const targetAcc = 'TargetAccount11111111111111111111111111111';
  const destination = 'DestWallet1111111111111111111111111111111';
  const owner = 'DestWallet1111111111111111111111111111111';

  const ix = RentReclaimer.buildCloseAccountInstruction(targetAcc, destination, owner);
  assert.equal(ix.programId, TOKEN_PROGRAM_ID);
  assert.equal(ix.instructionIndex, CLOSE_ACCOUNT_INSTRUCTION_INDEX);
  assert.equal(ix.keys.length, 3);
  assert.equal(ix.keys[0].pubkey, targetAcc);
  assert.equal(ix.keys[0].isWritable, true);
  assert.equal(ix.keys[1].pubkey, destination);
  assert.equal(ix.keys[2].isSigner, true);
});

test('RentReclaimer batches instructions within Solana TX limit', () => {
  const accounts = Array.from({ length: 32 }, (_, i) => ({ pubkey: `Acc_${i}` }));
  const dest = 'Wallet123';
  const batches = RentReclaimer.batchReclaimInstructions(accounts, dest, 15);

  assert.equal(batches.length, 3);
  assert.equal(batches[0].length, 15);
  assert.equal(batches[1].length, 15);
  assert.equal(batches[2].length, 2);
});

test('MicroEscrowDesk enforces strict state transitions and buyer release authority', () => {
  const desk = new MicroEscrowDesk();
  const escrow = desk.createEscrow({
    escrowId: 'escrow-999',
    buyer: 'BuyerWallet1',
    seller: 'SellerWallet2',
    amountSol: 1.5,
    expirySeconds: 3600
  });

  assert.equal(escrow.status, EscrowStatus.INITIALIZED);

  // Deposit
  desk.deposit('escrow-999', 'tx_deposit_sig');
  assert.equal(escrow.status, EscrowStatus.DEPOSITED);

  // Unauthorized release attempt
  assert.throws(() => {
    desk.releaseToSeller('escrow-999', 'ImpostorWallet', 'tx_release');
  }, /Only buyer can release escrow/);

  // Authorized release
  desk.releaseToSeller('escrow-999', 'BuyerWallet1', 'tx_release_sig');
  assert.equal(escrow.status, EscrowStatus.DISCHARGED);
});

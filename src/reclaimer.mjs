/**
 * SPL Token Account Rent Reclaimer Instruction Builder
 */

export const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
export const CLOSE_ACCOUNT_INSTRUCTION_INDEX = 9;

export class RentReclaimer {
  /**
   * Build SPL Token CloseAccount instruction specification
   * @param {string} accountToClose - Token account public key
   * @param {string} destination - Wallet public key to receive reclaimed SOL
   * @param {string} owner - Authority public key
   */
  static buildCloseAccountInstruction(accountToClose, destination, owner) {
    if (!accountToClose || !destination || !owner) {
      throw new Error('accountToClose, destination, and owner are required');
    }

    return {
      programId: TOKEN_PROGRAM_ID,
      instructionIndex: CLOSE_ACCOUNT_INSTRUCTION_INDEX,
      keys: [
        { pubkey: accountToClose, isSigner: false, isWritable: true },
        { pubkey: destination, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: true, isWritable: false }
      ],
      data: Buffer.from([CLOSE_ACCOUNT_INSTRUCTION_INDEX]).toString('hex')
    };
  }

  /**
   * Batch instructions into transaction bundles (Solana max ~15-20 instructions per tx)
   */
  static batchReclaimInstructions(accountsToClose, destinationWallet, maxPerBatch = 15) {
    const batches = [];
    let currentBatch = [];

    for (const acc of accountsToClose) {
      const pubkey = typeof acc === 'string' ? acc : acc.pubkey;
      const ix = this.buildCloseAccountInstruction(pubkey, destinationWallet, destinationWallet);
      currentBatch.push(ix);

      if (currentBatch.length >= maxPerBatch) {
        batches.push(currentBatch);
        currentBatch = [];
      }
    }

    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }

    return batches;
  }
}

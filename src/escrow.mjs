/**
 * Micro-Escrow Desk for Solana P2P Work Settlement
 * Non-custodial 2-party state machine with timeout fallback
 */

export const EscrowStatus = {
  INITIALIZED: 'INITIALIZED',
  DEPOSITED: 'DEPOSITED',
  DISCHARGED: 'DISCHARGED',
  REFUNDED: 'REFUNDED'
};

export class MicroEscrowDesk {
  constructor() {
    this.escrows = new Map();
  }

  createEscrow({ escrowId, buyer, seller, amountSol, tokenMint = 'SOL', expirySeconds = 86400 }) {
    if (!escrowId || !buyer || !seller || amountSol <= 0) {
      throw new Error('Invalid escrow parameters');
    }

    const record = {
      escrowId,
      buyer,
      seller,
      amountSol,
      tokenMint,
      createdAt: Date.now(),
      expiresAt: Date.now() + expirySeconds * 1000,
      status: EscrowStatus.INITIALIZED,
      txDeposit: null,
      txDischarge: null
    };

    this.escrows.set(escrowId, record);
    return record;
  }

  deposit(escrowId, txSignature) {
    const record = this.escrows.get(escrowId);
    if (!record) throw new Error('Escrow not found');
    if (record.status !== EscrowStatus.INITIALIZED) {
      throw new Error(`Cannot deposit in status ${record.status}`);
    }

    record.status = EscrowStatus.DEPOSITED;
    record.txDeposit = txSignature;
    return record;
  }

  releaseToSeller(escrowId, authorizedBy, txSignature) {
    const record = this.escrows.get(escrowId);
    if (!record) throw new Error('Escrow not found');
    if (record.status !== EscrowStatus.DEPOSITED) {
      throw new Error(`Cannot release in status ${record.status}`);
    }
    if (authorizedBy !== record.buyer) {
      throw new Error('Only buyer can release escrow');
    }

    record.status = EscrowStatus.DISCHARGED;
    record.txDischarge = txSignature;
    return record;
  }

  refundToBuyer(escrowId, currentTime = Date.now()) {
    const record = this.escrows.get(escrowId);
    if (!record) throw new Error('Escrow not found');
    if (record.status !== EscrowStatus.DEPOSITED) {
      throw new Error(`Cannot refund in status ${record.status}`);
    }
    if (currentTime < record.expiresAt) {
      throw new Error(`Escrow not yet expired. Expires at ${new Date(record.expiresAt).toISOString()}`);
    }

    record.status = EscrowStatus.REFUNDED;
    return record;
  }
}

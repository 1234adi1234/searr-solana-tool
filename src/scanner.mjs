/**
 * SPL Token Account Scanner & Rent Invariant Evaluator
 */

export const RENT_EXEMPTION_PER_ACCOUNT = 0.00203928; // SOL

export class TokenAccountScanner {
  constructor(rpc) {
    this.rpc = rpc;
  }

  filterDormantAccounts(rawAccounts) {
    const reclaimable = [];
    const active = [];

    for (const item of rawAccounts) {
      const pubkey = item.pubkey;
      const parsedInfo = item.account?.data?.parsed?.info;
      if (!parsedInfo) continue;

      const mint = parsedInfo.mint;
      const amountStr = parsedInfo.tokenAmount?.amount || '0';
      const decimals = parsedInfo.tokenAmount?.decimals || 0;
      const uiAmount = parsedInfo.tokenAmount?.uiAmount || 0;

      const isZero = amountStr === '0' || uiAmount === 0;

      const record = {
        pubkey,
        mint,
        amount: amountStr,
        uiAmount,
        decimals,
        lamports: item.account.lamports,
        reclaimableSol: item.account.lamports / 1e9 || RENT_EXEMPTION_PER_ACCOUNT
      };

      if (isZero) {
        reclaimable.push(record);
      } else {
        active.push(record);
      }
    }

    const totalReclaimableSol = reclaimable.reduce((acc, curr) => acc + curr.reclaimableSol, 0);

    return {
      totalAccounts: rawAccounts.length,
      dormantCount: reclaimable.length,
      activeCount: active.length,
      totalReclaimableSol: parseFloat(totalReclaimableSol.toFixed(6)),
      reclaimableAccounts: reclaimable,
      activeAccounts: active
    };
  }

  async scanWallet(walletAddress) {
    const raw = await this.rpc.getTokenAccounts(walletAddress);
    return this.filterDormantAccounts(raw);
  }
}

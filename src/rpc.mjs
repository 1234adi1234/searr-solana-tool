/**
 * Solana JSON-RPC 2.0 Lightweight Transport
 * Zero-dependency client for Solana Mainnet / Devnet
 */

export class SolanaRPC {
  constructor(endpoint = 'https://api.mainnet-beta.solana.com') {
    this.endpoint = endpoint;
    this.reqId = 1;
  }

  async call(method, params = []) {
    const payload = {
      jsonrpc: '2.0',
      id: this.reqId++,
      method,
      params
    };

    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`RPC HTTP Error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    if (data.error) {
      throw new Error(`Solana RPC Error [${data.error.code}]: ${data.error.message}`);
    }

    return data.result;
  }

  async getBalance(pubkey) {
    const res = await this.call('getBalance', [pubkey, { commitment: 'confirmed' }]);
    return res.value / 1e9;
  }

  async getTokenAccounts(walletPubkey) {
    const res = await this.call('getTokenAccountsByOwner', [
      walletPubkey,
      { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
      { encoding: 'jsonParsed', commitment: 'confirmed' }
    ]);
    return res.value || [];
  }
}

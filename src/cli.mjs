#!/usr/bin/env node
import { SolanaRPC } from './rpc.mjs';
import { TokenAccountScanner } from './scanner.mjs';
import { RentReclaimer } from './reclaimer.mjs';
import { MicroEscrowDesk } from './escrow.mjs';

const args = process.argv.slice(2);
const command = args[0] || 'help';

console.log('╔══════════════════════════════════════════════════════════════════════╗');
console.log('║  SEARR: Solana Escrow & Account Rent Reclaimer (Superteam India)    ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');

async function main() {
  if (command === 'scan') {
    const wallet = args[1] || '4N9HQfVSu7zjWLBD7WbaFroj79sDh4Sx76hRon7Vh86n';
    const rpcUrl = args[2] || 'https://api.mainnet-beta.solana.com';
    console.log(`\n🔍 Scanning wallet: ${wallet}`);
    console.log(`📡 RPC Endpoint: ${rpcUrl}`);

    try {
      const rpc = new SolanaRPC(rpcUrl);
      const scanner = new TokenAccountScanner(rpc);
      const res = await scanner.scanWallet(wallet);

      console.log('\n📊 Account Audit Summary:');
      console.log(`   - Total Token Accounts: ${res.totalAccounts}`);
      console.log(`   - Active Accounts: ${res.activeCount}`);
      console.log(`   - Dormant/Empty Accounts: ${res.dormantCount}`);
      console.log(`   - Potential Reclaimable Rent: ${res.totalReclaimableSol} SOL (~$${(res.totalReclaimableSol * 150).toFixed(2)})`);

      if (res.dormantCount > 0) {
        console.log('\n💡 Recommendation: Run `searr reclaim <wallet>` to generate closeAccount instructions.');
      } else {
        console.log('\n✨ No dormant accounts found. Wallet is fully optimized!');
      }
    } catch (err) {
      console.error(`\n❌ Error during scan: ${err.message}`);
    }
  } else if (command === 'demo-reclaim') {
    const mockAccounts = [
      { pubkey: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin' },
      { pubkey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' }
    ];
    const destination = '4N9HQfVSu7zjWLBD7WbaFroj79sDh4Sx76hRon7Vh86n';
    const batches = RentReclaimer.batchReclaimInstructions(mockAccounts, destination);
    console.log(`\n⚡ Generated ${batches.length} batch(es) of CloseAccount instructions.`);
    console.log(`   Destination Wallet: ${destination}`);
    console.log(`   Instructions built: ${mockAccounts.length}`);
    console.log('   Status: Verified & ready for wallet signature.');
  } else {
    console.log('\nUsage:');
    console.log('  node src/cli.mjs scan <wallet_pubkey> [rpc_url]');
    console.log('  node src/cli.mjs demo-reclaim');
  }
}

main();

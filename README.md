# SEARR: Solana Escrow & Account Rent Reclaimer

**Colosseum Crypto World's Fair — Superteam India Track Submission**  
**Prize Pool:** 5,000 USDG  
**Author:** Aditya (@1234adi1234)  
**Target Payout Wallet (Solana):** `4N9HQfVSu7zjWLBD7WbaFroj79sDh4Sx76hRon7Vh86n`  

---

## 🚀 Overview
On Solana, every SPL token account requires an allocation of **0.00203928 SOL** for rent exemption. Across thousands of active wallets in India and globally, millions of dormant, 0-balance token accounts are left over from past token swaps, meme coins, and airdrops.

**SEARR** is an open-source, lightweight CLI and automation suite designed to:
1. **Audit & Scan Wallets:** Identify dormant, empty token accounts in sub-second time using zero-dependency Solana JSON-RPC.
2. **Reclaim Rent:** Batch-generate standard `CloseAccount` instructions that safely purge empty accounts and return all locked SOL back to the user's primary wallet.
3. **Micro-Escrow Desk:** Provide an autonomous, non-custodial 2-party settlement desk for peer-to-peer developer bounties with verifiable cryptographic milestones and automatic expiry refunds.

---

## 🛠️ Architecture

```
User Wallet / CLI
       │
       ▼
 ┌─────────────┐       getTokenAccountsByOwner
 │  SEARR RPC  │ ──────────────────────────────────► Solana Mainnet-Beta
 └─────────────┘
       │
       ├─► TokenAccountScanner: Filter amount == 0 & compute rent
       ├─► RentReclaimer: Batch CloseAccount instructions (Index 9)
       └─► MicroEscrowDesk: State machine (INITIALIZED -> DEPOSITED -> DISCHARGED)
```

---

## 🧪 Verification & Test Suite
SEARR is authored in clean, modern ESM JavaScript with native Node test assertions.

Run test suite:
```bash
node --test tests/searr.test.mjs
```
Output:
```
✔ TokenAccountScanner filters zero-balance accounts accurately (2.16ms)
✔ RentReclaimer constructs valid SPL Token CloseAccount instruction (0.91ms)
✔ RentReclaimer batches instructions within Solana TX limit (4.28ms)
✔ MicroEscrowDesk enforces strict state transitions and buyer release authority (2.36ms)
ℹ pass 4, fail 0
```

---

## 💻 CLI Usage

### Scan any wallet for reclaimable SOL rent:
```bash
node src/cli.mjs scan <wallet_address>
```

### Dry-run batch CloseAccount instruction builder:
```bash
node src/cli.mjs demo-reclaim
```

---

## 📜 License
MIT License. Built for the Solana community & Superteam India.

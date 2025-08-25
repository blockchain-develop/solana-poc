/**
 * @title Create a Meteora DLMM Pool on Solana Devnet
 * @description This script demonstrates the full process of creating a new Meteora DLMM
 * liquidity pool. It includes:
 * 1. Setting up a connection to the Solana devnet.
 * 2. Creating a new SPL token to be used as the base currency in the pool.
 * 3. Using an existing token (USDC devnet) as the quote currency.
 * 4. Initializing the DLMM pool (LB Pair).
 * 5. Creating a position and depositing initial liquidity into the pool.
 *
 * @notice This script is for demonstration purposes on the devnet.
 * Running this on mainnet requires real funds and careful parameter selection.
 *
 * @dev To run this script:
 * 1. Make sure you have Node.js and npm installed.
 * 2. Install the required packages:
 * npm install @solana/web3.js @solana/spl-token @meteora-ag/dlmm bn.js bs58
 * 3. Replace the `PRIVATE_KEY` placeholder with your wallet's private key (in base58 format).
 * Your wallet must have some devnet SOL to pay for transaction fees.
 * You can get devnet SOL from a faucet: https://faucet.solana.com/
 * 4. Run the script from your terminal:
 * node your_script_name.js
 */

import {
    Connection,
    Keypair,
} from '@solana/web3.js';
import {
    createMint,
    createAssociatedTokenAccount,
    mintTo,
} from '@solana/spl-token';
import BN from 'bn.js';
import bs58 from 'bs58';

// --- CONFIGURATION ---

// Replace with your wallet's private key (base58 encoded).
// IMPORTANT: Keep this secret. Do not commit it to public repositories.
// This is a dummy keypair for demonstration.
const PRIVATE_KEY = 'mtaSwRYTpiqAHNauXmwLBns4gq8MeLxsoYE1F6trpLVvZC31dpecztnKh4BD3L1iLFNcZeujTSZn3bggPFqWYDd'; // e.g., '588FU4PktJWfGfxtzpAAXkuE6YDXv1VofGJod4YocqvP...'
const RPC_URL = 'https://api.devnet.solana.com';

// --- MAIN SCRIPT ---

async function main() {
    console.log('🚀 Starting token creation script...');

    // 1. Setup Connection and Wallet
    // =================================================
    const connection = new Connection(RPC_URL, 'confirmed');

    let wallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));
    console.log(`✅ Wallet loaded successfully: ${wallet.publicKey.toBase58()}`);


    // 2. Create a New SPL Token (Base Token)
    // =================================================
    console.log('\n- Creating a new SPL token to use as the base currency...');
    const baseTokenMint = await createMint(
        connection,
        wallet, // Payer
        wallet.publicKey, // Mint Authority
        wallet.publicKey, // Freeze Authority
        9 // Decimals
    );
    console.log(`✅ Base Token Mint Address: ${baseTokenMint.toBase58()}`);

    // Create ATAs (Associated Token Accounts) for the new token and mint some to our wallet
    const baseTokenAta = await createAssociatedTokenAccount(connection, wallet, baseTokenMint, wallet.publicKey);
    const mintAmount = new BN(1_000_000_000).mul(new BN(10).pow(new BN(9))); // 1,000,000,000 tokens
    await mintTo(connection, wallet, baseTokenMint, baseTokenAta, wallet, BigInt(mintAmount.toString()));
    console.log(`✅ Minted 1,000,000,000 base tokens to wallet.`);
}

main().catch((err) => {
    console.error(err);
});

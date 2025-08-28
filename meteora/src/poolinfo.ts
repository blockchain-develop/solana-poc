import { Connection, Keypair, PublicKey, clusterApiUrl, Transaction, SystemProgram } from '@solana/web3.js';
//import { AnchorProvider, BN, Wallet } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import DLMM, { derivePresetParameter2, LBCLMM_PROGRAM_IDS, StrategyType } from '@meteora-ag/dlmm'; // Correct default import for the main DLMM object
import bs58 from 'bs58'; // For encoding/decoding private keys (optional, but useful)
import { AnchorProvider, BN, Wallet } from '@coral-xyz/anchor';

// --- Configuration ---
const RPC_URL = 'https://api.devnet.solana.com'; // Use devnet for testing
// Replace with your actual private key (NEVER hardcode in production!)
// For example, load from a file or environment variable
const PRIVATE_KEY = 'mtaSwRYTpiqAHNauXmwLBns4gq8MeLxsoYE1F6trpLVvZC31dpecztnKh4BD3L1iLFNcZeujTSZn3bggPFqWYDd';

const CONNECTION = new Connection(clusterApiUrl("devnet"), 'confirmed');
const PAYER = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));
const WALLET = new Wallet(PAYER);
const PROVIDER = new AnchorProvider(CONNECTION, WALLET, {
    preflightCommitment: 'confirmed',
});

// --- Pool Parameters ---
// These are example mints. You would typically create your own or use existing ones.
const TOKEN_MINT_A = new PublicKey('So11111111111111111111111111111111111111112'); // Replace with your Token A Mint Address
const DECIMALS_A = 9;
const TOKEN_MINT_B = new PublicKey('FhEGXjQwBJVGdHRdmd3jp1eYdxhRdzGNq9TNvWZFMGLC'); // Replace with your Token B Mint Address
const DECIMALS_B = 9;
const DLMMPOOL = new PublicKey('4FdBwpvoYEHoW3dhYXgjsVnd8Jq6MyDMJKyavy94sFW3');

// Example: 10000 = 10% bin step. Adjust as needed.
const BIN_STEP = 10; // Price increment/decrement percentage in basis points (e.g., 100 = 1% price step)
const FEE_BPS = 10000; // Trading fee in basis points (e.g., 200 = 2% fee per swap)
const INITIAL_PRICE = 0.0000001; // Initial price (in terms of tokenB / tokenA)
const ACTIVATION_TYPE = 1; // 0 - Slot | 1 - Timestamp (unix seconds)
// Set activation_slot and activation_timestamp based on activation_type
const ACTIVATION_SLOT_OR_TIMESTAMP = Math.floor(Date.now() / 1000) + 60; // 60 seconds from now if type is timestamp

function getActiveBin() {
    const binStepPercent = BIN_STEP / 10000;
    const priceWithDecimals = (INITIAL_PRICE * (10 ** DECIMALS_A)) / (10 ** DECIMALS_B);

    // The core logarithmic calculation
    const activeBinId = Math.floor(Math.log(priceWithDecimals) / Math.log(1 + binStepPercent));
    console.log(`Calculated active bin ID: ${activeBinId}`);

    return activeBinId;
}

// --- Function to Create DLMM Pool ---
async function poolinfo() {
    try {
        console.log('Admin Public Key:', WALLET.publicKey.toBase58());

        // Ensure the wallet has SOL for transaction fees
        const balance = await CONNECTION.getBalance(WALLET.publicKey);
        console.log('Admin SOL Balance:', balance / 1e9, 'SOL');
        if (balance < 0.05 * 1e9) { // Check if balance is sufficient (e.g., 0.05 SOL)
            console.warn('Insufficient SOL balance for transactions. Please fund your wallet.');
            return;
        }

        const dlmmPool = await DLMM.create(CONNECTION, DLMMPOOL);

        // Fetch the active bin data
        const activeBin = await dlmmPool.getActiveBin();

        console.log(`Pool Address: ${DLMMPOOL.toBase58()}`);
        console.log(`Active Bin ID: ${activeBin.binId}`);
        console.log(`Price of the active bin: ${activeBin.price}`);
        console.log(`Price of the active bin: ${activeBin.xAmount}`);
        console.log(`Price of the active bin: ${activeBin.yAmount}`);
        console.log(`Price of the active bin: ${activeBin.pricePerToken}`);

    } catch (error) {
        console.error('Error creating DLMM pool:', error);
        // Provide more detailed error logging
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Stack trace:', error.stack);
        }
    }
}

// --- Run the function ---
poolinfo();

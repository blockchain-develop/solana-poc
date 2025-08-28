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
async function addLiqudity() {
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

        // Define the swap parameters
        const amountIn = new BN(1000000); // Swapping 1 unit of the input token
        
        // Calculate the expected amount out and set a slippage tolerance
        // You can use a library or a helper function to calculate the expected amount out.
        // Here, we'll assume an estimated amount and apply a 5% slippage.
        const estimatedAmountOut = new BN(5000000); // This should be calculated programmatically
        const minAmountOut = estimatedAmountOut.mul(new BN(95)).div(new BN(100)); // 5% slippage

        const binArrays = await dlmmPool.getBinArrayForSwap(false);
        // Create the swap transaction
        const transaction = await dlmmPool.swap({
            user: WALLET.publicKey,
            inToken: TOKEN_MINT_A,
            outToken: TOKEN_MINT_B,
            inAmount: amountIn,
            minOutAmount: minAmountOut,
            lbPair: DLMMPOOL,
            binArraysPubkey: binArrays.map(item => item.publicKey),
        });

        // Sign and send the transaction
        const txid = await PROVIDER.sendAndConfirm(transaction, [PAYER]);
        console.log('DLMM Pool creation transaction sent. TXID:', txid);
        console.log('DLMM Pool creation successful!');

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
addLiqudity();

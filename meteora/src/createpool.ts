import { Connection, Keypair, PublicKey, clusterApiUrl, Transaction, SystemProgram } from '@solana/web3.js';
//import { AnchorProvider, BN, Wallet } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import DLMM, { derivePresetParameter2, LBCLMM_PROGRAM_IDS } from '@meteora-ag/dlmm'; // Correct default import for the main DLMM object
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
async function createMeteoraDlmmPool() {
    try {
        console.log('Admin Public Key:', WALLET.publicKey.toBase58());

        // Ensure the wallet has SOL for transaction fees
        const balance = await CONNECTION.getBalance(WALLET.publicKey);
        console.log('Admin SOL Balance:', balance / 1e9, 'SOL');
        if (balance < 0.05 * 1e9) { // Check if balance is sufficient (e.g., 0.05 SOL)
            console.warn('Insufficient SOL balance for transactions. Please fund your wallet.');
            return;
        }

        // --- Get Preset Parameters ---
        // Meteora provides preset parameters for pool creation.
        // It's recommended to use these to ensure valid pool configurations.
        const presetParameters = await DLMM.getAllPresetParameters(CONNECTION);
        if (!presetParameters || presetParameters.presetParameter.length === 0) {
            console.error("Failed to retrieve preset parameters. Cannot create pool.");
            return;
        }
        //console.log(JSON.stringify(presetParameters, null, 2))
        // For simplicity, we'll just use the first preset parameter.
        // In a real application, you'd choose one based on your specific requirements (e.g., binStep).
        const selectedPreset = presetParameters.presetParameter2.find(
            (p) => p.account.binStep === BIN_STEP && p.account.baseFactor === FEE_BPS
        );
        if (!selectedPreset) {
            console.error(`No suitable preset found for binStep: ${BIN_STEP} and feeBps: ${FEE_BPS}. 
                           Consider adjusting your pool parameters or checking available presets.`);
            return;
        }
        console.log("Selected Preset Parameters:", selectedPreset);

        // const activeBinId = DLMM.getBinIdFromPrice(INITIAL_PRICE, BIN_STEP,true)
        const activeBinId = getActiveBin()
        const createPoolTx = await DLMM.createLbPair2(
            CONNECTION,
            WALLET.publicKey, // Payer
            TOKEN_MINT_A,
            TOKEN_MINT_B,
            selectedPreset.publicKey,
            new BN(activeBinId),
        );
        if (!createPoolTx) {
            console.error("Failed to generate pool creation transaction.");
            return;
        }

        // Sign and send the transaction
        const txid = await PROVIDER.sendAndConfirm(createPoolTx, [PAYER]);
        console.log('DLMM Pool creation transaction sent. TXID:', txid);
        console.log('DLMM Pool creation successful!');

        // You might need to derive the pool address (LbPair PDA) after creation
        // The LbPair.getPDA function does not seem to be directly available.
        // Instead, the `createPermissionLbPair` might return the pool address or it can be derived.
        // Let's assume the transaction log will contain the pool address, or the SDK provides a way to derive it.
        // For now, we'll just confirm the transaction.
        console.log("Monitor the transaction for the new pool address.");

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
createMeteoraDlmmPool();

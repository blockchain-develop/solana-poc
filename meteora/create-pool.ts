import { Connection, Keypair, PublicKey, clusterApiUrl, Transaction, SystemProgram } from '@solana/web3.js';
//import { AnchorProvider, BN, Wallet } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import DLMM, {derivePresetParameter2, LBCLMM_PROGRAM_IDS } from '@meteora-ag/dlmm'; // Correct default import for the main DLMM object
//import { BN } from 'bn.js'; // BN.js for large number arithmetic
import bs58 from 'bs58'; // For encoding/decoding private keys (optional, but useful)

import pkg from '@coral-xyz/anchor';
const { AnchorProvider, BN, Wallet } = pkg;

//import dlmm from '@meteora-ag/dlmm';
//const { DLMM } = dlmm;

//import xx from '@meteora-ag/dlmm';
//const {DLMM, derivePresetParameter2, LBCLMM_PROGRAM_IDS } = pkg;

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
const BIN_STEP = 10000; // Price increment/decrement percentage in basis points (e.g., 100 = 1% price step)
const FEE_BPS = 2; // Trading fee in basis points (e.g., 200 = 2% fee per swap)
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
        // For simplicity, we'll just use the first preset parameter.
        // In a real application, you'd choose one based on your specific requirements (e.g., binStep).
        const selectedPreset = presetParameters.presetParameter.find(
            (p) => p.account.binStep === BIN_STEP// && p.account.feeBps === FEE_BPS
        );

        if (!selectedPreset) {
            console.error(`No suitable preset found for binStep: ${BIN_STEP} and feeBps: ${FEE_BPS}. 
                           Consider adjusting your pool parameters or checking available presets.`);
            return;
        }

        console.log("Selected Preset Parameters:", selectedPreset);

        // --- Prepare DLMM Pool Creation Parameters ---
        // `createPermissionLbPair` expects `LbPairConfig` and `InitializeLbPairParams`
        const lbPairConfig = {
            owner: WALLET.publicKey,
            tokenMintX: TOKEN_MINT_A,
            tokenMintY: TOKEN_MINT_B,
            binStep: BIN_STEP,
            // These values would come from `selectedPreset` or be carefully chosen
            // Example values:
            baseFactor: selectedPreset.account.baseFactor, // Typically from preset
            minBinId: selectedPreset.account.minBinId,     // Typically from preset
            maxBinId: selectedPreset.account.maxBinId,     // Typically from preset
            feeBps: FEE_BPS,
            // You may need to specify more fields from the preset config or Meteora docs
        };

        /*
        const initializeLbPairParams = {
            initialPrice: new BN(INITIAL_PRICE * 1e9), // Example: Price 1.0, assuming 9 decimals for price
            // Activation settings
            activationSlot: ACTIVATION_TYPE === 0 ? new BN(ACTIVATION_SLOT_OR_TIMESTAMP) : null,
            activationTime: ACTIVATION_TYPE === 1 ? new BN(ACTIVATION_SLOT_OR_TIMESTAMP) : null,
            // Other optional parameters like `feeOwner`, `positionOwner`, `oracle` can be added
        };

        console.log('Attempting to create DLMM pool...');
*/

        // The createPermissionLbPair function will return a Transaction
        // The `DLMM` object needs to be initialized.
        // The `DLMM` object from `@meteora-ag/dlmm` seems to be the main SDK class.
        // Let's assume `createPermissionLbPair` is a static method or exposed through the default export.
        // Based on search results, `createPermissionLbPair` is a static function of the DLMM export.

        const binStep = new BN(25)
        const baseFactor = new BN(10000)
        const programId = LBCLMM_PROGRAM_IDS["mainnet-beta"]

        const presetParamPda = derivePresetParameter2(
            binStep,
            baseFactor,
            new PublicKey(programId),
        );

        const activeBinId = getActiveBin();

        const createPoolTx = await DLMM.createLbPair2(
            CONNECTION,
            WALLET.publicKey, // Payer
            lbPairConfig.tokenMintX,
            lbPairConfig.tokenMintY,
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

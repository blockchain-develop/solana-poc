import { Connection, Keypair, PublicKey, clusterApiUrl, Transaction, SystemProgram, Cluster } from '@solana/web3.js';
import DLMM from '@meteora-ag/dlmm'; // Correct default import for the main DLMM object
import { AnchorProvider, BN, Wallet } from '@coral-xyz/anchor';
import { conf } from "./const";

const CONNECTION = new Connection(clusterApiUrl(conf.Network as Cluster), 'confirmed');
const OWNER = conf.Owner;
const WALLET = new Wallet(OWNER);
const PROVIDER = new AnchorProvider(CONNECTION, WALLET, {
    preflightCommitment: 'confirmed',
});

const MINT_X = conf.MemeMint
const DECIMALS_X = conf.MemeDecimal
const MINT_Y = conf.BaseMint
const DECIMALS_Y = conf.BaseDecimal

// Example: 10000 = 10% bin step. Adjust as needed.
const BIN_STEP = 10; // Price increment/decrement percentage in basis points (e.g., 100 = 1% price step)
const FEE_BPS = 10000; // Trading fee in basis points (e.g., 200 = 2% fee per swap)
const INITIAL_PRICE = 0.0000001; // Initial price (in terms of tokenB / tokenA)

function getActiveBin() {
    const binStepPercent = BIN_STEP / 10000;
    const priceWithDecimals = (INITIAL_PRICE * (10 ** DECIMALS_X)) / (10 ** DECIMALS_Y);

    // The core logarithmic calculation
    const activeBinId = Math.floor(Math.log(priceWithDecimals) / Math.log(1 + binStepPercent));
    console.log(`Calculated active bin ID: ${activeBinId}`);

    return activeBinId;
}

// --- Function to Create DLMM Pool ---
async function createMeteoraDlmmPool() {
    try {
        // Ensure the wallet has SOL for transaction fees
        const balance = await CONNECTION.getBalance(OWNER.publicKey);
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
            OWNER.publicKey,
            MINT_X,
            MINT_Y,
            selectedPreset.publicKey,
            new BN(activeBinId),
        );
        if (!createPoolTx) {
            console.error("Failed to generate pool creation transaction.");
            return;
        }

        // Sign and send the transaction
        const txid = await PROVIDER.sendAndConfirm(createPoolTx, [OWNER]);
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

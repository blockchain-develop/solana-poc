import { Connection, Keypair, PublicKey, clusterApiUrl, Transaction, SystemProgram, Cluster } from '@solana/web3.js';
import DLMM, { StrategyType } from '@meteora-ag/dlmm'; // Correct default import for the main DLMM object
import { AnchorProvider, BN, Wallet } from '@coral-xyz/anchor';
import { conf } from "./const";

const CONNECTION = new Connection(clusterApiUrl(conf.Network as Cluster), 'confirmed');
const OWNER = conf.Owner;
const WALLET = new Wallet(OWNER);
const PROVIDER = new AnchorProvider(CONNECTION, WALLET, {
    preflightCommitment: 'confirmed',
});

const POOL = conf.POOL;

async function addLiqudity() {
    try {
        // Ensure the wallet has SOL for transaction fees
        const balance = await CONNECTION.getBalance(OWNER.publicKey);
        console.log('Admin SOL Balance:', balance / 1e9, 'SOL');
        if (balance < 0.05 * 1e9) { // Check if balance is sufficient (e.g., 0.05 SOL)
            console.warn('Insufficient SOL balance for transactions. Please fund your wallet.');
            return;
        }

        const dlmmPool = await DLMM.create(CONNECTION, POOL);

        // Define your strategy
        const TOTAL_RANGE_INTERVAL = 10;
        const activeBin = await dlmmPool.getActiveBin();
        const minBinId = activeBin.binId - TOTAL_RANGE_INTERVAL;
        const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL;

        // The amounts you want to deposit (in lamports/smallest unit)
        const totalXAmount = new BN(1000000000);
        const totalYAmount = new BN(1000000000);

        const newPositionKeypair = new Keypair();

        // Create the transaction to initialize the position and add liquidity
        const transaction = await dlmmPool.initializePositionAndAddLiquidityByStrategy({
            positionPubKey: newPositionKeypair.publicKey,
            user: OWNER.publicKey,
            totalXAmount,
            totalYAmount,
            strategy: {
                minBinId,
                maxBinId,
                strategyType: StrategyType.Spot
            },
            // Optional: set a slippage tolerance
            slippage: 0.05
        });

        // Sign and send the transaction
        const txHash = await PROVIDER.sendAndConfirm(transaction, [OWNER, newPositionKeypair]);
        console.log("Liquidity added with transaction:", txHash);

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

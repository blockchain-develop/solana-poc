import { Connection, Keypair, PublicKey, clusterApiUrl, Transaction, SystemProgram, Cluster } from '@solana/web3.js';
import DLMM from '@meteora-ag/dlmm';
import { AnchorProvider, BN, Wallet } from '@coral-xyz/anchor';
import { conf } from "./const";

const CONNECTION = new Connection(clusterApiUrl(conf.Network as Cluster), 'confirmed');
const OWNER = conf.Owner;
const WALLET = new Wallet(OWNER);
const PROVIDER = new AnchorProvider(CONNECTION, WALLET, {
    preflightCommitment: 'confirmed',
});

const POOL = conf.POOL;

async function poolinfo() {
    try {
        // Ensure the wallet has SOL for transaction fees
        const balance = await CONNECTION.getBalance(OWNER.publicKey);
        console.log('Admin SOL Balance:', balance / 1e9, 'SOL');
        if (balance < 0.05 * 1e9) { // Check if balance is sufficient (e.g., 0.05 SOL)
            console.warn('Insufficient SOL balance for transactions. Please fund your wallet.');
            return;
        }

        const dlmmPool = await DLMM.create(CONNECTION, POOL);

        // Fetch the active bin data
        const activeBin = await dlmmPool.getActiveBin();

        console.log(`Pool Address: ${POOL.toBase58()}`);
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

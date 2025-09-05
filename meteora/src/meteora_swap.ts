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
const MINT_X = conf.MemeMint
const MINT_Y = conf.BaseMint

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
            user: OWNER.publicKey,
            inToken: MINT_Y,
            outToken: MINT_X,
            inAmount: amountIn,
            minOutAmount: minAmountOut,
            lbPair: POOL,
            binArraysPubkey: binArrays.map(item => item.publicKey),
        });

        // Sign and send the transaction
        const txid = await PROVIDER.sendAndConfirm(transaction, [OWNER]);
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

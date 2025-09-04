import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { getAssociatedTokenAddress, freezeAccount } from '@solana/spl-token';
import bs58 from 'bs58';
import { Wallet } from '@coral-xyz/anchor';

const CONNECTION = new Connection(clusterApiUrl("devnet"), 'confirmed');
const PRIVATE_KEY = 'mtaSwRYTpiqAHNauXmwLBns4gq8MeLxsoYE1F6trpLVvZC31dpecztnKh4BD3L1iLFNcZeujTSZn3bggPFqWYDd';
const PAYER = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));
const WALLET = new Wallet(PAYER);

const mint = new PublicKey('GDrShR7JqB5SyQv3QYZf4woWkY2BBYdCCouGgJYpVUKY');
const owner = new PublicKey('6YZCH4iTX9QxRsJUg5mz1GuTntJQVGj3w9dviFjb1bYL');

// --- Function to Create DLMM Pool ---
async function freezetoken() {
    console.log('User Public Key:', WALLET.publicKey.toBase58());

    const tokenAccount = await getAssociatedTokenAddress(
        mint,
        owner,
        true,
    );

    const signature = await freezeAccount(
        CONNECTION,
        PAYER,
        tokenAccount,
        mint,
        PAYER,
    );

    console.log('Transaction signature:', signature);
    console.log(`Successfully freeze token account: ${owner.toBase58()}`);
}

// --- Run the function ---
freezetoken();

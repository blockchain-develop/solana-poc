import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { mintTo, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import bs58 from 'bs58';
import { Wallet } from '@coral-xyz/anchor';

const CONNECTION = new Connection(clusterApiUrl("devnet"), 'confirmed');
const PRIVATE_KEY = 'mtaSwRYTpiqAHNauXmwLBns4gq8MeLxsoYE1F6trpLVvZC31dpecztnKh4BD3L1iLFNcZeujTSZn3bggPFqWYDd';
const PAYER = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));
const WALLET = new Wallet(PAYER);

const mint = new PublicKey('GDrShR7JqB5SyQv3QYZf4woWkY2BBYdCCouGgJYpVUKY');
const owner = new PublicKey('6YZCH4iTX9QxRsJUg5mz1GuTntJQVGj3w9dviFjb1bYL');
const amount = 1000000000;

// --- Function to Create DLMM Pool ---
async function minttoken() {
    console.log('User Public Key:', WALLET.publicKey.toBase58());

    const tokenAccount = await getOrCreateAssociatedTokenAccount(
        CONNECTION,
        PAYER,
        mint,
        owner
    );

    const signature = await mintTo(
        CONNECTION,
        PAYER,
        mint,
        tokenAccount.address,
        PAYER,
        amount,
    );

    console.log('Transaction signature:', signature);
    console.log(`Successfully mint to token account: ${owner.toBase58()}, amount: ${amount}`);
}

// --- Run the function ---
minttoken();

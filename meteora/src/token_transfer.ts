import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { transfer, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import bs58 from 'bs58';
import { Wallet } from '@coral-xyz/anchor';

const CONNECTION = new Connection(clusterApiUrl("devnet"), 'confirmed');
const PRIVATE_KEY = '3QWKhMFKaezHuRfREfaTAUDQ23fmRzcMxXQJVTesGvYnQg4wZmXUmHuem13JbqNv2yFnv72DvHVmebNDS5rqDCCx';
const PAYER = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));
const WALLET = new Wallet(PAYER);

const mint = new PublicKey('GDrShR7JqB5SyQv3QYZf4woWkY2BBYdCCouGgJYpVUKY');
const from = new PublicKey('6YZCH4iTX9QxRsJUg5mz1GuTntJQVGj3w9dviFjb1bYL');
const to = new PublicKey('GDrShR7JqB5SyQv3QYZf4woWkY2BBYdCCouGgJYpVUKY');
const amount = 1000000000;

// --- Function to Create DLMM Pool ---
async function transfertoken() {
    console.log('User Public Key:', WALLET.publicKey.toBase58());

    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
        CONNECTION,
        PAYER,
        mint,
        from
    );

    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
        CONNECTION,
        PAYER,
        mint,
        to
    );

    const signature = await transfer(
        CONNECTION,
        PAYER,
        fromTokenAccount.address,
        toTokenAccount.address,
        PAYER,
        amount,
    );

    console.log('Transaction signature:', signature);
    console.log(`Successfully transfer token, from: ${from.toBase58()}, to: ${to.toBase58()}, amount: ${amount}`);
}

// --- Run the function ---
transfertoken();

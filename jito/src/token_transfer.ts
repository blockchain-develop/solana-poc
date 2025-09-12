import { Connection, Keypair, PublicKey, clusterApiUrl, Cluster } from '@solana/web3.js';
import { transfer, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import { conf } from "./const";

const CONNECTION = new Connection(clusterApiUrl(conf.Network as Cluster), 'confirmed');
const user = conf.User;
const mint = conf.MemeMint;
const from = conf.User;
const to = conf.Owner.publicKey;
const amount = 1000000000;

// --- Function to Create DLMM Pool ---
async function transfertoken() {
    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
        CONNECTION,
        user,
        mint,
        from.publicKey
    );

    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
        CONNECTION,
        user,
        mint,
        to
    );

    const signature = await transfer(
        CONNECTION,
        from,
        fromTokenAccount.address,
        toTokenAccount.address,
        from,
        amount,
    );

    console.log('Transaction signature:', signature);
    console.log(`Successfully transfer token, from: ${from.publicKey.toBase58()}, to: ${to.toBase58()}, mint: ${mint.toBase58()}, amount: ${amount}`);
}

// --- Run the function ---
transfertoken();

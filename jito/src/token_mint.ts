import { Connection, Keypair, PublicKey, clusterApiUrl, Cluster } from '@solana/web3.js';
import { mintTo, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import { conf } from "./const";

const CONNECTION = new Connection(clusterApiUrl(conf.Network as Cluster), 'confirmed');
const owner = conf.Owner;
const mint = conf.MemeMint;
const to = conf.Owner.publicKey;
const amount = 1000000000;

// --- Function to Create DLMM Pool ---
async function minttoken() {
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
        CONNECTION,
        owner,
        mint,
        to,
    );

    const signature = await mintTo(
        CONNECTION,
        owner,
        mint,
        tokenAccount.address,
        owner,
        amount,
    );

    console.log('Transaction signature:', signature);
    console.log(`Successfully mint to token account: ${tokenAccount.address.toBase58()}, owner: ${to.toBase58()}, mint: ${mint.toBase58()}, amount: ${amount}`);
}

// --- Run the function ---
minttoken();

import { Connection, Keypair, PublicKey, clusterApiUrl, Cluster } from '@solana/web3.js';
import { getAssociatedTokenAddress, freezeAccount } from '@solana/spl-token';
import { conf } from "./const";

const CONNECTION = new Connection(clusterApiUrl(conf.Network as Cluster), 'confirmed');
const owner = conf.Owner;
const mint = conf.MemeMint;
const to = conf.User.publicKey;

// --- Function to Create DLMM Pool ---
async function freezetoken() {
    const tokenAccount = await getAssociatedTokenAddress(
        mint,
        to,
        true,
    );

    const signature = await freezeAccount(
        CONNECTION,
        owner,
        tokenAccount,
        mint,
        owner,
    );

    console.log('Transaction signature:', signature);
    console.log(`Successfully freeze token account: ${tokenAccount.toBase58()}, owner: ${to.toBase58()}, mint: ${mint.toBase58()}`);
}

// --- Run the function ---
freezetoken();

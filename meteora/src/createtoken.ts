import { Connection, Keypair, PublicKey, clusterApiUrl, Transaction, SystemProgram } from '@solana/web3.js';
//import { AnchorProvider, BN, Wallet } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, createMint, mintTo, createAssociatedTokenAccount } from '@solana/spl-token';
import DLMM, { derivePresetParameter2, LBCLMM_PROGRAM_IDS, StrategyType } from '@meteora-ag/dlmm'; // Correct default import for the main DLMM object
import bs58 from 'bs58'; // For encoding/decoding private keys (optional, but useful)
import { AnchorProvider, BN, Wallet } from '@coral-xyz/anchor';
//import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
//import { mplTokenMetadata, createV1, TokenStandard  } from '@metaplex-foundation/mpl-token-metadata';
//import { keypairIdentity, percentAmount,publicKey } from '@metaplex-foundation/umi';
import {
    signerIdentity,
    keypairIdentity,
    createGenericFile,
    percentAmount,
    createSignerFromKeypair,
} from "@metaplex-foundation/umi";
import {
    mplTokenMetadata,
    createAndMint,
    createV1,
    TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import { bundlrUploader } from "@metaplex-foundation/umi-uploader-bundlr";
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'

import * as fs from "fs";
import { addAbortListener } from 'events';

// --- Configuration ---
const RPC_URL = 'https://api.devnet.solana.com'; // Use devnet for testing
// Replace with your actual private key (NEVER hardcode in production!)
// For example, load from a file or environment variable
const PRIVATE_KEY = 'mtaSwRYTpiqAHNauXmwLBns4gq8MeLxsoYE1F6trpLVvZC31dpecztnKh4BD3L1iLFNcZeujTSZn3bggPFqWYDd';

//const umi = createUmi('https://api.devnet.solana.com');
const CONNECTION = new Connection(clusterApiUrl("devnet"), 'confirmed');
const PAYER = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));
const WALLET = new Wallet(PAYER);
const PROVIDER = new AnchorProvider(CONNECTION, WALLET, {
    preflightCommitment: 'confirmed',
});

// --- Function to Create DLMM Pool ---
async function createtoken() {
    const mintKey = Keypair.generate()
    // 创建token
    const baseTokenMint = await createMint(
        CONNECTION,
        PAYER,
        WALLET.publicKey,
        WALLET.publicKey,
        9,
        mintKey,
    );
    console.log(`✅ Base Token Mint Address: ${baseTokenMint.toBase58()}`);

    // ATA
    const baseTokenAta = await createAssociatedTokenAccount(CONNECTION, PAYER, baseTokenMint, WALLET.publicKey);

    // mint
    const mintAmount = new BN(1_000_000_000).mul(new BN(10).pow(new BN(9)));
    await mintTo(CONNECTION, PAYER, baseTokenMint, baseTokenAta, PAYER, BigInt(mintAmount.toString()));
    console.log(`✅ Minted 1,000,000 base tokens to wallet.`);

    // Create Umi instance and configure with Bundlr
    const umi = createUmi(RPC_URL)
        .use(mplTokenMetadata())
        .use(bundlrUploader())
    let keypair = umi.eddsa.createKeypairFromSecretKey(bs58.decode(PRIVATE_KEY));
    const signer = createSignerFromKeypair(umi, keypair);
    umi.use(signerIdentity(signer));
    let mintKeyPair = umi.eddsa.createKeypairFromSecretKey(mintKey.secretKey)
const mintSigner = createSignerFromKeypair(umi, mintKeyPair);

    // Create a placeholder image
    const image = fs.readFileSync("./src/image.png");
    const file = createGenericFile(image, "image.png");

    try {
        // 1. Upload the image to Bundlr
        const [imageUrl] = await umi.uploader.upload([file]);
        console.log(`Image uploaded to Arweave at: ${imageUrl}`);

        // 2. Upload the JSON metadata to Bundlr
        const metadataJson = {
            name: "My Awesome Token",
            symbol: "MAT",
            description: "This is a token created with Umi and Bundlr.",
            image: imageUrl,
            attributes: [
                {
                    trait_type: "Edition",
                    value: "1",
                },
            ],
            properties: {
                files: [
                    {
                        uri: imageUrl,
                        type: "image/png",
                    },
                ],
            },
        };
        const metadataUri = await umi.uploader.uploadJson([metadataJson]);
        console.log(`Metadata uploaded to Arweave at: ${metadataUri}`);

        // 3. 
        await createV1(
            umi,
            {
                mint: mintSigner,
                authority: umi.payer,
                name: 'My NFT',
                uri: metadataUri,
                sellerFeeBasisPoints: percentAmount(5.5),
                tokenStandard: TokenStandard.Fungible,
            }).sendAndConfirm(umi)
        console.log("Token and metadata created successfully!");
    } catch (error) {
        console.error("Failed to create token metadata:", error);
    }
}

// --- Run the function ---
createtoken();

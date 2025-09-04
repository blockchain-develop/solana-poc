import { Connection, Keypair, PublicKey, clusterApiUrl, Cluster } from '@solana/web3.js';
import { createMint } from '@solana/spl-token';
import bs58 from 'bs58';
import {
    signerIdentity,
    createGenericFile,
    percentAmount,
    createSignerFromKeypair,
} from "@metaplex-foundation/umi";
import {
    mplTokenMetadata,
    createV1,
    TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import { bundlrUploader } from "@metaplex-foundation/umi-uploader-bundlr";
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import * as fs from "fs";
import { conf } from "./const";

const CONNECTION = new Connection(clusterApiUrl(conf.Network as Cluster), 'confirmed');
const owner = conf.Owner;

async function createtoken() {
    const mintKey = Keypair.generate();
    console.log(`mint key: ${bs58.encode(mintKey.secretKey)}`)
    // 创建token
    const baseTokenMint = await createMint(
        CONNECTION,
        owner,
        owner.publicKey,
        owner.publicKey,
        9,
        mintKey,
    );
    console.log(`✅ Base Token Mint Address: ${baseTokenMint.toBase58()}`);

    // Create Umi instance and configure with Bundlr
    const umi = createUmi(clusterApiUrl(conf.Network as Cluster))
        .use(mplTokenMetadata())
        .use(bundlrUploader())
    let ownerKeypair = umi.eddsa.createKeypairFromSecretKey(owner.secretKey);
    const ownerSigner = createSignerFromKeypair(umi, ownerKeypair);
    umi.use(signerIdentity(ownerSigner));

    let mintKeypair = umi.eddsa.createKeypairFromSecretKey(mintKey.secretKey)
    const mintSigner = createSignerFromKeypair(umi, mintKeypair);

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

        // 3. create metadata
        await createV1(
            umi,
            {
                mint: mintSigner,
                authority: umi.payer,
                name: 'My NFT',
                uri: metadataUri,
                sellerFeeBasisPoints: percentAmount(0),
                tokenStandard: TokenStandard.Fungible,
            }).sendAndConfirm(umi)
        console.log("Token and metadata created successfully!");
    } catch (error) {
        console.error("Failed to create token metadata:", error);
    }
}

// --- Run the function ---
createtoken();

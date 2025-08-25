/**
 * @title Create a Meteora DLMM Pool on Solana Devnet
 * @description This script demonstrates the full process of creating a new Meteora DLMM
 * liquidity pool. It includes:
 * 1. Setting up a connection to the Solana devnet.
 * 2. Creating a new SPL token to be used as the base currency in the pool.
 * 3. Using an existing token (USDC devnet) as the quote currency.
 * 4. Initializing the DLMM pool (LB Pair).
 * 5. Creating a position and depositing initial liquidity into the pool.
 *
 * @notice This script is for demonstration purposes on the devnet.
 * Running this on mainnet requires real funds and careful parameter selection.
 *
 * @dev To run this script:
 * 1. Make sure you have Node.js and npm installed.
 * 2. Install the required packages:
 * npm install @solana/web3.js @solana/spl-token @meteora-ag/dlmm bn.js bs58
 * 3. Replace the `PRIVATE_KEY` placeholder with your wallet's private key (in base58 format).
 * Your wallet must have some devnet SOL to pay for transaction fees.
 * You can get devnet SOL from a faucet: https://faucet.solana.com/
 * 4. Run the script from your terminal:
 * node your_script_name.js
 */

import {
    Connection,
    Keypair,
    PublicKey,
    sendAndConfirmTransaction,
    SystemProgram,
    Transaction,
} from '@solana/web3.js';
import {
    createMint,
    createAssociatedTokenAccount,
    mintTo,
    getAssociatedTokenAddress,
} from '@solana/spl-token';
import { DLMM, LbPair, getBinStep, MAINNET_PROGRAM_ID } from '@meteora-ag/dlmm';
import BN from 'bn.js';
import bs58 from 'bs58';

// --- CONFIGURATION ---

// Replace with your wallet's private key (base58 encoded).
// IMPORTANT: Keep this secret. Do not commit it to public repositories.
// This is a dummy keypair for demonstration.
const PRIVATE_KEY = 'YOUR_PRIVATE_KEY_HERE'; // e.g., '588FU4PktJWfGfxtzpAAXkuE6YDXv1VofGJod4YocqvP...'
const DEVNET_RPC_URL = 'https://api.devnet.solana.com';

// The program ID for Meteora DLMM on Devnet.
// Note: The SDK might export a DEVNET_PROGRAM_ID, but we define it here for clarity.
const DLMM_PROGRAM_ID = new PublicKey('LBUZKhRxPF3XUpBCjp4Q4y4Jo2aZConoA2dKkGRqsA6');

// Use USDC on devnet as the quote token.
const QUOTE_TOKEN_MINT = new PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr');
const QUOTE_TOKEN_DECIMALS = 6;

// --- MAIN SCRIPT ---

async function main() {
    console.log('🚀 Starting Meteora pool creation script...');

    // 1. Setup Connection and Wallet
    // =================================================
    const connection = new Connection(DEVNET_RPC_URL, 'confirmed');

    let wallet;
    if (!PRIVATE_KEY || PRIVATE_KEY === 'YOUR_PRIVATE_KEY_HERE') {
        console.warn('⚠️ Private key not found. Generating a new temporary wallet.');
        wallet = Keypair.generate();
        console.log('Airdropping 2 SOL to new wallet. This might take a moment...');
        const airdropSignature = await connection.requestAirdrop(wallet.publicKey, 2 * 1e9);
        await connection.confirmTransaction(airdropSignature, 'confirmed');
        console.log(`✅ Airdrop successful. Wallet address: ${wallet.publicKey.toBase58()}`);
    } else {
        try {
            wallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));
            console.log(`✅ Wallet loaded successfully: ${wallet.publicKey.toBase58()}`);
        } catch (error) {
            console.error('❌ Invalid private key. Please check the format (base58).');
            return;
        }
    }


    // 2. Create a New SPL Token (Base Token)
    // =================================================
    console.log('\n- Creating a new SPL token to use as the base currency...');
    const baseTokenMint = await createMint(
        connection,
        wallet, // Payer
        wallet.publicKey, // Mint Authority
        wallet.publicKey, // Freeze Authority
        9 // Decimals
    );
    console.log(`✅ Base Token Mint Address: ${baseTokenMint.toBase58()}`);

    // Create ATAs (Associated Token Accounts) for the new token and mint some to our wallet
    const baseTokenAta = await createAssociatedTokenAccount(connection, wallet, baseTokenMint, wallet.publicKey);
    const mintAmount = new BN(1_000_000).mul(new BN(10).pow(new BN(9))); // 1,000,000 tokens
    await mintTo(connection, wallet, baseTokenMint, baseTokenAta, wallet, BigInt(mintAmount.toString()));
    console.log(`✅ Minted 1,000,000 base tokens to wallet.`);


    // 3. Initialize the DLMM Pool (LB Pair)
    // =================================================
    console.log('\n- Initializing the DLMM pool (LbPair)...');

    // Define pool parameters
    const binStep = 10; // A common value, represents price tick granularity.
    const initialPrice = new BN(1 * 10 ** (QUOTE_TOKEN_DECIMALS)); // Initial price of 1 USDC per base token

    // Find the PDA for the LbPair
    const lbPairPda = LbPair.getPDA(DLMM_PROGRAM_ID, baseTokenMint, QUOTE_TOKEN_MINT, binStep);
    const lbPairKey = lbPairPda.publicKey;
    console.log(`Computed LbPair Address: ${lbPairKey.toBase58()}`);

    // Create the instruction to initialize the pool
    const dlmmPool = new DLMM(connection, DLMM_PROGRAM_ID);
    const createPoolIx = await dlmmPool.createLbPair(
        wallet.publicKey, // Payer
        baseTokenMint,
        QUOTE_TOKEN_MINT,
        initialPrice,
        binStep
    );

    // Create and send the transaction
    const createPoolTx = new Transaction().add(createPoolIx);
    try {
        const txSignature = await sendAndConfirmTransaction(connection, createPoolTx, [wallet]);
        console.log(`✅ Pool creation transaction successful! Signature: ${txSignature}`);
    } catch (error) {
        console.error('❌ Pool creation failed:', error);
        return;
    }


    // 4. Add Initial Liquidity
    // =================================================
    console.log('\n- Adding initial liquidity to the pool...');

    // We need ATAs for both tokens for the pool to use.
    const baseTokenVault = await getAssociatedTokenAddress(baseTokenMint, lbPairKey, true);
    const quoteTokenVault = await getAssociatedTokenAddress(QUOTE_TOKEN_MINT, lbPairKey, true);
    console.log(`Base vault: ${baseTokenVault.toBase58()}, Quote vault: ${quoteTokenVault.toBase58()}`);

    // Define the liquidity shape and amount
    const liquidityParameters = {
        // Amount of each token to deposit
        amountX: new BN(100_000).mul(new BN(10).pow(new BN(9))), // 100,000 base tokens
        amountY: new BN(100_000).mul(new BN(10).pow(new BN(QUOTE_TOKEN_DECIMALS))), // 100,000 quote tokens (USDC)
        // Define the price range for the liquidity.
        // We will provide liquidity in a range of 5 bins on each side of the active price.
        activeId: createPoolIx.program.coder.instruction.accounts.length, // This needs to be correctly identified from the created pool state
        binDistributionX: Array(11).fill(new BN(0)).map((_, i) => i < 5 ? new BN(10) : new BN(0)), // Example distribution
        binDistributionY: Array(11).fill(new BN(0)).map((_, i) => i > 5 ? new BN(10) : new BN(0)), // Example distribution
    };

    // Note: A real-world scenario requires fetching the `activeId` from the created pool's on-chain state.
    // For this script, we proceed with a simplified deposit. A more robust implementation would fetch the LbPair account data first.
    // The `initializePositionAndDeposit` is a more advanced method. A simpler approach is to use `deposit`.

    // Let's create a position and deposit liquidity.
    // For simplicity, we'll deposit into a few bins around the initial price.
    const lbPairState = await LbPair.fetch(connection, lbPairKey);
    if (!lbPairState) {
        console.error("❌ Could not fetch the new pool's state.");
        return;
    }

    const positionPda = dlmmPool.getPositionPda(wallet.publicKey, lbPairKey);
    console.log(`Position PDA: ${positionPda.publicKey.toBase58()}`);

    const depositAmountX = new BN(10000 * 10 ** 9); // 10,000 base tokens
    const depositAmountY = new BN(0); // We'll deposit only base tokens first

    const depositTx = new Transaction();
    
    // Check if position exists, if not, add instruction to create it
    const positionAccount = await connection.getAccountInfo(positionPda.publicKey);
    if (!positionAccount) {
        console.log("Position not found, creating it...");
        const createPositionIx = await dlmmPool.initializePosition(
            positionPda.publicKey,
            lbPairKey,
            wallet.publicKey,
            -128, // Lower bin id
            128, // Width
        );
        depositTx.add(createPositionIx);
    }

    const depositIx = await dlmmPool.deposit(
        lbPairKey,
        positionPda.publicKey,
        depositAmountX,
        depositAmountY,
        new BN(lbPairState.activeId), // Deposit around the active bin
        wallet.publicKey,
        baseTokenAta,
        await getAssociatedTokenAddress(QUOTE_TOKEN_MINT, wallet.publicKey)
    );
    
    depositTx.add(depositIx);

    try {
        const depositSignature = await sendAndConfirmTransaction(connection, depositTx, [wallet]);
        console.log(`✅ Liquidity deposit transaction successful! Signature: ${depositSignature}`);
    } catch (error) {
        console.error('❌ Liquidity deposit failed:', error);
        // This can happen if you don't have enough quote tokens (USDC) on devnet.
        // Use a devnet USDC faucet to get some.
        return;
    }

    console.log('\n🎉 Congratulations! Your Meteora DLMM pool has been created and funded.');
    console.log(`   - Pool Address: ${lbPairKey.toBase58()}`);
    console.log(`   - Base Token: ${baseTokenMint.toBase58()}`);
    console.log(`   - Quote Token: ${QUOTE_TOKEN_MINT.toBase58()}`);
}

main().catch((err) => {
    console.error(err);
});

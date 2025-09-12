import { PublicKey, Connection, clusterApiUrl, Cluster, LAMPORTS_PER_SOL, sendAndConfirmTransaction, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { conf } from "./const";
import { withdrawSol } from '@solana/spl-stake-pool';

const CONNECTION = new Connection(clusterApiUrl(conf.Network as Cluster), 'confirmed');
const PAYER = conf.Owner;
const PAYERKEY = new PublicKey('GxDDTT1zqgH2aNgdoyDvEgvHdsLq91JAExCTao7c5GT4');
const AMOUNT = 10;
const POOL = conf.JitoStakingPool;
const JITOSOLMINT = conf.JitoSOL;

async function jitoWithdraw() {
    const lamportsToBurn = AMOUNT;
    console.log(`Preparing to withdraw SOL by burning ${lamportsToBurn} stake pool tokens...`);

    try {
        // Find the user's Associated Token Account for the stake pool tokens.
        // The SPL Token program uses this to determine which account holds the user's LSTs.
        const destinationTokenAccount = await getAssociatedTokenAddress(
            JITOSOLMINT,
            PAYERKEY,
        );

        // 6. Call the withdrawSol function to get the necessary instructions and signers
        const { instructions } = await withdrawSol(
            CONNECTION,
            POOL,
            PAYERKEY,
            PAYERKEY,
            lamportsToBurn
        );

        // 7. Create a new transaction and add the instructions
        const transaction = new Transaction().add(...instructions);

        // 8. Get the latest blockhash and sign the transaction
        transaction.recentBlockhash = (await CONNECTION.getRecentBlockhash()).blockhash;
        transaction.feePayer = PAYERKEY

        const simulationResult = await CONNECTION.simulateTransaction(transaction);

        console.log("模拟结果: ✅");
        console.log("日志 (Logs):", simulationResult.value.logs);
        console.log("消耗的计算单元 (Units Consumed):", simulationResult.value.unitsConsumed);

        if (simulationResult.value.err) {
            console.error("模拟失败！错误信息:", simulationResult.value.err);
        } else {
            console.log("模拟成功！交易预计会成功执行。");
        }

    } catch (error) {
        console.error("Failed to withdraw SOL:", error);
    }
}

// --- Run the function ---
jitoWithdraw();

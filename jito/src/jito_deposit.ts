import { PublicKey, Connection, clusterApiUrl, Cluster, LAMPORTS_PER_SOL, sendAndConfirmTransaction, Transaction } from '@solana/web3.js';
import { conf } from "./const";
import { depositSol } from '@solana/spl-stake-pool';

const CONNECTION = new Connection(clusterApiUrl(conf.Network as Cluster), 'confirmed');
const PAYER = conf.Owner;
const PAYERKEY = new PublicKey('45tKMp4VtPY4yMXSqyonrjW7ck9btSqLisMH1JtW6vUE');
const AMOUNT = 0.1;
const POOL = conf.JitoStakingPool;

async function jitoDeposit() {
    console.log('开始执行向 Jito 质押池存入 SOL 的操作...');

    const lamportsToDeposit = AMOUNT * LAMPORTS_PER_SOL;
    console.log(`准备存入 ${AMOUNT} SOL (${lamportsToDeposit} Lamports)`);

    try {
        // 使用 @solana/spl-stake-pool 库提供的 `depositSol` 辅助函数
        // 这个函数会自动处理查找 JitoSOL 的 ATA (Associated Token Account)
        // 如果 ATA 不存在，它会自动创建
        const { instructions } = await depositSol(
            CONNECTION,
            POOL,
            PAYERKEY, // 从这个钱包地址扣除 SOL
            lamportsToDeposit,
            undefined, // destinationTokenAccount: 留空则会自动创建或查找
            undefined  // referralFeeAccount: 如果没有推荐，则留空
        );

        // Create a new transaction and add the instructions
        const transaction = new Transaction().add(...instructions);

        // Get the latest blockhash and sign the transaction
        transaction.recentBlockhash = (await CONNECTION.getRecentBlockhash()).blockhash;
        transaction.feePayer = PAYERKEY;

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
        console.error('❌ 操作失败:', error);
    }
}

// --- Run the function ---
jitoDeposit();

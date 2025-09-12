import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Keypair } from "@solana/web3.js"
import * as bs58 from "bs58"

const { PublicKey, Cluster } = require("@solana/web3.js");

export const mainnet = {
    Network: 'mainnet-beta',
    MyProgramId: new PublicKey('5Xh5S1cVHkKiG79VNTsWS7HwxidLwRJujh9H3iKGxgp6'),
    TokenProgramId: TOKEN_PROGRAM_ID,
    Token2022ProgramId: TOKEN_2022_PROGRAM_ID,
    JupiterProgramId: new PublicKey('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'),
    AssociatedTokenProgramId: ASSOCIATED_TOKEN_PROGRAM_ID,
    JitoStakingPool: new PublicKey('Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb'),
    JitoSOL: new PublicKey('J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn'),
    Owner: Keypair.fromSecretKey(bs58.decode("mtaSwRYTpiqAHNauXmwLBns4gq8MeLxsoYE1F6trpLVvZC31dpecztnKh4BD3L1iLFNcZeujTSZn3bggPFqWYDd")),
    User: Keypair.fromSecretKey(bs58.decode("3QWKhMFKaezHuRfREfaTAUDQ23fmRzcMxXQJVTesGvYnQg4wZmXUmHuem13JbqNv2yFnv72DvHVmebNDS5rqDCCx")),
}
export const devnet = {
    Network: 'devnet',
    MyProgramId: new PublicKey('5Xh5S1cVHkKiG79VNTsWS7HwxidLwRJujh9H3iKGxgp6'),
    TokenProgramId: TOKEN_PROGRAM_ID,
    Token2022ProgramId: TOKEN_2022_PROGRAM_ID,
    JupiterProgramId: new PublicKey('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'),
    AssociatedTokenProgramId: ASSOCIATED_TOKEN_PROGRAM_ID,
    JitoStakingPool: new PublicKey('Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb'),
    Owner: Keypair.fromSecretKey(bs58.decode("mtaSwRYTpiqAHNauXmwLBns4gq8MeLxsoYE1F6trpLVvZC31dpecztnKh4BD3L1iLFNcZeujTSZn3bggPFqWYDd")),
    User: Keypair.fromSecretKey(bs58.decode("3QWKhMFKaezHuRfREfaTAUDQ23fmRzcMxXQJVTesGvYnQg4wZmXUmHuem13JbqNv2yFnv72DvHVmebNDS5rqDCCx")),
}

export const conf = mainnet

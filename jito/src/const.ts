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
    MemeMint: new PublicKey('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'),
    MemeDecimal: 9,
    Owner: Uint8Array.from([]),
    User: Uint8Array.from([]),
}
export const devnet = {
    Network: 'devnet',
    MyProgramId: new PublicKey('5Xh5S1cVHkKiG79VNTsWS7HwxidLwRJujh9H3iKGxgp6'),
    TokenProgramId: TOKEN_PROGRAM_ID,
    Token2022ProgramId: TOKEN_2022_PROGRAM_ID,
    JupiterProgramId: new PublicKey('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'),
    AssociatedTokenProgramId: ASSOCIATED_TOKEN_PROGRAM_ID,
    MemeMint: new PublicKey('5nJJuvEh2wBjPyEMQA8oV88yikRxFptZChkQAsS22tVN'),
    MemeDecimal: 9,
    BaseMint: new PublicKey('So11111111111111111111111111111111111111112'),
    BaseDecimal: 9,
    POOL: new PublicKey('hxwmFg9HJy21opUyzy1pBmYcWL8jp4U6iXi5BtEkMgA'),
    Owner: Keypair.fromSecretKey(bs58.decode("mtaSwRYTpiqAHNauXmwLBns4gq8MeLxsoYE1F6trpLVvZC31dpecztnKh4BD3L1iLFNcZeujTSZn3bggPFqWYDd")),
    User: Keypair.fromSecretKey(bs58.decode("3QWKhMFKaezHuRfREfaTAUDQ23fmRzcMxXQJVTesGvYnQg4wZmXUmHuem13JbqNv2yFnv72DvHVmebNDS5rqDCCx")),
}

export const conf = devnet

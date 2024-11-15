import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { pushOracleClient } from "./sdk/src/pushOracleClient";
import { pullOracleClient } from "./sdk/src/pullOracleClient";
import { MockPythPush } from "./target/types/mock_pyth_push";
import { MockPythPull } from "./target/types/mock_pyth_pull";
import { confirmTransaction } from "@solana-developers/helpers";
import { config } from "dotenv";
config({ path: './.env' });

export async function setPrice(name: string, price: number) {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const admin = anchor.Wallet.local();

    const push = anchor.workspace.MockPythPush as Program<MockPythPush>;
    const pushOrcale = new pushOracleClient({ provider: provider, wallet: admin, program: push, opts: { commitment: "confirmed" } });

    const pushTxId = await pushOrcale.setPrice(new PublicKey(Buffer.from(process.env[`${name}_PUSH_FEED`].slice(2), "hex")), price, 0);

    const pull = anchor.workspace.MockPythPull as Program<MockPythPull>;
    const pullOracle = new pullOracleClient({ provider: provider, wallet: admin, program: pull, opts: { commitment: "confirmed" } });

    const pullTxId = await pullOracle.setPrice(new PublicKey(process.env[`${name}_PULL_ADDRESS`]), price, 0);

    if (await Promise.all([confirmTransaction(provider.connection, pushTxId), confirmTransaction(provider.connection, pullTxId)])) {
        console.log(`The price of ${name} is now ${price} with transactions ${pushTxId} and ${pullTxId}\n`);
    } else {
        console.error(`Failed to update price for ${name}\n`);
    }
}

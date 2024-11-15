import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { pushOracleClient } from "./sdk/src/pushOracleClient";
import { pullOracleClient } from "./sdk/src/pullOracleClient";
import { MockPythPush } from "./target/types/mock_pyth_push";
import { MockPythPull } from "./target/types/mock_pyth_pull";
import { confirmTransaction } from "@solana-developers/helpers";
import { config } from "dotenv";
import { updateEnvVariable } from "./write_to_env";
config({ path: './.env' });

async function createPythPriceAccount(name: string) {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const admin = anchor.Wallet.local();

    const push = anchor.workspace.MockPythPush as Program<MockPythPush>;
    const pushOrcale = new pushOracleClient({ provider: provider, wallet: admin, program: push, opts: { commitment: "confirmed" } });
    const [pushTxId, pushPriceAccountAddress] = await pushOrcale.createOracle(1, 0, 100 / 10);
    const priceFeed = anchor.utils.bytes.hex.encode(pushPriceAccountAddress.toBuffer());
    if (await confirmTransaction(provider.connection, pushTxId)) {
        console.log(`Pyth push price account created for ${name} on ${pushPriceAccountAddress} with price feed ${priceFeed} during transaction ${pushTxId}\n`);
        updateEnvVariable(`${name}_PUSH_FEED`, priceFeed);
    } else {
        console.error(`Failed to create push oracle for ${name}\n`);
    }

    const pull = anchor.workspace.MockPythPull as Program<MockPythPull>;
    const pullOracle = new pullOracleClient({ provider: provider, wallet: admin, program: pull, opts: { commitment: "confirmed" } });
    const [pullTxId, pullPriceAccountAddress] = await pullOracle.createOracle(priceFeed, 1, 0, 100 / 10);
    if (await confirmTransaction(provider.connection, pushTxId)) {
        console.log(`Pyth pull price account created for ${name} on ${pullPriceAccountAddress} during transaction ${pullTxId}\n`);
        updateEnvVariable(`${name}_PULL_ADDRESS`, pullPriceAccountAddress.toString());
    } else {
        console.error(`Failed to create pull oracle for ${name}\n`);
    }
}

Promise.all([
    createPythPriceAccount("SOL"),
    createPythPriceAccount("USDC"),
    createPythPriceAccount("ETH"),
]);

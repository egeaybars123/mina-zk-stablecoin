import { SDK, WaitFor, Keyring, TransactionOptions } from "avail-js-sdk"
import * as dotenv from 'dotenv';

export const SubmitData = async (data: string) => {
    // Initialize the SDK with a public Turing testnet endpoint
    // You can always switch it out with your own endpoint
    dotenv.config();

    const providerEndpoint = "wss://turing-rpc.avail.so/ws";
    const sdk = await SDK.New(providerEndpoint)

    const Alice = process.env.AVAIL_SEED_PHRASE;
    const account = new Keyring({ type: "sr25519" }).addFromUri(Alice)

    // You can submit data to any AppID of your choosing
    const options: TransactionOptions = { app_id: 243 }

    //Submit the transaction
    const result = await sdk.tx.dataAvailability.submitData(data, WaitFor.BlockInclusion, account, options)
    if (result.isErr) {
        console.log(result.reason)
        process.exit(1)
    }

    // Logging transaction details in the terminal
    console.log("Data=" + result.txData.data)
    console.log("Who=" + result.event.who + ", DataHash=" + result.event.dataHash)
    console.log("TxHash=" + result.txHash + ", BlockHash=" + result.blockHash)

    await sdk.api.disconnect()

    return true
    
}


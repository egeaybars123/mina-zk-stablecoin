import { initialize } from "avail-js-sdk"


//TxHash=0x44a7c1d706e7524fea499062c0aa81cbb6152160b011447b69ce151d2ccf4535
//BlockHash=0xd8f22b8ac4bdf1ec10f93b693313b7a58ac9a3c652d1cd722506b9436189385a
//DataHash=0x5b695251eabd83babc9327ee74bb22263524b61d23fef7e2b585c8fc05bc06d6

//Mina proof:
//TxHash=0x25800f6c2d935783855970565daaf569273644cbef7ab9ff53c8f14983a553e5
//BlockHash=0xbd188d901afde0c8267fa0bcb48e436e0be1f5d8035a01925a98e088aee387d2

export const ReadData = async (txHash: string, blockHash: string) => {
    try {
        //initialize sdk
        const api = await initialize("wss://turing-rpc.avail.so/ws")

        // Provide the transaction hash and block hash
        //const [txHash, blockHash] = ["0x25800f6c2d935783855970565daaf569273644cbef7ab9ff53c8f14983a553e5", "0xbd188d901afde0c8267fa0bcb48e436e0be1f5d8035a01925a98e088aee387d2"]
        console.log(`Tx Hash: ${txHash}, Block Hash: ${blockHash}`)

        // Extracting data
        const block = await api.rpc.chain.getBlock(blockHash)
        const tx = block.block.extrinsics.find((tx) => tx.hash.toHex() == txHash)
        if (tx == undefined) {
            console.log("Failed to find the Submit Data transaction")
            process.exit(1)
        }

        //console.log(JSON.stringify(tx))
        const dataHex = tx.method.args.map((a) => a.toString()).join(", ")
        // Data retrieved from the extrinsic data
        let str = ""
        for (let n = 2; n < dataHex.length; n += 2) {
            str += String.fromCharCode(parseInt(dataHex.substring(n, n + 2), 16))
        }
        console.log(`This is the string that was submitted: ${str}`)

        await api.disconnect()

        return str
    } catch (err) {
        console.error(err)
        process.exit(1)
    }
}

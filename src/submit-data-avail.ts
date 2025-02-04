import { ReserveProof } from "./ReserveProof.js";
import { PrivateKey, Signature, Field, PublicKey, verify } from "o1js"
import { SubmitData } from "./submit-data.js";
import { ReadData } from "./read-data.js";


async function Submit() {
    const { verificationKey } = await ReserveProof.compile();

    console.log("proving the reserves");
    const oraclePrivateKey = 'EKF65JKw9Q1XWLDZyZNGysBbYG21QbJf3a4xnEoZPZ28LKYGMw53'
    const oraclePubKey = 'B62qphyUJg3TjMKi74T2rF8Yer5rQjBr1UyEG7Wg9XEYAHjaSiSqFv1'
    const oracle = {
        privateKey: PrivateKey.fromBase58(oraclePrivateKey),
        publicKey: PublicKey.fromBase58(oraclePubKey)
    };
    const reserves = Field(2000)
    const signature = Signature.create(oracle.privateKey, [reserves])

    const { proof: reserve_proof } = await ReserveProof.prove_reserves(Field(1000), oracle.publicKey, signature, reserves);

    console.log("Submitting the proof on Avail DA...")
    
    const proof = await reserve_proof.toJSON();
    const proof_string = JSON.stringify(proof);

    console.log("proof_string", proof_string);
    console.log(proof_string.at(0));
    const proof_submission = await SubmitData(proof_string)
    console.log("Proof Submission Result: ", proof_submission)
}

async function Read() {
    const { verificationKey } = await ReserveProof.compile();

    const [txHash, blockHash] = ["0x25800f6c2d935783855970565daaf569273644cbef7ab9ff53c8f14983a553e5", "0xbd188d901afde0c8267fa0bcb48e436e0be1f5d8035a01925a98e088aee387d2"]

    console.log('verifying proof of reserves');

    const data = await ReadData(txHash, blockHash);

    const proof_json = JSON.parse(data)

    //console.log('proof data', reserve_proof.publicInput.toString());

    const ok = await verify(proof_json, verificationKey);
    console.log('ok', ok); 
}

//Submit(); //comment out if you want to prove & submit the proof to the Avail DA.
Read(); //comment out if you want to readb & verify the proof and from the Avail DA.
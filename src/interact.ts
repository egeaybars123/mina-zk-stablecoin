import { equal } from "node:assert"
import { AccountUpdate, Bool, Mina, PrivateKey, UInt64, UInt8, Signature, Field, PublicKey } from "o1js"
import { FungibleToken } from "./Stablecoin.js"
import { FungibleTokenAdmin } from "./FungibleTokenAdmin.js"
import { fetchReserves } from "./oracle.js"

const localChain = await Mina.LocalBlockchain({
  proofsEnabled: false,
  enforceTransactionLimits: false,
})
Mina.setActiveInstance(localChain)

const fee = 1e8

//zkOracle pubKey: B62qphyUJg3TjMKi74T2rF8Yer5rQjBr1UyEG7Wg9XEYAHjaSiSqFv1
//zkOracle privateKey: EKF65JKw9Q1XWLDZyZNGysBbYG21QbJf3a4xnEoZPZ28LKYGMw53

const oraclePrivateKey = 'EKF65JKw9Q1XWLDZyZNGysBbYG21QbJf3a4xnEoZPZ28LKYGMw53'
const oraclePubKey = 'B62qphyUJg3TjMKi74T2rF8Yer5rQjBr1UyEG7Wg9XEYAHjaSiSqFv1'
const userId = 1 //userId for the zkOracle server
console.log("")

const [deployer, issuer, ] = localChain.testAccounts
const contract = PrivateKey.randomKeypair()
const admin = PrivateKey.randomKeypair()
const oracle = {
  privateKey: PrivateKey.fromBase58(oraclePrivateKey),
  publicKey: PublicKey.fromBase58(oraclePubKey)
};


const token = new FungibleToken(contract.publicKey)
const adminContract = new FungibleTokenAdmin(admin.publicKey)

console.log("Deploying token contract...")

const deployTx = await Mina.transaction({
  sender: deployer,
  fee,
}, async () => {
  AccountUpdate.fundNewAccount(deployer, 3)
  await adminContract.deploy({ adminPublicKey: admin.publicKey })
  await token.deploy({
    symbol: "USDM", //USDM - test stablecoin on Mina
    src: "https://github.com/egeaybars123/mina-projects",
    allowUpdates: true,
  })
  await token.initialize(
    admin.publicKey,
    UInt8.from(6),
    // We can set `startPaused` to `Bool(false)` here, because we are doing an atomic deployment
    // If you are not deploying the admin and token contracts in the same transaction,
    // it is safer to start the tokens paused, and resume them only after verifying that
    // the admin contract has been deployed
    Bool(false),
    oracle.publicKey
  )
})

await deployTx.prove()
deployTx.sign([deployer.key, contract.privateKey, admin.privateKey])
await deployTx.send()
console.log("Deploy tx confirmed");

//Stablecoin issuer minting test - it should pass.
//Reason: issuer mints below their reserves.
const issuerBalanceBeforeMint = (await token.getBalanceOf(issuer)).toBigInt()
console.log("Issuer balance before mint:", issuerBalanceBeforeMint)
equal(issuerBalanceBeforeMint, 0n)

console.log("Oracle signing the Proof of Reserves.")
const nonce = token.nonce.get()
//const reserve = new UInt64(4e9)
//const signature_message: Field[] = reserve.toFields()
//signature_message.push(nonce)
//const signature = Signature.create(oracle.privateKey, signature_message)
const response = await fetchReserves(userId, Number(nonce))
console.log("First response: ", response)
const reserve = response.data.reserves;
const signature = response.signature;


console.log("Minting new tokens to Issuer.")
const mintTx = await Mina.transaction({
  sender: deployer,
  fee,
}, async () => {
  AccountUpdate.fundNewAccount(deployer, 1)
  await token.mint(issuer, new UInt64(2e9), new UInt64(reserve), Signature.fromBase58(signature)) //we are minting 2000 USDM tokens to issuer
})
await mintTx.prove();
mintTx.sign([deployer.key, admin.privateKey]);

await mintTx.send();
console.log("Mint Tx Confirmed!")

const issuerBalanceAfterMint = (await token.getBalanceOf(issuer)).toBigInt()
console.log("Issuer balance after mint:", issuerBalanceAfterMint)
equal(issuerBalanceAfterMint, BigInt(2e9))
const nonceAfterMint = token.nonce.get()
equal(nonceAfterMint, 1)


//Issuer attempts to mint above their reserves - tx must fail now!
console.log("Oracle Signing the Reserves...")
const nonce_1 = token.nonce.get()
//const reserve = new UInt64(4e9)
//const signature_message: Field[] = reserve.toFields()
//signature_message.push(nonce)
//const signature = Signature.create(oracle.privateKey, signature_message)
const response_1 = await fetchReserves(userId, Number(nonce_1))
console.log("Second response: ", response_1)
const reserve_1 = response_1.data.reserves;
const signature_1 = response_1.signature;

console.log("TEST 2 (Will fail): Minting new tokens to Issuer.")
try {
  const mintTx_1 = await Mina.transaction({
    sender: deployer,
    fee,
  }, async () => {
    AccountUpdate.fundNewAccount(deployer, 1)
    await token.mint(issuer, new UInt64(3e9), new UInt64(reserve_1), Signature.fromBase58(signature_1)) //we are minting 10000 USDM tokens to issuer - above the reserves
  })
  await mintTx_1.prove();
  mintTx_1.sign([deployer.key, admin.privateKey]);

  await mintTx_1.send(); //This gives an error!
} catch {
  console.log("Cannot mint - not enough reserves (Test passes)")
}

/*
THIS PART WAS DONE BEFORE THE ZKORACLE INTEGRATION - NEED TO CHANGE THE RESERVES TO IMPLEMENT THIS PART.
YOU CAN EXPERIMENT WITH IT IF YOU'RE INTERESTED.
// Reserve: 4,000 USD -> we minted 2,000 USDM till now
// Reserves drop to 1,500 -> Cannot mint more -> Needs to burn!
const new_reserve = new UInt64(15e8)
const signature_message_2: Field[] = new_reserve.toFields() //reserve does not change- fixed at 4000.
signature_message_2.push(nonce.add(2))
const signature_2 = Signature.create(oracle.privateKey, signature_message_2)

console.log("TEST 3: Burning tokens")
const burnTx = await Mina.transaction({
  sender: issuer,
  fee,
}, async () => {
  //AccountUpdate.fundNewAccount(issuer, 4)
  await token.burn(issuer, new UInt64(1e9)) //we are burning 1000 USDM tokens to be equal with the updated reserves.
})
await burnTx.prove();
burnTx.sign([issuer.key]);

await burnTx.send(); 

const issuerBalanceAfterBurn = (await token.getBalanceOf(issuer)).toBigInt()
console.log("Issuer balance after burn:", issuerBalanceAfterBurn)
equal(issuerBalanceAfterBurn, BigInt(1e9))
*/
import {
    Field,
    ZkProgram,
    Signature,
    PublicKey
} from 'o1js';

export const ReserveProof = ZkProgram({
    name: 'proof-of-reserves',
    publicInput: Field, //can we have three public inputs?

    methods: {
        prove_reserves: {
            privateInputs: [PublicKey, Signature, Field],

            async method(circulating_supply: Field, publicKey: PublicKey, signature: Signature, reserves: Field) {
                circulating_supply.assertLessThanOrEqual(reserves)
                signature.verify(publicKey, [reserves])
            },
        },

    },
});
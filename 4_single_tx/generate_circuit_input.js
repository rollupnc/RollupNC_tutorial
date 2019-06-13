const fs = require("fs");
const eddsa = require("../circomlib/src/eddsa.js");
const mimcjs = require("../circomlib/src/mimc7.js");

const alicePrvKey = Buffer.from('1'.toString().padStart(64,'0'), "hex");
const alicePubKey = eddsa.prv2pub(alicePrvKey);
const bobPrvKey = Buffer.from('2'.toString().padStart(64,'0'), "hex");
const bobPubKey = eddsa.prv2pub(bobPrvKey);

// accounts
const Alice = {
    pubkey: alicePubKey,
    balance: 500
}
const aliceHash = mimcjs.multiHash(
    [Alice.pubkey[0], Alice.pubkey[1], Alice.balance]
);

const Bob = {
    pubkey: bobPubKey,
    balance: 0
}
const bobHash = mimcjs.multiHash(
    [Bob.pubkey[0], Bob.pubkey[1], Bob.balance]
);

const accounts_root = mimcjs.multiHash([aliceHash, bobHash])

// transaction
const tx = {
    from: Alice.pubkey,
    to: Bob.pubkey,
    amount: 500
}

// Alice sign tx
const txHash = mimcjs.multiHash(
    [tx.from[0], tx.from[1], tx.to[0], tx.to[1], tx.amount]
);
const signature = eddsa.signMiMC(alicePrvKey, txHash)

// update Alice account
const newAlice = {
    pubkey: alicePubKey,
    balance: 0
}
const newAliceHash = mimcjs.multiHash(
    [newAlice.pubkey[0], newAlice.pubkey[1], newAlice.balance]
);

// update intermediate root
const intermediate_root = mimcjs.multiHash([newAliceHash, bobHash])

// update Bob account
const newBob = {
    pubkey: bobPubKey,
    balance: 500
}
const newBobHash = mimcjs.multiHash(
    [newBob.pubkey[0], newBob.pubkey[1], newBob.balance]
);

// update final root
const final_root = mimcjs.multiHash([newAliceHash, newBobHash])


const inputs = {
    "accounts_root": accounts_root.toString(),
    "intermediate_root": intermediate_root.toString(),
    "accounts_pubkeys": [
        [Alice.pubkey[0].toString(), Alice.pubkey[1].toString()], 
        [Bob.pubkey[0].toString(), Bob.pubkey[1].toString()]
    ],
    "accounts_balances": [Alice.balance, Bob.balance],
    "sender_pubkey": [Alice.pubkey[0].toString(), Alice.pubkey[1].toString()],
    "sender_balance": Alice.balance,
    "receiver_pubkey": [Bob.pubkey[0].toString(), Bob.pubkey[1].toString()],
    "receiver_balance": Bob.balance,
    "amount": tx.amount,
    "signature_R8x": signature['R8'][0].toString(),
    "signature_R8y": signature['R8'][1].toString(),
    "signature_S": signature['S'].toString(),
    "sender_proof": [bobHash.toString()],
    "sender_proof_pos": [1],
    "receiver_proof": [newAliceHash.toString()],
    "receiver_proof_pos": [0]
}

fs.writeFileSync(
    "./input.json",
    JSON.stringify(inputs),
    "utf-8"
);
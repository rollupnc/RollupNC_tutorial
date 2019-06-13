const fs = require("fs");
const eddsa = require("../circomlib/src/eddsa.js");
const mimcjs = require("../circomlib/src/mimc7.js");

const preimage = [123,456,789];
const M = mimcjs.multiHash(preimage);
const prvKey = Buffer.from('1'.toString().padStart(64,'0'), "hex");
const pubKey = eddsa.prv2pub(prvKey);

const signature = eddsa.signMiMC(prvKey, M);

const inputs = {
    "from_x": pubKey[0].toString(),
    "from_y": pubKey[1].toString(),
    "R8x": signature['R8'][0].toString(),
    "R8y": signature['R8'][1].toString(),
    "S": signature['S'].toString(),
    "M": M.toString()
}

fs.writeFileSync(
    "./input.json",
    JSON.stringify(inputs),
    "utf-8"
);

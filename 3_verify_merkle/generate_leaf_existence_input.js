const fs = require("fs");
const mimcjs = require("../circomlib/src/mimc7.js");
const mimcMerkle = require('./MiMCMerkle.js')

const leaf1 = mimcjs.multiHash([1,2,3])
const leaf2 = mimcjs.multiHash([4,5,6])
const leaf3 = mimcjs.multiHash([7,8,9])
const leaf4 = mimcjs.multiHash([9,8,7])
const leafArray = [leaf1,leaf2,leaf3,leaf4]

const tree = mimcMerkle.treeFromLeafArray(leafArray)
const root = tree[0][0];
const leaf1Proof = mimcMerkle.getProof(0, tree, leafArray)
const leaf1Pos = [1,1]

const inputs = {
    "leaf": leaf1.toString(),
    "root": root.toString(),
    "paths2_root": [leaf1Proof[0].toString(),leaf1Proof[1].toString()],
    "paths2_root_pos": leaf1Pos
}

fs.writeFileSync(
    "./input.json",
    JSON.stringify(inputs),
    "utf-8"
);

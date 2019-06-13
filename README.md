# RollupNC_tutorial
This is a [circom](https://github.com/iden3/circom) and [snarkjs](https://github.com/iden3/snarkjs) tutorial, using [RollupNC](https://github.com/barryWhiteHat/RollupNC) as an example. It takes you through how to build RollupNC, circuit by circuit, with generated inputs to test the circuits out.

(Created for [IC3 2019](https://www.initc3.org/) and inspired by [GuthL's rollup circom tutorial](https://github.com/GuthL/roll_up_circom_tutorial).)

- [RollupNC_tutorial](#rollupnc_tutorial)
  * [Setting up this tutorial](#setting-up-this-tutorial)
  * [Exercises](#exercises)
    + [Simple arithmetic constraints](#simple-arithmetic-constraints)
      - [Challenge](#challenge)
    + [Verifying an EdDSA signature](#verifying-an-eddsa-signature)
      - [Challenge](#challenge-1)
    + [Verifying a Merkle proof](#verifying-a-merkle-proof)
      - [Challenge](#challenge-2)
    + [Processing a single transaction](#processing-a-single-transaction)
    + [Processing multiple transactions](#processing-multiple-transactions)
  * [If conditions and comparators](#if-conditions-and-comparators)

![](https://i.imgur.com/x1tDlfD.png)

## Setting up this tutorial
0. We are using `node v10.16.0`, which you can possibly install using [nvm](https://github.com/nvm-sh/nvm/blob/master/README.md)
1. Clone this repo: `git clone https://github.com/therealyingtong/RollupNC_tutorial`
2. Clone the submodules: `git submodule update --init --recursive`
- this should clone `circomlib`. We are using v0.0.6 for this tutorial. To make sure we're using the same commit, do `git checkout 77928872169b7179c9eee545afe0a972d15b1e64` in the `circomlib` repository.
3. Install npm packages in both the root repository and the `circomlib` submodule: `npm i`

NB: there's a circom syntax highlighter in VS code! otherwise one can make do with `C#` highlighting.

## Exercises
### Simple arithmetic constraints
`cd 1_simple_arithmetic`

This is a contrived example to familiarise ourselves with the syntax of `circom` and how it works with `snarkjs`.

Let's write a circuit to check:
- that the sum of two private inputs `a + b` is equal to a public input `c`;
- that the product `b * c` is equal to private input `d`;

Create a new file named `circuit.circom` with the following content:
```
template SimpleChecks() {
    signal private input a;
    signal private input b;
    signal input c;
    signal private input d;
    signal output out;
    
    // force a + b = c
    a + b === c;

    // force b * c = d
    // fill this in

    // output c + d
    out <== c + d;
}

component main = SimpleChecks();
```
NB: there's a circom syntax highlighter in VS code! otherwise one can make do with `C#` highlighting.

- Compile your circuit `circom circuit.circom -o circuit.json`.

- Generate your input `node generate_circuit_input.js` (generates `input.json`).

- Calculate the witness `snarkjs calculatewitness -c circuit.json -i input.json`. This generates `witness.json`.

- Perform the trusted setup to get your `proving_key.json` and `verification_key.json`: `snarkjs setup -c circuit.json --protocol groth`.

- Generate the proof `snarkjs proof -w witness.json --pk proving_key.json`. This generates `proof.json` and `public.json`.

- Verify the proof `snarkjs verify`. 

#### Challenge
Modify the circuit and input to take in length-4 arrays of `a`, `b`, `c`, and `d`, and perform the checks in a `for` loop. Output the sums of `c` and `d` arrays. To get you started:

```
template SimpleChecks(k) {
    signal private input a[k];
    signal private input b[k];
    signal input c[k];
    signal private input d[k];
    signal output out;
    
    var sum = 0;
    for (var i = 0; i < k; i++){
        // force a + b = c
        a[i] + b[i] === c[i];

        // force b * c = d
        // fill this in

        // add up c and d arrays
        // use the variable 'sum' defined outside the for loop
    }
    // output sum of c and d arrays
    out <== sum;
}

component main = SimpleChecks(4);
```


### Verifying an EdDSA signature
`cd 2_verify_eddsa`

This example works with useful libraries in `circomlib`. Note: we are using v0.0.6 of `circomlib`. 

Create a new file named `circuit.circom` with the following content:

```
include "../circomlib/circuits/eddsamimc.circom";

template VerifyEdDSAMiMC() {
    signal input from_x;
    signal input from_y;
    signal input R8x;
    signal input R8y;
    signal input S;
    signal input M;
    
    component verifier = EdDSAMiMCVerifier();   
    verifier.enabled <== 1;
    verifier.Ax <== from_x;
    verifier.Ay <== from_y;
    verifier.R8x <== R8x
    verifier.R8y <== R8y
    verifier.S <== S;
    verifier.M <== M;
}

component main = VerifyEdDSAMiMC();
```

Generate your input `node generate_circuit_input.js` (generates `input.json`).

You know the drill from here!

#### Challenge
Modify the circuit and input to take in a length-3 preimage of the message as a private input, and hash them inside the circuit. To get you started:

```
include "../circomlib/circuits/eddsamimc.circom";
include "../circomlib/circuits/mimc.circom";

template VerifyEdDSAMiMC(k) {
    signal input from_x;
    signal input from_y;
    signal input R8x;
    signal input R8y;
    signal input S;
    signal private input preimage[k];

    component M = MultiMiMC7(k,91);
    M.in[0] <== // the first element of your preimage
    M.in[1] <== // the second element of your preimage
    M.in[2] <== // the third element of your preimage
    
    component verifier = EdDSAMiMCVerifier();   
    verifier.enabled <== 1;
    verifier.Ax <== from_x;
    verifier.Ay <== from_y;
    verifier.R8x <== R8x;
    verifier.R8y <== R8y;
    verifier.S <== S;
    verifier.M <== M.out;
}

component main = VerifyEdDSAMiMC(3);
```

### Verifying a Merkle proof
`cd 3_verify_merkle`

This example shows how to write smaller templates and use them as components in the main circuit. To verify a Merkle proof, we need to take in a leaf and its Merkle root, along with the path from the leaf to the root. Let's break this down into two circuits:

1. `get_merkle_root.circom`: this takes a leaf and a Merkle path and returns the computed Merkle root.
2. `leaf_existence.circom`: this compares an expected Merkle root with a computed Merkle root.

Create new file named `get_merkle_root.circom` and paste this code in: 

```
include "../circomlib/circuits/mimc.circom";

template GetMerkleRoot(k){
// k is depth of tree

    signal input leaf;
    signal input paths2_root[k];
    signal input paths2_root_pos[k];

    signal output out;

    // hash of first two entries in tx Merkle proof
    component merkle_root[k];
    merkle_root[0] = MultiMiMC7(2,91);
    merkle_root[0].in[0] <== leaf - paths2_root_pos[0]* (leaf - paths2_root[0]);
    merkle_root[0].in[1] <== paths2_root[0] - paths2_root_pos[0]* (paths2_root[0] - leaf);

    // hash of all other entries in tx Merkle proof
    for (var v = 1; v < k; v++){
        merkle_root[v] = MultiMiMC7(2,91);
        merkle_root[v].in[0] <== paths2_root[v] - paths2_root_pos[v]* (paths2_root[v] - merkle_root[v-1].out);
        merkle_root[v].in[1] <== //can you figure this one out?
    }

    // output computed Merkle root
    out <== merkle_root[k-1].out;

}

component main = GetMerkleRoot(2);

```
Try to fill in the second line of the `for` loop using the pattern from the lines before. (The solution is in `sample_get_merkle_root.circom`.)

Now, make the second file `leaf_existence.circom` and paste this in: 
```
include "./get_merkle_root.circom";

// checks for existence of leaf in tree of depth k

template LeafExistence(k){
// k is depth of tree

    signal input leaf; 
    signal input root;
    signal input paths2_root_pos[k];
    signal input paths2_root[k];

    component computed_root = GetMerkleRoot(k);
    computed_root.leaf <== leaf;

    for (var w = 0; w < k; w++){
        computed_root.paths2_root[w] <== // assign elements from paths2_root
        computed_root.paths2_root_pos[w] <== // assign elements from paths2_root_pos
    }

    // equality constraint: input tx root === computed tx root 
    root === computed_root.out;

}

component main = LeafExistence(2);
```

Make sure to REMOVE `component main = GetMerkleRoot(2)` from `get_merkle_root.circom`. 

Modify your input to work with `leaf_existence.circom`.

#### Challenge
Like you did in the EdDSA verification exercise, provide the preimage of the leaf hash as private inputs to `leaf_existence.circom`, and hash them in the circuit.

### Processing a single transaction
Let's define a transaction as:

```js
class Transaction = {
    from: eddsa_pubkey,
    to: eddsa_pubkey,
    amount: integer
}
```
and an account as:

```js
class Account = {
    pubkey: eddsa_pubkey,
    balance: integer
}
```
NB: we also have a nonce for protection against replay attacks, but for simplicity let's consider it in the next example.

In RollupNC, processing a single transaction involves:
- checking that the sender account existsin a tree of accounts, `accounts_root`
- checking that the hash of the transaction was signed by the sender
- debiting the sender account
- updating the `accounts_root` to get `intermediate_root`
- checking that the receiver account exists in `intermediate_root`
- crediting the receiver account
- updating the `accounts_root`to get `final_root`

Create a file called `circuit.circom` and put in this code. Fill in the signals for each component. Then, compile your circuit and test it against the `input.json` generated by running `node generate_circuit_input.js`.
```
include "./leaf_existence.circom";
include "./verify_eddsamimc.circom";
include "./get_merkle_root.circom";
include "../circomlib/circuits/mimc.circom";

template ProcessTx(k){
    // k is depth of accounts tree

    // accounts tree info
    signal input accounts_root;
    signal private input intermediate_root;
    signal private input accounts_pubkeys[2**k, 2];
    signal private input accounts_balances[2**k];

    // transactions info
    signal private input sender_pubkey[2];
    signal private input sender_balance;
    signal private input receiver_pubkey[2];
    signal private input receiver_balance;
    signal private input amount;
    signal private input signature_R8x;
    signal private input signature_R8y;
    signal private input signature_S;
    signal private input sender_proof[k];
    signal private input sender_proof_pos[k];
    signal private input receiver_proof[k];
    signal private input receiver_proof_pos[k];

    // output
    signal output new_accounts_root;

    // verify sender account exists in accounts_root
    component senderExistence = LeafExistence(k, 3);
    senderExistence.preimage[0] <== sender_pubkey[0];
    senderExistence.preimage[1] <== sender_pubkey[1];
    senderExistence.preimage[2] <== sender_balance;
    senderExistence.root <== accounts_root;
    for (var i = 0; i < k; i++){
        senderExistence.paths2_root_pos[i] <== sender_proof_pos[i];
        senderExistence.paths2_root[i] <== sender_proof[i];
    }

    // check that transaction was signed by sender
    component signatureCheck = VerifyEdDSAMiMC(5);
    signatureCheck.from_x <== sender_pubkey[0];
    signatureCheck.from_y <== sender_pubkey[1];
    signatureCheck.R8x <== signature_R8x;
    signatureCheck.R8y <== signature_R8y;
    signatureCheck.S <== signature_S;
    signatureCheck.preimage[0] <== sender_pubkey[0];
    signatureCheck.preimage[1] <== sender_pubkey[1];
    signatureCheck.preimage[2] <== receiver_pubkey[0];
    signatureCheck.preimage[3] <== receiver_pubkey[1];
    signatureCheck.preimage[4] <== amount;

    // debit sender account and hash new sender leaf
    component newSenderLeaf = MultiMiMC7(3,91){
        newSenderLeaf.in[0] <== sender_pubkey[0];
        newSenderLeaf.in[1] <== sender_pubkey[1];
        newSenderLeaf.in[2] <== sender_balance - amount;
    }

    // update accounts_root
    component computed_intermediate_root = GetMerkleRoot(k);
    computed_intermediate_root.leaf <== newSenderLeaf.out;
    for (var i = 0; i < k; i++){
        computed_intermediate_root.paths2_root_pos[i] <== sender_proof_pos[i];
        computed_intermediate_root.paths2_root[i] <== sender_proof[i];
    }

    // check that computed_intermediate_root.out === intermediate_root
    computed_intermediate_root.out === intermediate_root;

    // verify receiver account exists in intermediate_root
    component receiverExistence = LeafExistence(k, 3);
       // provide the appropriate signals to this component! see senderExistence for reference

    // credit receiver account and hash new receiver leaf
    component newReceiverLeaf = MultiMiMC7(3,91){
       // provide the appropriate signals to this component! see newSenderLeaf for reference
    }

    // update accounts_root
    component computed_final_root = GetMerkleRoot(k);
       // provide the appropriate signals to this component! see computed_intermediate_root for reference

    // output final accounts_root
    new_accounts_root <== computed_final_root.out;
}

component main = ProcessTx(1);
```

### Processing multiple transactions
Processing multiple transactions requires us to update the `accounts_root` many times before we arrive at the final one. This means we have to pre-compute all the `intermediate_roots` and pass them to the circuit to use in validating Merkle proofs.

Check out https://github.com/therealyingtong/RollupNC/blob/master/snark_circuit/multiple_tokens_transfer_and_withdraw.circom to see how it was implemented.

## If conditions and comparators
## If conditions and comparators

Although circom's parser (see parser/jaz.jison) supports `if` statements, because circom compiles the DSL into 
arithmetic circuits, circuits whose behavior *depends* on the value of an input can have unexpected behavior.

For example, consider the following example

```
template BadForceEqualIfEnabled() {
    signal input enabled;
    signal input in[2];

    if (enabled) {
        in[1] === in[0]
    }
}

component main BadForceEqualIfEnabled()
```

First compile the circuit:
`circom circuit.circom -o circuit.json`

Create the `input.json` file:

```
{"enabled": 0, "in": [1,2]} 
```

`snarkjs calculatewitness`

Now, in witness.json,
change the enabled flag (the second array element) to 1. 
(If it was set in the 
previous step the compiler will not calculate a witness because 
it sees a constraint that cannot be satisfied.)

`snarkjs setup --protocol groth`

`snarkjs proof --protocol groth`

`snarkjs verify`

Should get INVALID - we get OK in the bad case.

As an exercise, implement the circuit properly
(or refer to circuits/circomlib/comparators.circom).






{"enabled": 0, "in": [1,2]}


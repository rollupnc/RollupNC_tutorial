# RollupNC_tutorial
This is a [circom](https://github.com/iden3/circom) and [snarkjs](https://github.com/iden3/snarkjs) / [websnark](https://github.com/iden3/websnark) tutorial, using [RollupNC](https://github.com/barryWhiteHat/RollupNC) as an example. It takes you through how to build RollupNC, circuit by circuit, with generated inputs to test the circuits out.

(Created for [IC3 2019](https://www.initc3.org/) and inspired by [GuthL's rollup circom tutorial](https://github.com/GuthL/roll_up_circom_tutorial).)

![](https://i.imgur.com/x1tDlfD.png)

## Setting up this tutorial
0. We are using `node v10.16.0`, which you can possibly install using [nvm](https://github.com/nvm-sh/nvm/blob/master/README.md)
1. Clone this repo: `git clone https://github.com/therealyingtong/RollupNC_tutorial`
2. Clone the submodules: `git submodule update --init --recursive`
3. Install npm packages in both the root repository and the submodule: `npm i`

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

### Processing a single transaction

### Processing multiple transactions

## If conditions and comparators

template SimpleChecks() {
    signal private input a;
    signal private input b;
    signal input c;
    signal private input d;
    signal output out;
    
    // force a + b = c
    a + b === c;

    // force b * c = d
    b * c === d;

    // output c + d
    out <== c + d;
}

component main = SimpleChecks();
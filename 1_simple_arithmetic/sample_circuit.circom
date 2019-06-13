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
        b[i] * c[i] === d[i];

        // add up c and d arrays
        sum = sum + c[i] + d[i];
    }
    // output sum of c and d arrays
    out <== sum;
}

component main = SimpleChecks(4);
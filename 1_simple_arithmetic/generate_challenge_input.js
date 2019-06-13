const fs = require("fs");

var a = [2,2,2,2];
var b = [4,4,4,4];
var c = [6,6,6,6];
var d = [24,24,24,24];

const inputs = {
    "a": a,
    "b": b,
    "c": c,
    "d": d
}

fs.writeFileSync(
    "./input.json",
    JSON.stringify(inputs),
    "utf-8"
);
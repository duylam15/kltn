
const fs = require("fs");
const raw = fs.readFileSync(0, "utf8").trim();
let input;

try {
  input = JSON.parse(raw);   // <-- Parse array
} catch {
  input = raw;
}

function sumArray(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
  }
  return sum;
}


if (typeof sumArray === "function") {
  console.log(String(sumArray(input)));
}

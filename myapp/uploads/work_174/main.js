
const fs = require("fs");
const raw = fs.readFileSync(0, "utf8").trim();
const n = Number(raw);

function factorial(n) {
  if (n < 0) return 0;
  if (n === 0 || n === 1) return 1;
  return n * factorial(n - 1);
}


if (typeof factorial === "function") {
  console.log(String(factorial(n)));
}

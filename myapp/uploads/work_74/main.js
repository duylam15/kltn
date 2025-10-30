
const fs = require("fs");
const raw = fs.readFileSync(0, "utf8").trim();
const n = Number(raw);


console.log(factorial(5)); // 120

if (typeof factorial === "function") {
  console.log(String(factorial(n)));
}

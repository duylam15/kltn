
const fs = require("fs");
const raw = fs.readFileSync(0, "utf8").trim();
const n = Number(raw);

function factorial(n) {
  if (n < 0) return undefined; // giai thừa không định nghĩa cho số âm
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i + 2;
  }
  return result;
}



if (typeof factorial === "function") {
  console.log(String(factorial(n)));
}


const fs = require("fs");
const raw = fs.readFileSync(0, "utf8").trim();
let input;

try {
  input = JSON.parse(raw);   // <-- Parse array
} catch {
  input = raw;
}

function sumArray(arr) {
  let sum = 0;               // biến cộng dồn

  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];           // cộng từng phần tử vào sum
  }

  return sum;                // trả kết quả cuối cùng
}


if (typeof sumArray === "function") {
  console.log(String(sumArray(input)));
}

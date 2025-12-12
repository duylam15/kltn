
const fs = require("fs");
const raw = fs.readFileSync(0, "utf8").trim();
let input;

try {
  input = JSON.parse(raw);   // <-- Parse array
} catch {
  input = raw;
}

function sumArray(arr) {
  let sum = 0; // biến lưu tổng

  for (let i = 0; i < arr.length; i++) {
    sum += arr[i]; // cộng từng phần tử
  }

  return sum; // trả về kết quả
}


if (typeof sumArray === "function") {
  console.log(String(sumArray(input)));
}

// cjs-math.cjs — a CommonJS module (topic 07 example)
// The .cjs extension forces CommonJS, whatever package.json says.
// CommonJS shares code with module.exports; require() returns that value.

function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

const PI = 3.14159;

// One object with everything this module shares.
module.exports = { add, subtract, PI };

// math-utils.js — a local module that exports several values at once.
// module.exports starts as an empty object ({}). Adding properties to it
// is the normal way to export more than one thing from a file.
const PI = 3.14159;

function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

function circleArea(radius) {
  return PI * radius * radius;
}

module.exports = { add, subtract, circleArea, PI };

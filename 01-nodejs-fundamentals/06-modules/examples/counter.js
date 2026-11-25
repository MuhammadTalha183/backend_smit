// counter.js — a local module with private state.
// Its top-level `count` belongs to this file only (module scope).
// But because require() caches modules, every file that requires
// this module gets the SAME object — and the same count.
let count = 0;

function increment() {
  count += 1;
  return count;
}

function getCount() {
  return count;
}

module.exports = { increment, getCount };

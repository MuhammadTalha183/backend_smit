// esm-math.mjs — an ES Module (topic 07 example)
// The .mjs extension forces ES Modules, whatever package.json says.
// ES Modules share code with export; import loads it.
// Unlike CommonJS, these are live bindings, not copies (see notes.md §3.6).

export const PI = 3.14159;

export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

// A counter that proves live bindings: importing files see the
// current value of count, not a snapshot taken at import time.
export let count = 0;

export function increment() {
  count += 1;
  return count;
}

// A default export: the "main thing" this module offers.
// A file can have many named exports but only one default export.
export default {
  name: 'esm-math',
  description: 'Small maths helpers, written as an ES Module',
};

// demo-cjs.cjs — a CommonJS file loading BOTH systems (topic 07 example)
// Run it with: node examples/demo-cjs.cjs
// (from inside the 07-commonjs-es-modules folder)
//
// This file is CommonJS itself, so require() works here.
// Node.js 22.12 and later can also require() an ES Module —
// on older Node versions that line throws ERR_REQUIRE_ESM.

const cjsMath = require('./cjs-math.cjs');

console.log('--- PART 1: require() a CommonJS module ---');
console.log('cjsMath.add(5, 3):', cjsMath.add(5, 3));
console.log('cjsMath.PI:', cjsMath.PI);

console.log('--- PART 2: require() an ES Module (Node 22.12+) ---');
const esmMath = require('./esm-math.mjs');
console.log('esmMath.add(5, 3):', esmMath.add(5, 3));
console.log('esmMath.PI:', esmMath.PI);
console.log('esmMath.default.name:', esmMath.default.name);

async function main() {
  console.log('--- PART 3: dynamic import() of an ES Module ---');
  // import() works everywhere, in both systems, and returns a Promise.
  // It is the safe way to load ESM from CommonJS.
  const esm = await import('./esm-math.mjs');
  console.log('esm.add(10, 4):', esm.add(10, 4));
  console.log('esm.count (before):', esm.count);
  console.log('esm.increment():', esm.increment());
  console.log('esm.count (after):', esm.count);
}

main();

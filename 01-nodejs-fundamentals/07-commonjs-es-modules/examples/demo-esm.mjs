// demo-esm.mjs — an ES Module file loading BOTH systems (topic 07 example)
// Run it with: node examples/demo-esm.mjs
// (from inside the 07-commonjs-es-modules folder)
//
// This file is an ES Module, so import works here and require() does not.
// There is no __dirname or __filename in ESM — import.meta.url replaces them.

import { add as esmAdd, subtract as esmSubtract, PI, count, increment } from './esm-math.mjs';
import esmDefault from './esm-math.mjs';
import cjsMath from './cjs-math.cjs';
import { add as cjsAdd } from './cjs-math.cjs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

console.log('--- PART 1: import an ES Module (named + default) ---');
console.log('esmAdd(5, 3):', esmAdd(5, 3));
console.log('esmSubtract(5, 3):', esmSubtract(5, 3));
console.log('PI:', PI);
console.log('default export name:', esmDefault.name);

console.log('--- PART 2: import a CommonJS module ---');
// A CommonJS module has no real named exports, so its whole
// module.exports becomes the DEFAULT export. Named imports from
// CommonJS only work when Node.js can statically see the names
// (cjs-module-lexer) — here it can, because cjs-math.cjs assigns
// an object literal to module.exports.
console.log('cjsMath.add(5, 3):', cjsMath.add(5, 3));
console.log('cjsAdd(5, 3) — named import from CJS:', cjsAdd(5, 3));

console.log('--- PART 3: live bindings (ESM) vs copies (CJS) ---');
console.log('count (before):', count);
increment();
increment();
// Re-importing is not needed: the imported binding follows the
// module's current value. (In this same file the binding updates
// because increment() ran in the same module graph — see notes §3.6.)
console.log('count (after two increments):', count);

console.log('--- PART 4: __dirname in ESM ---');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log('__filename ends with demo-esm.mjs:', __filename.endsWith('demo-esm.mjs'));
console.log('__dirname ends with examples:', __dirname.endsWith('examples'));

console.log('--- PART 5: require() inside ESM, via createRequire ---');
// createRequire gives you a require() that works inside an ES Module.
// Useful when an old library only works with require().
const require = createRequire(import.meta.url);
const cjsAgain = require('./cjs-math.cjs');
console.log('createRequire + require CJS add:', cjsAgain.add(2, 3));

console.log('--- PART 6: top-level await (ESM only) ---');
// No async wrapper needed — await works at the top level of an ESM file.
// The same line in a .cjs file is a SyntaxError.
const lazy = await import('./esm-math.mjs');
console.log('top-level await import, lazy.add(1, 2):', lazy.add(1, 2));

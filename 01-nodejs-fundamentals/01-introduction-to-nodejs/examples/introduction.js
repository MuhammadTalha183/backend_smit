/**
 * 01 - Introduction to Node.js
 * ----------------------------
 * Your first Node.js program, with proof that JavaScript
 * is now running OUTSIDE the browser.
 *
 * Run it with:  node examples/introduction.js
 *
 * What you will see:
 *  1. A hello message - JavaScript running on the server.
 *  2. Which Node.js / V8 versions you are running.
 *  3. Proof there is no `window` here - no browser.
 *  4. Your first built-in module: `os`.
 */

// ============================================================
// PART 1 - Hello, Node.js
// ============================================================
console.log('--- PART 1: Hello, Node.js ---');
console.log('Hello, Node.js!');
console.log('JavaScript is running outside the browser.');
console.log('');

// ============================================================
// PART 2 - Which Node.js am I running?
// ============================================================
console.log('--- PART 2: Versions ---');
console.log('Node version:', process.version);
console.log('V8 version:  ', process.versions.v8);
console.log('Platform:    ', process.platform);
console.log('process is a global object - no require() needed.');
console.log('');

// ============================================================
// PART 3 - Browser vs Node.js, in code
// ============================================================
console.log('--- PART 3: Browser vs Node.js ---');
console.log('typeof window:  ', typeof window);
console.log('typeof document:', typeof document);
console.log('typeof process: ', typeof process);
console.log('window and document are undefined here -');
console.log('there is no web page on a server.');
console.log('');

// ============================================================
// PART 4 - Your first module: os
// ============================================================
console.log('--- PART 4: First module (os) ---');
const os = require('os');

console.log('CPU cores:  ', os.cpus().length);
console.log('Free memory:', Math.round(os.freemem() / 1024 / 1024), 'MB');
console.log('Total memory:', Math.round(os.totalmem() / 1024 / 1024), 'MB');
console.log('');
console.log('require() loads a built-in module.');
console.log('Node.js can talk to the operating system.');
console.log('');
console.log('Next: 02 - Node.js Architecture');
console.log('V8 runs the code. libuv handles the waiting.');

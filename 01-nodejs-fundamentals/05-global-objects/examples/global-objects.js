/**
 * 05 - Global Objects
 * -------------------
 * This file PROVES what is global in Node.js, with runnable code.
 * Run it with:
 *
 *   node examples/global-objects.js
 *
 * What you will see:
 *  1. `globalThis` and `global` are the same object in Node.js,
 *     and there is NO `window` - that is a browser global.
 *  2. `__dirname` and `__filename` exist in every CommonJS file,
 *     and they are NOT globals - they come from the module wrapper.
 *  3. `process` is the most useful global: version, platform,
 *     current folder, command-line arguments, environment.
 *  4. `Buffer` holds raw bytes: one Urdu word is 4 characters
 *     but 8 bytes in UTF-8 - characters and bytes are not the same.
 *  5. The timers (`setTimeout`, `setImmediate`) and `console`
 *     are globals too - you never have to require them.
 *  6. The module-scope trap: a top-level `var` in a file is NOT
 *     global. Only things you put on `globalThis` are global.
 *  7. `URL` and `TextEncoder` / `TextDecoder` are globals for
 *     parsing links and converting text to bytes and back.
 *  8. `queueMicrotask` runs after the current code, before timers.
 *     It is last in this file on purpose: microtasks only run
 *     after ALL synchronous code finishes.
 *
 * Exact paths and timings vary by machine - look at the VALUES
 * and the true/false results, not the absolute paths.
 */

console.log('Node.js version:', process.version);
console.log('');

// ============================================================
// PART 1 - globalThis, global, and (no) window
// ============================================================
console.log('--- PART 1: globalThis, global, window ---');
console.log('globalThis === global:', globalThis === global);
console.log('typeof window:', typeof window);
console.log('typeof globalThis.setTimeout:', typeof globalThis.setTimeout);
console.log('typeof globalThis.process:', typeof globalThis.process);
console.log('typeof globalThis.Buffer:', typeof globalThis.Buffer);
console.log('typeof globalThis.console:', typeof globalThis.console);
console.log('');

// ============================================================
// PART 2 - __dirname, __filename, and process
// ============================================================
console.log('--- PART 2: __dirname, __filename, process ---');
console.log('__dirname:', __dirname);
console.log('__filename:', __filename);
console.log('process.cwd():', process.cwd());
console.log('process.version:', process.version);
console.log('process.platform:', process.platform);
console.log('process.argv[0] (node binary):', process.argv[0]);
console.log('process.argv[1] (this file):', process.argv[1]);
console.log('process.env.NODE_ENV:', process.env.NODE_ENV);
console.log('typeof process.env.NODE_ENV:', typeof process.env.NODE_ENV);
console.log('');

// ============================================================
// PART 3 - console is more than console.log
// ============================================================
console.log('--- PART 3: console methods ---');
console.table([
  { name: 'Talha', topic: 'Node.js' },
  { name: 'D CODES', topic: 'Backend' },
]);
console.log('console.table above printed a table, not just text.');
console.log('');

// ============================================================
// PART 4 - Buffer: characters are not bytes
// ============================================================
console.log('--- PART 4: Buffer and UTF-8 bytes ---');
const word = 'سلام';
const buf = Buffer.from(word, 'utf8');
console.log('word:', word);
console.log('word.length (characters):', word.length);
console.log('buf.length (bytes):', buf.length);
console.log('buf.toString("utf8"):', buf.toString('utf8'));
console.log('Buffer.from("hello").toString("hex"):', Buffer.from('hello').toString('hex'));
console.log('');

// ============================================================
// PART 5 - Timers and console are globals, no require needed
// ============================================================
console.log('--- PART 5: timers are globals ---');
console.log('global.setTimeout === setTimeout:', global.setTimeout === setTimeout);
console.log('global.setImmediate === setImmediate:', global.setImmediate === setImmediate);
console.log('global.console === console:', global.console === console);
console.log('global.Buffer === Buffer:', global.Buffer === Buffer);
console.log('');

// ============================================================
// PART 6 - The module-scope trap
// ============================================================
console.log('--- PART 6: a top-level var is NOT global ---');
var myModuleVar = 'I live in this file only';
globalThis.myExplicitGlobal = 'I live everywhere';
console.log('myModuleVar:', myModuleVar);
console.log('globalThis.myModuleVar:', globalThis.myModuleVar);
console.log('globalThis.myExplicitGlobal:', globalThis.myExplicitGlobal);
console.log('');

// ============================================================
// PART 7 - URL, TextEncoder, TextDecoder
// ============================================================
console.log('--- PART 7: URL and text encoding ---');
const url = new URL('https://example.com/users?page=2&limit=10');
console.log('url.hostname:', url.hostname);
console.log('url.pathname:', url.pathname);
console.log('url.searchParams.get("page"):', url.searchParams.get('page'));
const encoder = new TextEncoder();
const encoded = encoder.encode('hello');
console.log('TextEncoder "hello":', Array.from(encoded).join(', '));
const decoder = new TextDecoder();
console.log('TextDecoder back to text:', decoder.decode(encoded));
console.log('');

// ============================================================
// PART 8 - queueMicrotask runs before timers (kept last on purpose:
// microtasks only run after ALL synchronous code finishes,
// so this demo sits at the end of the file)
// ============================================================
console.log('--- PART 8: queueMicrotask order ---');
setTimeout(() => console.log('  3. setTimeout(0)'), 0);
queueMicrotask(() => console.log('  1. queueMicrotask'));
Promise.resolve().then(() => console.log('  2. Promise.then'));
console.log('  0. synchronous code (runs first, always)');

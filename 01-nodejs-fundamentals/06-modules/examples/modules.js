// modules.js — runnable demo for 06 Modules and Module Systems.
// Run it from this folder's parent with: node examples/modules.js
// It proves, in order: core modules, local modules, module.exports,
// require() caching (one shared object), the module wrapper, and
// requiring a JSON file. No packages are installed — only built-in
// and local modules are used.

// A top-level variable in THIS file. It is not global: counter.js
// cannot see it, and greet.js cannot see it. That is module scope.
const myPrivateName = 'Talha';

console.log('Node.js version:', process.version);
console.log('');

console.log('--- PART 1: a core (built-in) module ---');
// Core modules are loaded by name, with no ./ in front.
const path = require('path');
console.log('path.join("users", "talha", "notes.txt"):', path.join('users', 'talha', 'notes.txt'));
console.log('path.basename("/home/talha/app.js"):', path.basename('/home/talha/app.js'));
console.log('typeof path:', typeof path);
console.log('');

console.log('--- PART 2: a local module (one export) ---');
// Local modules are loaded by their relative path, starting with ./
const greet = require('./greet.js');
console.log('typeof greet:', typeof greet);
console.log(greet('Talha'));
console.log(greet('D CODES'));
console.log('');

console.log('--- PART 3: a local module (several exports) ---');
const math = require('./math-utils.js');
console.log('math.add(5, 3):', math.add(5, 3));
console.log('math.subtract(5, 3):', math.subtract(5, 3));
console.log('math.circleArea(2):', math.circleArea(2));
console.log('math.PI:', math.PI);
console.log('');

console.log('--- PART 4: require() caches modules (one shared object) ---');
// Requiring the same file twice returns the SAME object, not a new copy.
const counterA = require('./counter.js');
const counterB = require('./counter.js');
console.log('counterA === counterB:', counterA === counterB);
console.log('counterA.increment():', counterA.increment());
console.log('counterA.increment():', counterA.increment());
console.log('counterB.getCount() (sees the same count):', counterB.getCount());
console.log('counterB.increment():', counterB.increment());
console.log('counterA.getCount() (also sees it):', counterA.getCount());
console.log('');

console.log('--- PART 5: the module wrapper ---');
// These five names exist in every CommonJS file, but they are NOT globals.
// They are arguments Node.js passes to the wrapper function around this file.
console.log('__filename:', __filename);
console.log('__dirname:', __dirname);
console.log('typeof require:', typeof require);
console.log('typeof module:', typeof module);
console.log('typeof exports:', typeof exports);
console.log('module.exports === exports (at the start):', module.exports === exports);
console.log('typeof globalThis.greet:', typeof globalThis.greet);
console.log('typeof globalThis.myPrivateName:', typeof globalThis.myPrivateName);
console.log('');

console.log('--- PART 6: requiring a JSON file ---');
// require() can load a .json file too. It is parsed into a plain object.
const config = require('./config.json');
console.log('config.appName:', config.appName);
console.log('config.port:', config.port);
console.log('config.version:', config.version);
console.log('typeof config:', typeof config);
console.log('');

console.log('--- PART 7: require.resolve and require.cache ---');
// require.resolve() answers "which file would require() load?" without loading it.
console.log('require.resolve("./greet.js"):', require.resolve('./greet.js'));
// require.cache holds every module loaded so far, keyed by its full path.
console.log('require.cache has greet.js:', require.resolve('./greet.js') in require.cache);
console.log('require.cache has counter.js:', require.resolve('./counter.js') in require.cache);
console.log('require.main === module (this file was run directly):', require.main === module);

/**
 * 03 - V8 Engine
 * --------------
 * This file PROVES how V8 runs your JavaScript, with runnable code.
 * Run it with:  node --expose-gc examples/v8.js
 * (The --expose-gc flag is only needed for Part 4, so the demo
 *  can trigger garbage collection on demand. Without it, Part 4
 *  prints a note instead of running the GC step.)
 *
 * What you will see:
 *  1. Which V8 version your Node.js is running, and your heap stats.
 *  2. JIT warm-up: the SAME loop runs much faster the 2nd time,
 *     because V8 has compiled it to optimized machine code.
 *  3. Hidden Classes / Inline Caching: objects with the SAME shape
 *     are read much faster than objects whose shape keeps changing.
 *  4. Garbage Collection: heap grows as objects are created, then
 *     shrinks again after the objects are dropped and GC runs.
 *
 * Exact timings vary by machine - look at the ORDER and the
 * relative difference, not the milliseconds.
 */

const v8 = require('v8');

console.log('Node.js version:', process.version);
console.log('V8 version:     ', process.versions.v8);
console.log('');

// ============================================================
// PART 1 - V8 by the numbers: heap statistics
// ============================================================
console.log('--- PART 1: Heap statistics (v8 module) ---');

const heap = v8.getHeapStatistics();
console.log('Used heap size: ', Math.round(heap.used_heap_size / 1024 / 1024), 'MB');
console.log('Total heap size:', Math.round(heap.total_heap_size / 1024 / 1024), 'MB');
console.log('Heap size limit:', Math.round(heap.heap_size_limit / 1024 / 1024), 'MB');
console.log('This is V8\'s memory: the heap where your objects live.');
console.log('Raise the limit with: node --max-old-space-size=4096 app.js');
console.log('');

// ============================================================
// PART 2 - JIT warm-up: the same code gets faster
// ============================================================
console.log('--- PART 2: JIT warm-up ---');
console.log('Running the SAME 1,000,000-add loop three times...');

function add(a, b) {
  return a + b;
}

function runAdd(n) {
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += add(i, i + 1);
  }
  return sum;
}

console.time('1st run (1M adds)');
console.log('  result:', runAdd(1000000));
console.timeEnd('1st run (1M adds)');

console.time('2nd run (1M adds)');
console.log('  result:', runAdd(1000000));
console.timeEnd('2nd run (1M adds)');

console.time('3rd run (1M adds)');
console.log('  result:', runAdd(1000000));
console.timeEnd('3rd run (1M adds)');

console.log('Why faster? First run: Ignition interprets the bytecode.');
console.log('Later runs: TurboFan compiled add() to optimized machine');
console.log('code, because it saw the same number types every time.');
console.log('');

// ============================================================
// PART 3 - Hidden Classes: same shape = fast, changing shape = slow
// ============================================================
console.log('--- PART 3: Hidden Classes / Inline Caching ---');

function sumPoint(p) {
  return p.x + p.y;
}

const sameShape = { x: 1, y: 2 };

console.time('Same shape (2M reads)');
let total = 0;
for (let i = 0; i < 2000000; i++) {
  total += sumPoint(sameShape);
}
console.timeEnd('Same shape (2M reads)');

console.time('Changing shape (2M reads)');
total = 0;
for (let i = 0; i < 2000000; i++) {
  // Same values, but the property ORDER flips every time,
  // so V8 sees a different hidden class on every other call.
  const p = i % 2 ? { x: 1, y: 2 } : { y: 2, x: 1 };
  total += sumPoint(p);
}
console.timeEnd('Changing shape (2M reads)');

console.log('Total (to stop V8 optimising the loop away):', total);
console.log('Same shape = one hidden class, one fast inline cache.');
console.log('Changing shape = V8 must look up x and y every time.');
console.log('Rule: always add properties in the same order.');
console.log('');

// ============================================================
// PART 4 - Garbage Collection: memory is freed for you
// ============================================================
console.log('--- PART 4: Garbage Collection ---');

function heapMB() {
  return Math.round(v8.getHeapStatistics().used_heap_size / 1024 / 1024);
}

console.log('Heap before creating objects:', heapMB(), 'MB');

let users = [];
for (let i = 0; i < 200000; i++) {
  users.push({ id: i, name: 'user' + i });
}
console.log('Heap after creating 200,000 objects:', heapMB(), 'MB');

// Drop the only reference - the objects are now unreachable.
users = null;

if (global.gc) {
  global.gc();
  console.log('Heap after dropping them + running GC:', heapMB(), 'MB');
  console.log('GC freed the memory. No free() call needed in JS.');
} else {
  console.log('GC step skipped: run with --expose-gc to see it.');
  console.log('Example: node --expose-gc examples/v8.js');
}
console.log('');
console.log('Lesson: V8 runs JavaScript. V8 also cleans up after it.');
console.log('Keep object shapes stable and types consistent, and');
console.log('V8 can keep your code on the fast path.');

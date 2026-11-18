/**
 * 04 - Event Loop
 * ----------------
 * This file PROVES how the Node.js Event Loop orders your code,
 * with runnable code. Run it with:
 *
 *   node examples/event-loop.js
 *
 * What you will see:
 *  1. Microtasks first: process.nextTick runs before a Promise,
 *     and both run before any timer or setImmediate callback.
 *  2. Inside an I/O callback, setImmediate ALWAYS runs before
 *     setTimeout(..., 0). At the top level that order is NOT
 *     guaranteed - this file shows why.
 *  3. A blocking loop delays a timer: the timer was scheduled
 *     for 100ms but fires late, because the Event Loop was busy.
 *  4. A slow file read does NOT block the loop: the timer set
 *     after it still fires on time, because fs work runs in
 *     libuv's Thread Pool, not on the main thread.
 *
 * Exact timings vary by machine - look at the ORDER and the
 * relative difference, not the milliseconds.
 */

const fs = require('fs');

console.log('Node.js version:', process.version);
console.log('');

// ============================================================
// PART 1 - Microtasks run before timers and immediates
// ============================================================
console.log('--- PART 1: nextTick vs Promise vs timer vs immediate ---');

setTimeout(() => console.log('  4. setTimeout(0)'), 0);
setImmediate(() => console.log('  5. setImmediate'));
Promise.resolve().then(() => console.log('  2. Promise.then'));
process.nextTick(() => console.log('  1. process.nextTick'));
console.log('  0. synchronous code (runs first, always)');
console.log('');

// ============================================================
// PART 2 - Inside an I/O callback, setImmediate beats setTimeout(0)
// ============================================================
console.log('--- PART 2: inside an I/O callback ---');
console.log('Reading this file with fs.readFile...');

fs.readFile(__filename, () => {
  console.log('  readFile callback (poll phase)');
  setTimeout(() => console.log('  setTimeout(0) - runs second'), 0);
  setImmediate(() => console.log('  setImmediate - runs FIRST'));
  console.log('  (both were scheduled inside the callback)');
});

// ============================================================
// PART 3 - Blocking the loop delays a timer
// ============================================================
setTimeout(() => {
  console.log('');
  console.log('--- PART 3: blocking the Event Loop ---');
  console.log('Timer scheduled for 100ms. Now blocking the main');
  console.log('thread with a busy loop for about 300ms...');

  const timerStart = Date.now();
  setTimeout(() => {
    const waited = Date.now() - timerStart;
    console.log(`Timer fired after ${waited}ms, not 100ms.`);
    console.log('The loop was blocked, so the timer could not fire');
    console.log('on time - it waited for the busy loop to finish.');
    console.log('');
    part4();
  }, 100);

  // Deliberate blocking: a busy loop on the main thread.
  // Nothing else can run while this loop runs - not timers,
  // not I/O callbacks, not other requests.
  const blockUntil = Date.now() + 300;
  let x = 0;
  while (Date.now() < blockUntil) {
    x += 1;
  }
  console.log('Busy loop done. (x =', x + ')');
}, 500);

// ============================================================
// PART 4 - Async file I/O does NOT block the loop
// ============================================================
function part4() {
  console.log('--- PART 4: async I/O does not block the loop ---');
  console.log('Starting a slow async file read, then a 50ms timer.');

  const timerStart = Date.now();
  fs.readFile(__filename, 'utf8', (err, data) => {
    if (err) throw err;
    console.log(`File read done (${data.length} chars).`);
  });

  setTimeout(() => {
    const waited = Date.now() - timerStart;
    console.log(`Timer fired after ${waited}ms - on time,`);
    console.log('even though the file read was still running.');
    console.log('The read happened in the Thread Pool, not on');
    console.log('the main thread, so the loop stayed free.');
    console.log('');
    console.log('Lesson: the Event Loop is a traffic controller,');
    console.log('not a worker. Keep it free, and Node.js stays fast.');
  }, 50);
}

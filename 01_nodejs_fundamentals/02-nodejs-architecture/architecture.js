/**
 * 02 - Node.js Architecture
 * -------------------------
 * This file PROVES the architecture with runnable code.
 * Run it with:  node examples/architecture.js
 *
 * What you will see:
 *  1. Your JavaScript runs on ONE thread, in order.
 *  2. A file read is NON-BLOCKING - the main thread moves on.
 *  3. crypto.pbkdf2() uses the THREAD POOL (4 workers by default).
 *     Hashes 1-4 finish together, hash 5 waits for a free worker.
 *  4. A busy loop BLOCKS everything - even a timer cannot run.
 */

const fs = require('fs');
const crypto = require('crypto');

console.log('Node.js version:', process.version);
console.log('V8 version:     ', process.versions.v8);
console.log('');

// ============================================================
// PART 1 - Single thread: one thing at a time, in order
// ============================================================
console.log('--- PART 1: Single thread ---');
console.log('A');
console.log('B');
console.log('C');
console.log('Result: always A, B, C - the Call Stack runs in order.');
console.log('');

// ============================================================
// PART 2 - Non-blocking I/O: the main thread does NOT wait
// ============================================================
console.log('--- PART 2: Non-blocking file read ---');
console.log('Start: asking libuv to read this file...');

fs.readFile(__filename, 'utf8', (err, data) => {
  if (err) throw err;
  console.log(`Callback: file read finished (${data.length} characters).`);
  console.log('Notice: this line ran AFTER "End" below.');
});

console.log('End: I ran BEFORE the file callback - the main thread moved on.');
console.log('');

// ============================================================
// PART 3 - Thread Pool: 4 workers by default
// ============================================================
console.log('--- PART 3: Thread Pool (crypto.pbkdf2, 5 hashes) ---');
console.log('Starting 5 password hashes at the same time...');

const start = Date.now();

for (let i = 1; i <= 5; i++) {
  crypto.pbkdf2('password', 'salt', 100000, 64, 'sha512', () => {
    console.log(`Hash ${i} done in ${Date.now() - start}ms`);
  });
}

console.log('All 5 hashes started. Main thread is free again.');
console.log('Watch the order: hash 5 can only start when one of the');
console.log('first 4 workers frees up, so it finishes last.');
console.log('That is the 4-thread pool limit in action.');
console.log('');

// ============================================================
// PART 4 - Blocking code: what NOT to do in a server
// ============================================================
// Wait a little so Parts 2 and 3 finish first, then demonstrate
// blocking. A timer is scheduled for 100ms, then the main
// thread is blocked for 1000ms with a busy loop - so the
// timer can only run AFTER the loop finishes, ~1000ms late.
setTimeout(() => {
  console.log('--- PART 4: Blocking code ---');
  console.log('Scheduling a timer for 100ms, then blocking for 1000ms...');

  const timerStart = Date.now();
  setTimeout(() => {
    console.log(`Timer: I was scheduled for 100ms, but ran after ${Date.now() - timerStart}ms.`);
    console.log('Why? The busy loop blocked the Event Loop.');
    console.log('');
    console.log('Lesson: V8 runs JavaScript. libuv handles waiting.');
    console.log('Never block the Event Loop with heavy work.');
  }, 100);

  const blockingStart = Date.now();
  while (Date.now() - blockingStart < 1000) {
    // Busy wait - deliberately blocking the main thread.
    // In a real server this would freeze EVERY user for 1 second.
  }
  console.log('Blocking loop finished: nothing else could run for 1 second.');
}, 1500);

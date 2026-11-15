02 — Node.js Architecture
Priority: 🔴 High
Previous topic: 01 — Introduction to Node.js
Next topic: 03 — V8 Engine (coming next)
>
One-line summary: Node.js is single-threaded JavaScript on the outside, and a powerful C/C++ engine (V8 + libuv) on the inside. Your JavaScript runs on one thread, while slow work is handed off in the background — that is why one Node.js server can handle thousands of requests at the same time.

Table of Contents
1. What Is Node.js Architecture?
2. The Big Picture — Diagram
3. The Layers, One by One
4. How a Request Flows Through Node.js
5. Single-Threaded — What It Really Means
6. The Thread Pool
7. Blocking vs Non-Blocking
8. Why Node.js Is Fast (and When It Is Not)
9. Real-World Example
10. Code Walkthrough — architecture.js
11. Common Mistakes & Misconceptions
12. Interview Questions
13. Exercises
14. Summary — The Mental Model to Remember

1. What Is Node.js Architecture?
Architecture means: what parts is Node.js made of, and how do those parts work together?
Node.js is not one single program. It is a combination of several powerful tools joined together:
Part
Written in
Job
V8 Engine
C++
Runs your JavaScript — compiles it to fast machine code
libuv
C
Gives Node.js the Event Loop, async I/O, and the Thread Pool
Node.js Bindings
C++
The bridge between JavaScript and C/C++
Node.js Standard Library
JavaScript
Built-in modules you use: fs, http, path, events
Other C/C++ libraries
C/C++
DNS (c-ares), HTTP parsing (llhttp), crypto (OpenSSL), compression (zlib)
Your application
JavaScript
The code you write
Simple way to remember it:
You write JavaScript → Node.js translates it → V8 executes it → libuv handles the waiting → the Operating System does the real I/O work.
Node.js was created because JavaScript was fast in the browser (thanks to V8), but there was no way to run it on a server. Ryan Dahl (2009) took V8 out of Chrome, added libuv for async I/O, and built Node.js around them.

2. The Big Picture — Diagram
Diagram 1: The Layers (top to bottom)
┌─────────────────────────────────────────────────────────┐
│  YOUR APPLICATION (JavaScript)                          │
│  app.js, server.js, routes, controllers...              │
└──────────────────────┬──────────────────────────────────┘
                       │  require('fs'), require('http')...
┌──────────────────────▼──────────────────────────────────┐
│  NODE.JS STANDARD LIBRARY (JavaScript)                  │
│  fs  •  http  •  path  •  events  •  crypto  •  os ...  │
└──────────────────────┬──────────────────────────────────┘
                       │  Node.js Bindings (C++)
┌──────────────────────▼──────────────────────────────────┐
│  NODE.JS BINDINGS  (C++ bridge)                         │
│  Connects JavaScript code to C/C++ code                 │
└──────┬───────────────────────────────┬──────────────────┘
       │                               │
┌──────▼──────────────┐      ┌──────────▼──────────────┐
│  V8 ENGINE (C++)    │      │  libuv (C)              │
│                     │      │                         │
│  • Parses JS        │      │  • Event Loop           │
│  • Compiles JS to   │      │  • Thread Pool (4)      │
│    machine code     │      │  • Async I/O            │
│  • Garbage          │      │  • Timers, DNS,         │
│    Collection       │      │    File System          │
└──────┬──────────────┘      └──────────┬──────────────┘
       │                               │
┌──────▼───────────────────────────────▼──────────────────┐
│  OPERATING SYSTEM  (Linux / macOS / Windows)            │
│  Files, Network, Sockets — the real I/O happens here    │
└─────────────────────────────────────────────────────────┘
Diagram 2: The Same Idea as a Flowchart (Mermaid — renders on GitHub)
flowchart TD
    A[Your JS Code] --> B[Node.js Standard Library<br/>fs, http, path...]
    B --> C[Node.js Bindings<br/>C++ Bridge]
    C --> D[V8 Engine<br/>Runs JavaScript]
    C --> E[libuv<br/>Event Loop + Thread Pool]
    D --> F[Operating System]
    E --> F
    F --> G[File System / Network / Database]
Diagram 3: What Runs Where
  MAIN THREAD  (only ONE thread runs your JavaScript)
  ┌──────────────────────────────────────────────────┐
  │  Call Stack  →  your functions run here,         │
  │                 one at a time, in order          │
  │                                                  │
  │  Event Loop  →  checks: is any async work done?  │
  │                 if yes, run its callback         │
  └──────────────────────────────────────────────────┘
                          │
                          │ hands slow work to →
                          ▼
  THREAD POOL  (4 worker threads by default)
  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
  │ Worker 1 │ │ Worker 2 │ │ Worker 3 │ │ Worker 4 │
  │ fs, crypto│ │ fs, crypto│ │ fs, crypto│ │ fs, crypto│
  └──────────┘ └──────────┘ └──────────┘ └──────────┘
                          │
                          ▼
  OPERATING SYSTEM  →  real file / network work
Read this diagram like this: your code is always on the main thread. Slow work is sent away — either to the Thread Pool or to the OS — so the main thread stays free to accept the next request.

3. The Layers, One by One
3.1 Your Application (JavaScript)
This is the code you write — server.js, routes, controllers, database calls.
const http = require('http');

http.createServer((req, res) => {
  res.end('Hello from Node.js');
}).listen(3000);
You never talk to V8 or libuv directly. You talk to the Standard Library, and it talks to the rest for you.
3.2 Node.js Standard Library (JavaScript)
Built-in modules, already included with Node.js. No npm install needed.
Module
Use it for
fs
Reading / writing files
http / https
Creating servers, making requests
path
Working with file paths
events
EventEmitter — events in your own code
os
CPU, memory, operating system info
crypto
Hashing, encryption
url
Parsing URLs
Example:
const fs = require('fs');     // File System module
const path = require('path');  // Path module
3.3 Node.js Bindings (C++)
JavaScript cannot directly talk to the Operating System or to C libraries. The Bindings are the translator in the middle.
JavaScript  --(bindings)-->  C++  --(bindings)-->  V8 / libuv / OS
You do not write bindings in normal backend work — but you must know they exist, because they explain how a JS call like fs.readFile() ends up as real work on your hard disk.
3.4 V8 Engine (C++)
V8 is Google Chrome's JavaScript engine. Node.js uses the same engine, outside the browser.
What V8 does:
Parses your JavaScript code.
Compiles it to machine code (using a Just-In-Time compiler — JIT). This is why Node.js is fast.
Executes it on the Call Stack.
Garbage Collection — frees memory you no longer use.
V8 is covered in full detail in the next topic: 03 — V8 Engine.
For now, remember: V8 = the part that runs JavaScript.
3.5 libuv (C)
libuv is the part most beginners have never heard of — and the part that makes Node.js special.
What libuv provides:
Feature
What it means
Event Loop
The loop that keeps checking: "Is any async work finished? If yes, run its callback."
Thread Pool
4 worker threads for work that cannot be done async by the OS (file I/O, crypto, DNS, compression).
Async I/O
Non-blocking file and network operations, using the OS where possible.
Timers, signals, child processes
setTimeout, setInterval, process signals, and more.
The Event Loop is covered in full detail in topic 04 — Event Loop.
For now, remember: libuv = the part that handles waiting, so your code does not have to.
3.6 Other C/C++ Libraries
Node.js also bundles small specialist libraries. You do not need to memorize them, but know they exist:
Library
Job
c-ares
Async DNS lookups (turning google.com into an IP address)
llhttp
Parsing HTTP requests/responses
OpenSSL
HTTPS, TLS, crypto
zlib
Compression (gzip)
3.7 Operating System
At the very bottom is the OS — Linux, macOS, or Windows. The actual reading of a file, or sending of network data, always happens here. Node.js just asks the OS to do it, and the OS notifies Node.js when it is done.

4. How a Request Flows Through Node.js
Let's trace one real request, step by step.
Scenario: A user opens http://localhost:3000/profile and your server reads user.json from disk and sends it back.
1. USER / BROWSER
   sends HTTP request → localhost:3000/profile
            │
            ▼
2. OPERATING SYSTEM
   receives the network data, passes it to Node.js
            │
            ▼
3. libuv — EVENT LOOP (Main Thread)
   "A new request arrived. Run the HTTP callback."
            │
            ▼
4. V8 — CALL STACK (Main Thread)
   runs your callback:  fs.readFile('user.json', ...)
   "This is slow file work — I will not wait here."
            │
            ▼
5. libuv — THREAD POOL (Worker Thread)
   a worker thread reads user.json from disk
   ... main thread is FREE meanwhile ...
   it can accept the NEXT user's request right now
            │
            ▼
6. WORK FINISHES → CALLBACK QUEUE
   "user.json is ready. Put the callback in the queue."
            │
            ▼
7. EVENT LOOP (Main Thread)
   picks up the callback from the queue
            │
            ▼
8. V8 — CALL STACK (Main Thread)
   runs your callback:  res.end(fileData)
            │
            ▼
9. OPERATING SYSTEM → USER
   response sent back to the browser
The key insight
The main thread never waits for the file.
It starts the file read, moves on to the next request, and comes back only when the file is ready.
>
That is non-blocking I/O — and that is the whole secret of Node.js.

5. Single-Threaded — What It Really Means
Node.js is single-threaded for your JavaScript code.
One Call Stack. One thing at a time. In order.
console.log('1');
console.log('2');
console.log('3');
// Output is ALWAYS: 1, 2, 3 — never 2, 1, 3
What single-threaded does NOT mean:
Misconception
Truth
"Node.js can only do one thing at a time"
It can only execute JavaScript one thing at a time. I/O work happens in the background (Thread Pool / OS) at the same time.
"Node.js has only one thread in total"
It has one main thread for JS, plus a Thread Pool (4 threads) and OS threads behind the scenes.
"Node.js is slow because it is single-threaded"
For I/O-heavy work (APIs, databases, files) it is very fast, because it never wastes time waiting.
Analogy — a restaurant:
Traditional multi-threaded server (like a restaurant with 1 waiter per table): each waiter serves only one table. 100 tables = 100 waiters. Expensive, and waiters stand idle while food cooks.
Node.js (1 waiter for all tables): one waiter takes an order, gives it to the kitchen, and immediately goes to the next table. When the kitchen rings the bell, the waiter delivers the food. One waiter, many tables, no idle waiting.
The waiter is the Event Loop. The kitchen is the Thread Pool / OS.

6. The Thread Pool
Some work cannot be done asynchronously by the OS, so libuv runs it on worker threads.
Default size: 4 threads.
UV_THREADPOOL_SIZE = 4   (default)
You can change it with an environment variable (before Node.js starts):
UV_THREADPOOL_SIZE=8 node app.js
What uses the Thread Pool?
Uses the Thread Pool ✅
Does NOT use it ❌
fs.readFile() — file system
Network I/O (http, net) — handled by the OS directly
crypto.pbkdf2() — password hashing
Timers (setTimeout)
zlib — compression
Most database drivers (they use network I/O)
DNS lookup (dns.lookup())

Why does the size matter?
If all 4 workers are busy with heavy file/crypto work, the 5th task waits in a queue. That is why:
Never do heavy CPU work (big loops, image processing, large JSON parsing) on the main thread or in the Thread Pool without thinking.
For CPU-heavy work, use Worker Threads, child processes, or a separate service — that comes in Phase 05.
Quick mental check: if 4 users request a password hash at the same time and each hash takes 1 second, the 5th user waits. That is the Thread Pool limit in action. The example file examples/architecture.js demonstrates this.

7. Blocking vs Non-Blocking
This is the most important comparison in all of Node.js.
Blocking (Synchronous) — the main thread waits
const fs = require('fs');

console.log('Start');
const data = fs.readFileSync('user.json', 'utf8'); // ⛔ WAITS here
console.log('File read');
console.log('End');
Output:
Start
... (nothing else can run while the file is read) ...
File read
End
Non-Blocking (Asynchronous) — the main thread moves on
const fs = require('fs');

console.log('Start');
fs.readFile('user.json', 'utf8', (err, data) => {
  console.log('File read'); // runs LATER, when the file is ready
});
console.log('End');
Output:
Start
End          <-- runs BEFORE the file is read
File read    <-- callback runs when the work finishes

Blocking
Non-blocking
Main thread
Waits, does nothing
Free to handle other requests
Other users
Must wait
Served immediately
When to use
Startup config, scripts, one-time setup
Almost always in a server
Example
readFileSync
readFile (with callback / Promise)
Rule for backend work: in a server, never block the Event Loop. A single readFileSync inside a request handler blocks every user, not just one.

8. Why Node.js Is Fast (and When It Is Not)
✅ Node.js is excellent for: I/O-bound work
REST APIs
Real-time chat apps (Socket.io)
Streaming (video, files)
Microservices that call databases and other APIs
Dashboards, admin panels, CRUD apps
Why? Because most of the time is spent waiting — waiting for the database, waiting for the network, waiting for a file. Node.js does not waste that waiting time.
❌ Node.js is NOT the best choice for: CPU-bound work
Video encoding / image processing
Heavy calculations, machine learning training
Large data compression on every request
Complex math on the main thread
Why? Because CPU work runs on the single main thread and blocks everything else while it runs. There is no other JS thread to take over.
The one-line test:
If the work is mostly waiting, use Node.js.
If the work is mostly calculating, Node.js alone is the wrong tool (or use Worker Threads).

9. Real-World Example
A food-delivery API — 1,000 users ordering at the same time:
User 1 → "Order biryani"  →  DB query (waiting...)
User 2 → "Order burger"   →  DB query (waiting...)
User 3 → "Order pizza"    →  DB query (waiting...)
...
User 1000 → "Order zinger" → DB query (waiting...)

Node.js does NOT wait for User 1's database answer
before taking User 2's order.

It starts all 1,000 queries, and as each database
answer comes back, the Event Loop runs that user's
callback and sends the response.

Result: one small server handles all 1,000 users,
because the real work (database) happens outside
the main thread.
This is why companies like Netflix, PayPal, LinkedIn, and Uber use Node.js for their APIs — not because JavaScript is magic, but because this architecture wastes almost no time waiting.

10. Code Walkthrough — architecture.js
Run it:
node examples/architecture.js
Expected output is saved in examples/example.txt.
What the file proves (in order)
Part 1 — Single thread, one thing at a time:
console.log('A');
console.log('B');
console.log('C');
// Always A, B, C — the Call Stack runs in order.
Part 2 — Non-blocking file read:
fs.readFile(__filename, 'utf8', () => {
  console.log('File read finished (callback)');
});
console.log('I run BEFORE the file callback');
// The main thread does not wait for the file.
Part 3 — Thread Pool in action (crypto):
const start = Date.now();
for (let i = 1; i <= 5; i++) {
  crypto.pbkdf2('password', 'salt', 100000, 64, 'sha512', () => {
    console.log(`Hash ${i} done in ${Date.now() - start}ms`);
  });
}
// Hash 5 can only start when one of the first 4 workers frees up,
// so it finishes last. Exact timings vary by machine —
// the point is the ORDER, not the milliseconds.
// That is the 4-thread pool limit, visible in real time.
Part 4 — Blocking code (what NOT to do):
const blockingStart = Date.now();
while (Date.now() - blockingStart < 1000) { /* busy wait */ }
// Nothing else — no timer, no callback — can run during this 1 second.
// This is why CPU work blocks the whole server.
Important lines explained
Line / idea
Why it matters
require('fs'), require('crypto')
Standard Library modules — the top layer of the architecture.
fs.readFile(..., callback)
Async I/O — handed to libuv, main thread stays free.
crypto.pbkdf2(...)
Thread Pool work — uses a worker thread, not the main thread.
The while busy-wait loop
Deliberate blocking — proves that CPU work freezes the Event Loop.
process.version, process.versions.v8
Shows the real V8 version bundled with your Node.js.

11. Common Mistakes & Misconceptions
❌ "Node.js is a language."
  ✅ Node.js is a runtime. JavaScript is the language.
❌ "Node.js is multi-threaded."
  ✅ Your JavaScript runs on one main thread. The Thread Pool is for specific background work only.
❌ "Non-blocking means faster code."
  ✅ Non-blocking means the server is free while waiting. The file/database itself is not faster — the server just does not sit idle.
❌ "I can do heavy calculations in a route handler, it's fine."
  ✅ A 2-second calculation blocks every user for 2 seconds. Move CPU work out of the request path.
❌ "The Event Loop and the Thread Pool are the same thing."
  ✅ The Event Loop coordinates work on the main thread. The Thread Pool executes certain heavy/async tasks on worker threads.
❌ "V8 and Node.js are the same."
  ✅ V8 is one part of Node.js. Node.js = V8 + libuv + bindings + standard library + more.

12. Interview Questions
Practice answering these out loud, in your own words — do not memorize:
What is Node.js? Is it a language, a framework, or a runtime?
Explain the architecture of Node.js. What are V8 and libuv?
What is the difference between V8 and libuv?
Is Node.js single-threaded or multi-threaded? Explain both sides.
What is the Thread Pool? What is its default size, and what uses it?
What is blocking vs non-blocking code? Give a real example.
Why is Node.js good for I/O-heavy applications but not for CPU-heavy ones?
What happens if you block the Event Loop?
What are Node.js Bindings? Why are they needed?
Trace a request: a user asks for a file — what happens step by step inside Node.js?
Good answer pattern: start with the one-line definition, then the diagram in words, then a real example. Never start with a memorized paragraph.

13. Exercises
All exercises are in exercises/. Do them after reading this README and running architecture.js.
Draw it yourself — Redraw Diagram 1 from memory, without looking. Label V8, libuv, Bindings, Standard Library, and the OS.
Prove single-threaded — Write a program that prints numbers 1–5, then add a setTimeout(..., 0) between them. Explain the output order.
Prove the Thread Pool limit — Change the loop in architecture.js from 5 hashes to 8. Run it. Which hashes finish together, and which wait?
Blocking vs non-blocking — Write both versions of a file read (readFileSync vs readFile) with timestamps. Measure the difference in behavior, not just speed.
Real-world trace — Pick one real app (WhatsApp, Daraz, YouTube). Write 5 lines tracing one user action through the architecture: browser → OS → Event Loop → Thread Pool/OS → callback → response.
Solutions are not provided on purpose — the exercise is the learning. If you are stuck, re-read Section 4 and run the example again.

14. Summary — The Mental Model to Remember
┌─────────────────────────────────────────────────────┐
│  YOUR JAVASCRIPT                                    │
│  runs on ONE main thread, one thing at a time       │
├─────────────────────────────────────────────────────┤
│  V8                                                 │
│  compiles + executes your JavaScript                │
├─────────────────────────────────────────────────────┤
│  libuv                                              │
│  Event Loop coordinates, Thread Pool does the       │
│  heavy background work, OS does the real I/O        │
├─────────────────────────────────────────────────────┤
│  RESULT                                             │
│  The server never waits idle — it takes the         │
│  next request while the previous one is still       │
│  being processed in the background.                 │
└─────────────────────────────────────────────────────┘
If you remember only three sentences:
V8 runs JavaScript. libuv handles waiting.
The main thread never waits — slow work goes to the Thread Pool or the OS.
Never block the Event Loop with heavy work on the main thread.

Files in This Folder
02-nodejs-architecture/
├── README.md                  # This file
├── examples/
│   ├── architecture.js        # Runnable demo: single thread, async I/O, Thread Pool, blocking
│   └── example.txt            # Expected output of architecture.js
└── exercises/
    └── README.md              # 5 practice tasks (with hints)
How to run:
node examples/architecture.js

← Phase 01 Overview · Next: 03 — V8 Engine →
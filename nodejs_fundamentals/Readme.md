Phase 01 — Node.js Fundamentals
Prerequisite: Core JavaScript is already completed.
This phase starts directly with Node.js. We revise a JavaScript concept only when Node.js needs it — we do not repeat the whole JavaScript course.
What You Will Learn
By the end of this phase, you will be able to:
Explain what Node.js is, why it was created, and where it is used.
Explain how Node.js works internally — V8, libuv, the Event Loop, and the Thread Pool.
Run JavaScript outside the browser using Node.js.
Use built-in modules: File System, Path, HTTP, and Events.
Write asynchronous, non-blocking code with callbacks, Promises, and async/await.
Handle errors and environment variables the professional way.
Build a simple HTTP server with the core http module (before Express.js in Phase 02).
Philosophy: Learn → Understand → Implement → Build → Document → Share.
A topic is not complete until its concepts, practical implementation, exercises, and documentation are covered.

Topics
We are covering the first five topics first. The rest follow in the same order.
#
Topic
Priority
Status
Folder
01
Introduction to Node.js
⭐ Start here
⬜ Next
01-introduction/
02
Node.js Architecture
🔴 High
✅ Done
02-nodejs-architecture/
03
V8 Engine
🔴 High
⬜ Next
03-v8-engine/
04
Event Loop
🔴🔴 Very High
⬜ Next
04-event-loop/
05
Global Objects
🟡 Medium
⬜ Next
05-global-objects/
06
Modules and Module Systems
—
⬜ Later
06-modules/
07
CommonJS and ES Modules
—
⬜ Later
07-commonjs-es-modules/
08
NPM and Package Management
—
⬜ Later
08-npm/
09
File System Module
—
⬜ Later
09-file-system/
10
Path Module
—
⬜ Later
10-path-module/
11
HTTP Module
—
⬜ Later
11-http-module/
12
Events and Event Emitters
—
⬜ Later
12-events/
13
Streams and Buffers
—
⬜ Later
13-streams-and-buffers/
14
Environment Variables
—
⬜ Later
14-environment-variables/
15
Error Handling
—
⬜ Later
15-error-handling/
16
Asynchronous Programming in Node.js
—
⬜ Later
16-async-programming/
The roadmap is flexible. Topics may be reordered or split if a topic is too large for one folder — we split it, we never compress or skip content.

How Each Topic Is Organized
Every topic folder follows the same structure, so any developer can follow it without confusion:
01-nodejs-fundamentals/
│
├── README.md                  # This file — phase overview
│
├── 01-introduction/
│   ├── README.md              # Notes, diagrams, explanation
│   ├── examples/              # Runnable code
│   └── exercises/             # Practice tasks
│
├── 02-nodejs-architecture/
│   ├── README.md
│   ├── examples/
│   │   ├── architecture.js
│   │   └── example.txt        # Expected output of architecture.js
│   └── exercises/
│
└── ...                        # 03, 04, 05 ... created as we reach them
Rules for the structure:
Create a folder only when we reach that topic. No empty placeholder folders.
Every README.md explains: what the concept is, why it exists, how it works internally, and where it is used in real backend work.
Every examples/ folder has runnable code + a short explanation of the important lines.
Every exercises/ folder has practice tasks — no topic is complete without them.

How to Run the Examples
You need Node.js installed. Check it first:
node --version
npm --version
Run any example from inside its folder:
node examples/architecture.js
Compare your output with the example.txt file in the same folder. If the output is different, read the code again before moving on — do not copy-paste blindly.

Learning Method (Used for Every Topic)
Conceptual Understanding — What is it? Why does it exist? What problem does it solve?
Deep Technical Theory — Internal mechanism, architecture, and execution flow.
Real-World Examples — How is it used in a real backend application?
Hands-on Implementation — Write the code, run it, break it, fix it.
Code Explanation — Understand every important line, not just the output.
Practical Exercises — Solve the exercises in the topic folder.
Documentation — Notes go into that topic's README.md.

Key Ideas of This Phase (One-Line Summary)
Idea
One line
Node.js
JavaScript runtime that runs JS outside the browser, on the server.
V8 Engine
Google's engine that compiles JavaScript to fast machine code.
libuv
The C library that gives Node.js the Event Loop, async I/O, and the Thread Pool.
Event Loop
The mechanism that lets single-threaded Node.js handle many requests without blocking.
Non-blocking I/O
Start a slow task (file, database, network), do other work, get notified when it finishes.
Modules
Code split into reusable files, imported with require() (CommonJS) or import (ES Modules).
These six lines are the foundation of everything in Phases 02–07. If any of them is unclear, go back to its topic before moving forward.

Common Beginner Mistakes
❌ Treating Node.js as a programming language — it is a runtime, JavaScript is the language.
❌ Thinking Node.js is multi-threaded like Java — it is single-threaded for JavaScript code, with a Thread Pool only for specific heavy/async work.
❌ Blocking the Event Loop with heavy synchronous work (big loops, readFileSync on every request).
❌ Skipping the exercises and jumping to Express.js — Phase 02 will feel confusing without this phase.
❌ Memorizing definitions without running the examples.

Completion Checklist
01 — Introduction to Node.js
02 — Node.js Architecture
03 — V8 Engine
04 — Event Loop
05 — Global Objects
06 — Modules and Module Systems
07 — CommonJS and ES Modules
08 — NPM and Package Management
09 — File System Module
10 — Path Module
11 — HTTP Module
12 — Events and Event Emitters
13 — Streams and Buffers
14 — Environment Variables
15 — Error Handling
16 — Asynchronous Programming in Node.js
Next step: 02 — Node.js Architecture

← Back to Main README · Next: Node.js Architecture →
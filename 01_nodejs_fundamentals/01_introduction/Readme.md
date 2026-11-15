01 — Introduction to Node.js
Priority: ⭐ Start here — this is the first topic of Phase 01.
Previous topic: Phase 01 Overview
Next topic: 02 — Node.js Architecture
>
One-line summary: Node.js lets you run JavaScript outside the browser, on the server — so the same language you use for a website can now build the backend behind it.

Table of Contents
1. What Is Node.js?
2. Why Was Node.js Created?
3. A Short History
4. JavaScript Before and After Node.js — Diagram
5. Key Features
6. Node.js vs JavaScript in the Browser
7. What Can You Build with Node.js?
8. What Node.js Is NOT Good For
9. How Node.js Works — A First Look
10. Install and Check Node.js
11. Your First Node.js Program
12. The REPL — Try JavaScript Instantly
13. Code Walkthrough — introduction.js
14. Common Mistakes & Misconceptions
15. Interview Questions
16. Exercises
17. Summary — The Mental Model to Remember

1. What Is Node.js?
Node.js is a JavaScript runtime environment.
That one sentence has three words to understand:
Word
Meaning
JavaScript
The programming language you already know from Core JavaScript.
Runtime
The environment that runs the code. A browser is a runtime for JavaScript. Node.js is another runtime — but for the server.
Environment
Everything around the code: the engine that executes it, the built-in tools (file system, network, timers), and the operating system underneath.
In simple words:
Before Node.js, JavaScript could only run inside a browser.
Node.js takes JavaScript out of the browser and lets it run on a computer / server, where it can read files, talk to databases, and answer requests from users.
Three things Node.js is NOT:
❌ Not a programming language — JavaScript is the language. Node.js runs it.
❌ Not a framework — Express.js is a framework built on Node.js. Node.js itself is the platform underneath.
❌ Not a library — it is a complete runtime, with its own engine, modules, and tools.
The one-line test:
If someone asks "What is Node.js?", answer: "A runtime that runs JavaScript outside the browser, on the server."
Then add one example: "So I can build an API with the same language I use on the frontend."

2. Why Was Node.js Created?
Before Node.js, servers worked like this:
One user arrives  →  server gives them one thread  →  thread waits
                                                      for the database
                                                      / file / network
100 users arrive →  100 threads, most of them just WAITING
That waiting wastes memory and limits how many users one server can handle. This was called the C10k problem — handling 10,000 connections at the same time was very hard.
In 2009, Ryan Dahl had a different idea:
What if one thread never waits?
Start the slow work, move on to the next user, and come back when the slow work is finished.
To build that, he needed two things:
A very fast JavaScript engine — he took V8, the engine from Google Chrome.
A way to do non-blocking I/O — he used libuv, a C library that handles async work in the background.
He joined them together, and Node.js was born.
Why this mattered for JavaScript developers:
Frontend developers already knew JavaScript — now they could write the backend in the same language.
One language for the whole application: frontend + backend.
APIs, real-time apps, and servers became much simpler to build and scale.

3. A Short History
You do not need to memorize dates for an exam — but the timeline helps you understand why Node.js looks the way it does.
Year
What happened
2009
Ryan Dahl creates Node.js. First version runs on Linux, built on V8 + libuv.
2010
npm (Node Package Manager) is created — now the largest package registry in the world.
2011
Node.js runs on Windows. Companies start using it in production.
2015
Node.js and io.js (a fork) merge back together. The Node.js Foundation is formed. Long-Term Support (LTS) versions begin.
2017–2020
async/await becomes standard, ES Modules support improves, performance keeps growing.
Today
Node.js powers APIs at Netflix, PayPal, LinkedIn, Uber, Walmart, and thousands of startups. New versions release every 6 months; LTS versions are supported for years.
Two ideas to remember from the history:
Node.js is not new or experimental — it has been in production since 2009.
npm is part of the story from the very start — sharing code is built into the Node.js way of working.

4. JavaScript Before and After Node.js — Diagram
Before Node.js: JavaScript lived only in the browser
┌─────────────────────────────────────────┐
│  BROWSER (Chrome, Firefox...)           │
│                                         │
│  ┌──────────┐    ┌───────────────────┐  │
│  │   V8     │    │  window, document │  │
│  │  Engine  │    │  alert, fetch...  │  │
│  └──────────┘    └───────────────────┘  │
│                                         │
│  JavaScript CAN:                        │
│  • Change a web page                    │
│  • Handle button clicks                 │
│  • Call an API with fetch()             │
│                                         │
│  JavaScript CANNOT:                     │
│  • Read a file from the hard disk       │
│  • Talk directly to a database          │
│  • Listen for requests on a port        │
└─────────────────────────────────────────┘
After Node.js: the same JavaScript runs on the server
┌─────────────────────────────────────────┐
│  NODE.JS (on your computer / server)    │
│                                         │
│  ┌──────────┐    ┌───────────────────┐  │
│  │   V8     │    │  fs, http, path,  │  │
│  │  Engine  │    │  os, crypto...    │  │
│  └──────────┘    └───────────────────┘  │
│         +                               │
│  ┌───────────────────────────────────┐  │
│  │  libuv — Event Loop + Thread Pool │  │
│  └───────────────────────────────────┘  │
│                                         │
│  JavaScript CAN now:                    │
│  • Read and write files (fs)            │
│  • Create a web server (http)           │
│  • Talk to a database (PostgreSQL)      │
│  • Answer thousands of requests         │
│                                         │
│  JavaScript CANNOT here:                │
│  • Use window or document —             │
│    there is no web page on a server     │
└─────────────────────────────────────────┘
The same idea as a flowchart (Mermaid — renders on GitHub)
flowchart LR
    A[JavaScript Code] --> B{Where does it run?}
    B -->|Browser| C[Web Page<br/>window, document]
    B -->|Node.js| D[Server<br/>fs, http, database]
Read it like this: the language is the same. What changes is the environment — and the environment decides what the code is allowed to do.

5. Key Features
These are the features you will hear in every Node.js introduction. Learn them as one line each first — the deep detail comes in the next topics.
Feature
One line
Where it is explained
Built on V8
Google's fast JavaScript engine compiles JS to machine code.
Topic 03 — V8 Engine
Single-threaded
Your JavaScript runs on one main thread, one thing at a time.
Topic 02 — Architecture
Non-blocking I/O
Slow work (file, database, network) runs in the background; the main thread never waits.
Topic 02 — Architecture, Topic 04 — Event Loop
Event-driven
Code runs in response to events: a request arrives, a file finishes, a timer fires.
Topic 12 — Events
Asynchronous
Use callbacks, Promises, and async/await instead of waiting line by line.
Topic 16 — Async Programming
npm ecosystem
Millions of reusable packages — install with one command.
Topic 08 — NPM
Cross-platform
Same code runs on Windows, macOS, and Linux.
—
Large community
Huge community, documentation, and packages for almost everything.
—
If you remember only two features, remember these:
Non-blocking I/O — Node.js does not wait.
Single-threaded + Event Loop — one thread, many users.

6. Node.js vs JavaScript in the Browser
Same language, different world. This table causes a lot of beginner confusion — learn it now.

Browser JavaScript
Node.js
Runs on
The user's browser
A server / your computer
Global object
window
global
Can access
document, window, alert()
fs, http, path, process, os
Cannot access
The file system, the database directly
window, document, alert()
Main job
Make a web page interactive
Build servers, APIs, tools, scripts
Modules
ES Modules (import)
CommonJS (require) and ES Modules
Example code
document.getElementById('btn')
fs.readFile('data.txt', ...)
Try it yourself — this is the fastest way to feel the difference:
// In the browser console, this works:
console.log(window);    // ✅ Window object

// In Node.js, this fails:
console.log(window);    // ❌ ReferenceError: window is not defined
And the opposite:
// In Node.js, this works:
const fs = require('fs');   // ✅ File System module

// In the browser, this fails:
// ❌ require is not defined (in plain browser JS)

7. What Can You Build with Node.js?
What
Example
Why Node.js fits
REST APIs
A food-delivery API, a student-management API
Many small requests, mostly waiting for the database
Real-time apps
Chat app, live notifications, multiplayer game
Events + WebSockets, many connections at once
Web servers
Any website backend (before Express, with the http module)
Fast request handling
Streaming apps
Video/audio streaming, file uploads
Streams — data flows in pieces, never all at once
Microservices
Small services that talk to each other
Lightweight, fast to start
CLI tools / scripts
Build tools, automation scripts, data processing
JavaScript + file system access
Dashboards & admin panels
CRUD apps, internal tools
Same as REST APIs
Companies using Node.js in production: Netflix, PayPal, LinkedIn, Uber, Walmart, eBay, NASA, Trello.
They did not choose it because it is trendy. They chose it because most backend work is waiting — and Node.js wastes almost no time waiting.

8. What Node.js Is NOT Good For
Honesty matters — Node.js is not the best tool for everything.
Weak area
Why
What to use instead
CPU-heavy work
Big calculations, video encoding, image processing block the single main thread
Worker Threads, a separate service, Python / Go / Rust for that part
Heavy number crunching
Machine learning training, complex math
Python, or a dedicated service
Simple static websites
Overkill — a static host is simpler
Static hosting (Vercel, Netlify)
The one-line test (same as in Topic 02):
If the work is mostly waiting, use Node.js.
If the work is mostly calculating, Node.js alone is the wrong tool.
This is not a weakness to hide — it is the trade-off that makes Node.js so good at what it is built for.

9. How Node.js Works — A First Look
You do not need the full detail yet — that is Topic 02. But here is the 30-second version, so the next topic does not feel new:
1. You write JavaScript.
2. V8 compiles and runs it on the Call Stack (main thread).
3. When you start slow work (read a file, call a database),
   libuv takes it to the background (Thread Pool / OS).
4. Your code moves on — it does not wait.
5. When the slow work finishes, the Event Loop runs your callback.
  Your code          V8            libuv           OS
     │                │               │              │
     │── read file ──▶│               │              │
     │                │── hand off ──▶│── read ─────▶│
     │── next user ──▶│  (free!)      │   ...        │
     │                │               │◀── done ─────│
     │◀─ callback ────│◀── run it ────│              │
If any word here is unclear, that is normal. Each part gets its own topic:
Topic 02 — Architecture: all the parts and how they connect.
Topic 03 — V8 Engine: how JavaScript becomes machine code.
Topic 04 — Event Loop: how the waiting and callbacks actually work.

10. Install and Check Node.js
Install
Download the LTS version (Long-Term Support — stable, recommended for learning and production) from:
https://nodejs.org/
LTS = stable, use this.
Current = newest features, changes faster — not needed for this journey.
Check it worked
Open a terminal and run:
node --version
npm --version
Expected output (your version numbers may be newer — that is fine):
v24.22.1
10.9.4
node --version — the Node.js runtime version.
npm --version — npm comes bundled with Node.js, no separate install.
If node is not found: close and reopen the terminal after installing, then try again. On Windows, restart the terminal so the new PATH is loaded.

11. Your First Node.js Program
Create a file called hello.js:
console.log('Hello, Node.js!');
Run it:
node hello.js
Output:
Hello, Node.js!
That is it — you just ran JavaScript outside the browser.
A slightly bigger first program — a real server in 6 lines
const http = require('http');

http.createServer((req, res) => {
  res.end('Hello from my first Node.js server!');
}).listen(3000);

console.log('Server running at http://localhost:3000');
Run it, then open http://localhost:3000 in your browser. You will see your message.
Press Ctrl + C in the terminal to stop the server.
Do not worry about understanding every line yet — the http module gets its own topic (Topic 11). For now, notice the pattern: require() a module, use it, run it with node.

12. The REPL — Try JavaScript Instantly
REPL = Read, Eval, Print, Loop. It is Node.js's interactive mode — type JavaScript, see the answer immediately.
Start it by typing node with no file name:
node
Welcome to Node.js v24.22.1.
Type ".help" for more information.
> 2 + 3
5
> const name = 'Talha';
undefined
> `Hello, ${name}!`
'Hello, Talha!'
> .exit
Useful REPL commands:
Command
What it does
.help
Show all commands
.exit
Leave the REPL (or press Ctrl + C twice)
.clear
Clear the current input
.load hello.js
Load and run a file inside the REPL
When to use the REPL: quick tests, checking a function, trying a module — faster than creating a file every time.

13. Code Walkthrough — introduction.js
Run it:
node examples/introduction.js
Expected output is saved in examples/example.txt.
What the file shows (in order)
Part 1 — Hello, Node.js:
console.log('Hello, Node.js!');
// Your first program — JavaScript running outside the browser.
Part 2 — Which Node.js am I running?
console.log('Node version:', process.version);
console.log('V8 version:  ', process.versions.v8);
console.log('Platform:    ', process.platform);
// process is a global object — available everywhere, no require() needed.
// (Global Objects get their own topic: Topic 05.)
Part 3 — Browser vs Node.js, in code:
console.log('typeof window:', typeof window);
// 'undefined' in Node.js — there is no window on a server.
// In a browser this would be 'object'.
Part 4 — Your first module:
const os = require('os');
console.log('CPU cores:', os.cpus().length);
console.log('Free memory:', Math.round(os.freemem() / 1024 / 1024), 'MB');
// require() loads a built-in module. os tells you about the computer.
Important lines explained
Line / idea
Why it matters
console.log(...)
Works in both browser and Node.js — same function, different runtime.
process.version
process is a global — no require() needed. It describes the running Node.js process.
typeof window
Proves there is no browser here. 'undefined' is the expected, correct answer.
require('os')
Loads a built-in module. This is how you get new abilities in Node.js.
os.cpus().length
Real data from your own computer — Node.js can talk to the OS.

14. Common Mistakes & Misconceptions
❌ "Node.js is a programming language."
  ✅ JavaScript is the language. Node.js is the runtime that runs it.
❌ "Node.js is a framework like Express."
  ✅ Express is a framework built on Node.js. Node.js is the platform underneath.
❌ "I need to learn a new language to learn Node.js."
  ✅ If you know Core JavaScript, you already know the language. You are learning a new environment.
❌ "window and document work in Node.js."
  ✅ They do not exist on a server. Use global, process, fs, http instead.
❌ "Node.js is only for big companies / big apps."
  ✅ It is also the simplest way to run a script, build a small API, or automate a task.
❌ "I must memorize the whole history and all version numbers."
  ✅ Remember 2009, Ryan Dahl, V8 + libuv, and why — the rest is reference material.

15. Interview Questions
Practice answering these out loud, in your own words — do not memorize:
What is Node.js? Is it a language, a framework, or a runtime?
Why was Node.js created? What problem did it solve?
Who created Node.js, and when?
What is the difference between JavaScript in the browser and JavaScript in Node.js?
Why is there no window or document in Node.js?
What is npm? Why is it important?
What is the REPL? When would you use it?
Name three things you can build with Node.js.
What is Node.js NOT good for, and why?
What are V8 and libuv, in one sentence each? (Full detail is Topic 02 and 03.)
Good answer pattern: one-line definition first, then why it exists, then one real example. Never start with a memorized paragraph.

16. Exercises
All exercises are in exercises/. Do them after reading this README and running introduction.js.
Install and verify — Install the LTS version, run node --version and npm --version, and write down your versions.
Hello, your name — Write a program that prints your name, your university, and your semester. Run it with node.
REPL practice — In the REPL, create a variable, do a calculation, and use a template literal. Write down what you typed and what it returned.
Browser vs Node.js — Write a program that prints typeof window, typeof document, and typeof process. Explain each result in a comment.
Your first server — Copy the 6-line server from Section 11, run it, open http://localhost:3000, and change the message. What happens when you change the message — do you need to restart the server? Why?
Solutions are not provided on purpose — the exercise is the learning.

17. Summary — The Mental Model to Remember
┌─────────────────────────────────────────────────────┐
│  JAVASCRIPT                                         │
│  the language — you already know it                 │
├─────────────────────────────────────────────────────┤
│  NODE.JS                                            │
│  the runtime — runs JavaScript outside the browser  │
│  V8 runs the code  •  libuv handles the waiting     │
├─────────────────────────────────────────────────────┤
│  RESULT                                             │
│  Same language for frontend AND backend.            │
│  Build servers, APIs, and tools with JavaScript.    │
└─────────────────────────────────────────────────────┘
If you remember only three sentences:
Node.js is a runtime, not a language or a framework.
It runs JavaScript outside the browser, on the server.
It was built to never wait — one thread, non-blocking I/O, many users.

Files in This Folder
01-introduction/
├── README.md                  # This file
├── examples/
│   ├── introduction.js        # Runnable demo: hello, process, window check, os module
│   └── example.txt            # Expected output of introduction.js
└── exercises/
    └── README.md              # 5 practice tasks (with hints)
How to run:
node examples/introduction.js

← Phase 01 Overview · Next: 02 — Node.js Architecture →
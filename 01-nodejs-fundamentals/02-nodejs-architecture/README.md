# 02 — Node.js Architecture

> **Priority:** 🔴 High
> **Previous topic:** [01 — Introduction to Node.js](../01-introduction-to-nodejs/README.md)
> **Next topic:** [03 — V8 JavaScript Engine](../03-v8-javascript-engine/README.md)

## Introduction

Node.js is single-threaded JavaScript on the outside, and a powerful C/C++ engine (V8 + libuv) on the inside. Your JavaScript runs on one thread, while slow work is handed off in the background — that is why one Node.js server can handle thousands of requests at the same time.

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain what Node.js is made of: V8, libuv, Bindings, the Standard Library, and the Operating System.
- Explain the difference between V8 (which runs JavaScript) and libuv (which handles waiting).
- Explain what "single-threaded" really means, and what the Thread Pool does.
- Explain blocking vs non-blocking code, and why a server must not block the Event Loop.
- Trace one request through Node.js, from the browser to the file system and back.

## Topics Covered

- The layers of Node.js, and what each layer does
- V8 Engine and libuv — their separate jobs
- The Event Loop and the Call Stack
- The Thread Pool (default 4 workers) — what uses it, and what does not
- Blocking vs non-blocking I/O
- Why Node.js is fast for I/O-bound work and weak for CPU-bound work
- How a request flows through Node.js, step by step

## Files in This Lesson

| File | What it is |
|------|-----------|
| [notes.md](./notes.md) | Full detailed notes — definitions, diagrams, explanations, code walkthrough, misconceptions, terminology, summary, interview questions and answers |
| [examples/](./examples/) | Runnable code — `architecture.js` with real output in `example.txt` |
| [exercises.md](./exercises.md) | 5 exercises, no solutions — basic, conceptual, practical, scenario-based, and interview-style |

**How to run the example:**

```bash
node examples/architecture.js
```

## Key Takeaways

- V8 runs JavaScript. libuv handles waiting.
- Your JavaScript runs on one main thread, one thing at a time.
- Slow work goes to the Thread Pool or the Operating System — the main thread never waits.
- Async does not always mean Thread Pool: network I/O uses the OS, while file I/O, crypto, compression, and DNS use the Thread Pool.
- Never block the Event Loop with heavy work on the main thread.
- If the work is mostly *waiting*, use Node.js. If it is mostly *calculating*, Node.js alone is the wrong tool.
- Node.js is a runtime, not a language and not a framework.

---

[← Main README](../../README.md) · [Previous: 01 — Introduction to Node.js](../01-introduction-to-nodejs/README.md) · [Next: 03 — V8 JavaScript Engine](../03-v8-javascript-engine/README.md)

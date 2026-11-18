# 03 — V8 Engine

> **Priority:** 🔴 High

V8 is the engine that runs your JavaScript. It reads your code, turns it into bytecode with Ignition, compiles the hot parts into fast machine code with TurboFan, and frees memory you no longer use with its Garbage Collector. This lesson explains that pipeline in plain, beginner-friendly language — no prior engine knowledge needed.

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain what V8 is and how it differs from Node.js.
- Trace the V8 pipeline: Parser → AST → Ignition → TurboFan.
- Explain JIT compilation, deoptimization, Hidden Classes, and Inline Caching.
- Explain how Garbage Collection works (Young and Old Generations) and what the Stack and Heap are.
- Write code that stays on V8's fast path.

## Topics Covered

- What V8 is, and V8 vs Node.js
- Parser and AST
- Ignition (interpreter) and bytecode
- TurboFan (JIT compiler) and deoptimization
- Hidden Classes and Inline Caching
- Garbage Collection — Young and Old Generations
- Stack vs Heap
- What V8 does NOT do
- Writing V8-friendly code

## Lesson Files

- **Notes:** [notes.md](./notes.md) — full detailed notes, diagrams, and interview questions with answers.
- **Examples:** [examples/](./examples/) — [v8.js](./examples/v8.js) with real output in [example.txt](./examples/example.txt). Run it with `node --expose-gc examples/v8.js` (the `--expose-gc` flag is needed for the Garbage Collection demo in Part 4).
- **Exercises:** [exercises.md](./exercises.md) — 5 exercises, no solutions.

## Key Takeaways

- V8 interprets first with Ignition, then compiles only the hot code with TurboFan.
- Stable object shapes and consistent types keep your code on the fast path.
- Changing an object's shape or a function's argument types forces V8 to slow down or deoptimize.
- The first benchmark run is warm-up — measure the 2nd or 3rd run.
- GC frees only unreachable objects; a forgotten reference still leaks.
- V8 runs JavaScript and cleans up its memory — files, network, and timers are Node.js and libuv's job, not V8's.
- Hot code is what matters: the route handler, the loop over 10,000 rows, the function called on every request.

---

[← Main README](../../README.md) · Previous: [02 — Node.js Architecture](../02-nodejs-architecture/README.md) · Next: [04 — Event Loop](../04-event-loop/README.md)

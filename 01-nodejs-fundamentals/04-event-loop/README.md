# 04 — Event Loop

> **Priority:** 🔴🔴 Very High
>
> The Event Loop is the traffic controller of Node.js — it runs your JavaScript on one thread, and whenever something is slow (a file, a database, a timer), it hands that work to the background, keeps serving other requests, and runs your callback when the work finishes. That is how one thread handles thousands of users at once.

## Learning objectives

By the end of this lesson, you will be able to:

- Explain what the Event Loop is, which library provides it, and how it differs from V8.
- Name the six phases of the loop in order, and say what runs in each one.
- Explain how `process.nextTick`, Promise microtasks, `setTimeout`, and `setImmediate` are ordered.
- Predict whether `setTimeout(0)` or `setImmediate` runs first — at the top level, and inside an I/O callback.
- Explain what the Thread Pool does, which work uses it, and how many threads it has by default.
- Explain what blocks the loop, who it affects, and how to write code that keeps the loop free.

## Topics covered

- What the Event Loop is, and why one thread is enough
- The six phases: Timers, Pending Callbacks, Idle/Prepare, Poll, Check, Close Callbacks
- Microtasks: `process.nextTick` vs Promises
- `setTimeout(0)` vs `setImmediate` — the ordering rule
- The Thread Pool (default 4 workers)
- What blocks the loop, and what does not
- Writing Event-Loop-friendly code

## Read, run, practise

- **Notes (full detail):** [notes.md](./notes.md) — definitions, the six phases, diagrams, code walkthrough, misconceptions, terminology, interview questions with answers.
- **Examples:** [examples/](./examples/) — run `node examples/event-loop.js`; real output is in [examples/example.txt](./examples/example.txt).
- **Exercises:** [exercises.md](./exercises.md) — 5 exercises, no solutions.

## Key takeaways

- The Event Loop runs your callbacks in a fixed order — Timers, Poll, Check — and microtasks (`nextTick`, then Promises) run before the loop moves on.
- Inside an I/O callback, `setImmediate` always beats `setTimeout(0)`; at the top level, that order is not guaranteed.
- Timers are minimums, not promises — a blocked loop makes them late.
- The Thread Pool *executes* slow work (files, DNS, crypto); the Event Loop *coordinates* it.
- Slow work belongs in the background — the main thread must stay free, or every user waits.
- Never use `Sync` methods or long loops inside a request handler.

---

[← Main README](../../README.md) · Previous: [03 — V8 JavaScript Engine](../03-v8-javascript-engine/README.md) · Next: [05 — Global Objects](../05-global-objects/README.md)

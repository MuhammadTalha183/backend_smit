# 01 — Introduction to Node.js

> **Priority:** ⭐ Start here — this is the first topic of Module 01.
> **Previous:** [Module README](../README.md)
> **Next:** [02 — Node.js Architecture](../02-nodejs-architecture/README.md)

## Introduction

Node.js lets you run JavaScript outside the browser, on the server — so the same language you use for a website can now build the backend behind it. It was created in 2009 by Ryan Dahl, built on Google's V8 engine plus libuv, so one thread never has to sit idle waiting on slow work. This lesson explains what Node.js is, why it exists, and how to run your first program with it.

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain what Node.js is — a JavaScript runtime, not a language or a framework.
- Explain why Node.js was created, including the C10k problem and non-blocking I/O.
- Tell browser JavaScript apart from Node.js (`window` / `document` vs `fs` / `http` / `process`).
- Install the LTS version, check it with `node --version`, and run a program with `node`.
- Use the REPL for quick tests and write a small working HTTP server.

## Topics Covered

- What Node.js is, and what it is not
- Why Node.js was created (Ryan Dahl, 2009, V8 + libuv)
- A short history, including npm and LTS
- Key features: V8, single-threaded, non-blocking I/O, event-driven, npm
- Node.js vs JavaScript in the browser
- What you can build with Node.js, and what it is not good for
- How Node.js works internally — a first look
- Install and check, your first program, and the REPL

## Links

- [notes.md](./notes.md) — full detailed notes, diagrams, and interview questions with answers
- [examples/](./examples/) — runnable demo [`introduction.js`](./examples/introduction.js) with real output in [`example.txt`](./examples/example.txt)
- [exercises.md](./exercises.md) — 5 practice tasks, no solutions

Run the example:

```bash
node examples/introduction.js
```

## Key Takeaways

- Node.js is a **runtime**, not a language or a framework — JavaScript is the language.
- It runs JavaScript **outside the browser, on the server**.
- It was built to **never wait** — one thread, non-blocking I/O, many users.
- The browser gives you `window` and `document`; Node.js gives you `fs`, `http`, and `process` — and has no `window`.
- Most backend work is **waiting**, and Node.js wastes almost no time waiting.
- CPU-heavy work blocks the single main thread, so Node.js alone is the wrong tool for it.
- If you know Core JavaScript, you already know the language — you are learning a new environment.

---

[← Module README](../README.md) · [Next: 02 — Node.js Architecture →](../02-nodejs-architecture/README.md)

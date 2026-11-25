# Module 01 — Node.js Fundamentals

> **Repository:** Backend Development Journey — see the [Main README](../README.md).
> **Technology:** JavaScript, Node.js
> **Learning approach:** Learn → Understand → Implement → Build → Document → Share.
>
> This module is the entry point for Phase 01. Start with topic 01 and follow the topics in order — each topic builds on the one before it.

---

## Table of Contents

- [1. Module Overview](#1-module-overview)
- [2. Learning Objectives](#2-learning-objectives)
- [3. Prerequisites](#3-prerequisites)
- [4. Topics Covered](#4-topics-covered)
- [5. Module Roadmap](#5-module-roadmap)
- [6. Folder Structure](#6-folder-structure)
- [7. Practical Learning Activities](#7-practical-learning-activities)
- [8. Exercises and Assessments](#8-exercises-and-assessments)
- [9. Important Diagrams](#9-important-diagrams)
- [10. Learning Progress Checklist](#10-learning-progress-checklist)
- [11. Completion Requirements](#11-completion-requirements)
- [12. References and Resources](#12-references-and-resources)

---

## 1. Module Overview

Node.js lets you run JavaScript outside the browser, on the server. This module explains what Node.js is, what it is made of, and how it works inside — before you build anything with Express.js in Phase 02.

You will learn:

- What Node.js is, and what it is **not** (not a language, not a framework).
- The architecture: V8, libuv, Bindings, the Standard Library, and the Operating System.
- How V8 turns JavaScript into fast machine code.
- How the Event Loop lets one thread handle thousands of requests.
- Which global objects Node.js gives you for free, and which names only *look* global.
- Then, in the remaining topics: modules, npm, the file system, HTTP, events, streams, environment variables, error handling, and async programming.

This module is written for beginners learning Node.js from scratch, for developers revising backend fundamentals, for future contributors to this repository, and for AI assistants using this repository as a learning reference.

**A topic is not complete until its concepts, practical implementation, exercises, and documentation are covered.**

---

## 2. Learning Objectives

By the end of this module, you will be able to:

- Explain what Node.js is, why it was created, and where it is used.
- Explain how Node.js works internally — V8, libuv, the Event Loop, and the Thread Pool.
- Run JavaScript outside the browser using Node.js.
- Use built-in modules: File System, Path, HTTP, and Events.
- Write asynchronous, non-blocking code with callbacks, Promises, and `async/await`.
- Handle errors and environment variables the professional way.
- Build a simple HTTP server with the core `http` module (before Express.js in Phase 02).
- Explain each of these ideas in your own words, with a real example — not by memorising definitions.

---

## 3. Prerequisites

- **Core JavaScript fundamentals — completed.** This module starts directly with Node.js. We revise a JavaScript concept only when Node.js needs it; we do not repeat the whole JavaScript course.
- **Node.js installed** — the LTS (Long-Term Support) version from [https://nodejs.org/](https://nodejs.org/). Check it with:
  ```bash
  node --version
  npm --version
  ```
- A terminal and a code editor. No other tools are needed for this module.

---

## 4. Topics Covered

| # | Topic | Priority | Status | Folder |
|---|-------|----------|--------|--------|
| 01 | Introduction to Node.js | ⭐ Start here | ✅ Notes, examples, exercises done | [01-introduction-to-nodejs/](./01-introduction-to-nodejs/) |
| 02 | Node.js Architecture | 🔴 High | ✅ Notes, examples, exercises done | [02-nodejs-architecture/](./02-nodejs-architecture/) |
| 03 | V8 JavaScript Engine | 🔴 High | ✅ Notes, examples, exercises done | [03-v8-javascript-engine/](./03-v8-javascript-engine/) |
| 04 | Event Loop | 🔴🔴 Very High | ✅ Notes, examples, exercises done | [04-event-loop/](./04-event-loop/) |
| 05 | Global Objects | 🟢 Normal | ✅ Notes, examples, exercises done | [05-global-objects/](./05-global-objects/) |
| 06 | Modules and Module Systems | 🔴 High | ✅ Notes, examples, exercises done | [06-modules/](./06-modules/) |
| 07 | CommonJS and ES Modules | 🔴 High | ✅ Notes, examples, exercises done | [07-commonjs-es-modules/](./07-commonjs-es-modules/) |
| 08 | NPM and Package Management | — | ⬜ Later | `08-npm/` *(not created yet)* |
| 09 | File System Module | — | ⬜ Later | `09-file-system/` *(not created yet)* |
| 10 | Path Module | — | ⬜ Later | `10-path-module/` *(not created yet)* |
| 11 | HTTP Module | — | ⬜ Later | `11-http-module/` *(not created yet)* |
| 12 | Events and Event Emitters | — | ⬜ Later | `12-events/` *(not created yet)* |
| 13 | Streams and Buffers | — | ⬜ Later | `13-streams-and-buffers/` *(not created yet)* |
| 14 | Environment Variables | — | ⬜ Later | `14-environment-variables/` *(not created yet)* |
| 15 | Error Handling | — | ⬜ Later | `15-error-handling/` *(not created yet)* |
| 16 | Asynchronous Programming in Node.js | — | ⬜ Later | `16-async-programming/` *(not created yet)* |

"Done" in this table means the **documentation** for that topic is written and its example has been run and verified. It does **not** mean you have learned it — see [Section 10](#10-learning-progress-checklist): tick a lesson only after you have run its examples and done its exercises yourself.

---

## 5. Module Roadmap

```text
01 Introduction to Node.js
        ↓  what Node.js is, why it exists, first program
02 Node.js Architecture
        ↓  V8, libuv, Bindings, Thread Pool, blocking vs non-blocking
03 V8 JavaScript Engine
        ↓  Parser → AST → Ignition → TurboFan, Hidden Classes, Garbage Collection
04 Event Loop
        ↓  six phases, microtasks, timers, setImmediate, blocking the loop
05 Global Objects
        ↓  global / globalThis, process, console, Buffer, timers
06 Modules and Module Systems
        ↓  one file one job, require, module.exports, caching, wrapper
07 CommonJS and ES Modules
        ↓  require vs import, live bindings, interop, "type", dual packages
08 NPM and Package Management          ← next
09 File System Module
10 Path Module
11 HTTP Module
12 Events and Event Emitters
13 Streams and Buffers
14 Environment Variables
15 Error Handling
16 Asynchronous Programming in Node.js
        ↓
Phase 02 — Express.js
```

The roadmap is flexible. A topic that is too large for one folder is split into parts — never compressed or skipped.

---

## 6. Folder Structure

Every topic folder follows the same structure, so any developer can follow it without confusion:

```text
01-nodejs-fundamentals/
│
├── README.md                  # This file — module overview
├── resources.md               # References and further reading
│
├── diagrams/
│   ├── nodejs-runtime-architecture.md
│   ├── v8-and-libuv.md
│   ├── event-loop-workflow.md
│   ├── thread-pool-workflow.md
│   ├── async-file-operation.md
│   ├── modules-and-require.md
│   └── commonjs-vs-esm.md
│
├── 01-introduction-to-nodejs/
│   ├── README.md              # Short lesson overview — start here
│   ├── notes.md               # Full notes (13 sections)
│   ├── examples/
│   │   ├── introduction.js
│   │   └── example.txt        # Real output of introduction.js
│   └── exercises.md           # 5 exercises, no solutions
│
├── 02-nodejs-architecture/
│   ├── README.md
│   ├── notes.md
│   ├── examples/
│   │   ├── architecture.js
│   │   └── example.txt
│   └── exercises.md
│
├── 03-v8-javascript-engine/
│   ├── README.md
│   ├── notes.md
│   ├── examples/
│   │   ├── v8.js
│   │   └── example.txt
│   └── exercises.md
│
├── 04-event-loop/
│   ├── README.md
│   ├── notes.md
│   ├── examples/
│   │   ├── event-loop.js
│   │   └── example.txt
│   └── exercises.md
│
├── 05-global-objects/
│   ├── README.md
│   ├── notes.md
│   ├── examples/
│   │   ├── global-objects.js
│   │   └── example.txt
│   └── exercises.md
│
└── 06-modules/
    ├── README.md
    ├── notes.md
    ├── examples/
    │   ├── modules.js
    │   ├── greet.js
    │   ├── math-utils.js
    │   ├── counter.js
    │   ├── config.json
    │   └── example.txt
    └── exercises.md

└── 07-commonjs-es-modules/
    ├── README.md
    ├── notes.md
    ├── examples/
    │   ├── cjs-math.cjs
    │   ├── esm-math.mjs
    │   ├── demo-cjs.cjs
    │   ├── demo-esm.mjs
    │   └── example.txt
    └── exercises.md
```

**Rules for the structure:**

- Create a folder only when we reach that topic. No empty placeholder folders.
- Every topic has a short `README.md` (overview + links), a full `notes.md`, runnable `examples/`, and an `exercises.md`.
- Every `notes.md` follows the same 13 sections: Introduction, Definitions, Detailed explanations, How it works internally, Architecture/workflow, Real-world examples, Code examples, Step-by-step code explanations, Common misconceptions, Terminology, Summary, Interview questions and answers, References.
- Never link to a topic folder that does not exist yet — use plain text "(coming next)" until it is created.

---

## 7. Practical Learning Activities

For every topic, follow the same method — Learn → Understand → Implement → Build → Document → Share:

1. **Read the lesson README** — what the topic is, and what you will be able to do after it.
2. **Read `notes.md` section by section** — from simple to technical. Do not skip the diagrams; they carry the mental model.
3. **Run the example** from inside the topic folder, e.g.:
   ```bash
   node examples/introduction.js
   ```
   Compare your output with `examples/example.txt`. Timing numbers and machine-specific values (memory, paths) will differ — the order and the effects must match. If they do not, re-read the code before moving on.
4. **Break it on purpose** — change one line, predict the output, run it. This is where understanding is built.
5. **Do the exercises** in `exercises.md` — no solutions are given on purpose.
6. **Explain it out loud** — in your own words, with one real example. If you cannot, go back to `notes.md`.

---

## 8. Exercises and Assessments

Each topic's `exercises.md` has 5 exercises, grouped as:

- **Basic understanding** — can you run it and describe what happened?
- **Conceptual questions** — can you explain *why* it works that way?
- **Practical coding exercises** — can you write it yourself?
- **Scenario-based questions** — can you apply it to a real situation?
- **Interview-style questions** — can you answer it out loud, in your own words? (Short answers are in `notes.md` §12 — attempt first, then check.)

There is no separate answer file. The exercise *is* the learning.

---

## 9. Important Diagrams

The diagrams live in [`diagrams/`](./diagrams/) — each file has a Mermaid diagram with an explanation underneath, written for beginners:

| Diagram | What it explains | File |
|---------|-----------------|------|
| Node.js Runtime Architecture | The layers: your code, Standard Library, Bindings, V8, libuv, OS | [nodejs-runtime-architecture.md](./diagrams/nodejs-runtime-architecture.md) |
| V8 and libuv | The V8 pipeline and how libuv relates to it | [v8-and-libuv.md](./diagrams/v8-and-libuv.md) |
| Event Loop Workflow | The six phases of the loop, in order | [event-loop-workflow.md](./diagrams/event-loop-workflow.md) |
| Thread Pool Workflow | The 4 worker threads, the queue, and what uses them | [thread-pool-workflow.md](./diagrams/thread-pool-workflow.md) |
| Asynchronous File Operation | One `fs.readFile` call, from your code to the OS and back | [async-file-operation.md](./diagrams/async-file-operation.md) |
| Modules and require() | How `require()` resolves, caches, and wraps a file | [modules-and-require.md](./diagrams/modules-and-require.md) |
| CommonJS vs ES Modules | How Node.js decides which system a file is | [commonjs-vs-esm.md](./diagrams/commonjs-vs-esm.md) |

The same diagrams also appear inside the relevant `notes.md` files, next to the text that explains them.

---

## 10. Learning Progress Checklist

Tick a box only after **you** have done that step — not when the notes were generated.

### 01 — Introduction to Node.js

- [ ] Lesson explained (read `notes.md`).
- [ ] Technical notes prepared (read and understood).
- [ ] Important diagrams included (reviewed — see §9).
- [ ] Practical examples documented (ran `examples/introduction.js`).
- [ ] Exercises prepared (did all 5 in `exercises.md`).
- [ ] Interview questions included (answered out loud).
- [ ] Documentation reviewed.

### 02 — Node.js Architecture

- [ ] Lesson explained.
- [ ] Technical notes prepared.
- [ ] Important diagrams included.
- [ ] Practical examples documented (ran `examples/architecture.js`).
- [ ] Exercises prepared.
- [ ] Interview questions included.
- [ ] Documentation reviewed.

### 03 — V8 JavaScript Engine

- [ ] Lesson explained.
- [ ] Technical notes prepared.
- [ ] Important diagrams included.
- [ ] Practical examples documented (ran `examples/v8.js`; GC demo needs `--expose-gc`).
- [ ] Exercises prepared.
- [ ] Interview questions included.
- [ ] Documentation reviewed.

### 04 — Event Loop

- [ ] Lesson explained.
- [ ] Technical notes prepared.
- [ ] Important diagrams included.
- [ ] Practical examples documented (ran `examples/event-loop.js`).
- [ ] Exercises prepared.
- [ ] Interview questions included.
- [ ] Documentation reviewed.

### 05 — Global Objects

- [ ] Lesson explained.
- [ ] Technical notes prepared.
- [ ] Important diagrams included.
- [ ] Practical examples documented (ran `examples/global-objects.js`).
- [ ] Exercises prepared.
- [ ] Interview questions included.
- [ ] Documentation reviewed.

### 06 — Modules and Module Systems

- [ ] Lesson explained.
- [ ] Technical notes prepared.
- [ ] Important diagrams included.
- [ ] Practical examples documented (ran `examples/modules.js`).
- [ ] Exercises prepared.
- [ ] Interview questions included.
- [ ] Documentation reviewed.

### 07 — CommonJS and ES Modules

- [ ] Lesson explained.
- [ ] Technical notes prepared.
- [ ] Important diagrams included.
- [ ] Practical examples documented (ran `examples/demo-cjs.cjs` and `examples/demo-esm.mjs`).
- [ ] Exercises prepared.
- [ ] Interview questions included.
- [ ] Documentation reviewed.

### 08–16 — Coming next

- [ ] 08 — NPM and Package Management
- [ ] 09 — File System Module
- [ ] 10 — Path Module
- [ ] 11 — HTTP Module
- [ ] 12 — Events and Event Emitters
- [ ] 13 — Streams and Buffers
- [ ] 14 — Environment Variables
- [ ] 15 — Error Handling
- [ ] 16 — Asynchronous Programming in Node.js

---

## 11. Completion Requirements

This module is complete when **all** of these are true:

- [ ] Every topic 01–16 has a short README, full `notes.md`, verified examples, and exercises.
- [ ] Every example runs and its output matches `example.txt` (except timing / machine-specific numbers).
- [ ] Every exercise in every `exercises.md` has been attempted.
- [ ] You can explain the six key ideas in your own words: Node.js, V8, libuv, Event Loop, non-blocking I/O, modules.
- [ ] You can trace one request through Node.js — browser → Event Loop → Thread Pool / OS → callback → response — without looking at the notes.

A topic is not complete because its notes exist. It is complete when you understand it, can run it, and can explain it.

---

## 12. References and Resources

See [`resources.md`](./resources.md) for the full list — official Node.js and V8 documentation, libuv, MDN JavaScript reference, and npm docs.

Key references used while writing these notes:

- Node.js documentation — [https://nodejs.org/en/docs](https://nodejs.org/en/docs)
- Node.js API reference — [https://nodejs.org/api/](https://nodejs.org/api/)
- V8 documentation — [https://v8.dev/docs](https://v8.dev/docs)
- libuv documentation — [https://libuv.org/](https://libuv.org/)

---

[← Main README](../README.md) · [Next: 01 — Introduction to Node.js →](./01-introduction-to-nodejs/README.md)

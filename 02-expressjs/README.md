# Module 02 — Express.js

> **Repository:** Backend Development Journey — see the [Main README](../README.md).
> **Technology:** JavaScript, Node.js, Express.js 5.x
> **Learning approach:** Learn → Understand → Implement → Build → Document → Share.
>
> This module is Phase 02. It assumes Module 01 (Node.js Fundamentals) — you already know how Node.js works inside, so here you learn how Express.js turns that into real web servers and APIs. Start with topic 01 and follow the topics in order — each topic builds on the one before it.

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

Express.js is the minimal, unopinionated web framework for Node.js. Node.js alone can serve HTTP — Module 01 proved that — but raw `http` code gets messy fast: routing by hand, parsing bodies by hand, repeating the same error handling in every handler. Express gives you routing, middleware, and request/response helpers, and stays out of your way for everything else.

You will learn:

- What Express.js is, and what it is **not** (not a full framework, not a database, not an ORM).
- How to set up an Express project — `package.json`, folder structure, dev workflow.
- HTTP fundamentals: methods, status codes, headers, and the request/response cycle.
- Routing: paths, parameters, query strings, and routers.
- The request and response objects: what you can read, what you can send.
- Middleware: the heart of Express — built-in, custom, and error-handling.
- Controllers: keeping routes thin and handlers organised.
- Error handling: one central place for every failure.
- Validation: never trusting client input.
- REST APIs: designing a clean API from everything above.
- Configuration: environment variables, secrets, and per-environment settings.

This module is written for beginners learning Express.js from scratch, for developers revising backend fundamentals, for future contributors to this repository, and for AI assistants using this repository as a learning reference.

**A topic is not complete until its concepts, practical implementation, exercises, and documentation are covered.**

---

## 2. Learning Objectives

By the end of this module, you will be able to:

- Explain what Express.js is, why it exists, and where it fits in the stack.
- Set up an Express project from scratch with a clean folder structure.
- Explain HTTP methods, status codes, and headers — and use them correctly.
- Build routes with parameters, query strings, and routers.
- Read anything from a request and send any kind of response.
- Write and order middleware — including custom and error-handling middleware.
- Organise handlers into controllers and keep routes thin.
- Handle every error in one central place, with a consistent response format.
- Validate params, query, and body input — and return clear 400 errors.
- Design and build a REST API: resources, pagination, filtering, versioning.
- Configure an app with environment variables, safely, per environment.
- Explain each of these ideas in your own words, with a real example — not by memorising definitions.

---

## 3. Prerequisites

- **Module 01 — Node.js Fundamentals — completed.** Express runs on Node.js; this module does not re-teach the Event Loop, modules, or the `http` module.
- **Core JavaScript fundamentals — completed.**
- **Node.js installed** — the LTS (Long-Term Support) version from [https://nodejs.org/](https://nodejs.org/). Check it with:
  ```bash
  node --version
  npm --version
  ```
- Express.js 5.x, installed per project with `npm install express`. A terminal and a code editor. No other tools are needed for this module.

---

## 4. Topics Covered

| # | Topic | Priority | Status | Folder |
|---|-------|----------|--------|--------|
| 01 | Introduction to Express.js | ⭐ Start here | ✅ Notes, examples, exercises done | [01-introduction/](./01-introduction/) |
| 02 | Project Setup | 🔴 High | ✅ Notes, examples, exercises done | [02-project-setup/](./02-project-setup/) |
| 03 | HTTP Fundamentals | 🔴 High | ✅ Notes, examples, exercises done | [03-http-fundamentals/](./03-http-fundamentals/) |
| 04 | Routing | 🔴 High | ✅ Notes, examples, exercises done | [04-routing/](./04-routing/) |
| 05 | Request and Response | 🔴 High | ✅ Notes, examples, exercises done | [05-request-response/](./05-request-response/) |
| 06 | Middleware | 🔴 High | ✅ Notes, examples, exercises done | [06-middleware/](./06-middleware/) |
| 07 | Controllers | 🔴 High | ✅ Notes, examples, exercises done | [07-controllers/](./07-controllers/) |
| 08 | Error Handling | 🔴 High | ✅ Notes, examples, exercises done | [08-error-handling/](./08-error-handling/) |
| 09 | Validation | 🔴 High | ✅ Notes, examples, exercises done | [09-validation/](./09-validation/) |
| 10 | REST APIs | 🔴 High | ✅ Notes, examples, exercises done | [10-rest-apis/](./10-rest-apis/) |
| 11 | Configuration | 🟡 Medium | ✅ Notes, examples, exercises done | [11-configuration/](./11-configuration/) |

"Done" in this table means the **documentation** for that topic is written and its example has been run and verified. It does **not** mean you have learned it — see [Section 10](#10-learning-progress-checklist): tick a lesson only after you have run its examples and done its exercises yourself.

---

## 5. Module Roadmap

```text
01 Introduction to Express.js
        ↓  what Express is, why it exists, first server
02 Project Setup
        ↓  npm init, package.json, folder structure, dev workflow
03 HTTP Fundamentals
        ↓  methods, status codes, headers, request/response cycle
04 Routing
        ↓  paths, params, query strings, routers
05 Request and Response
        ↓  req.params/query/body, res.send/json/status
06 Middleware
        ↓  app.use, next(), built-in, custom, order
07 Controllers
        ↓  thin routes, organised handlers, service layer intro
08 Error Handling
        ↓  next(err), central handler, custom error classes
09 Validation
        ↓  never trust client input, 400 with field errors
10 REST APIs
        ↓  resources, pagination, filtering, versioning
11 Configuration
        ↓  env vars, secrets, per-environment config
        ↓
Phase 03 — Database Management
```

The roadmap is flexible. A topic that is too large for one folder is split into parts — never compressed or skipped.

---

## 6. Folder Structure

Every topic folder follows the same structure, so any developer can follow it without confusion:

```text
02-expressjs/
│
├── README.md                  # This file — module overview
├── resources.md               # References and further reading
│
├── diagrams/
│   ├── express-request-lifecycle.md
│   ├── middleware-pipeline.md
│   ├── routing-flow.md
│   ├── rest-api-design.md
│   └── error-handling-flow.md
│
├── 01-introduction/
│   ├── README.md              # Short lesson overview — start here
│   ├── notes.md               # Full notes (13 sections)
│   ├── examples/
│   │   ├── hello-express.js
│   │   └── example.txt        # Real output of hello-express.js
│   └── exercises.md           # 5 exercises, no solutions
│
├── 02-project-setup/
│   ├── README.md
│   ├── notes.md
│   ├── examples/
│   │   ├── server.js
│   │   ├── config-demo.js
│   │   └── example.txt
│   └── exercises.md
│
├── 03-http-fundamentals/
│   ├── README.md
│   ├── notes.md
│   ├── examples/
│   │   ├── http-demo.js
│   │   └── example.txt
│   └── exercises.md
│
├── 04-routing/
│   ├── README.md
│   ├── notes.md
│   ├── examples/
│   │   ├── routing.js
│   │   └── example.txt
│   └── exercises.md
│
├── 05-request-response/
│   ├── README.md
│   ├── notes.md
│   ├── examples/
│   │   ├── request-response.js
│   │   └── example.txt
│   └── exercises.md
│
├── 06-middleware/
│   ├── README.md
│   ├── notes.md
│   ├── examples/
│   │   ├── middleware.js
│   │   ├── public/hello.txt
│   │   └── example.txt
│   └── exercises.md
│
├── 07-controllers/
│   ├── README.md
│   ├── notes.md
│   ├── examples/
│   │   ├── controllers.js
│   │   ├── userController.js
│   │   └── example.txt
│   └── exercises.md
│
├── 08-error-handling/
│   ├── README.md
│   ├── notes.md
│   ├── examples/
│   │   ├── error-handling.js
│   │   └── example.txt
│   └── exercises.md
│
├── 09-validation/
│   ├── README.md
│   ├── notes.md
│   ├── examples/
│   │   ├── validation.js
│   │   └── example.txt
│   └── exercises.md
│
├── 10-rest-apis/
│   ├── README.md
│   ├── notes.md
│   ├── examples/
│   │   ├── rest-api.js
│   │   └── example.txt
│   └── exercises.md
│
└── 11-configuration/
    ├── README.md
    ├── notes.md
    ├── examples/
    │   ├── config-demo.js
    │   ├── .env.example
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
   NODE_PATH=/tmp/express-verify/node_modules node examples/hello-express.js
   ```
   (The examples need Express installed. In a real project you run `npm install express` once and then just `node examples/hello-express.js`.) Compare your output with `examples/example.txt`. Timing numbers, ports, and machine-specific values will differ — the order and the effects must match. If they do not, re-read the code before moving on.
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
| Express Request Lifecycle | One request, from the socket to the response | [express-request-lifecycle.md](./diagrams/express-request-lifecycle.md) |
| Middleware Pipeline | How middleware runs in order, and what `next()` does | [middleware-pipeline.md](./diagrams/middleware-pipeline.md) |
| Routing Flow | How Express matches a request to a route | [routing-flow.md](./diagrams/routing-flow.md) |
| REST API Design | Resources, methods, status codes, pagination | [rest-api-design.md](./diagrams/rest-api-design.md) |
| Error Handling Flow | Where an error goes, from throw to response | [error-handling-flow.md](./diagrams/error-handling-flow.md) |

The same diagrams also appear inside the relevant `notes.md` files, next to the text that explains them.

---

## 10. Learning Progress Checklist

Tick a box only after **you** have done that step — not when the notes were generated.

### 01 — Introduction to Express.js

- [ ] Lesson explained (read `notes.md`).
- [ ] Technical notes prepared (read and understood).
- [ ] Important diagrams included (reviewed — see §9).
- [ ] Practical examples documented (ran `examples/hello-express.js`).
- [ ] Exercises prepared (did all 5 in `exercises.md`).
- [ ] Interview questions included (answered out loud).
- [ ] Documentation reviewed.

### 02 — Project Setup

- [ ] Lesson explained.
- [ ] Technical notes prepared.
- [ ] Important diagrams included.
- [ ] Practical examples documented (ran `examples/server.js` and `examples/config-demo.js`).
- [ ] Exercises prepared.
- [ ] Interview questions included.
- [ ] Documentation reviewed.

### 03 — HTTP Fundamentals

- [ ] Lesson explained.
- [ ] Technical notes prepared.
- [ ] Important diagrams included.
- [ ] Practical examples documented (ran `examples/http-demo.js`).
- [ ] Exercises prepared.
- [ ] Interview questions included.
- [ ] Documentation reviewed.

### 04 — Routing

- [ ] Lesson explained.
- [ ] Technical notes prepared.
- [ ] Important diagrams included.
- [ ] Practical examples documented (ran `examples/routing.js`).
- [ ] Exercises prepared.
- [ ] Interview questions included.
- [ ] Documentation reviewed.

### 05 — Request and Response

- [ ] Lesson explained.
- [ ] Technical notes prepared.
- [ ] Important diagrams included.
- [ ] Practical examples documented (ran `examples/request-response.js`).
- [ ] Exercises prepared.
- [ ] Interview questions included.
- [ ] Documentation reviewed.

### 06 — Middleware

- [ ] Lesson explained.
- [ ] Technical notes prepared.
- [ ] Important diagrams included.
- [ ] Practical examples documented (ran `examples/middleware.js`).
- [ ] Exercises prepared.
- [ ] Interview questions included.
- [ ] Documentation reviewed.

### 07 — Controllers

- [ ] Lesson explained.
- [ ] Technical notes prepared.
- [ ] Important diagrams included.
- [ ] Practical examples documented (ran `examples/controllers.js`).
- [ ] Exercises prepared.
- [ ] Interview questions included.
- [ ] Documentation reviewed.

### 08 — Error Handling

- [ ] Lesson explained.
- [ ] Technical notes prepared.
- [ ] Important diagrams included.
- [ ] Practical examples documented (ran `examples/error-handling.js`).
- [ ] Exercises prepared.
- [ ] Interview questions included.
- [ ] Documentation reviewed.

### 09 — Validation

- [ ] Lesson explained.
- [ ] Technical notes prepared.
- [ ] Important diagrams included.
- [ ] Practical examples documented (ran `examples/validation.js`).
- [ ] Exercises prepared.
- [ ] Interview questions included.
- [ ] Documentation reviewed.

### 10 — REST APIs

- [ ] Lesson explained.
- [ ] Technical notes prepared.
- [ ] Important diagrams included.
- [ ] Practical examples documented (ran `examples/rest-api.js`).
- [ ] Exercises prepared.
- [ ] Interview questions included.
- [ ] Documentation reviewed.

### 11 — Configuration

- [ ] Lesson explained.
- [ ] Technical notes prepared.
- [ ] Important diagrams included.
- [ ] Practical examples documented (ran `examples/config-demo.js`).
- [ ] Exercises prepared.
- [ ] Interview questions included.
- [ ] Documentation reviewed.

---

## 11. Completion Requirements

This module is complete when **all** of these are true:

- [ ] Every topic 01–11 has a short README, full `notes.md`, verified examples, and exercises.
- [ ] Every example runs and its output matches `example.txt` (except timing / ports / machine-specific numbers).
- [ ] Every exercise in every `exercises.md` has been attempted.
- [ ] You can explain the six key ideas in your own words: routing, middleware, request/response, controllers, error handling, REST.
- [ ] You can trace one request through Express — socket → middleware → router → controller → response — without looking at the notes.
- [ ] You can build a small REST API from scratch: routes, validation, error handling, and configuration.

A topic is not complete because its notes exist. It is complete when you understand it, can run it, and can explain it.

---

## 12. References and Resources

See [`resources.md`](./resources.md) for the full list — official Express.js documentation, Node.js HTTP docs, MDN HTTP reference, and REST guidance.

Key references used while writing these notes:

- Express.js documentation — [https://expressjs.com/](https://expressjs.com/)
- Express.js API reference (5.x) — [https://expressjs.com/en/5x/api.html](https://expressjs.com/en/5x/api.html)
- Express.js guide — [https://expressjs.com/en/guide/routing.html](https://expressjs.com/en/guide/routing.html)
- Node.js HTTP documentation — [https://nodejs.org/api/http.html](https://nodejs.org/api/http.html)
- MDN HTTP reference — [https://developer.mozilla.org/en-US/docs/Web/HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP)

---

[← Main README](../README.md) · [Previous: Module 01 — Node.js Fundamentals](../01-nodejs-fundamentals/README.md) · [Next: 01 — Introduction to Express.js →](./01-introduction/README.md)

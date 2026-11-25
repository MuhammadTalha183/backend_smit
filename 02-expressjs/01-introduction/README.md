# 01 — Introduction to Express.js

> **Priority:** ⭐ Start here
> **Previous topic:** [Module 01 — Node.js Fundamentals](../../01-nodejs-fundamentals/README.md)
> **Next topic:** [02 — Project Setup](../02-project-setup/README.md)

Node.js can already serve HTTP requests with its built-in `http` module — but doing everything by hand gets painful fast: you parse URLs yourself, write `if`/`else` chains to route requests, and set every header by hand. Express.js is the thin layer that removes that pain. It is a minimal, unopinionated web framework for Node.js: it adds routing, middleware, and helpful request/response methods on top of the same `http` module, and stays out of the way for everything else. This topic is the introduction: what Express is, why it exists, what it does and does not do, and where it fits in the stack — then a first working app.

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain what Express.js is and why it exists on top of raw Node.js `http`.
- Describe where Express fits in the stack: Node.js `http` underneath, routing and middleware on top.
- Explain the difference between a minimal framework (Express) and an opinionated framework.
- List what Express does for you — routing, middleware, `req`/`res` helpers, static files.
- List what Express does **not** do — no ORM, no built-in templating engine, no auth, no validation.
- Compare raw Node.js `http`, Express, and a bigger framework, and choose the right one for a job.
- Build and run a minimal Express app with two or three routes.
- Explain what a route, a route parameter, and `res.json()` are.

## Topics Covered

- What Express.js is — a minimal, unopinionated web framework for Node.js
- Why Express exists — the pain of raw `http` (manual routing, URL parsing, headers)
- Where Express fits in the stack — `http` module underneath, Express on top
- Minimal vs opinionated frameworks — Express vs NestJS, and friends
- What Express gives you — routing, middleware, `req`/`res` helpers, static files
- What Express does **not** give you — no ORM, no templating built in, no auth, no validation
- Express 5.x — what changed from Express 4 (Node.js 18+, async errors, new wildcard syntax)
- When to use Express — vs raw Node.js vs a bigger framework
- Your first Express app — routes, route parameters, `res.json()`

## Links

- **Notes:** [notes.md](./notes.md) — full detailed notes, diagrams, and interview questions with answers
- **Examples:** [examples/](./examples/) — run [`hello-express.js`](./examples/hello-express.js), expected output in [`example.txt`](./examples/example.txt)
- **Exercises:** [exercises.md](./exercises.md) — 5 practice tasks, no solutions
- **Module README:** [02 — Express.js](../README.md)

**How to run the examples:**

```bash
NODE_PATH=/tmp/express-verify/node_modules node examples/hello-express.js
```

> Express is **not** installed inside this repo — it lives only in `/tmp/express-verify/node_modules`, and `NODE_PATH` tells Node.js to look there. Do not run `npm install` for this topic; proper project setup with `package.json` is [02 — Project Setup](../02-project-setup/README.md).

## Key Takeaways

- Express is a thin layer on top of Node.js's built-in `http` module — it does not replace it, it organises it.
- Express adds routing (which handler answers which method + path), middleware (a pipeline of small functions), and `req`/`res` helpers (`res.json()`, `res.send()`, `req.params`).
- Express is minimal and unopinionated: it makes almost no decisions for you, so you choose your own database, templating engine, and structure.
- Express does **not** include an ORM, a templating engine, authentication, or validation — those come from other packages you add yourself.
- Use raw `http` for tiny one-off servers and learning; use Express for real APIs and small-to-medium apps; use a bigger opinionated framework when a large team needs structure enforced.
- A route is a method + a path + a handler. A route parameter like `:name` turns part of the URL into a value (`req.params.name`).

---

[← Main README](../../README.md) · Previous: [Module 01 — Node.js Fundamentals](../../01-nodejs-fundamentals/README.md) · Next: [02 — Project Setup](../02-project-setup/README.md)

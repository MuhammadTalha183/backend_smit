# 08 — Error Handling

> **Priority:** 🔴 High
> **Previous topic:** [07 — Controllers](../07-controllers/README.md)
> **Next topic:** [09 — Validation](../09-validation/README.md)

Everything works until it doesn't. A database goes down, a user asks for an id that does not exist, a route is typed wrong. Error handling is the plan for those moments: catch every error in exactly one place, answer the client with a clear status code and message, log what happened for yourself — and never leak a stack trace to a stranger. Without it, one bad request can crash the whole server.

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain the difference between sync errors, async errors, and programmer errors.
- Forward errors with `next(err)` and explain why throwing is not always enough.
- Write a centralized error-handling middleware (the four-argument function) and register it last.
- Create custom error classes that carry their own HTTP status code.
- Tell a 404 (not found) from a 500 (server broke) and answer each one correctly.
- Design a consistent error response format for your whole API.
- Explain why stack traces must never reach the client in production — and where they should go instead.

## Topics Covered

- Sync errors vs async errors vs programmer errors
- `try/catch`, `throw`, and `next(err)` — when each one works
- Express 5 vs Express 4: async rejections are forwarded automatically in v5
- Centralized error-handling middleware — the four-argument function `(err, req, res, next)`
- Custom error classes (`AppError`, `NotFoundError`, `ValidationError`)
- 404 handling: unknown routes vs missing resources
- A consistent error response format: `{ "error": "..." }`
- Logging errors on the server, hiding stack traces from the client
- What error handling must never do (swallow errors silently, leak internals, crash on a bad request)

## Links

- **Notes:** [notes.md](./notes.md) — full detailed notes, diagrams, and interview questions with answers
- **Examples:** [examples/](./examples/) — run [`error-handling.js`](./examples/error-handling.js), expected output in [`example.txt`](./examples/example.txt)
- **Exercises:** [exercises.md](./exercises.md) — 5 practice tasks, no solutions
- **Module README:** [02 — Express.js](../README.md)

**How to run the examples:**

```bash
NODE_PATH=/tmp/express-verify/node_modules node examples/error-handling.js
```

Express 5.3.0 is used for the examples (installed outside the repo — no `node_modules` folder is created inside it). The server listens on an ephemeral port, calls its own routes, prints the responses, and exits by itself.

## Key Takeaways

- One error handler, registered last, answers every error in the same format. Never write `res.status(500)` in ten different controllers.
- Sync errors thrown in a handler are caught by Express. Async rejections are forwarded automatically in Express 5, but needed try/catch or a wrapper in Express 4.
- Custom error classes carry their status code with them, so controllers throw `new NotFoundError('User')` instead of deciding status codes everywhere.
- 404 has two meanings: no route matched (unknown URL) and the route matched but the thing does not exist (missing user). Handle both, and do not confuse either with a 500.
- The client gets a status code and a safe message. The stack trace goes to your server log — never to the client, never in production.
- A bad request must never crash the server. If one request can kill the process, the error handling is broken.

---

[← Module README](../README.md) · Previous: [07 — Controllers](../07-controllers/README.md) · Next: [09 — Validation](../09-validation/README.md)

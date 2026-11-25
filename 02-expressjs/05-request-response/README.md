# 05 — Request and Response

> **Priority:** 🔴 High
> **Previous topic:** [04 — Routing](../04-routing/README.md)
> **Next topic:** [06 — Middleware](../06-middleware/README.md)

Every Express handler receives two objects: `req`, which carries everything the client sent — the URL, route parameters, query string, headers, cookies and body — and `res`, which is the only way to answer, with a status code, headers and a body. This topic goes through both properly: reading `req.params`, `req.query`, `req.body`, `req.headers` and `req.cookies`, and answering with `res.send`, `res.json`, `res.status`, `res.redirect`, `res.download` and `res.sendFile`, plus sharing data within a request via `res.locals` and serving different formats from one URL with content negotiation (`res.format`).

## Learning Objectives

By the end of this lesson, you will be able to:

- Read route parameters from `req.params` and query strings from `req.query`, and explain when to use each.
- Read a JSON request body from `req.body` and explain why `express.json()` must be registered first.
- Read request headers from `req.headers` / `req.get()` and explain when `req.cookies` is available.
- Choose between `res.send` and `res.json` and explain how they differ.
- Set status codes with `res.status()` and chain the response body onto it.
- Redirect with `res.redirect`, serve a file for viewing with `res.sendFile`, and force a download with `res.download`.
- Share data between middleware and handlers with `res.locals`.
- Serve different formats from one URL with `res.format` based on the client's `Accept` header.
- Explain the req/res lifecycle and why a response can only be sent once.

## Topics Covered

- `req.params` — route parameters (always strings)
- `req.query` — query string, filters, search, pagination
- `req.body` and `express.json()` — how body parsing works, `Content-Type`, size limits, malformed JSON
- `req.headers` and `req.get()` — lower-cased keys, `Accept`, `Authorization`
- `req.cookies` — why it needs `cookie-parser`
- `res.send` vs `res.json` — Content-Type guessing vs always JSON
- `res.status()` and chaining — `201 Created`, `404 Not Found`, and the forgotten send
- `res.redirect` — `302` by default, `301` for permanent moves
- `res.sendFile` and `res.download` — viewing vs saving a file
- `res.locals` — per-request storage shared by middleware and handlers
- Content negotiation — `res.format`, the `Accept` header, `406 Not Acceptable`
- The req/res lifecycle and the "send exactly once" rule

## Links

- **Notes:** [notes.md](./notes.md) — full detailed notes, diagrams, and interview questions with answers
- **Examples:** [examples/](./examples/) — run [`request-response.js`](./examples/request-response.js), expected output in [`example.txt`](./examples/example.txt)
- **Exercises:** [exercises.md](./exercises.md) — 5 practice tasks, no solutions
- **Module README:** [02 — Express.js](../README.md)

**How to run the examples:**

```bash
NODE_PATH=/tmp/express-verify/node_modules node examples/request-response.js
```

## Key Takeaways

- `req` is the question, `res` is the answer: read identity from `req.params`, options from `req.query`, submitted data from `req.body`, and metadata from `req.headers`.
- `req.body` is `undefined` until a body parser runs — register `app.use(express.json())` before your routes, and make sure the client sends `Content-Type: application/json`.
- Params and query values are always strings; convert and validate them yourself.
- Use `res.json` for APIs (always `application/json`) and `res.send` for text/HTML; set the status with `res.status()` and chain the body — an error body with a `200` status fools every client.
- A response is sent exactly once: `return` after every response in a branching handler, or the second send throws `Cannot set headers after they are sent`.
- `res.locals` is fresh per request, so it is the safe way to pass data from middleware to a handler; a module-level variable would leak between users.
- One URL can serve many formats: `res.format` picks by the `Accept` header, and `406 Not Acceptable` is the honest answer when no format matches.

---

[← Main README](../../README.md) · Previous: [04 — Routing](../04-routing/README.md) · Next: [06 — Middleware](../06-middleware/README.md)

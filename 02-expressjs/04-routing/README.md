# 04 — Routing

> **Priority:** 🔴 High
> **Previous topic:** [03 — HTTP Fundamentals](../03-http-fundamentals/README.md)
> **Next topic:** [05 — Request and Response](../05-request-response/README.md)

Every Express app answers one question for each request: *which function handles this?* Routing is that decision. You register routes — a method (`GET`, `POST`, …) plus a URL pattern plus a handler — and Express matches each incoming request against them in the order you registered them, first match wins. This topic covers the five method helpers, route parameters (`:id`), query strings, path patterns (strings, wildcards, regex), `app.route()` chaining, `express.Router()` and mounting, and the 404 catch-all that must sit last.

## Learning Objectives

By the end of this lesson, you will be able to:

- Register routes with `app.get()`, `app.post()`, `app.put()`, `app.patch()`, and `app.delete()`, and explain why the method is part of the match.
- Explain how Express matches routes in order — first match wins — and why specific routes must come before generic ones.
- Use route parameters (`:id`) and read them from `req.params`, remembering they are always strings.
- Use query strings (`?q=…&page=…`) and read them from `req.query`, and explain when to use a query string instead of a route parameter.
- Write route paths as exact strings, Express 5 wildcards (`*splat`), and regular expressions.
- Chain several methods onto one path with `app.route()`.
- Split routes into modules with `express.Router()` and mount them with `app.use('/prefix', router)`.
- Add a 404 catch-all in the correct (last) position and explain why it must be there.

## Topics Covered

- The five method helpers and `app.all()`
- How Express matches routes: method first, then path, in registration order
- Route parameters `:id` — one segment, always a string, `req.params`
- Query strings — filtering/searching/paging, `req.query`, defaults for missing keys
- Route parameters vs query strings — which resource vs how to filter
- Route paths: exact strings, Express 5 wildcards (`*splat`), regular expressions
- `app.route()` — chain `.get()`, `.post()`, … on one path
- `express.Router()` — a mini app per resource, in its own file
- Mounting routers with `app.use('/prefix', router)` and relative paths
- The 404 catch-all — why Express's built-in fallback is not enough, and why the handler must be last

## Links

- **Notes:** [notes.md](./notes.md) — full detailed notes, diagrams, and interview questions with answers
- **Examples:** [examples/](./examples/) — run [`routing.js`](./examples/routing.js), expected output in [`example.txt`](./examples/example.txt)
- **Exercises:** [exercises.md](./exercises.md) — 5 practice tasks, no solutions
- **Module README:** [../README.md](../README.md)

**How to run the examples:**

```bash
NODE_PATH=/tmp/express-verify/node_modules node examples/routing.js
```

## Key Takeaways

- A route is a method + a path pattern + a handler, and Express matches requests against routes **in registration order, first match wins** — so put specific routes before generic ones.
- Route parameters (`:id`) identify *which* resource and live in `req.params`; query strings (`?q=…`) modify the request and live in `req.query`. Both are always strings.
- In Express 5 the wildcard is `*splat` (`/files/*splat`) — the old Express 4 bare `*` throws an error at startup.
- `app.route('/items').get(…).post(…)` writes a shared path once; `express.Router()` plus `app.use('/api', router)` splits an app into one module per resource.
- A 404 catch-all (`app.use((req, res) => …)`) must be registered **last**, or it answers 404 to every request — including the valid ones.

---

[← Main README](../../README.md) · Previous: [03 — HTTP Fundamentals](../03-http-fundamentals/README.md) · Next: [05 — Request and Response](../05-request-response/README.md) · Module: [../README.md](../README.md)

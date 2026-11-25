# 06 — Middleware

> **Priority:** 🔴 High
> **Previous topic:** [05 — Request and Response](../05-request-response/README.md)
> **Next topic:** [07 — Controllers](../07-controllers/README.md)

Middleware is the function that runs between a request arriving and a route handler answering. It can log the request, parse the JSON body, check an API key, serve a static file — or stop the request entirely with a 401. Everything an Express app does around its routes is middleware, and the order you register it in decides whether it runs at all: a middleware placed after a route never runs for that route, body parsers must come before the routes that read `req.body`, and the error handler goes last.

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain what middleware is and what `next()` does.
- Register middleware with `app.use()` at application, router, and route level.
- Use the built-in middleware: `express.json()`, `express.urlencoded()`, `express.static()`.
- Write custom middleware — a logger and an auth-style check.
- Explain why middleware order matters, with a concrete example.
- Recognise the 4-argument error-handling middleware `(err, req, res, next)` and where it goes.

## Topics Covered

- What middleware is — the `(req, res, next)` function and the middleware stack
- `next()` vs `next(err)` vs sending a response — and what happens when you do none of them
- `app.use()` and mount paths
- Built-in middleware: `express.json()`, `express.urlencoded()`, `express.static()`
- Custom middleware: logger, auth check, attaching data to `req`
- Middleware order — why a middleware after a route never runs for it
- Application-level vs router-level vs route-level middleware
- How `req` / `res` flow through the stack
- Error-handling middleware — intro only (full detail is Topic 08)

## Links

- **Notes:** [notes.md](./notes.md) — full detailed notes, diagrams, and interview questions with answers
- **Examples:** [examples/](./examples/) — run [`middleware.js`](./examples/middleware.js), expected output in [`example.txt`](./examples/example.txt)
- **Exercises:** [exercises.md](./exercises.md) — 5 practice tasks, no solutions
- **Module README:** [02 — Express.js](../README.md)

**How to run the examples:**

```bash
NODE_PATH=/tmp/express-verify/node_modules node examples/middleware.js
```

## Key Takeaways

- Middleware is a `(req, res, next)` function. It can inspect or change `req`/`res`, end the response, or call `next()` to pass the request on.
- `next()` continues to the next layer; `next(err)` jumps to the error handler; calling neither and sending nothing hangs the request.
- Built-ins cover the everyday needs: `express.json()` for JSON bodies, `express.urlencoded()` for form bodies, `express.static()` for files. Without a body parser, `req.body` is `undefined`.
- Order is the whole game: Express walks one ordered stack, top to bottom. Middleware after a route that answers never runs for it; parsers go before the routes that need them; the error handler goes last.
- Application-level (`app.use`), router-level (`router.use`), and route-level (passed to one route) differ only in scope — use the narrowest scope that does the job.
- An error handler is recognised by its four parameters `(err, req, res, next)` — full detail in Topic 08.

---

[← Main README](../../README.md) · Previous: [05 — Request and Response](../05-request-response/README.md) · Next: [07 — Controllers](../07-controllers/README.md)

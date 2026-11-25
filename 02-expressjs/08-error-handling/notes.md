# 08 — Error Handling — Notes

> Phase 02 — Express.js · Topic 08 · Priority: 🔴 High
> Previous: [07 — Controllers](../07-controllers/README.md) · Next: [09 — Validation](../09-validation/README.md)

## Table of Contents

- [1. Introduction](#1-introduction)
- [2. Definition of Important Concepts](#2-definition-of-important-concepts)
- [3. Detailed Explanations](#3-detailed-explanations)
- [4. How the Technology Works Internally](#4-how-the-technology-works-internally)
- [5. Architecture or Workflow](#5-architecture-or-workflow)
- [6. Real-World Examples](#6-real-world-examples)
- [7. Code Examples Where Applicable](#7-code-examples-where-applicable)
- [8. Step-by-Step Code Explanations](#8-step-by-step-code-explanations)
- [9. Common Misconceptions](#9-common-misconceptions)
- [10. Important Technical Terminology](#10-important-technical-terminology)
- [11. Summary](#11-summary)
- [12. Interview Questions and Answers](#12-interview-questions-and-answers)
- [13. References](#13-references)

## 1. Introduction

Every backend you have built so far assumes the happy path: the user exists, the database answers, the request is well-formed. Real traffic is not like that. Users mistype URLs, send broken JSON, ask for records that were deleted yesterday, and do all of it at the same time your database has a bad minute.

Error handling is the plan for those moments, and it has three jobs:

1. **The server must not crash.** One bad request must never kill the process for every other user.
2. **The client must get a useful answer.** A status code and a message it can act on — not a hanging request, not a crash, not a stack trace.
3. **You must be able to find out what happened.** The error is logged on the server with enough detail to fix it.

The core idea of this topic is small: do not handle errors in ten places. Handle them in *one* place — a centralized error-handling middleware — and make every controller and middleware forward its errors there with `next(err)` or a `throw`.

## 2. Definition of Important Concepts

**Sync error**
An error thrown by synchronous code — `throw new Error(...)` inside a normal handler. Express catches it and forwards it to the error handler. Works the same in Express 4 and 5.

**Async error**
An error from a rejected promise inside an `async` handler — a database call that fails, a file read that rejects. Express 5 forwards it to the error handler automatically. Express 4 does not: the rejection becomes an unhandled promise rejection, the request hangs, and the process may crash.

**Programmer error (bug)**
A mistake in the code itself — reading a property of `undefined`, an infinite loop, a wrong variable name. These are not "expected" errors. The correct response is a 500, a log entry, and a bug fix — not a clever workaround.

**Operational error**
An expected failure of the world outside your code — database down, file missing, user not found, invalid input. These are the errors your error handler is designed for, and each one maps to a proper status code.

**`next(err)`**
Calling `next` with an argument tells Express: "this request failed, skip the normal middleware and go to the error handler." It is how sync code in middleware and callbacks forwards errors, and how Express 4 async code forwarded them.

**Error-handling middleware**
A middleware function with **four** arguments — `(err, req, res, next)`. The four arguments are what tell Express "this one handles errors, not requests." It must be registered **last**, after all routes and other middleware, so every error reaches it.

**Custom error class**
A class extending `Error` that carries extra information — most importantly an HTTP status code. `throw new NotFoundError('User')` says both *what* went wrong and *how* to answer it (404), so the central handler does not need a chain of `if` statements.

**404 vs 500**
404 means "I understood the request, but the thing does not exist" — the client's mistake, or at least a client-facing fact. 500 means "something broke on my side" — the server's fault, and the client can do nothing but retry later.

**Stack trace**
The list of function calls that led to an error. It is a debugging tool for developers and a security leak for clients: it reveals file paths, library names, and internal structure. It belongs in the server log, never in an API response — and never in production.

## 3. Detailed Explanations

### 3.1 The three kinds of errors, and why the difference matters

Not every error deserves the same treatment:

| Kind | Example | Treatment |
|---|---|---|
| Operational error | User not found, database down, invalid input | Expected: answer with the right status code, log it, keep serving |
| Programmer error | `Cannot read properties of undefined` | A bug: answer 500, log the stack, fix the code |
| Crash-level failure | Out of memory, event loop blocked | The process cannot continue safely: log, exit, let the process manager restart it |

Most of this topic is about operational errors. Programmer errors get the same 500 answer on the outside, but on the inside they are a signal to fix code — never to add a special case that hides the bug.

### 3.2 Sync errors: throw, and Express catches it

In a synchronous handler, a plain `throw` is enough:

```js
app.get('/users/:id', (req, res) => {
  const user = users.find((u) => u.id === Number(req.params.id));
  if (!user) throw new Error('User not found');
  res.json(user);
});
```

Express wraps sync handlers in a try/catch of its own. The throw is caught, and Express calls the error-handling middleware with that error. This works identically in Express 4 and 5.

But throwing a plain `Error` has a problem: it carries no status code, so the central handler must guess — and it guesses 500. Asking for a missing user is not a server failure; it is a 404. That is why custom error classes exist (see §3.5).

### 3.3 Async errors: Express 5 changed the rules

```js
app.get('/users/:id', async (req, res) => {
  const user = await db.users.findById(req.params.id); // may reject
  if (!user) throw new NotFoundError('User');
  res.json(user);
});
```

- **Express 5** (this repo, version 5.3.0): if the promise rejects — the database is down, or the `throw` runs — Express catches the rejection and forwards it to the error handler. No try/catch is needed in the controller.
- **Express 4**: the rejection is *not* caught. The request hangs forever, the client gets nothing, and Node.js may terminate the process with an unhandled rejection. Every async handler needed one of these:
  ```js
  // try/catch in every handler
  async function getUser(req, res, next) {
    try {
      const user = await db.users.findById(req.params.id);
      res.json(user);
    } catch (err) { next(err); }
  }
  // ...or a wrapper (the pattern you will see in Express 4 tutorials)
  const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);
  app.get('/users/:id', asyncHandler(getUser));
  ```

You will meet the wrapper pattern in older tutorials and codebases — recognize it, understand why it existed, and know that Express 5 made it unnecessary. The example in this topic proves the Express 5 behaviour live: `/async-error` rejects a promise with no try/catch anywhere, and the client still gets a clean 503.

### 3.4 `next(err)` — forwarding errors by hand

`next()` with no argument means "I am done, run the next middleware." `next(err)` with an argument means "this request failed." Express skips every remaining normal middleware and jumps straight to the error handler. Use it when:

- You are in a callback (not a promise), where `throw` would not be caught.
- You are in middleware that detects a problem early — for example an auth middleware that finds an invalid token: `return next(new AppError(401, 'Invalid token'))`.
- You are in Express 4 async code (see above).

One rule: after calling `next(err)`, do nothing else. `return next(err)` — the `return` stops the function from also trying to send a response.

### 3.5 Centralized error-handling middleware — one place, last in line

```js
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const body = { error: err.message || 'Internal server error' };
  if (process.env.NODE_ENV !== 'production') body.stack = err.stack;
  console.error(`[error] ${status} ${req.method} ${req.path} — ${err.message}`);
  res.status(status).json(body);
});
```

Three things make this work:

1. **Four arguments.** `(err, req, res, next)` is the signature Express recognizes. With three arguments it would be treated as normal middleware and never receive errors.
2. **Registered last.** Middleware runs in order, so an error handler registered before a route can never see that route's errors. It goes after every route, every router, and the 404 handler.
3. **One response format.** Every error in the whole API comes back the same way: `{ "error": "..." }`. Clients — your React app and your React Native app — can rely on that shape instead of parsing a different error format per endpoint.

### 3.6 Custom error classes — the status code travels with the error

```js
class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
class NotFoundError extends AppError {
  constructor(what) { super(404, `${what} not found`); }
}
```

Now a controller says *what* went wrong and the class says *how* to answer:

```js
if (!user) throw new NotFoundError('User');   // → 404 { "error": "User not found" }
```

Without custom errors, the central handler needs a fragile chain of `if (err.message.includes(...))` checks. With them, the handler is five lines: read `err.status` (default 500), read `err.message`, answer. New error types mean new small classes, not edits to the handler.

### 3.7 404: two different situations, one status code

404 happens in two places, and beginners mix them up:

- **No route matched.** The client asked for `/no-such-page`. No route exists, so a catch-all middleware at the end of the route list forwards a 404: `next(new NotFoundError('Route GET /no-such-page'))`. This middleware is registered *after* all routes but *before* the error handler.
- **The route matched, the thing does not exist.** `GET /users/999` is a real route, but user 999 is not in the database. The controller throws `NotFoundError('User')`.

Both are 404s and both go through the same central handler — but they are detected in different places. A common bug is forgetting the first one: without a catch-all 404 middleware, Express answers unknown routes with its own default HTML page ("Cannot GET /no-such-page"), which breaks the consistent JSON format your frontends expect.

### 3.8 The error response format

Keep it simple and consistent:

```json
{ "error": "User not found" }
```

For validation failures (topic 09) the format grows slightly — `{ "errors": [{ "field": "email", "message": "..." }] }` — but the principle is the same: one predictable shape, a human-readable message, and nothing internal. What must never appear in a response:

- **Stack traces.** They reveal file paths and internals. Log them; do not send them.
- **Database error text.** `duplicate key value violates unique constraint "users_email_key"` tells an attacker your table and column names. Translate it into "Email already registered" before answering.
- **Internal codes or paths.** The client does not need them; an attacker loves them.

In development, including the stack in the response is convenient — the example handler does exactly that when `NODE_ENV` is not `production`. In production, it is off. That one `if` is the difference between a helpful dev tool and a security leak.

### 3.9 Logging: the error's other destination

Answering the client is only half the job. The other half is writing the error down where you can find it later:

```js
console.error(`[error] ${status} ${req.method} ${req.path} — ${err.message}`);
```

`console.error` (not `console.log`) is the right tool: it writes to stderr, which log collectors and hosting platforms treat as error output. In a real deployment this line becomes a proper logger (Winston, Pino — Phase 06), but the habit starts here: every error the client sees is also written to the server log, with the method, the path, and the message. When a user reports "it said 500 at 3pm," the log is where you find out why.

### 3.10 What error handling must never do

- **Swallow errors silently.** An empty `catch {}` or a handler that answers 200 for a failure hides the problem from everyone — including you. If it failed, say so.
- **Answer 200 for an error.** A 200 means success. Frontends, retry logic, and monitoring all trust status codes; a 200 with an error body breaks every one of them.
- **Crash on a bad request.** A malformed request is the client's fault, not a reason to kill the server for all other users.
- **Leak internals.** Stack traces, SQL text, file paths, library versions — none of these belong in a response.
- **Handle errors in every controller.** That is how ten different error formats are born. Forward everything to one handler.

## 4. How the Technology Works Internally

When an error occurs, Express abandons the normal middleware walk and starts a second walk — the error walk:

```
Request  GET /users/999
   │
   ▼
express.json()            ← normal middleware
   │
   ▼
GET /users/:id            ← route matches, controller throws NotFoundError
   │        (or: async handler rejects — Express 5 catches it)
   ▼
Express skips all remaining NORMAL middleware
   │
   ▼
404 catch-all?            ← only reached if no route matched at all
   │
   ▼
Error handler (err, req, res, next)   ← FIRST error middleware, registered last
   │   logs the error, answers { status, message }
   ▼
Response  404 {"error":"User not found"}
```

The key mechanics:

- **Sync throw:** Express wraps each handler call in try/catch. A throw is caught and passed to `next(err)` internally.
- **Async rejection (Express 5):** Express checks whether the handler returned a promise, and attaches a `.catch(next)` to it. That is the whole change between Express 4 and 5.
- **Error middleware detection:** Express decides a function is an error handler by its *arity* — the number of declared parameters. Four parameters means error handler; three means normal middleware. (This is why you must not "clean up" the unused `next` parameter — removing it silently turns your error handler into normal middleware that never runs.)
- **If no error handler exists:** Express falls back to its built-in default, which sends a plain 500 with a stack trace in development and a bare message in production. It works, but it is not your format — which is why you always register your own.

## 5. Architecture or Workflow

The workflow for error handling in any Express app:

```
1. Controllers throw custom errors for expected failures
   throw new NotFoundError('User')      → 404
   throw new AppError(403, 'Forbidden') → 403
        │
2. Unexpected failures throw/reject on their own
   database down, bug in the code       → 500 (default)
        │
3. A catch-all 404 middleware handles unknown routes
   app.use((req, res, next) =>
     next(new NotFoundError(`Route ${req.method} ${req.path}`)))
        │
4. ONE central error handler, registered LAST, answers everything
   app.use((err, req, res, next) => { ... })
        │
5. The handler logs to the server and answers the client
   log:  [error] 404 GET /users/999 — User not found
   client: 404 { "error": "User not found" }
```

File layout (grows from topic 07's layout):

```
src/
  app.js
  routes/
  controllers/
  errors/
    AppError.js        # AppError, NotFoundError, ValidationError, ...
  middleware/
    errorHandler.js    # the central handler (imported by app.js, registered last)
    notFound.js        # the catch-all 404 middleware
```

The order in `app.js` is the architecture: body parsing → routers → 404 catch-all → error handler. If that order is wrong, errors are answered by the wrong handler or not at all.

## 6. Real-World Examples

- **A missing user.** `GET /users/999` → controller throws `NotFoundError('User')` → central handler answers `404 { "error": "User not found" }`. The React app shows "user not found" instead of a blank screen.
- **Database down.** The Postgres connection fails mid-request → the query promise rejects → Express 5 forwards it → central handler answers `503 { "error": "The database is unavailable" }`. The server keeps running; the next request after the database recovers succeeds.
- **A mistyped URL.** The mobile app calls `/user` instead of `/users` → no route matches → the catch-all forwards a 404 → the client gets JSON, not Express's default HTML error page.
- **A bug in production.** A controller reads a property of `undefined` → a 500 is answered, the stack is written to the server log, and the developer finds it in the logs the next morning. The client never sees the stack.
- **Your semester project.** A student takes a queue token for an office that no longer exists → 404 with a clear message. The queue service is down → 503, and the mobile app shows "try again in a minute" instead of crashing.

## 7. Code Examples Where Applicable

The full runnable example lives in `examples/error-handling.js`. The key lines:

```js
// Custom error classes — the status code travels with the error
class AppError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
class NotFoundError extends AppError {
  constructor(what) { super(404, `${what} not found`); }
}
```

```js
// An async error — Express 5 forwards it with no try/catch
app.get('/async-error', async (req, res) => {
  await Promise.reject(new AppError(503, 'The database is unavailable'));
});
```

```js
// Catch-all 404 for unknown routes (after all routes, before the handler)
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.path}`));
});
```

```js
// The central handler — four arguments, registered LAST
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const body = { error: err.message || 'Internal server error' };
  if (process.env.NODE_ENV !== 'production') body.stack = err.stack;
  console.error(`[error] ${status} ${req.method} ${req.path} — ${err.message}`);
  res.status(status).json(body);
});
```

Run it with:

```bash
NODE_PATH=/tmp/express-verify/node_modules node examples/error-handling.js
```

## 8. Step-by-Step Code Explanations

### 8.1 `error-handling.js` — the whole file, in order

1. `process.env.NODE_ENV = 'production'` is set at the top so the demo proves the production behaviour: no stack trace is ever sent. (In a real app this comes from the environment, not from code.)
2. `AppError` extends `Error` and stores a `status`. `NotFoundError` extends `AppError` and hard-codes 404 with a readable message. One small class per error type.
3. `/sync-error` throws a plain `Error` inside a sync handler. Express catches it. Because it has no `status`, the handler answers 500 — correct, because this is an unexpected failure.
4. `/async-error` is an `async` handler that rejects a promise. There is no try/catch anywhere in the file — Express 5 forwards the rejection to the error handler, which answers 503. This is the line that proves the Express 5 behaviour.
5. `/users/:id` throws `NotFoundError('User')` when the id is missing. Expected failure, correct status, no `if` chain in the handler.
6. `/ok` is the control: a healthy route that answers 200, proving the handler does not interfere with success.
7. The catch-all 404 middleware runs only when no route matched. It forwards a `NotFoundError` describing the method and path.
8. The central error handler is last. It reads `err.status` (default 500), builds `{ error: message }`, adds the stack only outside production, logs one line to stderr, and answers.
9. The self-test calls all five routes in order and prints status plus body, then closes the server and exits.

### 8.2 Reading the output

```
GET /ok            -> 200 {"message":"All good"}
[error] 500 GET /sync-error — Something broke while handling this request
GET /sync-error   -> 500 {"error":"Something broke while handling this request"}
```

Each error produces two lines: the server log line (stderr, for you) and the client response (stdout, for the user). The log line appears first because the handler logs before answering. In the client response there is no `stack` field — the production setting is doing its job.

## 9. Common Misconceptions

- **"try/catch in every controller is good error handling."** No — it is the old Express 4 workaround, and it scatters error logic across the whole codebase. In Express 5, async errors are forwarded for you; in both versions, one central handler is the pattern.
- **"404 means the server is broken."** No — 404 means the *thing* does not exist. It is usually the client's mistake (wrong id, wrong URL), and it is an expected, handled outcome, not a failure of the server.
- **"500 means I did something wrong as a user."** No — 500 means the server failed. A user who sees a 500 did nothing wrong and can only retry later.
- **"Sending the stack trace helps the user report the bug."** It helps an attacker more than a user. The user reports the status code and the message; the stack trace lives in your server log, where it belongs.
- **"The error handler catches everything, so my code cannot crash."** It catches request errors. It does not catch errors thrown outside a request (startup failures, uncaught exceptions in background jobs, out-of-memory). Those need process-level handlers (`process.on('uncaughtException')`) — and even those should usually just log and exit.
- **"Removing the unused `next` parameter from the error handler is harmless cleanup."** It is not. Express detects error handlers by counting parameters: four means error handler. Remove `next` and it becomes normal middleware that never receives errors.
- **"Express 4 and 5 handle async errors the same way."** They do not — this is the single most important version difference in this topic. Express 5 forwards async rejections; Express 4 hangs and can crash.

## 10. Important Technical Terminology

| Term | Meaning |
|---|---|
| Operational error | An expected failure (not found, DB down, bad input) with a proper status code. |
| Programmer error | A bug in the code itself; answered 500, logged, fixed — not worked around. |
| `next(err)` | Forwards an error to the error-handling middleware, skipping normal middleware. |
| Error-handling middleware | A four-argument function `(err, req, res, next)` that answers errors. |
| `AppError` / custom error class | An `Error` subclass carrying an HTTP status code (and anything else the handler needs). |
| 404 Not Found | The route or the resource does not exist. |
| 500 Internal Server Error | The server failed; the client did nothing wrong. |
| 503 Service Unavailable | A dependency (database, external service) is temporarily down. |
| Stack trace | The chain of function calls that led to an error — for logs, never for clients. |
| Centralized error handling | All errors answered in one middleware, in one format. |
| Unhandled rejection | A rejected promise nobody caught; in Express 4 async handlers this could crash the process. |

## 11. Summary

- Errors come in three kinds: operational (expected, status-coded), programmer errors (bugs, 500), and crash-level failures. Most error handling is about the first kind.
- Sync errors thrown in a handler are caught by Express in both versions. Async rejections are forwarded automatically only in Express 5; Express 4 needed try/catch or a wrapper.
- `next(err)` forwards an error by hand — from callbacks, from middleware, and from Express 4 async code.
- One central error-handling middleware, four arguments, registered last, answers every error in one format: `{ "error": "..." }`.
- Custom error classes carry the status code with the error, so controllers throw `new NotFoundError('User')` and the handler stays five lines long.
- 404 has two sources — unknown route (catch-all middleware) and missing resource (controller) — and neither is a 500.
- The client gets a status and a safe message; the stack trace goes to the server log, never to the client, and never in production.

## 12. Interview Questions and Answers

**Q1. How does Express handle errors?**
Errors are forwarded to error-handling middleware — a function with four arguments `(err, req, res, next)` registered last. Sync throws are caught by Express; in Express 5 async rejections are forwarded automatically; anything else is passed with `next(err)`.

**Q2. What is error-handling middleware, and how does Express recognize it?**
It is a middleware function declared with four parameters: `(err, req, res, next)`. Express detects it by the parameter count — four means error handler. It must be registered after all routes so every error reaches it.

**Q3. How do async errors differ between Express 4 and Express 5?**
In Express 5, a rejected promise in an async handler is forwarded to the error handler automatically. In Express 4 it is not caught — the request hangs and the process can crash — so every async handler needed try/catch with `next(err)` or a wrapper function.

**Q4. What is the difference between 404 and 500?**
404 means the requested thing does not exist — usually the client's mistake (wrong id or URL) and an expected outcome. 500 means the server failed unexpectedly — the client did nothing wrong. They are answered differently and monitored differently.

**Q5. Why use custom error classes?**
Because the error should carry its own HTTP status code. `throw new NotFoundError('User')` answers 404 wherever it is thrown, and the central handler stays simple — it reads `err.status` instead of guessing from the message.

**Q6. Why must stack traces never be sent to the client in production?**
They reveal internal file paths, library names, and code structure — information an attacker can use — and they are useless to a normal user. Stack traces belong in the server log, where developers can read them.

**Q7. What is `next(err)` for?**
It forwards an error to the error-handling middleware, skipping all remaining normal middleware. It is used from callbacks (where `throw` is not caught), from middleware that detects a problem, and in Express 4 async code.

**Q8. A request to a URL with no route returns Express's default HTML error page. How do you fix that?**
Register a catch-all 404 middleware after all routes — one that forwards a `NotFoundError` — and let the central error handler answer it in the API's normal JSON format.

## 13. References

- Express.js docs — Error handling: https://expressjs.com/en/guide/error-handling.html
- Express.js docs — Writing middleware: https://expressjs.com/en/guide/writing-middleware.html
- Express 5 migration guide (async error handling change): https://expressjs.com/en/guide/migrating-5.html
- MDN — HTTP response status codes: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
- Node.js docs — Errors: https://nodejs.org/api/errors.html

## Files in This Folder

- `README.md` — short overview, objectives, and how to run the examples
- `notes.md` — this file: full detailed notes with interview questions and answers
- `exercises.md` — 5 practice tasks, no solutions
- `examples/error-handling.js` — sync/async/404 errors + central handler (run this file)
- `examples/example.txt` — real output from running the example

---

[← Module README](../README.md) · Previous: [07 — Controllers](../07-controllers/README.md) · Next: [09 — Validation](../09-validation/README.md)

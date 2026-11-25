# 06 — Middleware — Notes

> **Module:** 02 — Express.js
> **Topic:** 06 — Middleware
> **Priority:** 🔴 High
> **Previous topic:** [05 — Request and Response](../05-request-response/README.md)
> **Next topic:** 07 — Controllers *(coming next — folder not created yet)*
>
> **One-line summary:** Middleware is a function that runs between the incoming request and the final route handler — it can read or change `req` and `res`, end the response early, or call `next()` to pass the request on. Almost everything an Express app does (logging, JSON parsing, auth, static files, error handling) is middleware, and the order you register it in decides whether it runs at all.
>
> **How to use these notes:** read [README.md](./README.md) first for the short overview, then work through this file section by section. Run the example in [`examples/middleware.js`](./examples/middleware.js) and compare your output with [`examples/example.txt`](./examples/example.txt). Then do the tasks in [`exercises.md`](./exercises.md).

---

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

---

## 1. Introduction

In Topic 05 you learned what `req` and `res` are: the request object carries everything the client sent, the response object is how you answer. But in a real app, a request almost never goes straight from the socket to a route handler. Before the handler runs, the app usually needs to log the request, parse the JSON body, check whether the user is logged in, and maybe serve a file. After the handler, an error might need catching.

Middleware is the mechanism Express gives you for all of that. A middleware function is a small function that sits in the middle of the request's journey. It receives the same `req` and `res` the route handler will receive, plus a third argument, `next`. It can do three things:

1. **Do work and pass on** — log something, add a property to `req`, parse the body — then call `next()` so the request continues to the next function.
2. **End the response itself** — send a 401 for a bad API key, serve a static file — in which case `next()` is never called and the route handler never runs.
3. **Pass an error on** — call `next(err)` to skip straight to the error-handling middleware.

**Why this matters:** without middleware, every route handler would have to repeat the same work — parse the body, check the token, log the request — in every single handler. Middleware lets you write that logic once and have it run for every request, or for a chosen set of routes, automatically. It is the single most important idea in Express: routes decide *what* to do, middleware decides *what happens around* it.

**Simple way to remember it:**

> **Middleware is a checkpoint on the road from request to response. Every request passes through the checkpoints in the order you built them. A checkpoint can inspect the request, change it, stop it, or wave it through with `next()`.**

By the end of this topic you will be able to: explain what middleware is and what `next()` does; register middleware with `app.use()` at application, router, and route level; use the built-in middleware (`express.json()`, `express.urlencoded()`, `express.static()`); write custom middleware (logger, auth check); explain why registration order decides whether middleware runs; and recognise the 4-argument error-handling middleware (full detail in Topic 08).

---

## 2. Definition of Important Concepts

| Concept | Definition |
|---|---|
| **Middleware** | A function with the signature `(req, res, next)` that runs during request processing. It can read/modify `req` and `res`, end the response, or call `next()` to continue to the next middleware or route handler. |
| **`next()`** | The function Express passes as the third argument. Calling it hands the request to the next matching middleware/route in the stack. Calling `next(err)` skips all normal middleware and jumps to the error handler. Not calling it (and not sending a response) hangs the request forever. |
| **Middleware stack** | The ordered list of all middleware functions and route handlers Express has registered, in registration order. A request walks this list top to bottom until something sends a response. |
| **`app.use()`** | Registers middleware that runs for every request whose path starts with the given mount path (or all requests if no path is given). The main way to add application-level middleware. |
| **Application-level middleware** | Middleware bound to the whole app with `app.use()` or `app.METHOD()`. Runs for every request (or every request under its mount path). |
| **Router-level middleware** | Middleware bound to an `express.Router()` instance with `router.use()`. Runs only for requests routed through that router. |
| **Route-level middleware** | Middleware passed as extra arguments to a single route, e.g. `app.get('/protected', checkApiKey, handler)`. Runs only for that route. |
| **Built-in middleware** | Middleware that ships with Express itself: `express.json()`, `express.urlencoded()`, `express.static()`, and `express.raw()` / `express.text()`. No `npm install` needed. |
| **`express.json()`** | Parses requests with a `Content-Type: application/json` body and puts the result on `req.body`. Does nothing (just calls `next()`) for other content types. |
| **`express.urlencoded()`** | Parses HTML form bodies (`application/x-www-form-urlencoded`) into `req.body`. The `{ extended: true }` option allows rich objects/arrays via the `qs` library; `false` uses the simpler `querystring` parser. |
| **`express.static()`** | Serves files from a folder on disk. A request for `/hello.txt` is answered from that folder with no route handler involved. |
| **Error-handling middleware** | A middleware with FOUR arguments: `(err, req, res, next)`. Express only treats a function as an error handler if it has exactly four parameters, and only runs it when `next(err)` is called or a handler throws. Intro only — full detail in Topic 08. |
| **Mount path** | The first argument to `app.use('/api', ...)`: the middleware only runs for requests whose path starts with `/api`. Without a mount path it runs for all requests. |

---

## 3. Detailed Explanations

### 3.1 What middleware actually is

A middleware function is an ordinary JavaScript function with three parameters:

```js
function logger(req, res, next) {
  console.log(req.method, req.url);
  next(); // hand the request to whatever comes next
}
```

That is all there is to it. Express does not have a special "middleware class" — any function with that shape can be middleware. A route handler is the same shape minus `next` (or with it, if it wants to pass on). In fact, **a route handler is just the last middleware in the chain** — the one that usually sends the response instead of calling `next()`.

### 3.2 `next()` — the handoff

`next()` is the whole control flow of Express. Three cases:

- **`next()`** — "I am done, continue to the next matching function in the stack." The request keeps walking down the list.
- **`next(err)`** — "Something failed." Express skips every remaining normal middleware and route and jumps to the first error-handling middleware (4 arguments). If there is none, Express's built-in final handler sends a 500.
- **Neither called, and no response sent** — the request hangs. The client waits until it times out. This is the most common beginner middleware bug: a function that does its work and then simply returns.

A middleware that sends a response (`res.send()`, `res.json()`, `res.status(401)...`) must NOT call `next()` afterwards — the response is already finished, and calling `next()` would try to send a second response ("Cannot set headers after they are sent").

### 3.3 `app.use()` — registering middleware

```js
app.use(logger);                 // runs for every request
app.use('/api', logger);         // runs only for paths starting with /api
app.use(express.json());         // built-in: parse JSON bodies
```

`app.use()` adds the function to the middleware stack at the position where the line runs. That position is everything — see Section 3.5.

Note the difference between passing a **function** and passing the **result of calling a function**: `app.use(express.json())` — `express.json()` is called once at startup and returns a middleware function; that returned function is what gets registered. This is why built-in middleware looks like a function call with no arguments. The same pattern is used by third-party middleware (`cors()`, `helmet()`, `morgan('dev')`): a factory that returns the real middleware, often configured by its arguments.

### 3.4 Built-in middleware

Express 5 ships with four body parsers plus the static file server. You will use three of them constantly:

**`express.json()`** — reads the raw request body, parses it as JSON, and assigns the result to `req.body`. If the body is not valid JSON, it calls `next(err)` with a `SyntaxError` (a 400). If the request has no JSON content type, it does nothing and `req.body` stays `undefined`. Without it, `req.body` is always `undefined` in a POST route — the classic "why is req.body empty?" bug.

**`express.urlencoded({ extended: true })`** — the same idea for HTML form submissions (`Content-Type: application/x-www-form-urlencoded`, body like `name=Talha&course=backend`). `extended: true` uses the `qs` library so nested objects (`user[name]=Talha`) parse into real objects; `extended: false` uses Node's built-in `querystring` and only gives flat key-value pairs. For most apps, `true` is the right choice.

**`express.static(root)`** — serves files from a folder. `app.use(express.static('public'))` means `GET /hello.txt` reads `public/hello.txt` and sends it, with the correct content type, and no route handler is involved. If the file does not exist, `express.static` calls `next()` so later routes get a chance — it does not send a 404 itself. That is why it is usually registered early, before your routes: it either answers or gets out of the way.

**`express.raw()` / `express.text()`** — parse the body into a raw `Buffer` or a plain string. Rarely needed; know they exist.

### 3.5 Middleware order — why it matters

Express processes the stack strictly top to bottom, in the order functions were registered. A request stops at the **first** handler that sends a response, and any middleware registered **after** that handler never runs for that request. Concretely:

```js
app.get('/early', handler);        // (1) registered first
app.use(lateMiddleware);           // (2) registered second
app.get('/late', handler);         // (3) registered third
```

- `GET /early` → matches (1), the handler sends a response, done. `lateMiddleware` (2) never runs.
- `GET /late` → (1) does not match the path, so Express moves on; (2) runs; then (3) matches and responds.

This is not a quirk — it is the design. It is how you scope behaviour: auth middleware registered before your protected routes protects them; the same middleware registered after a public route leaves that route open. It is also how bugs happen: registering `express.json()` **after** your POST routes means `req.body` is `undefined` in every one of them, because the parser never got a chance to run before the handler. The rule is simple:

> **Register middleware before the routes that need it. Error-handling middleware goes last.**

### 3.6 Custom middleware — the two patterns you will write most

**Logger** — runs for everything, does its work, calls `next()`:

```js
function logger(req, res, next) {
  console.log(`${req.method} ${req.url}`);
  next();
}
app.use(logger);
```

**Auth check** — either calls `next()` or ends the request:

```js
function checkApiKey(req, res, next) {
  if (req.headers['x-api-key'] === 'secret123') return next();
  res.status(401).json({ error: 'Unauthorized' });
}
app.get('/protected', checkApiKey, handler); // route-level: only this route
```

A third common pattern is **attaching data to `req`** for later handlers: `req.user = ...; next();` — the next handler in the chain reads `req.user`. That is how real auth middleware passes the logged-in user to the route.

### 3.7 Application-level vs router-level vs route-level

These are the same idea at three scopes:

| Level | How you register it | Runs for |
|---|---|---|
| **Application-level** | `app.use(fn)` or `app.use('/api', fn)` | Every request (or every request under the mount path) |
| **Router-level** | `router.use(fn)` on an `express.Router()` | Every request that goes through that router |
| **Route-level** | `app.get('/path', fn, handler)` | Only that one route |

Application-level is for cross-cutting concerns (logging, body parsing, CORS). Router-level is for a group of related routes (all `/users` routes share an auth check). Route-level is for a single sensitive route. Use the narrowest scope that does the job — a global auth check that also guards your login route is a bug, not a feature.

### 3.8 Error-handling middleware — INTRO ONLY

An error-handling middleware has **four** parameters:

```js
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: err.message });
});
```

The four-parameter signature is how Express recognises it — a function with three parameters is never treated as an error handler, even if its first parameter is named `err`. It runs only when `next(err)` is called somewhere earlier, or when a route handler throws. And it must be registered **last**, after all routes, so that errors from anywhere in the stack can reach it. That is the whole story for now: **full detail — error classes, async errors, 404 handling, and multiple error handlers — is Topic 08 (Error Handling). Do not build your real error strategy from this section alone.**

### 3.9 What middleware can and cannot do

Middleware **can**: read and modify `req` (headers, `req.body`, add custom properties like `req.user`); read and modify `res` (set headers, set status); end the response; call `next()` or `next(err)`; run asynchronously (do a database lookup, then call `next()` inside the callback — just remember Express does not wait for a returned promise in Express 5's normal middleware unless you handle rejections yourself).

Middleware **cannot**: see the response body of a later handler (it runs before the handler); run after a response has been sent for that request; or change the order of the stack at request time — the stack is fixed at startup, in registration order.

---

## 4. How the Technology Works Internally

### 4.1 The middleware stack is a list, not magic

When your app starts, every `app.use()`, `app.get()`, `app.post()` call appends an entry — called a **layer** — to an internal list on the app (in Express this list lives on the router). Each layer records:

- a **path pattern** it matches (a mount path, or a route path, or "everything" for `app.use(fn)` with no path),
- the **HTTP method** it cares about (for routes; `app.use` layers accept any method),
- the **function** to run.

There is no separate "middleware system" and "routing system" — routes and middleware are the same list. That is why order matters and why a route handler is just the last middleware.

### 4.2 What happens when a request arrives

1. Node's HTTP server receives the request and hands it to Express.
2. Express creates the `req` and `res` objects (wrapping Node's raw `IncomingMessage` / `ServerResponse` with helpers like `req.params`, `res.json()`).
3. Express walks the layer list from the top, in order. For each layer it checks: does the request path match this layer's pattern, and does the method match? If not, skip it.
4. The first matching layer's function runs with `(req, res, next)`. What happens next depends on the function:
   - It calls `next()` → go back to step 3, continuing from the next layer.
   - It calls `next(err)` → skip all normal layers and jump to the first error-handling layer.
   - It sends a response → the request is done. Remaining layers never run.
   - It does neither → the request hangs until the client times out.
5. If the list runs out with no response sent, Express's built-in final handler sends a 404.

### 4.3 How `next()` knows where to go

`next` is a closure created per request. It holds an index into the layer list — the position of the layer currently running. Calling `next()` simply resumes the walk from the next index. That is why each request gets its own walk: two requests in flight at the same time each have their own index, and one request calling `next()` cannot affect the other. It also explains why calling `next()` twice from the same middleware is a bug — the walk resumes twice, and the second resume can try to send a second response.

### 4.4 How `express.json()` works inside

`express.json()` is a thin wrapper around the `body-parser` package. When it runs, it checks the `Content-Type` header: if it is not JSON, it calls `next()` immediately. If it is JSON, it reads the request stream chunk by chunk (the body arrives as a stream, not all at once), concatenates the chunks, runs `JSON.parse()`, assigns the result to `req.body`, and calls `next()`. If parsing fails, it calls `next(err)` with a `SyntaxError` — which is how a bad JSON body ends up at your error handler instead of crashing the app. `express.urlencoded()` works the same way, with a query-string parser instead of `JSON.parse()`. `express.static()` checks whether the requested path maps to a real file in its folder; if yes it streams the file back, if no it calls `next()`.

---

## 5. Architecture or Workflow

### 5.1 The request pipeline — the shape of every Express app

Every Express app is the same pipeline, and learning to read it is learning to read Express:

```
Client request
    │
    ▼
┌──────────────────────────────┐
│  Application-level middleware │  app.use(logger) — runs for everything
│  (logging, body parsing,      │  app.use(express.json())
│   CORS, static files)         │  app.use(express.static('public'))
└──────────────┬───────────────┘
               │ next()
               ▼
┌──────────────────────────────┐
│  Router-level middleware      │  router.use(checkAuth) — runs for one
│  (auth for a group of routes) │  group of routes, e.g. /users
└──────────────┬───────────────┘
               │ next()
               ▼
┌──────────────────────────────┐
│  Route-level middleware       │  app.get('/admin', requireAdmin, ...)
│  (checks for one route)       │
└──────────────┬───────────────┘
               │ next()
               ▼
┌──────────────────────────────┐
│  Route handler                │  sends the response — the end of the
│  (the actual work)            │  normal chain
└──────────────┬───────────────┘
               │ next(err) or a throw — jumps here from ANY stage
               ▼
┌──────────────────────────────┐
│  Error-handling middleware    │  (err, req, res, next) — registered LAST
│  (4 arguments, at the end)    │
└──────────────────────────────┘
```

### 5.2 The order checklist — read your `app.js` top to bottom

When you open an Express app, read the registrations in order and ask, for each one, "which requests reach this line?"

1. **Logging / request-id first** — it should see every request, including ones that later fail.
2. **Body parsers next** (`express.json()`, `express.urlencoded()`) — before any route that reads `req.body`.
3. **Static files** — early, so file requests never reach your routes; remember it calls `next()` when the file is missing.
4. **Public routes** (login, signup, health check) — before any global auth middleware.
5. **Auth middleware** — after the public routes, before the protected routes.
6. **Protected routes** — the bulk of the app.
7. **404 handler** — a middleware at the end that sends a 404 for anything unmatched.
8. **Error handler (4 args)** — absolutely last, so errors from every stage above can reach it.

If something "does not run", the answer is almost always in this list: it was registered after the route that answered, or before the data it needed was attached to `req`.

---

## 6. Real-World Examples

- **Logging (every production app):** `morgan('combined')` or a custom logger as the first `app.use()` records every request — method, URL, status, time taken. Without it you are blind in production.
- **Body parsing (every API):** `express.json()` on every JSON API; `express.urlencoded()` on every server-rendered form. No API works without one of them.
- **Authentication (every protected app):** a middleware reads the `Authorization` header, verifies the JWT, attaches `req.user`, and calls `next()` — or sends 401. Every protected route reuses it instead of repeating the check.
- **Static files (every app with a frontend):** `express.static('public')` serves the built React/Vite frontend, images, and CSS. One line replaces a whole file server.
- **CORS (every API called from a browser):** the `cors()` middleware sets the `Access-Control-Allow-Origin` headers before your routes run, so browsers allow the cross-origin call.
- **Rate limiting (public APIs):** `express-rate-limit` counts requests per IP in a middleware and sends 429 when the limit is hit — the route handler never sees abusive traffic.
- **File uploads:** `multer` is middleware that parses `multipart/form-data`, saves the file, and puts its info on `req.file` before your handler runs.
- **Request validation:** a middleware checks `req.body` against a schema (Joi/Zod) and sends a 400 before the handler touches bad data. (Validation itself is Topic 09.)

The pattern is always the same: a cross-cutting concern, written once as middleware, applied to exactly the routes that need it by where it is registered.

---

## 7. Code Examples Where Applicable

The full runnable example is [`examples/middleware.js`](./examples/middleware.js); expected output is in [`examples/example.txt`](./examples/example.txt). The key pieces:

### 7.1 Logger — application-level, runs for everything

```js
function logger(req, res, next) {
  console.log(`[logger] ${req.method} ${req.url}`);
  next();
}
app.use(logger);
```

### 7.2 Auth check — route-level, ends the request or passes it on

```js
function checkApiKey(req, res, next) {
  if (req.headers['x-api-key'] === 'secret123') {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized: valid x-api-key header required' });
}
app.get('/protected', checkApiKey, (req, res) => {
  res.json({ message: 'Welcome, authenticated user!' });
});
```

### 7.3 Built-ins — JSON, form bodies, static files

```js
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
// GET /hello.txt now serves examples/public/hello.txt — no route needed.
```

### 7.4 Order demo — a middleware after a route never runs for it

```js
app.get('/early', (req, res) => res.send('early route'));
app.use((req, res, next) => {
  console.log('[late] I run only for routes registered after me');
  next();
});
app.get('/late', (req, res) => res.send('late route'));
```

`GET /early` never prints `[late]`; `GET /late` does. Check the output in `example.txt` to see it.

### 7.5 Error handler — 4 arguments, registered last (intro only)

```js
app.get('/boom', (req, res, next) => next(new Error('Boom! Something went wrong.')));
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});
```

### 7.6 Self-testing server — ephemeral port, fetch, shut down

```js
const server = app.listen(0, async () => {
  const port = server.address().port; // OS picks a free port
  const res = await fetch(`http://127.0.0.1:${port}/`);
  console.log(await res.text());
  server.close(() => process.exit(0));
});
```

---

## 8. Step-by-Step Code Explanations

### 8.1 `examples/middleware.js` — walking through the file

1. **Setup** — `require('express')` and `require('node:path')`; `const app = express()`. Nothing runs yet — this only builds the app.
2. **`logger` + `app.use(logger)`** — registered first, so it sees every request. It logs `GET /` etc. and calls `next()`. If it forgot `next()`, every request in the demo would hang.
3. **`app.use(express.json())` and `app.use(express.urlencoded({ extended: true }))`** — body parsers, registered before the POST routes that need `req.body`. They do nothing for GET requests and pass on.
4. **`app.use(express.static(...))`** — registered before the routes. `GET /hello.txt` is answered here from `public/hello.txt`; any other path falls through to the routes.
5. **`checkApiKey`** — defined, then used route-level on `/protected` only. Without the header it sends 401 and the handler never runs; with `x-api-key: secret123` it calls `next()` and the handler replies.
6. **Routes `/`, `/early`, `/protected`, `/echo`, `/form`, `/boom`** — registered in order. `/echo` proves `express.json()` worked (`req.body` echoed back); `/form` proves `express.urlencoded()` worked.
7. **The "late" middleware** — registered after `/early` and `/protected`. The self-test output proves it: `[late]` appears only before the `/late` response, never before `/early`.
8. **Route `/late`** — registered after the late middleware, so the middleware runs for it.
9. **Error handler (4 args)** — registered last. `/boom` calls `next(new Error(...))`, Express skips the remaining normal layers and lands here; it logs and sends a 500 JSON response.
10. **Self-test** — `app.listen(0, ...)` picks a free port, `fetch` calls each route in order, each response is printed as `METHOD path -> status body`, then `server.close()` and `process.exit(0)` shut the process down cleanly.

### 8.2 Reading the output (`examples/example.txt`)

- Every request prints a `[logger]` line first — the logger is registered first and runs for everything.
- `[late]` appears exactly once, before `GET /late` — proof that middleware after a route does not run for that route.
- `/protected` without the key returns 401 with an `[auth]` log line; with the key it returns 200.
- `/echo` and `/form` return the bodies that were sent — proof the parsers ran before the handlers.
- `/boom` prints `[error]` and returns 500 — proof the 4-argument handler caught `next(err)`.
- The last line is `[server] closed, exiting` — the server terminated itself; the process does not keep running.

---

## 9. Common Misconceptions

| Misconception | Reality |
|---|---|
| "Middleware runs for every request, always." | Only if it is registered before the route that answers, and only if its path/method matches. Middleware after a responding route never runs for that request. |
| "Forgetting `next()` is fine — Express moves on." | No. The request hangs until the client times out. Every middleware must either call `next()` / `next(err)` or send a response. |
| "I can call `next()` after `res.send()` to be safe." | No — the response is already finished. A later handler trying to send again throws "Cannot set headers after they are sent". Send OR pass on, never both. |
| "`express.json()` is optional — `req.body` just works." | No. Without a body parser, `req.body` is `undefined`. "Why is req.body empty?" is almost always a missing `express.json()` — or one registered after the route. |
| "An error handler is any middleware whose first parameter is named `err`." | No — Express checks the function's **arity** (number of declared parameters). Only exactly 4 parameters make it an error handler. `(err, req, res)` with three parameters is a normal middleware that Express will call with `(req, res, next)` — and `err` will actually be `req`. |
| "`app.use()` and `app.get()` are different systems." | They are the same stack. Routes are layers in the same ordered list as middleware; that is why order matters for both. |
| "Middleware runs in the order the requests arrive." | No — in the order the middleware was **registered** in your code. Request arrival order does not change the stack. |
| "Error-handling middleware can go anywhere." | It must go last (after all routes and other middleware), or errors raised before it is registered can never reach it. |
| "`express.static()` sends a 404 for missing files." | No — it calls `next()` when the file is missing, so a later route or your 404 handler gets the chance to answer. |
| "Third-party middleware like `cors()` is different from mine." | Same mechanism. `cors()` is a factory that returns a `(req, res, next)` function; `app.use(cors())` registers that returned function. |

---

## 10. Important Technical Terminology

| Term | Meaning |
|---|---|
| **Middleware** | A `(req, res, next)` function that runs during request processing. |
| **`next()` / `next(err)`** | The handoff: continue to the next layer, or jump to the error handler. |
| **Middleware stack / layer** | The ordered list of registered middleware and routes; each entry is a layer. |
| **Mount path** | The path prefix in `app.use('/api', fn)` that limits when the middleware runs. |
| **Application-level middleware** | Registered on the app with `app.use()`; runs for all (or path-prefixed) requests. |
| **Router-level middleware** | Registered on an `express.Router()`; runs for requests through that router. |
| **Route-level middleware** | Passed as an argument to one route; runs only for that route. |
| **Built-in middleware** | Middleware shipped with Express: `express.json()`, `express.urlencoded()`, `express.static()`, `express.raw()`, `express.text()`. |
| **Body parser** | Middleware that reads the request body stream and puts the parsed result on `req.body`. |
| **Error-handling middleware** | A middleware with exactly four parameters `(err, req, res, next)`; runs only on errors. |
| **Arity** | The number of parameters a function declares. Express uses arity (4) to recognise error handlers. |
| **Chaining** | Passing several middleware to one route: `app.get(path, mw1, mw2, handler)` — they run left to right, each calling `next()`. |
| **Short-circuit** | A middleware ending the response (e.g. 401) so later layers never run. |

---

## 11. Summary

- Middleware is a `(req, res, next)` function that runs between the request arriving and the route handler answering. It can inspect or change `req`/`res`, end the response, or call `next()` to pass the request on.
- `next()` continues to the next layer; `next(err)` jumps to the error handler; calling neither (and sending nothing) hangs the request.
- `app.use()` registers application-level middleware. `router.use()` is router-level; passing middleware as route arguments is route-level. Use the narrowest scope that does the job.
- Built-in middleware covers the everyday needs: `express.json()` for JSON bodies, `express.urlencoded()` for form bodies, `express.static()` for files. Without a body parser, `req.body` is `undefined`.
- **Order is the whole game.** Express walks one ordered stack, top to bottom. Middleware registered after a route that answers never runs for that route; body parsers must come before the routes that read `req.body`; the error handler must come last.
- Error-handling middleware has exactly four arguments `(err, req, res, next)` — Express recognises it by that arity — and only runs when `next(err)` is called or a handler throws. Full detail is Topic 08.
- Custom middleware is how real apps do logging, auth, CORS, rate limiting, and validation: write the logic once, register it where it belongs, and every matching request gets it for free.

---

## 12. Interview Questions and Answers

### Q1. What is middleware in Express?

**Answer:** A middleware is a function with the signature `(req, res, next)` that runs during request processing, between the request arriving and the route handler answering. It can read or modify `req` and `res`, end the response itself (for example, send a 401), or call `next()` to pass the request to the next function in the stack. Logging, body parsing, authentication, and static-file serving are all implemented as middleware.

### Q2. What does `next()` do, and what happens if you forget to call it?

**Answer:** `next()` hands the request to the next matching middleware or route handler in the stack. `next(err)` skips all normal middleware and jumps to the error-handling middleware. If a middleware neither calls `next()` nor sends a response, the request hangs — the client waits until it times out, because Express has no way to know the middleware is finished.

### Q3. What is the difference between `app.use()` and `app.get()`?

**Answer:** `app.use()` registers middleware that runs for any HTTP method whose path starts with the given mount path (or all requests with no path). `app.get()` registers a route handler that runs only for GET requests to that exact path. Under the hood they add layers to the same ordered stack — which is why registration order matters for both.

### Q4. Why does the order of middleware matter? Give an example.

**Answer:** Express walks its stack top to bottom in registration order, and a request stops at the first handler that sends a response. So a middleware registered after a route never runs for that route — for example, if you register `app.get('/early', handler)` before `app.use(logger)`, `GET /early` never gets logged. The same rule bites with body parsers: `express.json()` registered after your POST routes leaves `req.body` undefined in all of them. Rule of thumb: register middleware before the routes that need it, error handler last.

### Q5. What is the difference between application-level, router-level, and route-level middleware?

**Answer:** Application-level middleware is bound to the app with `app.use()` and runs for every request (or every request under a mount path) — used for logging and body parsing. Router-level middleware is bound to an `express.Router()` with `router.use()` and runs only for requests going through that router — used for a group of related routes, like all `/users` routes sharing an auth check. Route-level middleware is passed as an argument to a single route, e.g. `app.get('/admin', requireAdmin, handler)`, and runs only for that route. They differ only in scope.

### Q6. What does `express.json()` do, and why is `req.body` sometimes `undefined`?

**Answer:** `express.json()` reads the request body stream, parses it as JSON, and assigns the result to `req.body` — but only for requests with a JSON content type. `req.body` is `undefined` when no body parser is registered at all, when the parser is registered after the route that reads the body, or when the client sent a different content type (for example, a form body needs `express.urlencoded()` instead).

### Q7. How does `express.static()` work?

**Answer:** `express.static('public')` serves files from the `public` folder: a request for `/hello.txt` is answered from `public/hello.txt` with the correct content type, without any route handler running. If the file does not exist, it does not send a 404 — it calls `next()` so later routes or your own 404 handler can answer.

### Q8. How do you recognise an error-handling middleware, and where must it be registered?

**Answer:** By its signature: it has exactly four parameters, `(err, req, res, next)`. Express checks the function's arity — three parameters is a normal middleware, four is an error handler. It only runs when `next(err)` is called or a route handler throws, and it must be registered last, after all routes and other middleware, so errors from anywhere in the app can reach it. Full detail is Topic 08 (Error Handling).

### Q9. How would you write middleware that only allows logged-in users?

**Answer:** Write a function that checks the request for credentials — for example, verify a JWT from the `Authorization` header — and if valid, attach the user to the request (`req.user = decoded`) and call `next()`; if invalid or missing, send a 401 and do not call `next()`. Then register it where it belongs: `app.use(checkAuth)` after the public routes (login, signup) if it protects the whole app, or `router.use(checkAuth)` / route-level if it protects only some routes.

### Q10. Can middleware be async? What should you watch out for?

**Answer:** Yes — a middleware can do async work (a database lookup, a token verification) and call `next()` inside the callback or after an `await`. The danger is an unhandled rejection: if an async middleware throws or a promise rejects and nothing catches it, the request hangs (or the process crashes), because Express does not automatically catch rejected promises from middleware the way it catches synchronous throws. So always wrap async work in try/catch and forward failures with `next(err)`.

---

## 13. References

- Express.js official guide — "Using middleware": https://expressjs.com/en/guide/using-middleware.html
- Express.js official guide — "Writing middleware for use in Express apps": https://expressjs.com/en/guide/writing-middleware.html
- Express.js API reference — `express.json()`, `express.urlencoded()`, `express.static()`, `app.use()`: https://expressjs.com/en/5x/api.html
- Express.js official guide — "Error handling" (intro here; full detail in Topic 08): https://expressjs.com/en/guide/error-handling.html
- MDN — HTTP request methods and headers (background for `req.method`, `req.headers`): https://developer.mozilla.org/en-US/docs/Web/HTTP
- Node.js documentation — HTTP module (what Express wraps): https://nodejs.org/api/http.html

---

## Files in This Folder

- [README.md](./README.md) — short overview, objectives, and how to run the example
- [notes.md](./notes.md) — this file
- [examples/middleware.js](./examples/middleware.js) — runnable demo: logger, auth check, built-ins, order demo, error handler
- [examples/public/hello.txt](./examples/public/hello.txt) — static file served by `express.static()`
- [examples/example.txt](./examples/example.txt) — real output of running the demo
- [exercises.md](./exercises.md) — 5 practice tasks (no solutions) + interview-style questions

[← Main README](../../README.md) · Previous: [05 — Request and Response](../05-request-response/README.md) · Next: 07 — Controllers (coming next)

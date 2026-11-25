# 01 — Introduction to Express.js — Notes

> **Module:** 02 — Express.js
> **Topic:** 01 — Introduction to Express.js
> **Priority:** ⭐ Start here
> **Previous topic:** [Module 01 — Node.js Fundamentals](../../01-nodejs-fundamentals/README.md)
> **Next topic:** [02 — Project Setup](../02-project-setup/README.md)
>
> **One-line summary:** Express.js is a minimal, unopinionated web framework for Node.js — a thin layer on top of the built-in `http` module that adds routing, middleware, and helpful request/response methods, and deliberately leaves everything else (database, templating, auth) up to you.
>
> **How to use these notes:** read [README.md](./README.md) first for the short overview, then work through this file section by section. Run the example in [`examples/hello-express.js`](./examples/hello-express.js) and compare your output with [`examples/example.txt`](./examples/example.txt). Then do the tasks in [`exercises.md`](./exercises.md).

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

Module 01 taught you Node.js itself: the event loop, modules, and the built-in `http` module that can already answer web requests. So a fair question is — if Node.js can already serve HTTP, why does almost every Node.js backend use a framework, and why is that framework usually Express?

The short answer: **raw `http` gives you the pieces, Express gives you the pattern.** With raw `http`, every request arrives as the same event, and you do all the work yourself: read `req.url`, split it into parts, write an `if`/`else` chain to decide which code should answer, set the status code and `Content-Type` header by hand, and remember to call `res.end()`. That works for one route. It collapses at ten routes, and it is unmaintainable at fifty.

Express solves exactly that problem — and almost nothing else. It adds three things on top of `http`:

1. **Routing** — "a `GET` request to `/users/42` runs this function, and `42` is available as `req.params.id`."
2. **Middleware** — a pipeline of small functions a request passes through (logging, JSON parsing, auth) before it reaches its handler.
3. **`req`/`res` helpers** — `res.json()`, `res.send()`, `res.status()`, `req.query`, `req.body`, so you stop setting headers by hand.

Everything else — which database, which templating engine, how your folders are organised, how you validate input — Express leaves to you. That deliberate thinness is the whole point, and it is why Express became the default starting point for Node.js backends: it is small enough to learn in an afternoon and flexible enough to grow into a large API.

**A short history, so the versions make sense:**

- **2010 — Express is born.** TJ Holowaychuk creates Express, inspired by Ruby's Sinatra framework: a tiny layer that maps HTTP methods and paths to functions. Node.js is barely a year old, and Express quickly becomes its standard web framework.
- **2014 — Express 4.** A big cleanup: the bundled middleware (body parsing, sessions, logging) is removed from Express core and moved to separate packages. Express becomes even more minimal — and `express.json()` returns later as a thin wrapper. Express 4 rules the Node.js world for a decade.
- **2024 — Express 5.** After years in beta, Express 5.0 is released (December 2024). It requires Node.js 18+, forwards errors from `async` handlers automatically, and changes route-wildcard syntax (it now uses path-to-regexp v8). This topic uses Express 5.3.0, and section 3.7 lists exactly what changed from Express 4.
- **Today — Express is the baseline.** Newer frameworks (Fastify, Koa, Hono, NestJS) exist and are worth knowing, but Express is still the one most job descriptions, tutorials, and existing codebases assume. Learn it first; the others become easy afterwards.

**Simple way to remember it:**

> **Node.js `http` is the engine. Express is the steering wheel, pedals, and dashboard bolted onto it. It does not change how the engine works — it just lets you drive without reaching into the engine bay.**

---

## 2. Definition of Important Concepts

| Concept | Definition |
|---|---|
| **Express.js (Express)** | A minimal, unopinionated web framework for Node.js. It adds routing, middleware, and `req`/`res` helpers on top of the built-in `http` module. It is not a full platform — it is one layer. |
| **Web framework** | A library that organises how a server handles HTTP requests: which code runs for which URL, what runs before/after it, and how responses are built. Frameworks range from minimal (Express) to opinionated (NestJS). |
| **Minimal framework** | A framework that does one small job and stays out of the way. Express is the classic example: routing + middleware + helpers, and nothing else. You pick every other piece yourself. |
| **Opinionated framework** | A framework that makes most decisions for you: folder structure, database layer, validation, auth, testing. You move faster inside its rules and slower outside them. NestJS (and Ruby on Rails, Django) are opinionated. |
| **Routing** | The job of deciding which handler function answers a request, based on its HTTP method (`GET`, `POST`, ...) and its path (`/users`, `/users/42`). A route is one method + one path pattern + one handler. |
| **Route handler** | The function that runs when a route matches. It receives `(req, res)` (and optionally `next`) and is responsible for sending exactly one response. |
| **Route parameter** | A named segment of a route path, written with a colon: `/hello/:name`. When a request matches, Express puts the actual value in `req.params` — so `/hello/Talha` gives `req.params.name === 'Talha'`. |
| **Middleware** | A function that runs in the middle of request handling — between the request arriving and the route handler running (or between two handlers). It receives `(req, res, next)` and either passes control on with `next()` or ends the response itself. Logging, JSON parsing, and auth checks are all middleware. |
| **Middleware pipeline / stack** | The ordered list of middleware functions and routes a request walks through, in the order they were registered, until one of them sends a response. Order matters: registration order is execution order. |
| **`req` (request object)** | Express's extended version of Node.js's `http.IncomingMessage`. It adds `req.params`, `req.query`, `req.body`, `req.headers`, `req.method`, `req.path`, and more. |
| **`res` (response object)** | Express's extended version of Node.js's `http.ServerResponse`. It adds `res.send()`, `res.json()`, `res.status()`, `res.redirect()`, `res.sendFile()`, and more. |
| **`res.json()`** | Sends a JSON response: it stringifies the value, sets `Content-Type: application/json`, and sends the status code (200 unless you chained `res.status(...)` first). The standard way an API answers. |
| **`res.send()`** | Sends a response of any type: a string becomes `text/html`, an object/array becomes JSON, a `Buffer` is sent as-is. It also sets `Content-Length` and an `ETag` for you. |
| **Static files** | Files served as-is from disk (HTML, CSS, images, JavaScript) without running any handler code. Express serves them with `express.static('public')` — a built-in middleware. |
| **Template engine (view engine)** | A library that turns a template file plus data into HTML (EJS, Pug, Handlebars). Express supports them through `app.set('view engine', ...)` but ships with **none** built in — you install and choose one. |
| **ORM / ODM** | A library that maps database rows/documents to JavaScript objects (Prisma, Sequelize, Mongoose). Express has **no** ORM built in — you add one yourself, or use the database driver directly. |
| **REST API** | An API built around HTTP methods and resource URLs (`GET /users`, `POST /users`, `GET /users/42`) with JSON bodies. The most common thing Express apps are built for — and the focus of this module from topic 10 onwards. |
| **Error-handling middleware** | A middleware function with four arguments `(err, req, res, next)`. Express calls it when any earlier handler passes an error to `next(err)` (or, in Express 5, when an `async` handler rejects). Covered in detail in topic 08. |
| **Body parsing** | Reading the request body (usually JSON) and turning it into a JavaScript value on `req.body`. Express ships `express.json()` and `express.urlencoded()` for this — but not multipart/form-data (file uploads), which needs a package like `multer`. |

---
## 3. Detailed Explanations

### 3.1 The pain of raw `http` — why Express exists

Here is a small server using only Node.js's built-in `http` module. It has two routes and it is already awkward:

```js
const http = require('node:http');

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello from Node!');
  } else if (req.method === 'GET' && req.url.startsWith('/hello/')) {
    const name = req.url.split('/')[2]; // hand-rolled "routing"
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`Hello, ${name}!`);
  } else if (req.method === 'GET' && req.url === '/json') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Hello!' }));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(3000);
```

Count what you are doing by hand: matching method + URL with `if`/`else`, splitting the URL string to extract a value, choosing the `Content-Type` header for every response, remembering `writeHead` before `end`, and writing the 404 case yourself. Now imagine 30 routes, a JSON body to parse, and an auth check on half the routes — the `if`/`else` chain becomes the whole program, and the actual logic drowns in plumbing.

Express exists to delete the plumbing. The same server in Express is three lines — one `app.get()` per route — and the full version is in section 7.1: no `if`/`else`, no manual URL splitting (`:name` does it), no hand-set headers (`res.send` and `res.json` do it), no hand-written 404. The behaviour is identical — same HTTP, same TCP, same Node.js underneath — but the code says what it *means* instead of how the plumbing works.

**The rule of thumb:** if your server has more than two or three routes, or needs JSON bodies, logging, or auth, raw `http` is the wrong tool. Express is the point where the plumbing stops being worth writing by hand.

### 3.2 Where Express fits in the stack

Picture the stack as layers, each one standing on the one below it:

```text
┌─────────────────────────────────────────────┐
│  Your code: routes, handlers, business logic │
├─────────────────────────────────────────────┤
│  Express: routing, middleware, req/res      │
│  helpers, static files, error handling      │
├─────────────────────────────────────────────┤
│  Node.js http module: createServer,         │
│  IncomingMessage, ServerResponse            │
├─────────────────────────────────────────────┤
│  Node.js runtime: event loop, libuv, V8     │
└─────────────────────────────────────────────┘
```

Three things to notice:

- **Express does not replace `http` — it calls it.** `app.listen(3000)` is a shortcut for `http.createServer(app).listen(3000)`. The `app` object *is* a request handler function with the same `(req, res)` signature `http.createServer` expects. Everything Express does ultimately ends in `res.writeHead` / `res.end` — it just does it for you. And it does not touch the event loop or V8: it is ordinary JavaScript on the same runtime from Module 01, so a slow synchronous handler still blocks every other request.
- **Above Express, everything is your choice.** Database (PostgreSQL in this journey — Module 03), validation, auth, templating, folder structure: Express has no opinion, so each layer above it is a separate decision, and a separate package. That is why the module is organised the way it is: Express first, then the pieces you bolt onto it.

### 3.3 Minimal vs opinionated — what "unopinionated" actually costs and buys

Frameworks sit on a spectrum:

| | Minimal (Express, Koa, Fastify) | Opinionated (NestJS, Rails, Django) |
|---|---|---|
| **Decides for you** | Almost nothing | Folder structure, DB layer, validation, auth patterns, testing setup |
| **Learning curve** | An afternoon to be productive | Days to weeks before you are fluent |
| **Flexibility** | Total — swap any piece | Low — fighting the framework is painful |
| **Best for** | APIs, small-to-medium apps, learning, prototypes | Large teams, long-lived enterprise apps, strict consistency |
| **Risk** | Every project organises itself differently; beginners must learn *which* pieces to add | You inherit decisions you may not want; the framework is a big dependency to learn |

Express chose the minimal end on purpose, and the cost is real: **Express will not tell you how to structure your app.** Two Express projects can look completely different — one with all routes in `app.js`, another split into routers, controllers, and services (which is where this module is heading: topics 03 and 07 exist because Express leaves the structure to you). The upside is that nothing is hidden: when something breaks, the code that breaks is yours, and Express's source is small enough to read.

### 3.4 What Express gives you

Concretely, these are the pieces Express adds on top of `http` — and they are the only pieces it adds:

- **Routing by method + path.** `app.get()`, `app.post()`, `app.put()`, `app.patch()`, `app.delete()`, and `app.all()` match the HTTP method and the path pattern. A request that matches no route gets a 404 automatically.
- **Route parameters and query strings, parsed for you.** `:id` in a path becomes `req.params.id`; `?search=phone&page=2` becomes `req.query.search` and `req.query.page`. No string splitting.
- **Middleware.** `app.use()` registers functions that run before (or between) route handlers: logging, JSON parsing, auth, static files. Middleware is the mechanism every later topic in this module builds on.
- **`req`/`res` helpers.** `res.send()`, `res.json()`, `res.status()`, `res.redirect()`, `res.sendFile()`, `req.body`, `req.params`, `req.query`. Each one replaces three or four lines of raw `http` code.
- **Routers.** `express.Router()` lets you split routes into separate files and mount them under a path prefix (`app.use('/users', usersRouter)`). This is how a real app stays organised — topic 03.
- **Static file serving.** `express.static('public')` serves files from a folder, with correct `Content-Type` headers, caching headers, and range requests handled for you.
- **Error handling.** A single error-handling middleware at the end of the stack can catch errors from every route — topic 08.

### 3.5 What Express does NOT do

This list matters as much as the previous one, because beginners regularly assume Express does things it has never done:

- **No database, no ORM.** Express does not connect to PostgreSQL, MySQL, or MongoDB, and it has no query builder. You add `pg`, Prisma, or another library yourself (Module 03).
- **No templating engine built in.** Express can *use* EJS, Pug, or Handlebars, but you install and choose one. If you only build JSON APIs — as this journey does — you may never need one at all.
- **No authentication or authorisation.** No login, no sessions, no JWT helpers in core. Auth is middleware and libraries you add (Module 02, topic 04).
- **No input validation.** Express will happily accept any JSON body you send it. Validating that body — "email is required, age must be a number" — is your code or a library like Zod (topic 09).
- **No file-upload handling.** `express.json()` parses JSON and `express.urlencoded()` parses form bodies, but multipart/form-data (file uploads) needs a package like `multer`.
- **No WebSockets.** Express is HTTP only. Real-time features need `ws` or Socket.io alongside it.
- **No project structure, no CLI, no code generator.** There is no `express new my-app` that scaffolds a blessed layout (the old `express-generator` exists but is not part of Express and is rarely used today). You create the folders; this module's topics show you one good layout.

**The mental model:** Express is a *library for handling HTTP requests well*, not a *platform for building apps*. Everything outside HTTP request handling is someone else's job — usually yours, with one focused package per concern.

### 3.6 When to use Express — vs raw Node vs a bigger framework

| Situation | Right choice | Why |
|---|---|---|
| One endpoint, a webhook receiver, a quick experiment | Raw `http` | Less to install, nothing to learn, and the plumbing is trivial at this size |
| A REST API, a small-to-medium web app, a learning project | **Express** | Routing + middleware remove the plumbing; huge ecosystem; every problem has a documented answer |
| A large team app that must stay consistent for years | NestJS (or similar) | Enforced structure, dependency injection, and TypeScript-first design pay off at scale |
| Extreme throughput / very low latency as the top priority | Fastify | Faster JSON handling and validation built in — but a smaller ecosystem than Express |
| Server-rendered pages as the whole product | Express + a view engine, or a full-stack framework | Express can serve pages, but a framework like Next.js does far more for that job |

Two honest notes. First, **Express is not the fastest framework** — Fastify benchmarks higher, mostly on JSON serialisation. For most real apps the difference does not matter: your database queries will be slower than either framework by orders of magnitude. Second, **"everyone uses Express" is itself a feature**: when you are stuck at 11 pm, the answer already exists — a Stack Overflow thread, a middleware package, a tutorial. Ecosystem size is a real engineering consideration, not just popularity.

### 3.7 Express 5.x — what changed from Express 4

This topic uses **Express 5.3.0** (verified: installed at `/tmp/express-verify/node_modules`, requires Node.js `>= 18`). Express 5 was a long time coming — 5.0.0 landed in December 2024 after years in beta — and it is mostly a cleanup, not a rewrite. Your Express 4 knowledge transfers almost entirely. The changes that matter for a beginner:

- **Node.js 18+ required.** Express 5 drops older Node.js versions. (You are on Node.js v24, so this is already satisfied.)
- **Async errors are forwarded automatically.** In Express 4, if an `async` route handler threw or a promise rejected, the error was *not* caught — the request hung, unless you wrapped every handler or called `next(err)` yourself. In Express 5, a rejected promise in a handler goes straight to your error-handling middleware. This removes the most common Express 4 boilerplate (the `asyncHandler` wrapper) — and the most common Express 4 production bug.
- **Wildcard routes changed syntax.** Express 5 uses path-to-regexp v8 (verified: 8.4.2 in this install). The old `app.get('*', ...)` and `app.get('/files/*', ...)` no longer work — wildcards must now be *named*: `app.get('/files/*splat', ...)` gives you `req.params.splat` as an array. Similarly, optional parameters changed: the old `/users/:id?` syntax is gone; write `{/:id}` instead. If you copy an Express 4 wildcard from a tutorial and it throws, this is why.
- **Removed, deprecated things are gone.** `req.param(name)` (deprecated since 4.x) is removed — use `req.params`, `req.query`, or `req.body` explicitly. `app.router` is removed. `res.sendfile` (lowercase f) is gone — it is `res.sendFile`.
- **Everything else is the same.** `app.get/post/use/listen`, `express.json()`, `express.static()`, `express.Router()`, `res.json()` / `res.send()` — all unchanged. Code written for Express 4 runs on Express 5 except for the wildcard and removal items above. When you read Express tutorials, check which version they target: anything about wildcards or wrapping async handlers is version-sensitive; everything else is safe.

---
## 4. How the Technology Works Internally

Express is not magic and not a separate server — it is a few hundred lines of ordinary JavaScript sitting between Node.js's `http` module and your handlers. Here is what happens, in order, when a request arrives:

### 4.1 `express()` builds an app that is also a function

```js
const app = express();
```

`express()` returns an object, `app`, that has methods like `app.get()` and `app.use()` — but under the hood `app` is also a *function* with the signature `(req, res, next)`. That is the trick that lets Express plug into `http`: `http.createServer` accepts any function with that signature, so Express hands itself over as the request listener. When you call `app.listen(3000)`, Express just does `http.createServer(app).listen(3000)` for you.

### 4.2 Routes and middleware become Layers in a stack

Every call to `app.get()`, `app.post()`, or `app.use()` adds one **Layer** to an internal stack (kept on the app's router). A Layer stores:

- **the path pattern** it matches (compiled to a regular expression by path-to-regexp — v8 in Express 5),
- **the HTTP method** it cares about (for routes; middleware registered with `app.use()` matches all methods),
- **the handler function** to run.

Registration order is the stack order. There is no sorting, no priority system: first registered, first checked. This is why middleware order is the single most common source of Express bugs — a logging middleware registered *after* your routes never sees any request, because a route already answered it.

### 4.3 One request walks the stack via `next()`

When a request arrives, Express starts at the top of the stack and checks each Layer in turn:

1. **Does the method match?** A `GET /users` request skips every `app.post(...)` layer.
2. **Does the path match?** The layer's compiled regex is tested against the request path. `/hello/:name` matches `/hello/Talha` and captures `Talha` into `req.params.name`; it does not match `/hello` or `/hello/a/b`.
3. **If both match, run the handler.** The handler receives `(req, res, next)` — where `req` and `res` are the plain Node.js objects with Express's extra methods mixed in (Express extends them rather than replacing them).
4. **The handler decides what happens next.** It either sends a response (`res.send()`, `res.json()`, ...) — which ends the walk — or calls `next()` to move to the next matching layer, or calls `next(err)` to jump straight to error handling.

If the walk reaches the end of the stack with no response sent, Express's built-in final handler sends a `404 Not Found`. That is why an Express app never needs a hand-written 404: unmatched is the default outcome, not a case you must remember.

### 4.4 `req` and `res` are extended, not replaced

Express does not create its own request/response classes. It takes Node.js's `http.IncomingMessage` and `http.ServerResponse` and adds methods to them (`res.json`, `res.send`, `res.status`, `req.query`, `req.params`). This matters for two reasons: everything you learned about `http` in Module 01 still applies inside Express handlers (you can still call `res.writeHead` if you really want to), and anything that works with a plain Node.js server — like handing `app` to `http.createServer` yourself — still works.

### 4.5 Errors travel through `next(err)` — and Express 5 catches async rejections

If a handler calls `next(err)` with an Error, Express skips all remaining normal layers and walks the stack looking for a layer whose handler takes **four** arguments — `(err, req, res, next)`. That is how Express recognises error-handling middleware: by the number of arguments. If no error handler matches, Express's default error handler sends a `500` response (with a stack trace only when `NODE_ENV` is not `production`).

The Express 5 change: an `async` handler that throws (or returns a rejected promise) now behaves exactly as if it had called `next(err)`. Express 5 wraps async handlers and forwards the rejection for you. In Express 4 that rejection was silently dropped and the request hung — the classic "my route works until the database throws, then the browser spins forever" bug. (Error handling gets its own full topic — topic 08.)

---

## 5. Architecture or Workflow

### 5.1 The request lifecycle — the one diagram to remember

```text
Client (browser / fetch / Postman)
        │  GET /hello/Talha
        ▼
┌──────────────────────────────────────────────────┐
│  Node.js http server (created by app.listen)     │
│  hands (req, res) to the Express app function    │
└──────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────┐
│  MIDDLEWARE STACK — runs in registration order   │
│                                                  │
│  1. express.json()      parse JSON body → req.body│
│  2. logger              print "GET /hello/Talha" │
│  3. auth (some routes)  check token, or 401      │
│        │ each calls next() to continue           │
│        ▼                                         │
│  ROUTES — first match wins                       │
│  4. app.get('/hello/:name') → handler runs       │
│        │ res.send(`Hello, ${req.params.name}!`) │
│        ▼                                         │
│  (if nothing matched: built-in 404)              │
│  (if next(err): error-handling middleware → 500) │
└──────────────────────────────────────────────────┘
        │
        ▼
Client receives: 200 OK, "Hello, Talha!"
```

The key idea: **a request is a walk down an ordered list.** Middleware runs first, in order; the first matching route handles it; anything unmatched falls through to a 404; any error jumps sideways to the error handler. If you can picture this walk, you can debug almost any Express problem by asking one question: *"Where in the walk did it stop, and why?"*

### 5.2 The shape of a growing Express app

One file works for this topic's three routes. It stops working at about ten. The shape this module grows toward — introduced properly in topics 03 (routers) and 07 (controllers) — is:

```text
src/
├── app.js              # creates the app, registers middleware + routers
├── server.js           # calls app.listen() — the entry point
├── routes/
│   └── users.routes.js # app.use('/users', ...) — routing only
├── controllers/
│   └── users.controller.js  # req/res handling only
├── services/
│   └── users.service.js     # business logic + database calls
└── middlewares/
    └── auth.js         # reusable middleware (auth, validation, logging)
```

Each layer has one job: routes map URLs to controllers, controllers translate HTTP to logic, services do the work, middleware guards the pipeline. Express does not enforce this layout — you adopt it because it keeps a growing app readable. The rest of this module fills it in, one topic at a time: setup (02), routing (03), middleware (05), JSON bodies (06), controllers (07), errors (08), validation (09), REST APIs (10).

---

## 6. Real-World Examples

- **REST APIs — the default Express job.** Almost every Express app in production is a JSON API: a React frontend or a mobile app sends `GET /api/products`, the Express server queries PostgreSQL and answers with `res.json(...)`. The whole backend of a startup — users, orders, payments — is often one Express app (or several small ones) doing exactly this. This journey builds that: Module 03 adds PostgreSQL behind these same routes.
- **The backend behind a single-page app.** A React/Vite app serves its static files with `express.static()` while `/api/*` routes answer JSON. One server, two jobs — pages and data — which is why `express.static` exists in the first place.
- **Microservices and BFFs (Backend For Frontend).** Larger systems split into small Express services — one for auth, one for orders, one for notifications — each a few hundred lines. A "backend for frontend" is a thin Express layer that reshapes other services' data into exactly what one frontend needs.
- **Webhooks receivers.** Stripe, GitHub, and WhatsApp send your server an HTTP `POST` when something happens (payment succeeded, code pushed). The receiver is often a tiny Express app: one route, verify the signature, do the work, answer `200`. Raw `http` would do — but Express's JSON parsing and routing make it a five-line job.
- **Prototypes and hackathon backends.** Because Express needs almost no setup — `npm install express`, five lines, running server — it is the standard choice when the goal is a working API *today*. Many production systems started as an Express prototype that never needed replacing.
- **What Express is NOT used for (alone).** High-throughput real-time systems (games, live trading) usually add WebSockets or a specialised server; heavy data processing moves to workers or other languages; and server-rendered consumer sites often use a full-stack framework. In each case Express may still be *part* of the system — just not the whole of it.

---
## 7. Code Examples Where Applicable

### 7.1 The same server twice — raw `http` vs Express

Section 3.1 already showed the raw-`http` version of this server (manual `if`/`else` routing, hand-set headers, hand-written 404). Here is the same behaviour in Express — the plumbing disappears, the intent remains:

```js
const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('Hello from Node!'));
app.get('/json', (req, res) => res.json({ message: 'Hello!' }));

app.listen(3000, () => console.log('Listening on port 3000'));
```

Both programs answer the same HTTP. The Express version is shorter because routing, header-setting, and the 404 are framework behaviour now, not your code.

### 7.2 The topic example — `examples/hello-express.js`

The runnable example for this topic (run it with `NODE_PATH=/tmp/express-verify/node_modules node examples/hello-express.js`) creates the app, registers the three routes, then listens on port `0` and tests itself with `fetch()`:

```js
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello from Express!');
});

app.get('/hello/:name', (req, res) => {
  res.send(`Hello, ${req.params.name}!`);
});

app.get('/json', (req, res) => {
  res.json({ message: 'Hello from Express!', framework: 'Express', version: 5 });
});

const server = app.listen(0, async () => {
  // ... calls its own three routes with fetch(), prints the
  // responses, then closes the server and exits — see the file.
});
```

Expected output is in [`examples/example.txt`](./examples/example.txt) — the port number will differ on your run, because port `0` means "pick any free port". Section 8 walks through the full file line by line.

### 7.3 A first taste of middleware — one function, every request

Middleware is the next topic's subject in full (topic 05), but one example now shows the shape. This logger runs before every route, because it is registered with `app.use()` before the routes:

```js
const express = require('express');
const app = express();

// Middleware: runs for EVERY request, then passes control on with next().
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => res.send('Hello from Express!'));

app.listen(3000);
```

A request to `/` prints `GET /` and then the route answers. Remove the `next()` call and the request hangs — the walk stops at the middleware and never reaches the route. That one line is the whole middleware contract.

### 7.4 Route parameters and query strings side by side

```js
app.get('/users/:id', (req, res) => {
  // /users/42          → req.params.id === '42'
  // /users/42?tab=posts → req.query.tab === 'posts'
  res.json({ id: req.params.id, tab: req.query.tab || 'profile' });
});
```

Rule: **parameters identify the resource** (`/users/42` — *which* user), **query strings modify the request** (`?tab=posts`, `?page=2` — *how* to show it). Route parameters are always strings — `req.params.id` is `'42'`, not `42` — so convert with `Number()` when you need a number.

---

## 8. Step-by-Step Code Explanations

This section walks through `examples/hello-express.js` line by line — the file you actually ran. (Section 7.1 is the comparison; 7.3 and 7.4 are previews of later topics.)

### 8.1 `const express = require('express');`

Loads the Express package. `express` is a function: calling it creates an app. Note this is CommonJS `require()` — Express 5 is published as CommonJS, so `require('express')` is the standard way to load it, and the `NODE_PATH` in the run command is what lets Node.js find the package in `/tmp/express-verify/node_modules` without an `npm install` in this repo. (From topic 02 onwards, Express will be installed properly in a project with `package.json`, and this workaround goes away.)

### 8.2 `const app = express();`

Creates the application object. From now on, `app` is where everything is registered: routes with `app.get()`, middleware with `app.use()`, settings with `app.set()`. Remember from section 4: `app` is also secretly a function with the `(req, res, next)` signature — that is what `app.listen()` hands to `http.createServer`.

### 8.3 `app.get('/', (req, res) => { res.send('Hello from Express!'); });`

Registers the first route, in three parts:

- **`app.get`** — only `GET` requests are considered. A `POST /` would skip this layer entirely.
- **`'/'`** — only the path `/` matches. `/anything-else` skips it too.
- **`(req, res) => { ... }`** — the handler. It runs only when method *and* path match. `res.send('Hello from Express!')` sends a `200 OK` with the string as the body and `Content-Type: text/html` (Express's default for strings) — and ends the response. One handler, one response: after `res.send`, the walk is over.

### 8.4 `app.get('/hello/:name', (req, res) => { res.send(`Hello, ${req.params.name}!`); });`

The route-parameter route. `:name` is a placeholder: it matches exactly one path segment (anything without a `/` in it) and stores it in `req.params.name`. So `/hello/Talha` runs the handler with `req.params.name === 'Talha'`, `/hello/World` with `'World'`, and `/hello` (no segment) does not match at all — it falls through to the 404. The template literal (backticks) builds the reply string from the captured value. This is the same mechanism every REST API uses for `/users/:id` and `/posts/:postId`.

### 8.5 `app.get('/json', (req, res) => { res.json({ message: 'Hello from Express!', framework: 'Express', version: 5 }); });`

The JSON route. `res.json()` does three things in one call: `JSON.stringify()` the object, set `Content-Type: application/json`, and send it with status 200. This is the call you will use for almost every API response in this module. Note the object has three fields — a message, the framework name, and the major version — so the output itself tells you what served it.

### 8.6 `app.listen(0, ...)` and finding the port

Starts the server and saves the returned `http.Server` object so the program can close it later. Two details: **port `0`** means "operating system, pick any free port" — used here so the example never clashes with another server on your machine (in real projects you listen on a real port, 3000 by convention, or `process.env.PORT`). And **the callback runs once the server is listening** — only then is it safe to make requests to it. `server.address().port` reports which port the OS picked (35763 in the recorded run — yours will differ) so the code can build the base URL.

### 8.7 The three self-requests — `fetch()` against our own server

Each block does the same thing for a different route: `fetch()` the URL, read the body (`.text()` for the two plain-text routes, `.json()` for the JSON route — note `JSON.stringify()` is used when printing the parsed object, so the log line shows the raw JSON), and print `METHOD path -> response`. The `await`s work because the listen callback is declared `async`. Using the global `fetch()` (built into Node.js 18+) means the example needs no HTTP client library — the server tests itself.

### 8.8 The shutdown — why the example never hangs

A listening server keeps the Node.js process alive forever — that is its job. So the example closes the server explicitly (`server.close()`) and then exits. The `try/catch` around the fetches sets `process.exitCode = 1` if any request failed, so a failure still shuts down cleanly but reports a non-zero exit code. **The pattern to copy:** every script that starts a server for a test or a demo must close it and exit — otherwise your terminal sits there forever and you have to Ctrl+C.

---
## 9. Common Misconceptions

- **"Express is a server / Express replaces Node.js."**
  No. Express is a library that runs *inside* Node.js, on top of the `http` module. There is no separate Express server process — `app.listen()` creates a plain Node.js `http.Server`. If you uninstall Express, Node.js still serves HTTP; it is just more work.

- **"Express comes with a database / login / validation."**
  No — see section 3.5. Express has never shipped an ORM, auth, or validation. Tutorials that show "Express + login" are showing Express *plus* other packages. If a job description says "Express experience", it means Express plus the usual ecosystem (PostgreSQL, JWT, Zod, ...), not Express alone.

- **"Express is only for APIs — it can't serve web pages."**
  It can: `express.static()` serves HTML/CSS/JS, and `res.render()` with a view engine serves dynamic pages. It is just that JSON APIs are the far more common use, and the one this journey focuses on.

- **"You must use Express for every Node.js backend."**
  No. A one-endpoint webhook, a tiny proxy, or a learning exercise is often simpler in raw `http`. And for very large, heavily structured apps, an opinionated framework may fit better. Express is the default, not a law.

- **"Middleware runs for every request, in any order."**
  It runs in *registration* order, and only until something sends a response. Middleware registered after a route never runs for requests that route answers. Order is the most common Express bug — when something "doesn't run", check where it was registered before doubting the code.

- **"`app.get()` and `app.use()` are the same thing."**
  They look similar but match differently: `app.get(path, ...)` matches only `GET` requests to exactly that path (or pattern); `app.use(path, ...)` matches *all* methods, and matches the path as a *prefix* — `app.use('/users', ...)` also matches `/users/42`. Mixing them up produces routes that mysteriously answer `POST` requests, or middleware that mysteriously doesn't run.

- **"Express 5 is a rewrite — I must relearn Express."**
  No. Express 5 changes async error forwarding and wildcard syntax, and removes long-deprecated methods. The core — `app.get/post/use/listen`, `express.json()`, `express.Router()`, `res.json()` — is unchanged. If a tutorial says `app.get('*')`, it is an Express 4 tutorial; everything else in it still works.

- **"A route handler can send more than one response."**
  It cannot. The first `res.send()` / `res.json()` ends the response; a second one throws "Cannot set headers after they are sent". If you see that error, your handler (or your middleware chain) is trying to answer twice — usually a missing `return` after sending an error response.

---

## 10. Important Technical Terminology

| Term | Meaning |
|---|---|
| **Framework** | A library that dictates the shape of your program — it calls your code (inversion of control). Express is a framework; `pg` (the PostgreSQL driver) is a library. |
| **Minimal / unopinionated** | A framework that makes few decisions for you. Express's whole philosophy. |
| **Opinionated** | A framework that makes most decisions for you (structure, DB, validation). NestJS, Rails, Django. |
| **Routing** | Mapping an HTTP method + path to a handler function. |
| **Route** | One method + one path pattern + one handler. |
| **Route parameter (`:name`)** | A named, single-segment placeholder in a path; captured into `req.params`. |
| **Query string** | The `?key=value&key2=value2` part of a URL; parsed into `req.query`. |
| **Middleware** | A function `(req, res, next)` that runs mid-request and either calls `next()` or ends the response. |
| **Middleware stack / pipeline** | The ordered list of middleware + routes a request walks through. |
| **`next()`** | The function that passes control to the next layer in the stack. |
| **`next(err)`** | Passes an error, skipping normal layers and jumping to error-handling middleware. |
| **Error-handling middleware** | A 4-argument middleware `(err, req, res, next)` that catches errors from earlier layers. |
| **Router (`express.Router()`)** | A mini-app with its own routes, mounted on the main app under a path prefix. |
| **Static files** | Files served from disk as-is; served by `express.static()`. |
| **View engine / template engine** | A library that renders HTML from templates + data (EJS, Pug, Handlebars). Plugged in, never built in. |
| **ORM / ODM** | A library mapping database rows/documents to objects (Prisma, Sequelize, Mongoose). Not part of Express. |
| **Body parsing** | Turning the raw request body into `req.body`. `express.json()` does it for JSON. |
| **REST API** | An API using HTTP methods + resource URLs with JSON bodies. |
| **Ephemeral port** | A port picked by the OS when you listen on port `0`. Different every run. |
| **path-to-regexp** | The library Express uses to compile route patterns (`/users/:id`) into regular expressions. v8 in Express 5 — the reason wildcard syntax changed. |

---

## 11. Summary

- **Express is a minimal, unopinionated web framework for Node.js** — a thin layer on top of the built-in `http` module that adds routing, middleware, and `req`/`res` helpers.
- **It exists because raw `http` plumbing doesn't scale**: manual URL matching, header-setting, and `if`/`else` routing drown the real logic once you have more than a few routes.
- **Where it sits:** your code → Express (routing, middleware, helpers) → Node.js `http` → Node.js runtime. Express never replaces `http`; `app.listen()` just calls `http.createServer(app)` for you.
- **What it gives you:** routing by method + path, route parameters (`:id` → `req.params.id`), query parsing (`req.query`), middleware (`app.use()` + `next()`), `res.send()` / `res.json()` / `res.status()`, routers, static files, error handling.
- **What it does NOT give you:** no ORM/database, no templating engine built in, no auth, no validation, no file uploads, no WebSockets, no project structure. Those are separate packages and your own decisions.
- **Minimal vs opinionated:** Express makes almost no decisions — fast to learn, totally flexible, but the project structure is your responsibility. Opinionated frameworks (NestJS) decide more and suit large teams.
- **Internally:** `express()` returns an app that is also a `(req, res, next)` function; routes and middleware become Layers in a stack; each request walks the stack in registration order until a handler responds, falls through to a 404, or jumps to error handling via `next(err)`.
- **Express 5 (5.3.0 here):** requires Node.js 18+; async handler errors now forward to the error handler automatically; wildcards must be named (`/*splat`, not `*`); `req.param()` and `app.router` are gone. Everything else you know from Express 4 still applies.

---

## 12. Interview Questions and Answers

**1. What is Express.js?**

Express.js is a minimal, unopinionated web framework for Node.js. It sits on top of Node.js's built-in `http` module and adds routing (matching HTTP methods + paths to handler functions), middleware (a pipeline of functions a request passes through), and helper methods on the request and response objects (`res.json()`, `req.params`, `req.query`). It deliberately does not include a database layer, templating engine, authentication, or validation — you add those yourself.

**2. Why use Express instead of Node.js's built-in `http` module?**

Because raw `http` makes you write the plumbing yourself: matching method + URL with `if`/`else`, splitting URL strings to extract values, setting status codes and `Content-Type` headers by hand, and writing your own 404. That is fine for one or two routes and unmaintainable at thirty. Express replaces all of it with declarative routes (`app.get('/users/:id', handler)`), automatic parameter and query parsing, and helpers like `res.json()`. The HTTP behaviour is identical — Express just removes the repetitive code.

**3. Is Express a server? Does it replace Node.js?**

No to both. Express is a JavaScript library running inside Node.js. `app.listen(3000)` is a shortcut for `http.createServer(app).listen(3000)` — the actual server is Node.js's `http.Server`, and the `app` object is just the request-listener function passed to it. Express organises request handling; Node.js still does the networking, the event loop, and the executing.

**4. What is middleware? Give an example.**

Middleware is a function that runs in the middle of request handling, between the request arriving and the route handler running. It receives `(req, res, next)` and either calls `next()` to pass control to the next layer or ends the response itself. Examples: `express.json()` (parses a JSON body into `req.body`), a logger (prints `GET /users`), an auth check (verifies a token, answers 401 if it is missing). Middleware runs in registration order, and forgetting `next()` makes the request hang.

**5. What is the difference between `app.get()` and `app.use()`?**

`app.get(path, handler)` registers a *route*: it matches only `GET` requests to exactly that path pattern. `app.use(path, handler)` registers *middleware*: it matches all HTTP methods, and it matches the path as a prefix — `app.use('/users', ...)` also matches `/users/42` and `/users/42/posts`. Routes answer requests; middleware usually processes them and passes them on with `next()`.

**6. What are route parameters, and how are they different from query strings?**

A route parameter is a named segment of the path, written `:name` — `/users/:id` matches `/users/42` and puts `'42'` in `req.params.id`. A query string is the `?key=value` part after the path — `/users?role=admin` puts `{ role: 'admin' }` in `req.query`. Convention: parameters identify *which* resource (`/users/42`), query strings modify *how* you want it (`?page=2`, `?sort=name`). Both are always strings.

**7. What does Express NOT do?**

No database or ORM, no templating engine built in (it can use EJS/Pug/Handlebars but you install one), no authentication or authorisation, no input validation, no multipart file-upload parsing, no WebSockets, no TypeScript types, and no enforced project structure or CLI scaffolding. Express handles HTTP requests well; everything outside that is another package's job.

**8. What is the difference between a minimal and an opinionated framework?**

A minimal framework (Express, Koa, Fastify) does one small job and leaves every other decision to you — fast to learn, totally flexible, but you must choose and organise the other pieces yourself. An opinionated framework (NestJS, Ruby on Rails, Django) makes most decisions for you — folder structure, database layer, validation, testing — which is slower to learn but keeps a large team consistent. Express chose minimal on purpose; this module's later topics (routers, controllers, services) supply the structure Express itself does not.

**9. What changed in Express 5 compared to Express 4?**

Four things: (1) Node.js 18+ is required. (2) Errors from `async` route handlers are now forwarded to error-handling middleware automatically — in Express 4 a rejected promise hung the request unless you wrapped the handler or called `next(err)`. (3) Wildcard route syntax changed (path-to-regexp v8): `app.get('*')` no longer works; wildcards must be named, e.g. `app.get('/files/*splat')`, and optional params use `{/:id}` instead of `:id?`. (4) Long-deprecated APIs were removed: `req.param()`, `app.router`, `res.sendfile`. Everything else — `app.get/post/use/listen`, `express.json()`, `express.Router()`, `res.json()` — is unchanged.

**10. How does a request flow through an Express app?**

The `http` server hands `(req, res)` to the app function. Express walks its internal stack of Layers in registration order: for each layer it checks the HTTP method and the path pattern (compiled to a regex by path-to-regexp). Matching middleware runs first and calls `next()` to continue; the first matching route's handler runs and sends the response, which ends the walk. If nothing matches, Express's built-in final handler sends a 404. If a handler calls `next(err)` — or, in Express 5, an async handler rejects — Express skips to the first error-handling middleware (a function with four arguments).

**11. What is the difference between `res.send()` and `res.json()`?**

Both send a response, but `res.json()` is explicit: it always stringifies the value as JSON and sets `Content-Type: application/json`. `res.send()` is generic — a string becomes `text/html`, an object becomes JSON, a Buffer is sent raw — and it also sets `Content-Length` and an `ETag`. Use `res.json()` for API responses (it signals intent) and `res.send()` for text, HTML, or buffers.

**12. When would you use raw Node.js `http` instead of Express — and when would you use something bigger than Express?**

Raw `http` for a one-endpoint server (a webhook receiver, a health-check endpoint, a quick experiment) where installing a framework is more ceremony than the plumbing is worth. Something bigger — NestJS, typically — for a large, long-lived app built by a big team, where enforced structure, dependency injection, and TypeScript-first design pay off. Express is the middle: real REST APIs and small-to-medium apps, where you want routing and middleware without inheriting a whole architecture.

---

## 13. References

- Express.js official documentation — [https://expressjs.com/](https://expressjs.com/)
- Express 5.x API reference — [https://expressjs.com/en/5x/api.html](https://expressjs.com/en/5x/api.html)
- Express — Getting started / Hello world — [https://expressjs.com/en/starter/hello-world.html](https://expressjs.com/en/starter/hello-world.html)
- Express — Routing guide — [https://expressjs.com/en/guide/routing.html](https://expressjs.com/en/guide/routing.html)
- Express — Using middleware — [https://expressjs.com/en/guide/using-middleware.html](https://expressjs.com/en/guide/using-middleware.html)
- Express 5 migration guide (4.x → 5.x) — [https://expressjs.com/en/guide/migrating-5.html](https://expressjs.com/en/guide/migrating-5.html)
- Express on GitHub (source code — small enough to read) — [https://github.com/expressjs/express](https://github.com/expressjs/express)
- Node.js documentation — HTTP module (what Express sits on) — [https://nodejs.org/api/http.html](https://nodejs.org/api/http.html)

All examples in this topic were run and verified on Node.js v24.22.1 with Express 5.3.0 — see [`examples/example.txt`](./examples/example.txt) for the real output.

---

## Files in This Folder

```text
01-introduction/
├── README.md                  # Short lesson overview — start here
├── notes.md                   # This file — full detailed notes
├── exercises.md               # 5 practice tasks (no solutions)
└── examples/
    ├── hello-express.js       # Minimal Express app: 3 routes, self-tests, exits cleanly
    └── example.txt            # Expected output (Node v24.22.1, Express 5.3.0)
```

**How to run:**

```bash
NODE_PATH=/tmp/express-verify/node_modules node examples/hello-express.js
```

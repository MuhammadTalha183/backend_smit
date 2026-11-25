# 04 — Routing — Notes

> **Module:** 02 — Express.js
> **Topic:** 04 — Routing
> **Priority:** 🔴 High
> **Previous topic:** [03 — HTTP Fundamentals](../03-http-fundamentals/README.md)
> **Next topic:** [05 — Request and Response](../05-request-response/README.md)
>
> **One-line summary:** Routing is how Express decides which function handles an incoming request — it matches the request's HTTP method and URL path against the routes you registered, in the order you registered them, and the first match wins.
>
> **How to use these notes:** read [README.md](./README.md) first for the short overview, then work through this file section by section. Run the example in [`examples/routing.js`](./examples/routing.js) and compare your output with [`examples/example.txt`](./examples/example.txt). Then do the tasks in [`exercises.md`](./exercises.md).

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

In the previous topic you learned how HTTP works: a client sends a request with a method (`GET`, `POST`, …) and a URL, and a server sends back a response with a status code and a body. Express sits on top of that, and **routing** is the first job it does for every request: look at the method and the path, and decide which of your functions should answer.

Think of a restaurant. The customer walks in and says what they want — "a table for two" or "a takeaway burger". The host does not cook the food; the host **routes** the customer to the right place: the dining room, or the takeaway counter. Express is the host. Your route handlers are the kitchen stations. Routing is the decision of *who* handles *this* request.

Without routing, an Express app would be one giant function that checks `req.url` with a chain of `if` statements — exactly what plain Node.js `http` code looks like, and exactly the mess Express exists to remove. With routing, each URL pattern gets its own small, named handler, and Express does the matching for you.

By the end of this topic you will be able to: register routes for every HTTP method; use route parameters (`:id`) and query strings (`?q=…`); write route paths with strings, wildcards, and regular expressions; chain methods with `app.route()`; split an app into `express.Router()` modules and mount them at a prefix; explain the order Express matches routes; and add a 404 catch-all that runs only when nothing else matched.

---

## 2. Definition of Important Concepts

| Concept | Definition |
|---|---|
| **Route** | A pairing of an HTTP method, a URL path pattern, and a handler function. `app.get('/users', handler)` is one route. |
| **Route handler** | The callback `(req, res) => { … }` that runs when a route matches. It reads the request and sends the response. |
| **Route path** | The URL pattern a route matches against, e.g. `'/'`, `'/users/:id'`, `'/files/*splat'`. |
| **Route parameter** | A named segment of the path, written `:name` (e.g. `:id` in `/users/:id`). Its value is captured from the actual URL and appears in `req.params`. |
| **Query string** | The part of a URL after the `?`, written as `key=value` pairs joined by `&` (e.g. `/search?q=express&page=2`). Parsed by Express into `req.query`. |
| **`app.route()`** | A helper that returns a route object for one path, so you can chain `.get()`, `.post()`, … on it instead of repeating the path. |
| **`express.Router()`** | A mini Express app: an isolated router object you define routes on, then mount into the main app with `app.use('/prefix', router)`. |
| **Mounting** | Attaching a router (or middleware) at a path prefix with `app.use('/api', router)`. Every route inside the router is reached under that prefix. |
| **404 handler** | A catch-all placed last that answers "not found" for any request no route matched. |
| **HTTP method** | The verb of a request: `GET` (read), `POST` (create), `PUT` (replace), `PATCH` (update part), `DELETE` (remove). Express has one method per verb: `app.get()`, `app.post()`, and so on. |

---

## 3. Detailed Explanations

### 3.1 The five method helpers: `app.get`, `app.post`, `app.put`, `app.patch`, `app.delete`

Express gives you one method on the `app` object for each HTTP verb. The signature is always the same:

```js
app.METHOD(path, handler);
```

- `app.get(path, handler)` — handles `GET` requests. Reading data: a home page, a user profile, a list of items.
- `app.post(path, handler)` — handles `POST` requests. Creating data: a new user, a new order.
- `app.put(path, handler)` — handles `PUT` requests. Replacing a whole resource: send the complete new user object, the old one is fully replaced.
- `app.patch(path, handler)` — handles `PATCH` requests. Updating *part* of a resource: send only the fields that change, e.g. just `{ "name": "New Name" }`.
- `app.delete(path, handler)` — handles `DELETE` requests. Removing a resource.

The method is part of the match. `GET /users` and `POST /users` are **two different routes** that can live side by side — one lists users, the other creates one. This is the foundation of REST APIs: the same path, different verbs, different jobs.

### 3.2 Route paths: strings, wildcards, and regular expressions

A route path can be written in three ways:

**1. A plain string — an exact path.**

```js
app.get('/', handler);            // only the home page
app.get('/about', handler);       // only /about
app.get('/users', handler);       // only /users — NOT /users/42
```

A string path matches exactly, except that a trailing slash is ignored (`/about` also matches `/about/`). String paths are what you will use 95% of the time.

**2. A string with a wildcard — match many paths with one route.**

Express 5 uses the `*splat` wildcard syntax (powered by the `path-to-regexp` library). `*splat` matches any number of path segments:

```js
// Matches /files/a.png, /files/docs/report.pdf, /files/a/b/c.txt — anything under /files/
app.get('/files/*splat', (req, res) => {
  res.json({ file: req.params.splat }); // 'a.png', 'docs/report.pdf', ...
});
```

> ⚠️ **Express 5 change:** in Express 4 the wildcard was written as a bare `*` (`'/files/*'`). In Express 5 that throws an error at startup ("Missing parameter name"). The correct Express 5 form is `*splat` (or any name, e.g. `*rest`). If you copy old Express 4 examples from the internet, this is the first thing to fix.

**3. A regular expression — full control over the pattern.**

```js
// Matches /user/123, /user/987 — any URL made of /user/ followed by digits
app.get(/^\/user\/(\d+)$/, (req, res) => {
  res.json({ userId: req.params[0] });
});
```

With a regex route there are no named parameters — captured groups land in `req.params` as an array (`req.params[0]`, `req.params[1]`, …). Regex routes are powerful but hard to read; use them only when a string path cannot express the rule, for example "only digits here".

### 3.3 Route parameters: `:id`

A route parameter is a **named placeholder** in the path. It matches exactly one path segment (one chunk between slashes) and captures its value:

```js
app.get('/users/:id', (req, res) => {
  res.json({ userId: req.params.id });
});
// GET /users/42        -> { "userId": "42" }
// GET /users/talha     -> { "userId": "talha" }
// GET /users/42/posts  -> no match (extra segment)
```

Key facts about route parameters:

- **They are always strings.** `req.params.id` for `/users/42` is the string `'42'`, not the number `42`. Convert it yourself (`Number(req.params.id)`) before doing maths or database lookups.
- **You can have several in one path:** `/users/:userId/posts/:postId` gives `req.params.userId` and `req.params.postId`. Each matches one segment only — `:id` in `/users/:id` matches `42` but never `42/posts`, because the `/` stops it. (A wildcard is the tool for multi-segment matches.)
- **They identify *which* resource.** `/users/42` means "the user whose id is 42". If the id does not exist, the correct answer is a `404` with a clear message, not an empty `200`.

### 3.4 Query strings: `?key=value`

The query string is everything after the `?` in a URL. It does **not** identify a resource — it *modifies* the request: filtering, searching, sorting, paging.

```js
app.get('/search', (req, res) => {
  res.json({ q: req.query.q, page: req.query.page });
});
// GET /search?q=express&page=2
// -> req.query = { q: 'express', page: '2' }
```

Key facts about query strings:

- **They are always strings too**, and Express parses them for you into `req.query`. No parsing code needed.
- **They are optional and unordered.** `/search?q=express` and `/search?page=2&q=express` both hit the same route; missing keys are simply `undefined`, so give them defaults (`req.query.page ?? '1'`). Repeated keys become arrays: `/filter?tag=a&tag=b` gives `req.query.tag === ['a', 'b']`.
- **They belong in the URL the user sees.** A search page's URL *is* the search — that is why you can bookmark it or share it. A request body cannot do that. They are not secret, though: they appear in browser history, server logs, and referrer headers, so never put passwords or tokens in a query string.

**Route parameters vs query strings — the rule of thumb:**

| | Route parameter (`:id`) | Query string (`?q=…`) |
|---|---|---|
| Where it lives | In the path: `/users/42` | After the `?`: `/search?q=express` |
| What it means | *Which* resource | *How* to filter/sort/page the result |
| Required? | Yes — the route does not match without it | No — the route matches with or without it |
| Read from | `req.params` | `req.query` |
| Example | `/users/42`, `/posts/7/comments/3` | `/search?q=express&page=2`, `/users?role=admin` |

### 3.5 `app.route()`: one path, many methods

When several verbs share the same path, writing the path over and over is noisy and invites typos — write `/items` in one place and `/item` in another and you have a bug that no error message will catch. `app.route()` fixes that by returning a chainable route object:

```js
app
  .route('/items')
  .get((req, res) => res.json(items))          // GET /items — list
  .post((req, res) => { /* … */ })             // POST /items — create
  .put((req, res) => { /* … */ });             // PUT /items — replace all
```

The path appears exactly once, and every method handler is grouped visually under it. `app.route()` is a readability tool — it does nothing `app.get` + `app.post` cannot do. Use it when a path has two or more methods; a single-method path does not need it.

### 3.6 `express.Router()`: splitting the app into modules

A real app has dozens of routes. Putting them all in one file makes `app.js` unreadable. `express.Router()` is the answer: it creates a **mini app** — a router object with the same `.get()`, `.post()`, `.use()` methods as the main app — that you define in its own file and then **mount** into the main app:

```js
// routes/api.js
const express = require('express');
const router = express.Router();

router.get('/status', (req, res) => res.json({ status: 'ok' }));
router.get('/users/:id/posts', (req, res) => { /* … */ });

module.exports = router;
```

```js
// app.js
const apiRouter = require('./routes/api');
app.use('/api', apiRouter);
// Now: GET /api/status, GET /api/users/7/posts
```

Three things to understand about routers:

1. **Routes on a router are relative.** `router.get('/status')` mounted at `/api` becomes `/api/status`. The router file never mentions `/api` — the mount point is the main app's decision. That means the same router could be mounted at a different prefix (for example `/v2`) without changing a line inside it.
2. **Routers can be nested.** A router can mount another router with `router.use('/users', usersRouter)`, building a tree: `/api` → `/users` → `/:id`. Big apps are built this way — one router per resource, one mount per router.
3. **Routers have their own middleware.** `router.use(express.json())` or an auth check on a router applies only to that router's routes — a clean way to say "everything under `/admin` requires login" in one line.

### 3.7 Mounting: `app.use('/prefix', router)`

`app.use(path, router)` attaches the router at the prefix. From then on, a request whose path starts with the prefix is handed to the router, which strips the prefix and matches the *rest* of the path against its own routes:

```js
app.use('/api', apiRouter);
// GET /api/status  -> router sees '/status' -> matches router.get('/status')
// GET /api/users/7 -> router sees '/users/7' -> matches router.get('/users/:id')
```

Mounting is why real apps stay organised: the main `app.js` becomes a short list of mounts — `app.use('/api/users', usersRouter)`, `app.use('/api/posts', postsRouter)` — and each resource lives in its own file. Later topics (controllers, validation, error handling) build directly on this: a router per resource, with its own middleware, mounted at its own prefix.

### 3.8 The 404 catch-all

Express does **not** send a 404 for you when no route matches — if no route and no middleware handles a request, Express's built-in final handler sends a plain `Cannot GET /path` HTML page. In a real API you want a controlled JSON 404 instead, so you add a catch-all **at the very end** of your route list:

```js
// LAST — after every route and router
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});
```

`app.use()` with no path matches **every** method and path, so a request only reaches this line if nothing above matched it — and placed *above* your real routes, it would swallow them all.

---

## 4. How the Technology Works Internally

When you call `app.get('/users/:id', handler)`, Express does **not** run your handler. It stores a *layer* in an internal stack: the method (`GET`), a compiled matcher for the path, and the handler. This stack is the app's routing table, and it grows in the exact order you register routes. Starting the server changes nothing about the stack — registration is done at startup, matching happens per request.

When a request arrives, Express walks the stack **top to bottom, first match wins**:

1. **Method check.** Is the request's method the same as the layer's method? A `GET /users` request skips every `POST` layer without even looking at its path. (`app.use` layers have no method, so they match any method.)
2. **Path check.** Does the request's path match the layer's compiled pattern? For string paths Express 5 compiles the pattern with `path-to-regexp`, which turns `'/users/:id'` into a regular expression with a named capture group, and `'/files/*splat'` into a pattern that swallows slashes. For regex routes, the regex itself is the matcher.
3. **Parameter extraction.** On a match, the captured segments are decoded (`%20` → space, and so on) and placed in `req.params`; the query string is parsed separately into `req.query`.
4. **Handler runs — or `next()` continues.** The matched handler runs. If it calls `next()`, Express resumes walking the stack from where it stopped, looking for the *next* matching layer. If the handler sends a response, the walk ends.

Two consequences follow from "first match wins, in registration order":

- **A broad route registered first shadows a specific one registered later.** `app.get('/users/:id')` placed before `app.get('/users/new')` will capture `/users/new` as `id = 'new'`. Register specific routes (`/users/new`) *before* generic ones (`/users/:id`).
- **Matching is cheap because it is just regex tests in order.** There is no index or tree. That is also why route order is a design decision, not an accident: the file you write *is* the priority list.

---

## 5. Architecture or Workflow

The request's journey through a routed Express app, step by step:

```
Client request: GET /api/users/42/posts?page=1
        │
        ▼
┌─ Express app (the stack) ──────────────┐
│ layers are checked in the order they   │
│ were registered                        │
└────────────────────────────────────────┘
        │
        ├─ app.use(express.json())      → middleware, runs, calls next()
        ├─ app.get('/')                 → method GET ✓, path '/' ✗ → skip
        ├─ app.get('/users/:id')        → method GET ✓, path ✗ → skip
        │   (the real path is /api/users/42/posts, not /users/42)
        ├─ app.use('/api', apiRouter)   → prefix '/api' ✓ → hand over
        │        │
        │        ▼
        │   ┌─ apiRouter (own stack) ─┐
        │   │ path now: /users/42/posts
        │   └─────────────────────────┘
        │        │
        │        ├─ router.get('/status')          → path ✗ → skip
        │        └─ router.get('/users/:id/posts') → path ✓ → MATCH
        │             req.params = { id: '42' }, req.query = { page: '1' }
        │             handler runs → res.json(...)
        │
        ▼ (only if nothing matched)
   404 catch-all → res.status(404).json({ error: 'Not found' })
```

The rules this diagram encodes:

1. **Registration order is matching order.** The stack is a list, not a lookup table.
2. **Middleware runs before routing** (when registered first) — that is how `express.json()` is already done by the time a `POST` handler reads `req.body`.
3. **Routers are just layers** that hand the request to a smaller stack with the prefix removed.
4. **The 404 handler is the bottom of the stack.** Anything that falls through every layer lands there.

---

## 6. Real-World Examples

- **A blog / CMS.** `GET /posts` lists articles, `GET /posts/:slug` shows one article, `GET /posts?tag=nodejs&page=2` filters by tag and pages the result. The slug is a route parameter (which article), the tag and page are query strings (how to filter the list). A `postsRouter` mounted at `/posts` holds all of it.
- **An e-commerce store.** `/products/:id` is the product page, `/products?category=shoes&sort=price` is the filtered catalogue, `/cart` is a `POST` to add an item. The category and sort are query strings because the customer shares that URL — "shoes, sorted by price" *is* the link.
- **A social app.** `/users/:username` is a profile, `/users/:username/posts/:postId` is one post by that user. Two parameters in one path, each naming one level of the resource tree.
- **A file server / CDN.** `/files/*splat` serves anything under `/files/`, from `/files/logo.png` to `/files/docs/2026/report.pdf`. One wildcard route replaces an infinite number of exact routes.
- **API versioning.** The same `usersRouter` mounted twice — `app.use('/api/v1/users', usersRouter)` and `app.use('/api/v2/users', usersRouter)` — gives two API versions from one set of route definitions. Mounting is what makes this a one-line change.

---

## 7. Code Examples Where Applicable

### 7.1 The five method helpers

```js
app.get('/users', (req, res) => res.json(users));            // list
app.post('/users', (req, res) => res.status(201).json(newUser)); // create
app.put('/users/:id', (req, res) => { /* replace whole user */ });
app.patch('/users/:id', (req, res) => { /* update some fields */ });
app.delete('/users/:id', (req, res) => res.status(204).send()); // remove
```

### 7.2 Route parameters and query strings

```js
// Route param: WHICH user — /users/42
app.get('/users/:id', (req, res) => {
  const id = Number(req.params.id); // params are strings — convert!
  const user = users.find((u) => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Query string: HOW to filter — /users?role=admin&page=2
app.get('/users', (req, res) => {
  const { role, page = '1' } = req.query; // defaults for missing keys
  const result = role ? users.filter((u) => u.role === role) : users;
  res.json({ page: Number(page), users: result });
});
```

### 7.3 Wildcards and regular expressions (Express 5)

```js
// Wildcard: anything under /files/, any depth
app.get('/files/*splat', (req, res) => {
  res.json({ requestedFile: req.params.splat });
});

// Regex: only numeric ids reach this route
app.get(/^\/user\/(\d+)$/, (req, res) => {
  res.json({ userId: req.params[0] }); // regex captures are an array
});
```

### 7.4 `app.route()` — chain methods on one path

```js
app
  .route('/items')
  .get((req, res) => res.json(items))
  .post((req, res) => {
    const item = { id: items.length + 1, name: req.body.name };
    items.push(item);
    res.status(201).json(item);
  });
```

### 7.5 `express.Router()` and mounting

```js
// routes/api.js
const express = require('express');
const router = express.Router();

router.get('/status', (req, res) => res.json({ status: 'ok' }));
router.get('/users/:id/posts', (req, res) => {
  res.json({ userId: req.params.id, posts: [] });
});

module.exports = router;

// app.js
const apiRouter = require('./routes/api');
app.use('/api', apiRouter); // /api/status, /api/users/7/posts
```

### 7.6 The 404 catch-all (always last)

```js
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});
```

### 7.7 The full demo

The runnable demo tying all of this together is [`examples/routing.js`](./examples/routing.js): a home route, a route-parameter route, a query-string route, a `POST` route, an `app.route()` chain, a router mounted at `/api`, and a 404 catch-all — each called with `fetch()` and printed. Its output is in [`examples/example.txt`](./examples/example.txt).

---

## 8. Step-by-Step Code Explanations

This section walks through [`examples/routing.js`](./examples/routing.js) line by line — the same code, explained in the order it runs.

**Step 1 — Create the app and parse JSON bodies.**

```js
const express = require('express');
const app = express();
app.use(express.json());
```

`require('express')` loads Express; `express()` creates the app. `app.use(express.json())` registers body-parsing middleware **first**, so that by the time any `POST` handler runs, `req.body` already holds the parsed JSON. If this line came after the `POST` routes, `req.body` would be `undefined` inside them — order again.

**Step 2 — The home route.**

```js
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Routing demo' });
});
```

The simplest route in the file: `GET` + path `'/'` + a handler that answers JSON. `res.json()` sets the `Content-Type: application/json` header and stringifies the object for you.

**Step 3 — A route parameter.**

```js
app.get('/users/:id', (req, res) => {
  res.json({ userId: req.params.id });
});
```

When the demo calls `GET /users/42`, Express matches `:id` against the segment `42` and stores it as `req.params.id` — a string. The handler echoes it back as JSON.

**Step 4 — A query string.**

```js
app.get('/search', (req, res) => {
  res.json({ q: req.query.q ?? null, page: req.query.page ?? '1' });
});
```

The path is just `'/search'` — the query string is never part of a route path. For `GET /search?q=express&page=2`, Express parses the query into `req.query`. The `??` operator supplies defaults: `q` becomes `null` when absent, `page` becomes `'1'`.

**Step 5 — A POST route.**

```js
app.post('/users', (req, res) => {
  res.status(201).json({ created: true, name: req.body.name });
});
```

Same path as step 3's neighbour (`/users`) but a different method, so it is a different route. `201` is the correct status for "created". `req.body.name` works because of the `express.json()` middleware from step 1.

**Step 6 — `app.route()` chaining.**

```js
app
  .route('/items')
  .get((req, res) => res.json(items))
  .post((req, res) => {
    const item = { id: items.length + 1, name: req.body.name };
    items.push(item);
    res.status(201).json(item);
  });
```

The path `'/items'` is written once; `.get()` and `.post()` hang off it. The demo calls `GET /items` (2 items), then `POST /items` (adds `Pencil` as id 3), then `GET /items` again (3 items) — proving the `POST` really changed the shared `items` array.

**Step 7 — A router mounted at `/api`.**

```js
const apiRouter = express.Router();
apiRouter.get('/status', (req, res) => res.json({ status: 'ok' }));
apiRouter.get('/users/:id/posts', (req, res) => {
  res.json({ userId: req.params.id, posts: [] });
});
app.use('/api', apiRouter);
```

Routes are defined on `apiRouter` with short, relative paths (`'/status'`). `app.use('/api', apiRouter)` mounts them: the demo's `GET /api/status` and `GET /api/users/7/posts` reach the router, which strips `/api` and matches the remainder.

**Step 8 — The 404 catch-all, last.**

```js
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});
```

No path, no method — it matches everything. Because it is registered last, a request only reaches it when every route above failed to match. The demo proves it with `GET /no-such-route` → `404`.

**Step 9 — Self-test and self-terminate.**

```js
const server = app.listen(0, async () => {
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
  // … fetch() every route, print "METHOD path -> status body" …
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});
```

`listen(0)` asks the OS for any free (ephemeral) port, so the demo never collides with another server. `server.address().port` reads back the port actually chosen. The `show()` helper `fetch()`es each route and prints one line per request. When the list is done, `server.close()` stops accepting connections and `process.exit(0)` ends the process — the demo never hangs waiting.

---

## 9. Common Misconceptions

- **"Routes match in the order I *think* they should, not the order I wrote them."** No — Express matches in registration order, first match wins. A generic route (`/users/:id`) above a specific one (`/users/new`) eats the specific one. Specific first, generic later.
- **"If no route matches, Express sends a 404."** Not a useful one. The built-in fallback sends a plain HTML `Cannot GET /path` page. For an API you must add your own JSON 404 handler — and it must be last.
- **"Route parameters and query strings are the same thing."** They are not. Parameters are part of the path and identify *which* resource (`/users/42`); query strings come after `?` and modify the request (`/search?q=x&page=2`). They live in `req.params` and `req.query` respectively, and a route path never contains a `?`.
- **"`req.params.id` is a number when the URL has a number."** It is always a string. `/users/42` gives `'42'`. If you compare it with `===` against a number, or use it as an array index, it silently fails. Convert with `Number()`.
- **"A wildcard `*` still works in Express 5."** It does not — `app.get('/files/*', …)` throws at startup in Express 5. The wildcard is now `*splat` (e.g. `'/files/*splat'`), and the captured value is `req.params.splat`.
- **"Mounting a router copies its routes into the app."** It does not copy anything — the router keeps its own stack, and the app's stack holds one layer that forwards matching requests to it, with the mount prefix stripped. That is why the same router can be mounted at two prefixes.
- **"`app.route()` adds a feature `app.get` cannot do."** It adds nothing but readability: one path written once, methods chained under it. Use it for clarity, not for capability.
- **"The 404 handler can go anywhere, as long as it exists."** It must be last. `app.use()` with no path matches everything, so placed above your routes it answers 404 to every request — including the valid ones.

---

## 10. Important Technical Terminology

| Term | Meaning |
|---|---|
| **Routing** | The process of matching an incoming request's method + path to a handler. |
| **Route** | One method + path pattern + handler triple. |
| **Route handler** | The function that runs for a matched route: `(req, res) => { … }`. |
| **Route path / pattern** | The URL pattern a route matches: a string, a wildcard string, or a regex. |
| **Route parameter** | A `:name` placeholder in a path, captured into `req.params`. |
| **`req.params`** | Object of captured route parameters. Values are always strings. |
| **`req.query`** | Object of parsed query-string pairs. Values are strings (or arrays for repeated keys). |
| **Query string** | The `?key=value&key=value` tail of a URL. |
| **Wildcard (`*splat`)** | Express 5 pattern matching any number of path segments; value in `req.params.splat`. |
| **`app.route()`** | Returns a chainable route object for one path, so several methods can share it. |
| **`express.Router()`** | A mini-app / isolated router with its own route stack. |
| **Mounting** | Attaching a router at a prefix with `app.use('/prefix', router)`. |
| **Router prefix** | The mount path; stripped from the URL before the router matches the rest. |
| **404 catch-all** | A final `app.use()` handler that answers "not found" when nothing matched. |
| **First match wins** | Express walks the route stack in registration order and runs the first layer whose method and path match. |

---

## 11. Summary

- A **route** is a method + a path pattern + a handler. Express matches requests against routes **in registration order, first match wins**.
- `app.get()`, `app.post()`, `app.put()`, `app.patch()`, `app.delete()` cover the five main HTTP verbs; the method is part of the match, so `GET /users` and `POST /users` are different routes.
- **Route parameters** (`:id`) name one path segment and identify *which* resource; read them from `req.params`, and remember they are always strings.
- **Query strings** (`?q=express&page=2`) filter, sort, and page a request; read them from `req.query`, with defaults for missing keys. They never appear in a route path.
- Route paths can be **strings** (exact), **wildcards** (`/files/*splat` in Express 5 — the old bare `*` throws), or **regular expressions** (captures in `req.params` as an array).
- `app.route('/items').get(…).post(…)` writes a shared path once and chains its methods under it.
- `express.Router()` splits routes into modules; `app.use('/api', router)` **mounts** a router at a prefix, and the router's paths are relative to that prefix.
- A **404 catch-all** (`app.use((req, res) => …)`) must be the **last** thing registered, or it swallows every request.

---

## 12. Interview Questions and Answers

**Q1. How does Express match a request to a route?**

Express keeps all routes in a stack in the order they were registered. For each incoming request it walks the stack top to bottom: first it checks the HTTP method, then whether the path matches the route's pattern. The first layer that matches both runs its handler. If the handler calls `next()`, the walk continues to the next match; if it sends a response, the walk ends. If nothing matches, the request falls through to the final handler — which is why a 404 catch-all is placed last.

**Q2. What is the difference between a route parameter and a query string? When would you use each?**

A route parameter (`:id` in `/users/:id`) is part of the path, is required for the route to match, and identifies *which* resource — read it from `req.params`. A query string (`?q=express&page=2`) comes after the `?`, is optional, and modifies the request — filtering, searching, sorting, paging — read it from `req.query`. Use a parameter for identity (`/users/42`, `/posts/7/comments/3`) and a query string for options (`/search?q=express`, `/users?role=admin&page=2`). Parameters also make cleaner, shareable URLs for a single resource; query strings make the search itself bookmarkable.

**Q3. Why is `req.params.id` a string even when the URL contains a number, and what goes wrong if you forget?**

Because a URL is text — Express captures path segments as strings and never guesses their type. Forgetting this breaks strict comparisons: `'42' === 42` is `false`, so `users.find(u => u.id === req.params.id)` finds nothing when user ids are numbers, and the route wrongly returns 404. The fix is to convert explicitly — `Number(req.params.id)` — and to handle `NaN` (e.g. `/users/abc`) with a `400 Bad Request` rather than a confusing 404.

**Q4. You register `app.get('/users/:id')` before `app.get('/users/new')`. A user visits `/users/new` and sees the wrong page. Why, and how do you fix it?**

Because Express matches in registration order and `:id` matches any single segment — including the literal word `new`. The generic route wins, with `req.params.id === 'new'`. The fix is order: register the specific static route first (`/users/new`), then the generic parameterised route (`/users/:id`). The general rule is "specific before generic" for every pair of routes that can overlap.

**Q5. What is `express.Router()` and why does mounting matter in a real application?**

`express.Router()` creates a mini Express app with its own route stack, so one resource's routes can live in their own file (`routes/users.js`) instead of all piling into `app.js`. Mounting — `app.use('/api/users', usersRouter)` — attaches that router at a path prefix; the router's routes are relative to the prefix, so the router file never mentions `/api/users`. That keeps `app.js` a short list of mounts, lets the same router be mounted at a different prefix (API versioning), allows router-level middleware (e.g. auth for everything under `/admin`), and lets routers nest. Without it, a large app becomes one unmaintainable file.

**Q6. What is `app.route()` for, and when should you *not* use it?**

`app.route('/items')` returns a chainable object for one path so you can write `.get(…).post(…).put(…)` under it, with the path written exactly once. It exists to prevent typos between duplicated path strings and to group a path's methods visually. It adds no capability — everything it does, separate `app.get`/`app.post` calls do too. Do not use it for a path with only one method; a single `app.get('/items', …)` is clearer.

**Q7. How do you handle 404s in Express, and why must the handler be last?**

Add a catch-all after every route and router: `app.use((req, res) => res.status(404).json({ error: 'Not found', path: req.path }))`. `app.use()` with no path matches any method and any path, so a request reaches it only if nothing above matched. It must be last because the same "matches everything" property means that placed higher it would answer 404 to requests that a later route would have handled. (Express's own fallback only sends a plain HTML `Cannot GET /path` page, which is wrong for an API.)

**Q8. What changed about wildcards between Express 4 and Express 5?**

In Express 4 a bare `*` was the wildcard: `app.get('/files/*', handler)`. In Express 5 that throws a startup error ("Missing parameter name") because the routing library changed to `path-to-regexp` v8. The Express 5 form is a named wildcard: `app.get('/files/*splat', handler)`, and the matched part is available as `req.params.splat`. The name can be anything (`*rest`), but `*splat` is the convention.

**Q9. Can one path have different handlers for GET and POST? How?**

Yes — the HTTP method is part of the route, so `app.get('/users', listUsers)` and `app.post('/users', createUser)` are two independent routes on the same path. Express checks method first, so a `GET /users` request skips the `POST` layer entirely. This is the core of REST: the path names the resource, the verb names the action.

**Q10. What is the difference between `app.use('/api', router)` and `app.get('/api', handler)`?**

`app.use('/api', router)` *mounts*: it matches any method and any path that *starts with* `/api` (`/api/status`, `/api/users/7`), strips the prefix, and hands the rest to the router. `app.get('/api', handler)` is a single *route*: it matches only `GET` requests to exactly `/api`. Use `app.use` for mounting routers and middleware (prefix matching); use `app.get`/`app.post` for exact routes (exact matching).

---

## 13. References

- Express.js official guide — Routing: https://expressjs.com/en/guide/routing.html
- Express.js official guide — Using middleware: https://expressjs.com/en/guide/using-middleware.html (mounting and `app.use`)
- Express.js 5.x API reference — `app.METHOD`, `app.route`, `express.Router`: https://expressjs.com/en/5x/api.html
- Express.js — Migrating from Express 4 to Express 5 (routing / wildcard changes): https://expressjs.com/en/guide/migrating-5.html
- `path-to-regexp` (the route-pattern library behind Express 5): https://github.com/pillarjs/path-to-regexp
- MDN — HTTP request methods: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods
- MDN — Query strings / `URLSearchParams`: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
- Previous topic: [03 — HTTP Fundamentals](../03-http-fundamentals/README.md) · Next topic: [05 — Request and Response](../05-request-response/README.md) · Module README: [../README.md](../README.md)

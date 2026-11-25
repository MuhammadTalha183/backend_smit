# 05 — Request and Response — Notes

> **Module:** 02 — Express.js
> **Topic:** 05 — Request and Response Objects
> **Priority:** 🔴 High
> **Previous topic:** [04 — Routing](../04-routing/README.md)
> **Next topic:** [06 — Middleware](../06-middleware/README.md)
>
> **One-line summary:** Every Express handler receives two objects — `req`, which carries everything the client sent (URL, query string, headers, body), and `res`, which is the only way to answer (status, headers, body). If you can read `req` and control `res`, you can build any API.
>
> **How to use these notes:** read [README.md](./README.md) first for the short overview, then work through this file section by section. Run the example in [`examples/request-response.js`](./examples/request-response.js) and compare your output with [`examples/example.txt`](./examples/example.txt). Then do the tasks in [`exercises.md`](./exercises.md).

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

Topic 04 taught you routing — how Express matches a URL and a method to a handler. But a route that only knows *which* URL was hit is not very useful. A real handler needs to know *what the client asked for*: which user, which search term, what data was submitted, what kind of answer the client can accept. And then it needs to *answer*: with the right status code, the right format, and the right headers.

That is what this topic is about. Express gives every handler two objects:

- **`req` (the request object)** — everything the client sent: the URL, the route parameters, the query string, the headers, the cookies, and the body.
- **`res` (the response object)** — everything you use to answer: the status code, the headers, and the body, in whatever format the client needs.

You already met both objects in earlier topics — every handler signature is `(req, res) => {...}` — but so far you mostly used them to send a fixed string. This topic goes through them properly: every property you will read from `req`, every method you will call on `res`, how the two objects travel through the request lifecycle, and the traps that catch beginners (the body that is `undefined`, the response sent twice, the status code set too late).

By the end of this topic you will be able to: read `req.params`, `req.query`, `req.body`, `req.headers` and `req.cookies`; choose between `res.send`, `res.json`, `res.status`, `res.redirect`, `res.download` and `res.sendFile`; share data with `res.locals`; serve different formats with `res.format`; explain how `express.json()` parses a body; and avoid the classic mistakes — sending two responses, setting headers after the body, and reading `req.body` without a parser.

---

## 2. Definition of Important Concepts

| Concept | Definition |
|---|---|
| **`req` (request object)** | An object Express creates for each incoming HTTP request. It wraps Node.js's `http.IncomingMessage` and adds Express conveniences (`req.params`, `req.query`, `req.body`, `req.get()`). It carries everything the client sent. |
| **`res` (response object)** | An object Express creates for each request. It wraps Node.js's `http.ServerResponse` and adds Express helpers (`res.send`, `res.json`, `res.status`, `res.redirect`). It is the only way to answer the client. |
| **`req.params`** | Route parameters — the named parts of the URL path. For the route `/users/:id`, a request to `/users/42` gives `req.params = { id: '42' }`. Values are always strings. |
| **`req.query`** | The parsed query string — everything after `?` in the URL. For `/search?q=express&page=2`, `req.query = { q: 'express', page: '2' }`. Values are always strings (or arrays for repeated keys). |
| **`req.body`** | The parsed request body (for POST/PUT/PATCH). It is `undefined` unless a body-parsing middleware such as `express.json()` has run. Its shape depends on the `Content-Type` the client sent. |
| **`req.headers`** | All request headers as an object with lower-cased keys, e.g. `req.headers['user-agent']`, `req.headers['content-type']`. `req.get('User-Agent')` is the case-insensitive helper for one header. |
| **`req.cookies`** | Cookies parsed from the `Cookie` header — but only if the `cookie-parser` middleware is installed and used. Without it, `req.cookies` is `undefined` and you must read the raw `Cookie` header yourself. |
| **`res.send(body)`** | Sends a response. It guesses the `Content-Type` from the body: a string becomes `text/html`, an object or array becomes JSON. Ends the response. |
| **`res.json(body)`** | Sends a JSON response: sets `Content-Type: application/json`, runs `JSON.stringify` on the value, and ends the response. The standard way to answer an API client. |
| **`res.status(code)`** | Sets the HTTP status code and returns `res`, so you can chain: `res.status(201).json({...})`. It does not send anything by itself. |
| **`res.redirect([status,] path)`** | Sends a redirect: sets the `Location` header and ends the response. Default status is `302` (Found); pass `301` for a permanent redirect. |
| **`res.locals`** | An object that lives for exactly one request. Middleware can put data on it (`res.locals.user = ...`) and later handlers or templates can read it. It is reset for the next request, so it never leaks between users. |
| **`res.format(object)`** | Content negotiation: picks a response format based on the client's `Accept` header. You give it a handler per MIME type (`'application/json'`, `'text/plain'`, …) plus a `default` for anything unmatched. |
| **Content negotiation** | The process of agreeing on a response format: the client says what it accepts (`Accept: application/json`), the server picks the best format it can serve, or answers `406 Not Acceptable`. |
| **`express.json()`** | Built-in body-parsing middleware. Reads the raw request body, parses it as JSON (only when `Content-Type: application/json`), and attaches the result to `req.body`. |
| **Status code** | The three-digit number in a response that says what happened: `200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `500 Internal Server Error`. Set with `res.status()`. |

---

## 3. Detailed Explanations

### 3.1 Reading the request: `req.params`

Route parameters identify *which* resource the client wants. The route defines the shape; the URL supplies the values.

```js
app.get('/users/:id', (req, res) => {
  res.json({ id: req.params.id });
});
```

- `GET /users/42` → `req.params.id` is `'42'`.
- `GET /users/abc` → `req.params.id` is `'abc'`. Express does not check the type — if you need a number, convert and validate it yourself (`Number(req.params.id)`, and check for `NaN`).
- **Always a string.** Even `/users/42` gives `'42'`, not `42`. Comparing `req.params.id === 42` is `false` — a classic beginner bug.

### 3.2 Reading the request: `req.query`

The query string is everything after `?` in the URL. It is for **optional, non-identifying** input: search terms, filters, sorting, pagination.

```js
app.get('/search', (req, res) => {
  // GET /search?q=express&sort=newest&page=2
  // req.query = { q: 'express', sort: 'newest', page: '2' }
  const { q = '', page = '1' } = req.query;
  res.json({ q, page });
});
```

- **Always strings.** `page=2` arrives as `'2'` — convert with `Number()` when you need arithmetic.

### 3.3 Reading the request: `req.body` and `express.json()`

GET requests carry their data in the URL. POST, PUT and PATCH requests carry it in the **body** — the payload after the headers. A login form sends a username and password in the body; an API client sends a JSON object.

But `req.body` does **not** exist by default. Express deliberately ships without a body parser, and you must add one:

```js
const express = require('express');
const app = express();

app.use(express.json()); // <-- without this line, req.body is undefined

app.post('/echo', (req, res) => {
  res.status(201).json({ received: req.body });
});
```

What `express.json()` actually does, step by step:

1. It checks the request's `Content-Type` header. If it is not `application/json` (or a `+json` variant), it skips the request entirely — `req.body` stays `undefined` (or `{}` in some versions; never rely on it).
2. It reads the raw bytes of the body as they stream in.
3. It runs `JSON.parse` on the text. If the JSON is malformed, it does **not** call your handler — it passes an error to Express's error handling, which answers `400 Bad Request` with a `SyntaxError`.
4. On success it attaches the parsed value to `req.body` and calls `next()`.

Three consequences follow from that:

- **Order matters.** `app.use(express.json())` must be registered *before* any route that reads `req.body`. Middleware runs in registration order; a route defined above the parser never sees a parsed body.
- **The client must send the right `Content-Type`.** A client that posts JSON without `Content-Type: application/json` gets an empty body, even though the bytes are valid JSON. When debugging a missing body, check the header first.
- **Size limit.** By default `express.json()` rejects bodies larger than `100kb` with a `413 Payload Too Large` error. Raise it deliberately — `express.json({ limit: '1mb' })` — when you genuinely expect large payloads, never blindly.

### 3.4 Reading the request: `req.headers` and `req.cookies`

Headers are the metadata of the request — who the client is, what it accepts, what it is sending.

```js
app.get('/headers', (req, res) => {
  res.json({
    userAgent: req.headers['user-agent'],
    contentType: req.get('Content-Type'), // case-insensitive helper
    acceptsJson: req.accepts('json'),     // 'json' if the client accepts it, else false
  });
});
```

- `req.headers` keys are **always lower-cased** by Node.js: `req.headers['User-Agent']` is `undefined`; `req.headers['user-agent']` works. Use `req.get('User-Agent')` when you want case-insensitivity.
- **Cookies:** the browser sends cookies in one `Cookie` header (`Cookie: session=abc; theme=dark`). Express does **not** parse it — `req.cookies` exists only with the `cookie-parser` middleware. Without it, read the raw header: `req.headers.cookie`. Never trust a cookie's contents blindly — cookies are client-controlled input, just like the body.

### 3.5 Answering: `res.send` vs `res.json`

These two look interchangeable, and for objects they nearly are — but they are not the same method, and the difference matters.

```js
res.send('Hello');            // Content-Type: text/html, body: Hello
res.send({ ok: true });       // Content-Type: application/json, body: {"ok":true}
res.json({ ok: true });       // Content-Type: application/json, body: {"ok":true}
res.json('Hello');            // Content-Type: application/json, body: "Hello"
```

| | `res.send` | `res.json` |
|---|---|---|
| **Purpose** | General-purpose: send anything | Specifically: send JSON |
| **String input** | Sent as `text/html` | Sent as a JSON string (`"Hello"`, with quotes) |
| **Object/array input** | Converted to JSON automatically | Converted to JSON |
| **`Content-Type` set** | Guessed from the body | Always `application/json` |
| **`null` / `undefined`** | `res.send()` sends an empty body | `res.json(null)` sends the literal text `null` |


Both methods **end the response**. Anything you do after them — setting a header, sending again — either fails silently or throws `Error: Cannot set headers after they are sent to the client` (see Section 9).

### 3.6 Answering: `res.status` and chaining

`res.status()` sets the status code and returns `res` itself, so you chain the actual send onto it:

```js
app.post('/users', (req, res) => {
  res.status(201).json({ id: 1, name: req.body.name }); // 201 Created
});

app.get('/users/:id', (req, res) => {
  const user = findUser(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});
```

- `res.status(404)` alone sends **nothing**. Forgetting the chained `.json()` or `.send()` leaves the client hanging until it times out.

### 3.7 Answering: `res.redirect`, `res.download`, `res.sendFile`

**`res.redirect`** tells the client to go elsewhere. It sets the `Location` header and ends the response with a `3xx` status (default `302 Found`):

```js
app.get('/old', (req, res) => {
  res.redirect('/new');        // 302 Found, Location: /new
  // res.redirect(301, '/new'); // 301 Moved Permanently — browsers cache this
});
```

Use `301` only when the move is truly permanent — browsers and search engines remember it, and a wrong `301` is hard to undo. Use `302` (the default) for temporary moves and for the classic pattern of redirecting after a form POST so a refresh does not re-submit the form.

**`res.sendFile`** streams a file's contents as the response body. The browser displays it if it can (an image, a PDF, an HTML page):

```js
const path = require('path');

app.get('/manual', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'manual.pdf'));
});
```

- The path **must be absolute** (or relative to the `root` option: `res.sendFile('manual.pdf', { root: './public' })`). A relative path without `root` throws.
- `sendFile` sets `Content-Type` from the file extension automatically, and handles range requests (so a video can seek) for you.

**`res.download`** is `sendFile` with one difference: it adds `Content-Disposition: attachment`, which tells the browser to save the file instead of displaying it:

```js
app.get('/report', (req, res) => {
  res.download(path.join(__dirname, 'report.csv'), 'monthly-report.csv');
});
```

The second argument is the filename the browser suggests when saving. Use `download` for exports and reports; use `sendFile` for files meant to be viewed.

### 3.8 Content negotiation: `res.format` and the `Accept` header

One URL can serve many formats. A browser asking for a user profile wants HTML; a mobile app wants JSON; a script might want plain text. The client states its preference in the `Accept` header, and the server picks the best format it can serve. That is **content negotiation**.

`res.format` is Express's built-in way to do it:

```js
app.get('/data', (req, res) => {
  res.format({
    'application/json': () => {
      res.json({ message: 'Hello from the JSON version' });
    },
    'text/plain': () => {
      res.send('Hello from the plain-text version');
    },
    default: () => {
      res.status(406).send('Not Acceptable: this route serves JSON or plain text only');
    },
  });
});
```

- `Accept: application/json` → the JSON handler runs. `Accept: text/plain` → the text handler runs.
- `Accept: text/html` → no handler matches, so `default` runs. Returning `406 Not Acceptable` there is the honest answer: "I understand the request, but I cannot serve that format." Omitting `default` makes Express answer `406` for you automatically.
- `req.accepts('json')` lets you do the same check manually when `res.format` does not fit, for example inside a condition.

### 3.9 Sharing data within one request: `res.locals`

Middleware often learns something a later handler needs — who the user is, what time the request arrived, which theme to render. The place to put it is `res.locals`:

```js
app.use((req, res, next) => {
  res.locals.appName = 'Request & Response Demo';
  res.locals.requestTime = new Date().toISOString();
  next();
});

app.get('/locals', (req, res) => {
  res.json({ appName: res.locals.appName });
});
```

- `res.locals` is created fresh for **every request** and thrown away when the response ends. Data from one user's request can never leak into another's — which is exactly why you must not use a module-level variable for the same job.
- It is for **request-scoped** data only. Configuration that is the same for every request belongs in a module constant, not in `res.locals`.

---

## 4. How the Technology Works Internally

### 4.1 `req` and `res` are wrappers, not originals

Under Express sits Node.js's built-in `http` module. When a request arrives, Node.js creates an `http.IncomingMessage` (the raw request) and an `http.ServerResponse` (the raw response). Express does not replace them — it **extends** them:

- `req` is the `IncomingMessage` with Express properties mixed in (`req.params`, `req.query`, `req.body`, `req.get()`, `req.accepts()`). Anything Node.js provides — `req.method`, `req.headers`, `req.url`, the readable stream itself — is still there underneath.
- `res` is the `ServerResponse` with Express methods mixed in (`res.send`, `res.json`, `res.status`, `res.redirect`, `res.format`). The low-level methods — `res.writeHead()`, `res.write()`, `res.end()` — still exist underneath, and `res.send` ultimately calls them.

That is why Express feels thin: most of what it does is add convenient properties and methods on top of objects Node.js already built. It also explains the error messages — `Cannot set headers after they are sent` comes from Node.js's `ServerResponse`, not from Express.

### 4.2 How `express.json()` parses the body

`express.json()` is built on the `body-parser` package. It works as a stream consumer:

1. It listens for `data` events on the request stream and collects the chunks into a buffer.
2. When the `end` event fires, it decodes the buffer as UTF-8 text.
3. It calls `JSON.parse` on the text and assigns the result to `req.body`.
4. If parsing fails, it creates a `SyntaxError` with `status: 400` and calls `next(err)`, skipping your handler entirely.

Because the body arrives as a stream, the parser must finish reading before your handler runs — that is why body parsers are middleware placed *before* the routes, and why a handler can never "read the body itself" after `express.json()` has already consumed the stream.

### 4.3 How `res.send` decides what to send

`res.send(body)` runs a small decision tree:

1. **String** → `Content-Type: text/html`, body sent as-is. (Yes — `text/html`, not `text/plain`. A string containing `<b>hi</b>` renders as bold in a browser.)
2. **Buffer** → `Content-Type: application/octet-stream`.
3. **Object or array** → `JSON.stringify`, `Content-Type: application/json`.
4. **Number** → sent as the status code's text? No — as the body, with `Content-Type: text/html`. (Passing a number is a known footgun: `res.send(404)` sends the text `"404"`, it does **not** set the status to 404. Use `res.sendStatus(404)` or `res.status(404).send(...)` for that.)
5. After choosing the type, it sets `Content-Length`, an `ETag` (so browsers can cache), and ends the response with `res.end()`.

`res.json` skips the decision tree: it always stringifies and always sets `application/json`. That predictability is the whole reason it exists.

---

## 5. Architecture or Workflow

### 5.1 The request/response lifecycle

One HTTP request through Express, in order:

```
Client sends HTTP request
        │
        ▼
Node.js http server receives it
  → creates IncomingMessage (req) + ServerResponse (res)
        │
        ▼
Express wraps req/res (adds params, query, helpers)
        │
        ▼
Middleware stack runs in registration order
  → express.json() parses the body (if Content-Type is JSON)
  → your middleware sets res.locals, logs, checks auth…
  → each middleware either calls next() or ends the response
        │
        ▼
Router matches method + path → your handler runs
  → handler reads req.params / req.query / req.body / req.headers
  → handler decides status, format, body
  → handler calls ONE of res.send / res.json / res.redirect /
    res.sendFile / res.download / res.render — exactly once
        │
        ▼
Response bytes travel back to the client
  → headers first, then body, then the connection closes/keeps alive
        │
        ▼
req and res are discarded (res.locals dies with them)
```

### 5.2 Where each `req` property comes from

| Property | Source | When it is available |
|---|---|---|
| `req.method`, `req.url`, `req.headers` | Node.js, straight from the raw request | Immediately |
| `req.params` | The router, after a route pattern matches | Inside a matched handler |
| `req.query` | Express, parsed when `req` is created | Immediately |
| `req.body` | Body-parsing middleware (`express.json()` etc.) | After that middleware runs |
| `req.cookies` | `cookie-parser` middleware | After that middleware runs |

### 5.3 One handler, one response — the branching pattern

Real handlers branch, and every branch must end in exactly one response:

```js
app.get('/users/:id', (req, res) => {
  if (!req.params.id) {
    return res.status(400).json({ error: 'Missing user id' }); // branch 1
  }
  const user = findUser(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' }); // branch 2
  }
  return res.json(user);                                       // branch 3
});
```

The `return` on each branch is the mechanism that guarantees "exactly once": once a branch has answered, the function exits and no later branch can answer again. Handlers written without `return` — an `if` that sends, followed by code that sends again — are the single most common source of the double-send crash.

---

## 6. Real-World Examples

- **User profile API — `req.params`.** `GET /api/users/42` returns user 42's profile. The `42` is the identity of the resource, so it belongs in the path, not in a query string. Every REST API you will build in Topic 10 uses this pattern.
- **Search and pagination — `req.query`.** `GET /api/products?category=shoes&sort=price&page=3&limit=20` — filters, sorting and paging are optional modifiers on the same collection, so they live in the query string. The handler reads them, validates the numbers, and returns one page of results.
- **Login and signup — `req.body`.** `POST /api/login` with `{ "email": "...", "password": "..." }` in the JSON body. Credentials must never travel in the URL (URLs are logged everywhere); the body is the only safe place, and `express.json()` is what makes it readable.
- **Auth token — `req.headers`.** `Authorization: Bearer <token>` arrives as a header. Middleware reads `req.headers.authorization`, verifies the token, and stores the user on `res.locals.user` for the handler — the pattern behind nearly all API authentication.
- **Moved pages — `res.redirect`.** A blog that changes its URL scheme redirects `/old-post` to `/new-post` with a `301`, so old links and search engines keep working. After a successful form POST, a `302` redirect to a "thank you" page stops the browser re-submitting the form on refresh.
- **File export — `res.download`.** An admin dashboard's "Export CSV" button hits `GET /admin/export`, and the server answers with `res.download()` so the browser saves `report.csv` instead of displaying it.
- **One endpoint, two clients — `res.format`.** `GET /users/42` returns an HTML profile page to a browser (`Accept: text/html`) and JSON to a mobile app (`Accept: application/json`). One route, two audiences — the original use case content negotiation was designed for.

---

## 7. Code Examples Where Applicable

### Example 1 — Reading everything off `req`

```js
const express = require('express');
const app = express();
app.use(express.json());

app.get('/users/:id', (req, res) => {
  res.json({
    params: req.params,          // { id: '42' }        — from the path
    query: req.query,            // { verbose: 'true' }  — from ?verbose=true
    userAgent: req.get('User-Agent'),
  });
});

app.post('/users', (req, res) => {
  // req.body is the parsed JSON object the client posted
  res.status(201).json({ created: req.body });
});

app.listen(3000);
```


### Example 2 — `res.send` vs `res.json`

```js
app.get('/text', (req, res) => {
  res.send('Hello, world'); // text/html
});

app.get('/data', (req, res) => {
  res.json({ hello: 'world' }); // application/json — the API default
});

app.get('/created', (req, res) => {
  res.status(201).json({ id: 7 }); // status + body, chained
});

app.get('/missing', (req, res) => {
  res.status(404).json({ error: 'Not found' }); // error body WITH the error code
});
```

### Example 3 — Content negotiation with `res.format`

```js
app.get('/profile/:id', (req, res) => {
  const user = { id: req.params.id, name: 'Talha' };
  res.format({
    'application/json': () => res.json(user),
    'text/plain': () => res.send(`User ${user.id}: ${user.name}`),
    'text/html': () => res.send(`<h1>${user.name}</h1>`),
    default: () => res.status(406).send('Not Acceptable'),
  });
});
```


### Example 4 — The full demo (the runnable example in this topic)

The file [`examples/request-response.js`](./examples/request-response.js) puts it all together in one self-contained app: `req.params`, `req.query`, `req.body`, `req.headers`, `res.status` + `res.json`, `res.redirect`, `res.locals`, and `res.format` — and then calls its own routes with `fetch` and prints the results. Run it with:

```bash
NODE_PATH=/tmp/express-verify/node_modules node examples/request-response.js
```

Expected output is in [`examples/example.txt`](./examples/example.txt). Your port number and the `requestTime` timestamp will differ — everything else should match.

---

## 8. Step-by-Step Code Explanations

### 8.1 The demo file, section by section

**Setup — lines 1–21.** `require('express')` loads Express, `express()` creates the app, and `app.use(express.json())` registers the JSON body parser *before* any route, so `req.body` is available in the POST handler. The second `app.use(...)` is a small middleware that sets `res.locals.appName` and `res.locals.requestTime` on every request and calls `next()` to continue.

**Route 1 — `GET /users/:id`.** The `:id` segment is captured into `req.params.id`. The handler answers with `res.status(200).json(...)`. The `200` is explicit here for teaching; Express would default to `200` anyway. Note the value is a string: the response is `{ id: '42', ... }`, not `{ id: 42 }`.

**Route 2 — `GET /search`.** No route parameters — the input comes from `req.query`. Destructuring with defaults (`const { q = '', limit = '10' } = req.query`) handles a missing `q` or `limit` without an `if`. `Number(limit)` converts the string `'2'` to the number `2` before slicing the results array.

**Route 3 — `POST /echo`.** The client posts JSON; `express.json()` has already parsed it into `req.body`. The handler answers `201 Created` (a new resource — the echoed payload — was "created") with `{ received: req.body }`. Without the `express.json()` line at the top, `req.body` would be `undefined` and the response would be `{}`.

**Route 4 — `GET /headers`.** `req.headers['user-agent']` reads the raw header (lower-cased key). The demo's fetch sends `User-Agent: request-response-demo/1.0`, and that exact string comes back.

**Routes 5 — `GET /old` and `GET /new`.** `/old` calls `res.redirect('/new')`, which answers `302` with a `Location: /new` header and no body. `/new` answers with `res.send(...)` — a plain string, so the `Content-Type` is `text/html`.

**Route 6 — `GET /locals`.** Reads back the values the middleware stored on `res.locals`. This proves the data survived from middleware to handler within the same request — and because `requestTime` is a fresh timestamp per request, it also proves `res.locals` does not leak between requests.

**Route 7 — `GET /data`.** `res.format` with three keys: `application/json`, `text/plain`, and `default`. The demo calls it three times with three different `Accept` headers, so you see all three branches: JSON, plain text, and the `406`.

**Self-test — the `app.listen(0, ...)` block.** Port `0` asks the OS for any free port, so the demo never clashes with another server; `server.address().port` reads back the port actually chosen. Then `await fetch(...)` calls exercise every route and log each status plus its body. The `/old` call uses `redirect: 'manual'` so `fetch` does *not* follow the redirect — otherwise you would never see the `302` and the `Location` header. The block is wrapped in `try / finally`, and `finally` calls `server.close()` then `process.exit(0)`, so the process terminates instead of hanging.

---

## 9. Common Misconceptions

| Misconception | The truth |
|---|---|
| "`req.body` is always available." | No. `req.body` is `undefined` until a body-parsing middleware runs. For JSON you must register `app.use(express.json())` **before** your routes. |
| "`req.params.id` is a number when the URL has a number." | No. Route parameters and query values are **always strings**. Convert with `Number()` and validate the result. |
| "`res.status(404)` sends a 404 response." | No. It only *sets* the status. Nothing is sent until you chain `.json()`, `.send()` or `.end()`. A handler that calls only `res.status(404)` leaves the client hanging. |
| "`res.send(404)` sends a 404 status." | No. It sends the *body* `"404"` with status `200`. Use `res.status(404).send(...)` or `res.sendStatus(404)`. |
| "`res.send` and `res.json` are identical." | Nearly — but not for strings. `res.send('Hi')` returns plain text (`text/html`); `res.json('Hi')` returns the JSON string `"Hi"` with quotes. For APIs, `res.json` states the intent. |
| "I can send a response, then send another one later in the same handler." | No. A response can be sent exactly once. The second attempt throws `Error: Cannot set headers after they are sent to the client`. Use `return` after each response in branching handlers. |
| "`req.cookies` works out of the box." | No. Express does not parse cookies. `req.cookies` exists only with the `cookie-parser` middleware; otherwise read the raw `Cookie` header. |
| "`res.redirect` always means 301." | No. The default is `302` (temporary). Pass `301` explicitly only for a genuinely permanent move — browsers cache it. |
| "If the client sends JSON, Express parses it automatically." | No. Express checks the `Content-Type` header. JSON sent without `Content-Type: application/json` is ignored by `express.json()` and `req.body` stays empty. |

---

## 10. Important Technical Terminology

| Term | Meaning |
|---|---|
| **Request object (`req`)** | Express's per-request object carrying everything the client sent. |
| **Response object (`res`)** | Express's per-request object used to build and send the answer. |
| **Route parameter** | A named URL segment (`:id`) captured into `req.params`. |
| **Request body** | The payload of POST/PUT/PATCH requests, available as `req.body` after parsing. |
| **Header** | A key–value metadata line of an HTTP message (`Content-Type`, `Authorization`, `Accept`). |
| **Status code** | The three-digit number saying what happened (`200`, `201`, `404`, `500`). |
| **Content-Type** | The header naming the format of a body (`application/json`, `text/html`, `text/plain`). |
| **Content negotiation** | Agreeing on a response format from the client's `Accept` header (`res.format`). |
| **`res.locals`** | Per-request storage shared between middleware, handlers and templates. |

---

## 11. Summary

- Every Express handler receives `(req, res)`: `req` is everything the client sent, `res` is the only way to answer.
- Read identity from the path with `req.params` (`/users/:id` → `req.params.id`, always a string).
- Read optional input from the query string with `req.query` (`?q=...&page=2`, always strings, missing keys are `undefined`).
- Read submitted data from `req.body` — but only after `app.use(express.json())`, registered before the routes, and only when the client sent `Content-Type: application/json`.
- Answer with `res.json` for APIs and `res.send` for text/HTML; `res.json` always sets `application/json`, `res.send` guesses from the body.
- Set the outcome with `res.status(code)` and chain the body onto it — `res.status(201).json({...})` — and make the code match the outcome, especially for errors.
- Redirect with `res.redirect` (`302` by default, `301` only for permanent moves); serve a file for viewing with `res.sendFile` (absolute path) and for saving with `res.download`.
- Share data within one request with `res.locals` — fresh per request, never leaking between users.
- A response is sent exactly once: `return` after every response in a branching handler, and never set headers after the body has gone out.

---

## 12. Interview Questions and Answers

**Q1. What are `req` and `res` in Express?**

`req` is the request object — everything the client sent: method, URL, route parameters, query string, headers, cookies and body. `res` is the response object — the tool for answering: status code, headers and body. Express builds both by extending Node.js's `http.IncomingMessage` and `http.ServerResponse` with convenience properties and methods. Every handler signature is `(req, res, next) => {...}`.

**Q2. What is the difference between `req.params` and `req.query`? Give an example of each.**

`req.params` holds named segments of the URL path, defined by the route: `/users/:id` with a request to `/users/42` gives `req.params = { id: '42' }`. It identifies *which* resource. `req.query` holds the parsed query string after `?`: `/search?q=express&page=2` gives `req.query = { q: 'express', page: '2' }`. It holds optional modifiers — search terms, filters, sorting, pagination. Both are always strings.

**Q3. Why is `req.body` undefined in my POST handler?**

Because no body-parsing middleware has run — Express does not parse bodies by default. For JSON, register `app.use(express.json())` **before** the route. Two other causes: the client did not send `Content-Type: application/json`, so the parser skipped the request; or the JSON is malformed, in which case Express answers `400` and your handler never runs.

**Q4. What is the difference between `res.send` and `res.json`?**

`res.send` is general-purpose and guesses the `Content-Type` from the body: a string becomes `text/html`, an object becomes JSON. `res.json` always sets `Content-Type: application/json` and stringifies the value. The visible difference is strings: `res.send('Hi')` returns `Hi`, while `res.json('Hi')` returns `"Hi"` with quotes. For APIs, prefer `res.json` — it states the format explicitly.

**Q5. What does `res.status()` do? Does it send a response?**

No — it only sets the status code and returns `res` so you can chain: `res.status(201).json({...})`. Forgetting the chained send is a common bug: the handler finishes, nothing is sent, and the client waits until it times out. Also note the reverse trap: `res.send(404)` does not set a 404 status; it sends the text `"404"` with status `200`.

**Q6. How do you redirect in Express, and when do you use 301 vs 302?**

With `res.redirect(path)` — default status `302 Found` — or `res.redirect(301, path)` for a permanent redirect. Use `301` when a URL has moved forever (old blog URLs, a renamed route): browsers and search engines cache it. Use `302` for temporary moves and for redirecting after a form POST so a refresh does not re-submit the form.

**Q7. What is content negotiation, and how does `res.format` work?**

Content negotiation is agreeing on a response format: the client lists what it accepts in the `Accept` header, and the server picks the best format it can serve. `res.format` takes an object mapping MIME types to handlers and runs the one matching the client's `Accept` header. A `default` handler covers anything unmatched (conventionally `406 Not Acceptable`); without `default`, Express sends `406` itself.

**Q8. What is `res.locals` and why not use a global variable instead?**

`res.locals` is an object that lives for exactly one request. Middleware can set data on it (for example the logged-in user) and later handlers or templates can read it. A global or module-level variable would be shared across all concurrent requests, so one user's data could leak into another user's response. `res.locals` is created fresh per request and discarded when the response ends, which makes it safe.

**Q9. What is the difference between `res.sendFile` and `res.download`?**

Both send a file. `res.sendFile` streams the file as the response body with a `Content-Type` guessed from the extension, so the browser displays it if it can (PDF, image, HTML). `res.download` adds `Content-Disposition: attachment`, so the browser saves the file instead of displaying it, using the filename you pass as the second argument. Both need an absolute path (or the `root` option).

**Q10. What happens if you try to send two responses in one handler?**

The second send throws `Error: Cannot set headers after they are sent to the client`, because the headers are already on the wire. It usually happens in branching handlers: an `if` sends an error response, execution continues, and the code below sends again. The fix is to `return` after every response — `return res.status(404).json(...)` — so the handler exits immediately.

**Q11. How does `express.json()` work internally?**

It is middleware built on `body-parser`. It checks the `Content-Type` header and skips non-JSON requests. Otherwise it collects the body's stream chunks, decodes them as UTF-8, runs `JSON.parse`, attaches the result to `req.body`, and calls `next()`. Malformed JSON produces a `SyntaxError` (`400`); bodies over the default `100kb` limit are rejected with `413` unless you raise it.

**Q12. A client sends `Accept: application/json` but your route only serves HTML. What should the server do?**

Answer `406 Not Acceptable` — the honest status for "I understood the request but cannot serve any format you accept." With `res.format`, that is the `default` handler (or Express's automatic `406`). Do not silently return HTML anyway: the client asked for JSON, and HTML it cannot parse is worse than a clear error.

---

## 13. References

- Express.js — API Reference, Request object: https://expressjs.com/en/5x/api.html#req
- Express.js — API Reference, Response object: https://expressjs.com/en/5x/api.html#res
- Express.js — API Reference, `res.format`: https://expressjs.com/en/5x/api.html#res.format
- Express.js — API Reference, `express.json()`: https://expressjs.com/en/5x/api.html#express.json
- MDN — HTTP response status codes: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
- MDN — Content negotiation: https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiation
- MDN — `Accept` header: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept
- Node.js — `http.IncomingMessage`: https://nodejs.org/api/http.html#class-httpincomingmessage
- Node.js — `http.ServerResponse`: https://nodejs.org/api/http.html#class-httpserverresponse
- Previous topic: [04 — Routing](../04-routing/README.md) · Next topic: [06 — Middleware](../06-middleware/README.md)

---

[← Main README](../../README.md) · Previous: [04 — Routing](../04-routing/README.md) · Next: [06 — Middleware](../06-middleware/README.md)

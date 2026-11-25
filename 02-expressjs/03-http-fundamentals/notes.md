# 03 — HTTP Fundamentals — Notes

> **Module:** 02 — Express.js
> **Topic:** 03 — HTTP Fundamentals
> **Priority:** 🔴 High
> **Previous topic:** [02 — Project Setup](../02-project-setup/README.md)
> **Next topic:** [04 — Routing](../04-routing/README.md)
>
> **One-line summary:** HTTP is a simple request/response conversation — a client asks for something with a method, a URL, headers and maybe a body, and the server answers with a status code, headers and maybe a body. Express does not replace that conversation; it organises it, giving you friendly `req` and `res` objects built on top of Node.js's own `http` module.
>
> **How to use these notes:** read [README.md](./README.md) first for the short overview, then work through this file section by section. Run the example in [`examples/http-demo.js`](./examples/http-demo.js) and compare your output with [`examples/example.txt`](./examples/example.txt). Then do the tasks in [`exercises.md`](./exercises.md).

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
- [10. Important Terminology](#10-important-terminology)
- [11. Summary](#11-summary)
- [12. Interview Questions and Answers](#12-interview-questions-and-answers)
- [13. References](#13-references)

---

## 1. Introduction

Every web page you have ever opened, every API call your apps have ever made, and every form you have ever submitted all run on the same protocol: **HTTP** — the HyperText Transfer Protocol. It is the language browsers and servers use to talk to each other, and it has been doing that job since the early 1990s.

The good news for a backend learner is that HTTP is deliberately simple. There is no permanent connection to manage, no session to keep alive, no complicated handshake to memorise. Each interaction is one self-contained exchange:

1. A **client** (a browser, a mobile app, Postman, `fetch()` in your own code) sends a **request**.
2. A **server** (your Express app) sends back a **response**.
3. That is the whole conversation. Then both sides move on.

That simplicity is why HTTP survived while fancier protocols came and went — and why Express could be built as a thin, friendly layer on top of it instead of a whole new system.

**Why this topic matters before you write real routes:** every Express feature you will meet in the rest of this module is just HTTP with a nicer name. Routing is matching a method + URL. Middleware is code that runs while a request is on its way to a handler. `res.json()` is building a response with the right headers and status code. If you understand HTTP itself, Express stops looking like magic and starts looking like a toolbox — and when something goes wrong, you will debug the HTTP underneath instead of guessing at Express.

**What this topic covers:** the shape of a request and a response, the five HTTP methods you will use every day (GET, POST, PUT, PATCH, DELETE) and the ideas of *safe* and *idempotent*, the status codes that matter (200 through 503), the headers that carry metadata in both directions, the request/response cycle end to end, how Express sits on Node.js's built-in `http` module, how JSON and form bodies are sent and parsed, and finally where data belongs — query string, route parameter, or body.

By the end of this topic you will be able to: choose the right method and status code for any API operation; read a request and a response like a sentence; explain what Express adds on top of Node.js's `http` module; and wire up JSON and form body parsing without cargo-culting the two middleware lines every tutorial pastes in.

---

## 2. Definition of Important Concepts

| Concept | Definition |
|---|---|
| **HTTP** | HyperText Transfer Protocol — the rules for how a client and a server exchange messages over the web. Despite the name, it now carries JSON, images, files and video, not just hypertext. |
| **Request** | A message a client sends to a server: a method, a URL, headers, and an optional body. |
| **Response** | A message a server sends back: a status code, headers, and an optional body. |
| **Method (verb)** | The word in a request that says *what* the client wants to do: GET (read), POST (create), PUT (replace), PATCH (partial update), DELETE (remove). |
| **URL / URI** | The address of the thing being requested: scheme (`http`), host, port, path (`/users/42`), and optional query string (`?q=express`). |
| **Header** | A `Name: value` metadata line in a request or a response, e.g. `Content-Type: application/json`. Headers describe the message; they are not the message itself. |
| **Body (payload)** | The data carried by a request or response — usually JSON for APIs, or form data, or a file. GET requests normally have no body. |
| **Status code** | The three-digit number in a response that says how the request went: `200` OK, `404` Not Found, `500` Internal Server Error. The first digit is the family. |
| **Safe method** | A method that does not change anything on the server. GET is safe; POST, PUT, PATCH and DELETE are not. Safe methods can be retried and cached freely. |
| **Idempotent method** | A method where repeating the same request has the same effect as doing it once. GET, PUT and DELETE are idempotent; POST is not. |
| **Route parameter** | A named part of the URL path that identifies one resource, e.g. `:id` in `/users/:id` — Express puts it in `req.params`. |
| **Query string** | The `?key=value&key2=value2` part after a URL path, used for filtering, sorting and searching — Express puts it in `req.query`. |
| **Content-Type** | The header that says what format a body is in, e.g. `application/json`. The receiver uses it to decide how to parse the body. |

---

## 3. Detailed Explanations

### 3.1 The shape of a request

Every HTTP request has four parts. Take this example — a browser asking for a user's profile:

```http
GET /users/42?tab=posts HTTP/1.1
Host: api.example.com
Accept: application/json
Authorization: Bearer abc123

```

1. **Request line** — `GET /users/42?tab=posts HTTP/1.1`: the method, the path plus query string, and the HTTP version. This is the one line the server routes on. 2. **Headers** — `Host`, `Accept`, `Authorization`: `Name: value` metadata (who is asking, what format they want, what credentials they carry). 3. **A blank line** separates headers from body (always there, even with no body). 4. **Body** — the data, if any; this GET has none, while a POST creating a user would carry e.g. `{"name": "Talha"}`.

### 3.2 The shape of a response

A response mirrors the request, with one difference: instead of a method it carries a **status code**.

```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 34

{"id": 42, "name": "Talha"}
```

1. **Status line** — `HTTP/1.1 200 OK`: version, three-digit code, short reason phrase. 2. **Headers** — `Content-Type` says the body is JSON, `Content-Length` says how many bytes it is. 3. **A blank line**, then the **body** — the actual data.

Notice the symmetry: the request's `Accept: application/json` ("please send JSON") is answered by the response's `Content-Type: application/json` ("here is JSON"). Headers are how the two sides negotiate.

### 3.3 HTTP methods — what each one means

There are more methods in the spec (HEAD, OPTIONS, TRACE...), but five do almost all the work in APIs:

| Method | Meaning | Safe? | Idempotent? | Body? | Typical use |
|---|---|---|---|---|---|
| **GET** | Read a resource | Yes | Yes | No | Fetch a user, list products, search |
| **POST** | Create a new resource (or trigger an action) | No | **No** | Yes | Create a user, submit a form, log in |
| **PUT** | Replace a whole resource | No | Yes | Yes | Replace a user's entire profile |
| **PATCH** | Change part of a resource | No | Yes* | Yes | Change just a user's email |
| **DELETE** | Remove a resource | No | Yes | No | Delete a user |

\* PATCH is idempotent only if the patch itself is written that way (e.g. "set email to X" — repeating it changes nothing the second time). "Increment the counter by 1" as a PATCH is *not* idempotent. In practice, treat PATCH as "usually idempotent, verify the operation".

**Why POST is the only non-idempotent one:** POST means "create something new", and the server usually assigns the new thing an ID — send it twice and you get two users, two orders, two charges. That is why browsers warn before resubmitting a form and why payment APIs use *idempotency keys*. GET, PUT and DELETE can be retried freely. **Safe vs idempotent — not the same thing:** *safe* means "changes nothing at all", *idempotent* means "repeating it has the same effect as doing it once". GET is both; DELETE and PUT are idempotent but not safe — they change state, but the same request twice ends in the same state.

### 3.4 Status codes — the ones that matter

Status codes are grouped by their first digit. Learn the families first, then the individual codes:

| Family | Meaning | Examples |
|---|---|---|
| **1xx — Informational** | "Hold on, still working." Rarely seen in APIs. | 100 Continue |
| **2xx — Success** | The request worked. | 200, 201, 204 |
| **3xx — Redirection** | "Go look over there instead." | 301, 302, 304 |
| **4xx — Client error** | The *client* did something wrong. | 400, 401, 403, 404, 405, 409, 422 |
| **5xx — Server error** | The *server* did something wrong. | 500, 502, 503 |

The codes you will actually return, and when:

| Code | Meaning | When an API returns it |
|---|---|---|
| **200 OK** | Standard success | GET found the thing; PUT/PATCH updated it; DELETE removed it and you want to say so |
| **201 Created** | A new resource exists | POST created something — return the created object (with its new ID) in the body |
| **204 No Content** | Success, deliberately no body | DELETE removed the thing; a 204 *must not* have a body — Express strips it if you try |
| **301 Moved Permanently** | The resource moved forever | Old URL replaced by a new one; browsers and search engines remember it (temporary sibling: 302) |
| **400 Bad Request** | The request is malformed | Invalid JSON, a missing required field, a query value that is not a number |
| **401 Unauthorized** | Unauthenticated | No credentials, or invalid/expired ones — the client should log in (again) and retry |
| **403 Forbidden** | Authenticated but not allowed | A logged-in student trying to delete another student's record; retrying will not help |
| **404 Not Found** | The resource does not exist | `/users/999` when there is no user 999, or a route that does not exist at all |
| **405 Method Not Allowed** | Wrong method for this resource | POST to `/users/42` when only GET and DELETE are defined — include an `Allow` header |
| **409 Conflict** | State refuses the request | Creating a user with an email that already exists; the request is fine, the *state* says no |
| **422 Unprocessable Entity** | Well-formed but fails business rules | An email that is not shaped like an email, a booking date in the past, a quantity of −3 |
| **500 Internal Server Error** | The server broke | An uncaught exception, a database crash — never leak internals (stack traces, SQL) in the body |
| **503 Service Unavailable** | Temporarily unable to serve | Overloaded, restarting, or a dependency (like the database) is down; often with `Retry-After` |

The 400 vs 422 line: 400 = "I cannot read this", 422 = "I can read it, but it does not make sense".

**The 4xx vs 5xx rule of thumb:** if the client could fix it by changing the request, it is a 4xx. If nothing the client does would help, it is a 5xx. Getting this right matters because clients, monitoring tools and retry logic all branch on it — a client retries a 503, but it should never retry a 400 with the same body.

### 3.5 Headers — metadata in both directions

Headers are `Name: value` lines. Header names are **case-insensitive** (`Content-Type` and `content-type` are the same header), though by convention they are written in `Capitalised-With-Dashes` form. A few headers do most of the work:

**Request headers (client → server):**

- `Host` — which site the request is for. Required; one server can host many sites.
- `Accept` — what response formats the client understands, e.g. `Accept: application/json`. The server uses it for *content negotiation*.
- `Authorization` — credentials, usually `Bearer <token>` for APIs. Never put secrets in the URL — URLs end up in logs; headers are the right place.
- `Content-Type` — what format the *request* body is in, e.g. `application/json`. Only present when there is a body.

**Response headers (server → client):**

- `Content-Type` — what format the *response* body is in. `res.json()` sets this to `application/json` for you; `res.send('text')` sets `text/html`.
- `Location` — where the resource now is. Used with 201 (URL of the created resource) and 3xx redirects.
- `Cache-Control` — how the response may be cached (`no-cache`, `max-age=3600`).
- `Allow` — which methods are allowed on this resource (sent with 405).

**Custom headers** — anything starting with `X-` by convention, e.g. `X-Request-Id`, `X-Rate-Limit-Remaining`. APIs use them for tracing, rate limits and feature flags. In Express you set one with `res.set('X-Custom-Header', 'value')` and read a request header with `req.get('X-Client-Name')` (case-insensitive lookup — use `req.get()`, never `req.headers['X-Client-Name']` with the wrong case).

### 3.6 JSON vs form data — three body formats

A body is just bytes; `Content-Type` is what gives those bytes meaning. Three formats cover nearly everything:

| Format | Content-Type | What it looks like | Parsed by |
|---|---|---|---|
| **JSON** | `application/json` | `{"name": "Talha", "age": 21}` | `express.json()` |
| **URL-encoded form** | `application/x-www-form-urlencoded` | `name=Talha&age=21` | `express.urlencoded()` |
| **Multipart form** | `multipart/form-data` | Binary parts with boundaries | *Not* built into Express — use `multer` |

**Which to use:** JSON is the default for APIs — structured and typed (numbers stay numbers). URL-encoded is what a plain HTML `<form>` sends by default — flat key/value pairs, everything a string, no nesting; `extended: true` uses the `qs` library so nested objects like `user[name]=Talha` work. Multipart is for file uploads — each field is a separate "part" separated by a boundary string — and Express deliberately does not parse it; `multer` is the standard middleware for it.

**The golden rule:** the `Content-Type` header and the parser must agree. If the client sends JSON but the server only runs `express.urlencoded()`, `req.body` will be `{}` or `undefined` — the body arrived fine, nobody parsed it. And if the client forgets `Content-Type: application/json`, `express.json()` will skip the body even though it *is* JSON. When `req.body` is mysteriously empty, check `Content-Type` first.

### 3.7 Query strings vs route params vs body

The same piece of data can travel in three places — but each place has one job:

| | Route param | Query string | Body |
|---|---|---|---|
| Example | `/users/42` | `/users?role=admin&sort=name` | `{"name": "Talha"}` in POST |
| Express | `req.params.id` | `req.query.role` | `req.body` |
| Job | **Identify one resource** | **Filter, sort, search, paginate** | **Carry data to create/change** |
| Required? | Yes — the route does not match without it | No — optional, defaults apply | Yes for POST/PUT/PATCH |
| Visible in URL? | Yes | Yes | No |

Rules of thumb:

- **Identifying which thing:** route param (`/users/42` — the 42 *is* the resource). **Narrowing a list:** query string (`/users?role=admin&page=2` — still the users collection, just filtered; a search is a GET with criteria in the query string, which keeps it shareable and bookmarkable).
- **Sending new or changed data:** body. Never put a password, a long text, or a whole object in the URL — URLs are logged, bookmarked, and have length limits. **A GET request has no body** by convention — servers, proxies and caches may ignore one, so put GET data in the path or the query string.

---

## 4. How the Technology Works Internally

### 4.1 HTTP on the wire: TCP, then text

HTTP does not move data by itself — it rides on **TCP**. When a client wants to talk to a server:

1. **DNS** turns the hostname (`api.example.com`) into an IP address; then a **TCP handshake** opens a connection to that IP on a port (80 for HTTP, 443 for HTTPS).
3. The client sends the request as **plain text** (in HTTP/1.1) over that connection: the request line, the headers, a blank line, the body.
4. The server reads the text, works out what is being asked, and sends the response back as text over the same connection.
5. The connection may close, or stay open for the next request (*keep-alive*).

HTTP/1.1 text is human-readable — you can literally `telnet` to a server, type a request, and read the response. HTTP/2 and HTTP/3 compress and multiplex the same messages, but the *semantics* (method, URL, headers, status, body) are unchanged. **HTTPS** is HTTP with TLS encryption wrapped around it: the messages are identical, only the transport is encrypted. Your Express app in development runs plain HTTP on `localhost` — fine for learning, never for production with real user data.

### 4.2 How Node.js serves HTTP: the `http` module

Node.js has HTTP built in — no framework needed:

```js
const http = require('node:http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello, HTTP!');
});
server.listen(3000);
```

That callback runs once per request. Two objects arrive:

- **`req` — an `http.IncomingMessage`.** A *readable stream* plus parsed metadata: `req.method` (`'GET'`), `req.url` (`'/users/42?tab=posts'` — the raw string, query included), `req.headers` (an object with lowercased names). The body is **not** parsed — it arrives as chunks of the stream, and you must collect it yourself.
- **`res` — an `http.ServerResponse`.** A *writable stream* with helpers: `res.writeHead(status, headers)` sets the status and headers, `res.write(chunk)` sends part of the body, `res.end(data)` finishes the response. Until you call `res.end()`, the client waits.

Two facts about raw Node.js HTTP explain half of Express's design: **(1) the body is a stream** — Node.js hands you the request as soon as the headers arrive and the body streams in after, which is why `express.json()` exists (it collects the chunks, joins them, and runs `JSON.parse()` for you); **(2) there is no routing** — the `http` module calls your *one* callback for every request, whatever the method or URL, so matching `/users` vs `/products` is an `if (req.url === ...)` you write yourself. Express is, at its core, a routing layer on top of this single callback.

### 4.3 How Express sits on top of `http`

When you call `app.listen(3000)`, Express creates an `http` server and passes your `app` function as its request handler (`http.createServer(app)`) — `app` is a function with the signature `(req, res, next)`, which *is* the callback Node.js's `http` module expects. Express then wraps the raw objects before your route handler sees them:

- **`req` is still `IncomingMessage`, extended.** It keeps `req.method`, `req.url` and `req.headers`, and Express adds `req.params` (route params), `req.query` (parsed query string), `req.body` (filled in by body-parsing middleware), `req.get(name)` (case-insensitive header lookup), and more. The raw stream is still underneath — `req` is a stream you can read from.
- **`res` is still `ServerResponse`, extended.** It keeps `writeHead`/`write`/`end`, and Express adds `res.status(code)` (chainable status setter), `res.json(obj)` (stringify + set `Content-Type: application/json`), `res.send(body)` (send text/HTML/JSON with the right headers), `res.set(name, value)` (set a header), and `res.redirect(url)`.
- **Middleware is a pipeline.** Instead of one callback, Express runs your request through a chain of functions in order — logger, body parser, authentication, then the route handler. Each function either passes the request on with `next()` or ends the response. If nobody ends it, the client hangs until it times out.

The important mental model: **Express does not replace HTTP — it organises it.** The request that reaches your route handler is the same HTTP request the client sent; Express has just parsed the useful bits into convenient properties and given you helpers to build the response. When Express confuses you, think one layer down: what does the raw request look like, and what does the raw response need to be?

### 4.4 What happens to a JSON body, step by step

When a client POSTs `{"name": "Talha"}` with `Content-Type: application/json`:

1. Node.js's `http` parser reads the headers and emits the `request` event; the Express pipeline starts. 2. `express.json()` checks `req.headers['content-type']` — it is `application/json`, so this middleware claims the body (anything else and it calls `next()` immediately, leaving the body alone). 3. It reads the body stream chunk by chunk into a buffer — over the default 100kb limit, the request is rejected with **413 Payload Too Large**. 4. It runs `JSON.parse()` on the joined text; malformed JSON does **not** crash your app, it passes a 400 error to the error-handling middleware. 5. It assigns the result to `req.body` and calls `next()` — your handler now reads `req.body.name` like any object. `express.urlencoded()` does the same for `name=Talha&age=21` bodies, with a query-string parser instead of `JSON.parse()`. Both only run on requests that actually have a body — GET requests pass straight through.

---

## 5. Architecture or Workflow

### 5.1 The request/response cycle end to end

```
Client ──1. build request (method + URL + headers + body)──▶ DNS + TCP (+TLS)
Node.js http server ── parses request line + headers, emits 'request' (req, res)
Express app ── 2. express.json() parses body → req.body
            ── 3. router matches method + path → route handler
            ── 4. handler reads req.params / req.query / req.body, does the work
            ── 5. handler builds response: res.status(code).json(data)
Node.js http server ── serialises response (status + headers + body) ──▶ TCP
Client ── reads status code, then headers, then body ──▶ renders / hands JSON on
```

### 5.2 A concrete trace: `GET /users/42`

1. The client sends `GET /users/42 HTTP/1.1` with `Host: localhost:3000` and `Accept: application/json`; Node.js parses it and creates `req` (`method: 'GET'`, `url: '/users/42'`) and `res`.
2. Express runs its middleware: `express.json()` sees no body and no JSON content type — passes through.
3. The router compares the request against registered routes in order: `GET /`? No. `GET /users/:id`? Yes — `:id` captures `42`, so `req.params = { id: '42' }`.
4. The handler looks up user 42 (in a real app, from the database) and calls `res.status(200).json(user)`; `res.json()` sets `Content-Type: application/json`, stringifies the object, and calls `res.end()` — Node.js sends `HTTP/1.1 200 OK` + headers + body back over TCP, and the client parses the JSON.

### 5.3 A concrete trace: `POST /echo` with a JSON body

1. The client sends headers including `Content-Type: application/json` and `Content-Length: 29`, then the body `{"message": "hello", "count": 3}`; `express.json()` sees the matching content type, collects the body stream, parses it, and sets `req.body = { message: 'hello', count: 3 }`.
2. The router matches `POST /echo`, the handler calls `res.status(201).json(req.body)`, and the client receives `201 Created` with the same JSON back — proof the server understood the body.

### 5.4 How the pieces of this topic fit the rest of the module

**Where this goes next:** Topic 04 Routing (matching method + path, route params in depth) · Topic 05 Req/Res (every `req`/`res` property and helper) · Topic 07 Controllers (handler logic out of route files) · Topic 08 Errors (which 4xx/5xx when a handler throws) · Topic 09 Validation (400 vs 422, checking bodies properly) · Topic 10 REST APIs (methods + status codes as a real API design).

Every later topic assumes this one: routing is method + path matching, controllers are functions that build responses, error handling is choosing the right 4xx/5xx, and REST is methods and status codes used consistently. If a later topic feels confusing, come back here first.

---

## 6. Real-World Examples

- **Logging in.** The client POSTs `{"email": "...", "password": "..."}` to `/auth/login`. Correct credentials → `200` with a JSON body containing a token, plus the token also sent as an `Authorization: Bearer <token>` header on later requests. Wrong password → `401`. A logged-in user asking for the admin panel → `403`.
- **Creating an order.** POST `/orders` with the cart in the body → `201 Created` with the new order (including its ID) in the body, and a `Location: /orders/1042` header pointing at it. The client POSTs the same order twice by accident → two orders, because POST is not idempotent — real shops prevent this with idempotency keys.
- **Fetching a feed.** GET `/posts?sort=newest&page=2` — query string for sorting and pagination, no body. The response is `200` with a JSON array. The browser caches it, because GET is safe.
- **Updating a profile.** PUT `/users/42` with the *complete* new profile replaces everything (a field you leave out is wiped). PATCH `/users/42` with `{"email": "new@example.com"}` changes only the email. Sending the same PATCH twice is harmless; sending the same POST twice is not.
- **A file upload form.** A plain HTML form with a file input sends `multipart/form-data` — `express.json()` ignores it, and the file would never arrive without `multer`. This is the single most common "my upload doesn't work" cause.
- **A moved blog post.** GET `/blog/old-slug` → `301 Moved Permanently` with `Location: /blog/new-slug`. The browser follows it automatically and search engines update their index.

---

## 7. Code Examples Where Applicable

### 7.1 The raw `http` module vs Express

Raw Node.js — you compare method and URL yourself, set status and headers with `writeHead`, and stringify JSON by hand:

```js
const http = require('node:http');
const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello, HTTP!');
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});
server.listen(3000);
```

The same thing in Express — `app.get()` is the method + path match, `res.status().send()` replaces `writeHead` + `end`, `res.json()` replaces `JSON.stringify` + the `Content-Type` header, and the final `app.use()` is a catch-all 404:

```js
const express = require('express');
const app = express();
app.get('/', (req, res) => {
  res.status(200).send('Hello, HTTP!');
});
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});
app.listen(3000);
```

### 7.2 Methods and status codes in a tiny users API

```js
const express = require('express');
const app = express();
app.use(express.json());

const users = [{ id: 1, name: 'Talha' }];

app.get('/users', (req, res) => {
  res.status(200).json(users);                    // list → 200
});
app.post('/users', (req, res) => {
  const user = { id: users.length + 1, ...req.body };
  users.push(user);
  res.status(201).json(user);                     // created → 201
});
app.put('/users/:id', (req, res) => {
  const user = users.find((u) => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  Object.assign(user, req.body);                  // replace fields
  res.status(200).json(user);
});
app.delete('/users/:id', (req, res) => {
  const index = users.findIndex((u) => u.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'User not found' });
  users.splice(index, 1);
  res.status(204).send();                         // deleted, no body → 204
});
```

### 7.3 Headers — reading and setting them

```js
app.get('/headers', (req, res) => {
  const token = req.get('Authorization');   // case-insensitive read
  const agent = req.get('User-Agent');
  res.set('X-Custom-Header', 'http-fundamentals'); // custom response header
  res.set('Cache-Control', 'no-store');            // don't cache this response
  res.status(200).json({ token: token ?? null, agent });
});
```

### 7.4 Query strings vs route params vs body, side by side

```js
// Route param — identifies ONE user
app.get('/users/:id', (req, res) => {
  res.json({ id: req.params.id });           // /users/42 → { id: '42' }
});
// Query string — filters a list
app.get('/users', (req, res) => {
  res.json({ role: req.query.role ?? 'all', page: req.query.page ?? '1' });
  // /users?role=admin&page=2 → { role: 'admin', page: '2' }
});
// Body — data to create something
app.post('/users', (req, res) => {
  res.status(201).json({ created: req.body }); // {"name": "Talha"} → echoed
});
```

### 7.5 Form data — `express.urlencoded()`

```js
const express = require('express');
const app = express();
// Parses application/x-www-form-urlencoded bodies (plain HTML forms)
app.use(express.urlencoded({ extended: true }));
app.post('/login', (req, res) => {
  // A form posting username=talha&password=secret arrives as:
  // req.body = { username: 'talha', password: 'secret' }
  res.json({ username: req.body.username });
});
```

`extended: true` uses the `qs` library, so nested fields like `user[name]=Talha` parse into `{ user: { name: 'Talha' } }`. With `extended: false` you get the simpler built-in parser, which only handles flat key/value pairs. Note that `req.params.id` and `req.query.page` are always **strings** — `Number(...)` them before comparing with numeric IDs.

---

## 8. Step-by-Step Code Explanations

The runnable demo for this topic is [`examples/http-demo.js`](./examples/http-demo.js). Here it is, explained line by line.

### Step 1 — Create the app and the JSON parser

```js
const express = require('express');
const app = express();
app.use(express.json());
```

`require('express')` loads the framework; calling it returns the app, which is also a valid Node.js request-handler function. `app.use(express.json())` registers the JSON body parser as middleware for *every* request. Without this line, `req.body` on the POST route would be `undefined` — the body would arrive but nobody would parse it.

### Step 2 — The routes, one HTTP idea each

```js
app.get('/', (req, res) => {
  res.status(200).send('Hello, HTTP!');
});
```

`app.get(path, handler)` runs only for GET requests to exactly `/`. `res.status(200)` sets the code (chainable — it returns `res`); `.send('Hello, HTTP!')` sends a plain-text body.

```js
app.post('/echo', (req, res) => {
  res.status(201).json(req.body);
});
```

POST to `/echo` answers `201 Created` and sends the parsed body straight back with `res.json()` — the echo proves the body arrived *and* was parsed.

The other four routes follow the same pattern — one line of code, one HTTP idea:

| Route | What it shows |
|---|---|
| `GET /users/:id` | `:id` is a route parameter — Express matches `/users/42`, captures `42`, and exposes it as `req.params.id` (always a string) |
| `GET /search` | `/search?q=express` puts `{ q: 'express' }` in `req.query`; `?? null` keeps the key present when no `q` is given, since `JSON.stringify` drops `undefined` values |
| `GET /not-found-demo` | A deliberate 404 with a JSON error body — a small `{ error }` object, not a stack trace |
| `GET /headers` | `res.set()` adds a custom response header; `req.get('X-Client-Name')` reads a request header case-insensitively — headers flowing in both directions |

### Steps 3–5 — Listen, fetch yourself, shut down

```js
const server = app.listen(0, async () => {
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
```

Port `0` asks the operating system to pick any free port, so the demo never clashes with another server on your machine. The `listen` callback runs once the server is ready, and `server.address().port` tells us which port was picked. Inside it, a `show(label, response)` helper fetches each route with Node.js's built-in global `fetch()` and logs `METHOD path -> status body` — `response.status` is the code, `response.text()` reads the whole body. The POST call passes `method: 'POST'`, a `Content-Type: application/json` header, and a stringified JSON body, exactly what a real client would send; the headers route is logged separately because it also reads a response header back (`headersRes.headers.get('x-custom-header')`), proving the server's custom header arrived. Finally `server.close(() => process.exit(0))` stops accepting connections and exits with code 0 — a server that never closes would keep the process alive forever, so a demo must always self-terminate, and the `try/finally` around the fetch calls guarantees the shutdown runs even if a request throws.

---

## 9. Common Misconceptions

- **"POST is for creating, so every write must be a POST."** No. POST is one of four write methods. Use PUT to replace a whole resource, PATCH for a partial update, DELETE to remove. Using POST for everything works, but it throws away idempotency and makes your API harder to reason about — and interviewers will ask why.
- **"404 means the route doesn't exist."** It means *the resource* doesn't exist — that includes `/users/999` on a route that exists perfectly well. A missing route and a missing resource are both 404s, for different reasons.
- **"401 and 403 are interchangeable."** They are not. 401 = "I don't know who you are" (unauthenticated — log in and retry). 403 = "I know who you are, and the answer is no" (authenticated but not allowed — retrying changes nothing).
- **"400 and 422 are the same thing."** 400 = the request is malformed or fails basic checks ("I cannot read this"). 422 = the request is well-formed but fails business rules ("I can read it, but it does not make sense"). Many APIs use only 400 — that is acceptable — but if you use both, keep the line consistent.
- **"GET requests can carry a body."** Technically the spec does not forbid it; practically, servers, proxies and caches are allowed to ignore it, and `express.json()` will not parse a body on a request whose handler never reads it. Put GET data in the path or the query string.
- **"Express replaces Node.js's `http` module."** Express *uses* it. `app.listen()` creates an `http` server, `req` is an `IncomingMessage` and `res` is a `ServerResponse`, both with Express features added. Everything Express does, you could do with raw `http` — it would just take more code.
- **"If I send JSON, Express parses it automatically."** Only if `express.json()` middleware is registered *and* the request has `Content-Type: application/json`. Miss either one and `req.body` is `undefined` — the most common beginner bug in this module.
- **"Status codes are just decoration — the body is what matters."** Clients, browsers, caches, load balancers and monitoring tools all branch on the status code *before* reading the body. A 200 with an error message in the body will be cached as a success and retried as a failure by nobody. The code is the answer; the body is the detail.
- **"Headers are case-sensitive."** Header *names* are case-insensitive by spec — `Content-Type`, `content-type` and `CONTENT-TYPE` are the same header. That is why you read them with `req.get()`, not by indexing `req.headers` with a guessed case. Header *values* can be case-sensitive, though (`Bearer` vs `bearer` in Authorization usually matters).
- **"PUT and PATCH are the same."** PUT replaces the *whole* resource — fields you omit are reset or removed. PATCH changes only the fields you send. Sending a PATCH shaped like a PUT (a full object) is harmless; sending a PUT shaped like a PATCH (a partial object) silently wipes the fields you left out.
- **"A 500 means my code has a bug."** Often, but not always — the database being down is also a 500 from the client's point of view. The rule is about *whose fault the client can fix*: if no change to the request would help, it is a 5xx.

---

## 10. Important Terminology

| Term | Meaning |
|---|---|
| **HTTP** | HyperText Transfer Protocol — the request/response rules of the web. |
| **HTTPS** | HTTP over TLS — same messages, encrypted transport. |
| **Server** | The side that sends the response (your Express app). |
| **Method / verb** | What the request wants to do: GET, POST, PUT, PATCH, DELETE. |
| **Status code** | Three-digit number in the response; first digit is the family (2xx, 4xx, 5xx). |
| **Header** | A `Name: value` metadata line in a request or a response. |
| **Body / payload** | The data carried by a request or a response. |
| **Route parameter** | A named segment of the URL path (`:id` in `/users/:id`) → `req.params`. |
| **Query string** | The `?key=value` part of a URL, for filtering/searching → `req.query`. |
| **Content-Type** | The header naming the body's format (`application/json`, ...). |
| **Accept** | The request header naming the response formats the client understands. |
| **Authorization** | The request header carrying credentials, usually `Bearer <token>`. |
| **Safe method** | A method that changes nothing on the server (GET, HEAD, OPTIONS). |
| **Idempotent method** | Repeating it has the same effect as doing it once (GET, PUT, DELETE). |
| **Stateless** | HTTP keeps no memory between requests; each request is self-contained. |
| **IncomingMessage** | Node.js's `req` object — the request as a readable stream + parsed metadata. |
| **ServerResponse** | Node.js's `res` object — the response as a writable stream. |

---

## 11. Summary

- HTTP is one exchange: a request (method + URL + headers + optional body) and a response (status code + headers + optional body). It is stateless — every request carries everything the server needs.
- **Methods:** GET reads (safe, idempotent); POST creates (not idempotent); PUT replaces a whole resource (idempotent); PATCH changes part of one (usually idempotent); DELETE removes (idempotent).
- **Status codes:** 2xx success (200 OK, 201 Created, 204 No Content), 3xx redirect (301 Moved Permanently), 4xx the client is wrong (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 405 Method Not Allowed, 409 Conflict, 422 Unprocessable Entity), 5xx the server is wrong (500 Internal Server Error, 503 Service Unavailable).
- **Headers** are metadata in both directions: `Content-Type` names the body format, `Accept` names what the client wants back, `Authorization` carries credentials, and `X-` custom headers carry tracing and operational data. Header names are case-insensitive.
- **The cycle:** client builds a request → DNS + TCP (+ TLS) → Node.js `http` parses it → Express middleware pipeline (body parsing, then routing) → handler builds the response → Node.js serialises it back to the client.
- **Express on Node.js:** `app` is a request-handler function passed to `http.createServer()`. `req` is Node.js's `IncomingMessage` plus `req.params`, `req.query`, `req.body`, `req.get()`; `res` is `ServerResponse` plus `res.status()`, `res.json()`, `res.send()`, `res.set()`. Express organises HTTP; it does not replace it.
- **Bodies and where data belongs:** JSON (`application/json` + `express.json()`), URL-encoded forms (`application/x-www-form-urlencoded` + `express.urlencoded()`), multipart file uploads (`multipart/form-data` + `multer`) — the `Content-Type` header and the parser must agree, or `req.body` is empty. Route params identify one resource (`/users/42`), query strings filter/search/paginate (`?role=admin&page=2`), bodies carry data to create or change; GET requests have no body.

---

## 12. Interview Questions and Answers

**Q1. What is HTTP, and what does a request/response cycle look like?**

HTTP (HyperText Transfer Protocol) is the request/response protocol of the web. The client sends a request — a method, a URL, headers, and an optional body — over TCP (encrypted with TLS for HTTPS). The server parses it, does the work, and sends back a response — a status code, headers, and an optional body. HTTP is stateless: each request is self-contained and the server keeps no memory of previous requests between them.

**Q2. What is the difference between GET and POST?**

GET *reads* a resource: it is safe (changes nothing) and idempotent (repeating it changes nothing), it has no body, and its data travels in the URL (path or query string). POST *creates* a resource or triggers an action: it is neither safe nor idempotent (sending it twice creates two things), and its data travels in the body. Browsers cache GETs and warn before resubmitting POSTs for exactly this reason.

**Q3. What is the difference between PUT and PATCH?**

PUT replaces the *whole* resource — the body must be the complete new state, and fields you omit are reset or removed. PATCH changes only the fields you send, leaving the rest untouched. Both are idempotent when written correctly (the same PUT or PATCH twice ends in the same state). Use PUT when the client has the full object, PATCH when it only has a few changed fields.

**Q4. What does idempotent mean, and how is it different from safe?**

Idempotent means repeating the same request has the same effect as doing it once — GET, PUT and DELETE qualify; POST does not, since each POST typically creates a new resource with a new ID. (PATCH is idempotent only if the patch itself is, e.g. "set email to X" rather than "increment by 1".) *Safe* is stricter: the method changes nothing on the server at all — only GET (and HEAD/OPTIONS) are safe. So DELETE is idempotent but *not* safe: it changes state (the resource is gone), but doing it twice is no different from doing it once.

**Q5. Explain the status code families — and when would you return 201 instead of 200? And 204?**

1xx informational, 2xx success, 3xx redirection, 4xx client error, 5xx server error. Return **201 Created** (not 200) when a POST has created a new resource — it tells the client something new now exists, and the response usually includes the created object and a `Location` header with its URL. 200 is the general success code for reads and updates where nothing new was created. **204 No Content** is the DELETE answer: success with deliberately no body — a body on a 204 is a protocol violation, and Express strips it if you try to send one.

**Q6. What is the difference between 401 and 403? Between 400 and 404? Between 400 and 422?**

401 Unauthorized means *unauthenticated* — no credentials, or invalid/expired ones; the client should log in and retry. 403 Forbidden means *authenticated but not allowed* — the server knows who you are and the answer is no; retrying will not help. 400 Bad Request means the request itself is malformed or fails basic validation ("I cannot read this"); 404 Not Found means the request was fine but the resource does not exist. 400 vs 422: 400 is "I cannot read this", 422 is "I can read it, but it fails business rules" (e.g. a booking date in the past).

**Q7. What are HTTP headers? Name three request headers and three response headers, and what they do.**

Headers are `Name: value` metadata lines on a request or response; names are case-insensitive. Request headers: `Authorization` (credentials, usually `Bearer <token>`), `Accept` (response formats the client understands), `Content-Type` (format of the request body). Response headers: `Content-Type` (format of the response body), `Location` (URL of a created resource, or a redirect target), `Set-Cookie` (ask the client to store a cookie). Custom headers (`X-Request-Id`, `X-Rate-Limit-Remaining`) carry tracing and operational data.

**Q8. How does Express relate to Node.js's built-in `http` module? What are `req` and `res`, really?**

Express is built *on* the `http` module, not instead of it: `app.listen()` creates an `http` server and passes the Express `app` function as its request handler. `req` is Node.js's `http.IncomingMessage` (a readable stream with `req.method`, `req.url`, `req.headers`) with Express additions: `req.params`, `req.query`, `req.body`, `req.get()`. `res` is `http.ServerResponse` (a writable stream) with Express additions: `res.status()`, `res.json()`, `res.send()`, `res.set()`. Express adds routing and helpers; the HTTP underneath is unchanged.

**Q9. Why is `req.body` undefined when I POST JSON to my Express app?**

Two usual causes, and only two. First, `express.json()` middleware is not registered — without it nobody collects and parses the body stream, so `req.body` stays `undefined`. Second, the client did not send `Content-Type: application/json` — `express.json()` only claims bodies with that content type, so it skips the body even when the bytes *are* JSON. Check the middleware line first, then the header.

**Q10. What is the difference between a query string, a route parameter, and a request body — and when do you use each?**

A route parameter (`/users/:id` → `req.params.id`) identifies *one* resource — it is part of the path and required for the route to match. A query string (`/users?role=admin&page=2` → `req.query`) filters, sorts, searches or paginates a collection — optional, with defaults. A body (`req.body`) carries the data to create or change something in POST/PUT/PATCH. Rules: identifying which thing → route param; narrowing a list → query string; sending new data → body; GET has no body.

**Q11. What is the difference between `application/json`, `application/x-www-form-urlencoded`, and `multipart/form-data`?**

All three are body formats, named by their `Content-Type`. `application/json` is structured JSON — the default for APIs, parsed by `express.json()`. `application/x-www-form-urlencoded` is flat `key=value&key2=value2` pairs — what a plain HTML form sends, parsed by `express.urlencoded()`, everything arriving as strings. `multipart/form-data` splits the body into parts separated by a boundary — the format for file uploads, which Express does not parse itself; `multer` is the standard middleware for it.

**Q12. A client POSTs the same order twice and gets charged twice. What went wrong, and how do you fix it?**

POST is not idempotent: each POST creates a new resource, so two identical POSTs create two orders. The fix is an *idempotency key*: the client generates a unique key per logical operation and sends it in an `Idempotency-Key` header; the server stores the key with the result of the first request and, if it sees the same key again, returns the stored result instead of creating a second order. Payment APIs (Stripe, for example) work exactly this way.

---

## 13. References

- MDN Web Docs — *HTTP overview*: https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview
- MDN Web Docs — *HTTP request methods*: https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods
- MDN Web Docs — *HTTP response status codes*: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
- Node.js documentation — *HTTP module*: https://nodejs.org/api/http.html
- Node.js documentation — *`http.IncomingMessage` / `http.ServerResponse`*: https://nodejs.org/api/http.html
- Express.js documentation — *Express 5.x API reference* (`req`, `res`, `express.json()`, `express.urlencoded()`): https://expressjs.com/en/5x/api.html
- Express.js documentation — *Routing*: https://expressjs.com/en/guide/routing.html
- RFC 9110 — *HTTP Semantics* (methods, status codes, headers): https://www.rfc-editor.org/rfc/rfc9110

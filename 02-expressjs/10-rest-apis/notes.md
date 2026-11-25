# 10 — REST APIs — Notes

> **Module:** 02 — Express.js
> **Topic:** 10 — REST APIs
> **Priority:** 🔴 High
> **Previous topic:** [09 — Validation](../09-validation/README.md)
> **Next topic:** [11 — Configuration](../11-configuration/README.md)
>
> **One-line summary:** A REST API is a contract: resources with stable URLs, the right HTTP method and status code for every action, one response shape everywhere, and pagination so no request ever returns the whole table. Topics 04–09 were the pieces — routing, request/response, middleware, controllers, error handling, validation — this topic is how they fit together into one clean API that a React web app and a React Native mobile app can both use.
>
> **How to use these notes:** read [README.md](./README.md) first for the short overview, then work through this file section by section. Run the example in [`examples/rest-api.js`](./examples/rest-api.js) and compare your output with [`examples/example.txt`](./examples/example.txt). Then do the tasks in [`exercises.md`](./exercises.md).

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

Every app you have used this week talks to an API. When your phone shows a feed, it asked a server for a list of posts. When you tap "like", it sent a request that changed one thing on the server. REST is the set of conventions that makes those conversations predictable: the same URL always means the same resource, the HTTP method says what you want to do, and the status code says what happened.

Why does this matter for your journey? Your semester project has one backend and two frontends — React web and React Native mobile. Both frontends will call the same API. If the API is inconsistent — one endpoint returns an array, another returns an object, errors come back as HTML sometimes — both frontends pay for it. A clean REST API is what makes one backend serve two apps without pain.

This topic is also the capstone of Phase 02. Topics 04 to 09 each taught one skill: routing (04), request and response (05), middleware (06), controllers (07), error handling (08), validation (09). None of them is an API on its own. This topic assembles them: routes point at controllers, validation middleware guards the body, errors flow to one central handler, and every response wears the same envelope. By the end you can design an API for a real resource from scratch and explain every decision in it.

## 2. Definition of Important Concepts

- **REST (Representational State Transfer)** — an architectural style for APIs over HTTP, defined by Roy Fielding in 2000. It is a set of constraints, not a standard: stateless communication, resources identified by URLs, and a uniform interface (HTTP methods + status codes).
- **Resource** — a thing your API manages: a post, a user, an order. A resource has a URL and a representation (usually JSON).
- **Representation** — the JSON form of a resource sent over the wire. The same resource can have different representations (JSON for the app, a summary view for a list), but the resource itself is one thing.
- **Endpoint** — one method + URL combination, e.g. `GET /api/v1/posts`. One endpoint does one job.
- **Stateless** — the server keeps no memory of the client between requests. Each request carries everything the server needs (usually an auth token). This is what lets you scale by adding more servers.
- **Response envelope** — a fixed wrapper around every response, e.g. `{ success: true, data: ... }` for success and `{ success: false, error: { message } }` for failure. The client never has to guess the shape.
- **Pagination** — returning a list in pages (`?page=2&limit=10`) instead of all at once, so one request cannot return a million rows.
- **Filtering / sorting / searching** — query parameters that narrow a list: `?userId=2`, `?sort=title`, `?search=rest`.
- **Idempotency** — calling the same request twice has the same effect as calling it once. `GET`, `PUT` and `DELETE` are idempotent; `POST` is not (it creates a new resource each time).
- **API versioning** — putting a version in the URL (`/api/v1/...`) so you can change the API later without breaking existing clients.
- **HATEOAS** — the idea that responses include links to related actions. Nice in theory, rarely used in practice; know the word, don't build it unless asked.
- **CRUD** — Create, Read, Update, Delete — the four operations, mapped to `POST`, `GET`, `PUT/PATCH`, `DELETE`.

## 3. Detailed Explanations

### 3.1 The six REST constraints (the short version)

Fielding's dissertation lists six constraints. You need to understand four of them; the other two are background.

1. **Client–server separation.** The client handles the UI, the server handles data and rules. They evolve independently — this is exactly why one backend can serve a web app and a mobile app.
2. **Statelessness.** No session stored on the server. Every request is self-contained. If your server restarts, nothing about the client is lost, because there was nothing to lose.
3. **Cacheability.** Responses say whether they can be cached (`Cache-Control` headers). `GET` responses can be cached; `POST` responses cannot.
4. **Uniform interface.** This is the one that shapes your daily work: resources are identified by URLs, you manipulate them through representations, messages describe themselves, and the methods have fixed meanings. Sections 3.2–3.4 are this constraint in practice.
5. **Layered system.** The client cannot tell whether it talks to the real server or a proxy/load balancer in front of it. You get this for free with HTTP.
6. **Code on demand (optional).** The server may send executable code (like JavaScript) to the client. The only optional constraint, and the one everyone ignores.

### 3.2 Resource naming — nouns, not verbs

Resources are nouns. Actions are HTTP methods. This is the single most common beginner mistake, so learn the rule cold:

| Wrong | Right | Why |
|---|---|---|
| `GET /getPosts` | `GET /posts` | The method already says "get" |
| `POST /createPost` | `POST /posts` | The method already says "create" |
| `GET /deletePost/5` | `DELETE /posts/5` | Deleting with GET is dangerous — crawlers and prefetchers issue GETs |
| `GET /posts/getByUser/2` | `GET /posts?userId=2` | Filtering is a query parameter, not a new route |
| `GET /post/5` | `GET /posts/5` | Collections are plural; one item is `/posts/5` |

Nested resources show ownership: `/users/2/posts` means "posts belonging to user 2". One level of nesting is fine; two levels (`/users/2/posts/5/comments/9`) is a sign your design is too deep — flatten it.

### 3.3 HTTP methods — each one has exactly one job

- **GET** — read. Safe (changes nothing) and idempotent. Never put a body in a GET; parameters go in the URL or query string. Browsers, caches and prefetchers assume GET is harmless — that is why a delete must never be a GET.
- **POST** — create a new resource, or trigger an action that doesn't fit the other methods (e.g. `/login`). Not idempotent: sending it twice creates two resources. Returns `201 Created` with a `Location` header pointing at the new resource.
- **PUT** — replace a whole resource. Idempotent: sending the same PUT twice leaves the same result. The client sends the complete new state; missing fields are treated as removed.
- **PATCH** — change part of a resource. Idempotent in practice. The client sends only the fields that change.
- **DELETE** — remove a resource. Idempotent: deleting something twice still ends with it gone. Returns `204 No Content` (empty body) or `200` with the deleted item — pick one and be consistent.
- **HEAD / OPTIONS** — used by browsers and tooling (OPTIONS for CORS preflight). You rarely write handlers for them.

### 3.4 Status codes — the ones you actually need

Status codes are grouped by their first digit: `2xx` success, `3xx` redirection, `4xx` the client did something wrong, `5xx` the server did something wrong. Memorise this table, not the whole list:

| Code | Meaning | Use it when |
|---|---|---|
| 200 OK | Success | GET, PUT, PATCH worked |
| 201 Created | A new resource was created | POST worked — plus a `Location` header |
| 204 No Content | Success, empty body | DELETE worked |
| 400 Bad Request | The request is malformed or fails validation | Missing/invalid fields (topic 09) |
| 401 Unauthorized | No (or bad) credentials | The client is not logged in |
| 403 Forbidden | Logged in, but not allowed | A student tries an admin route |
| 404 Not Found | The resource does not exist | `GET /posts/99` |
| 409 Conflict | The request conflicts with current state | Registering an email that already exists |
| 422 Unprocessable Entity | The shape is fine but the content is invalid | Some APIs use this instead of 400 for validation |
| 500 Internal Server Error | Something broke on the server | Only for real bugs — never leak internals |

Two rules that separate good APIs from sloppy ones: never return `200` with an error hidden inside the body — the status code is the first thing every client, proxy and monitoring tool reads. And never return `500` for a client mistake — `500` means "our bug", and if your logs are full of `500`s for bad input, you can't tell real outages from user errors.

### 3.5 Designing routes for a real resource

Take the `posts` resource from the example and design it properly:

```text
GET    /api/v1/posts            list posts (paginated, filterable)
POST   /api/v1/posts            create a post
GET    /api/v1/posts/:id        one post
PUT    /api/v1/posts/:id        replace a post completely
PATCH  /api/v1/posts/:id        change part of a post
DELETE /api/v1/posts/:id        delete a post
```

Six endpoints, one resource, and a frontend developer can guess all of them after seeing the first two. That predictability is the product. A second resource follows the same pattern — `/api/v1/users`, `/api/v1/comments` — so the API grows by copying a shape, not inventing a new one each time.

### 3.6 Pagination, filtering and sorting

A list endpoint without pagination is a bug waiting for data. At 50 rows it is fine; at 50,000 rows one request can use up the server's memory and the client's. The standard shape:

```text
GET /api/v1/posts?page=2&limit=10&userId=2&sort=title&search=rest
```

- `page` and `limit` — which slice of the list. Cap `limit` (50 is a sane maximum) so a client can't ask for a million rows.
- `userId=2` — filtering: only rows matching a field.
- `sort=title` — ordering. Prefix with `-` for descending (`sort=-createdAt`) if you support it.
- `search=rest` — free-text match across title and body.
- The response carries `meta: { total, page, limit, pages }` so the client can render "page 2 of 5" without a second request.

Offset pagination (`page`/`limit`) is simple and right for a semester project. Cursor pagination (a `next` token instead of a page number) is better for feeds that change constantly, because rows don't shift under you — know it exists, build offset first.

### 3.7 Versioning — how APIs change without breaking clients

The moment a mobile app is installed on users' phones, you cannot force them to update. If you change the API, old app versions still call the old shape. The standard answer is a version in the URL: `/api/v1/posts`. When you need a breaking change, you ship `/api/v2/posts` and keep v1 running until old clients fade away. Rules: never remove a version silently, never change a v1 response shape (add fields, don't rename or remove them), and put the version in the URL — not in a header — because it is visible, debuggable and easy to route.

### 3.8 The response envelope — one shape, everywhere

Every response in the example looks like one of two shapes:

```json
{ "success": true, "data": { "id": 1, "title": "Hello Node" } }
{ "success": false, "error": { "message": "Post 99 not found" } }
```

The client checks `success` once and knows what to do. Without an envelope, every endpoint invents its own shape: one returns an array, another returns `{ post: ... }`, errors sometimes come as `{ error: "msg" }` and sometimes as plain text. The frontend then needs special cases everywhere, and a React Native screen breaks because one endpoint returned something unexpected. The envelope is a small discipline that pays off on every screen.

### 3.9 Putting topics 04–09 together

A request through the example API touches every Phase 02 skill in order:

1. **Routing (04)** — `app.use('/api/v1/posts', router)` mounts the router; `router.get('/:id')` matches the path.
2. **Request/response (05)** — `req.params.id`, `req.query.page`, `req.body.title`; `res.status(201).json(...)`.
3. **Middleware (06)** — `express.json()` parses the body before any route runs; validation middleware runs before the controller.
4. **Controllers (07)** — each route handler is a small function doing one job; the router file holds no business logic beyond the in-memory store.
5. **Error handling (08)** — a 404 handler catches unknown routes, a central error handler catches JSON parse errors, and both return the same envelope.
6. **Validation (09)** — `validatePost` rejects bad bodies with `400` before the controller ever sees them.

If any one of these is missing, the API degrades: no validation means bad data in the store; no central error handler means Express's default HTML error page leaks to an API client; no envelope means the frontend guesses.

### 3.10 REST vs the alternatives (know the neighbours)

- **GraphQL** — the client asks for exactly the fields it wants in one query. Powerful for complex apps, but it needs a schema, resolvers and tooling, and caching is harder. REST is the right default for a semester project.
- **gRPC** — binary, fast, typed contracts. Used between internal services, not browsers — a browser can't speak it natively.
- **WebSockets / Socket.io** — for live, two-way data (chat, live queue position). Complements REST: use REST for CRUD, sockets for live updates. Q-less would use both.

## 4. How the Technology Works Internally

### 4.1 What Express does with a request

1. The HTTP server (Node's `http` module) receives the request and hands it to Express.
2. Express runs the middleware stack in registration order — `express.json()` first, then your routers.
3. The router matches the path against its route table, top to bottom, first match wins.
4. The matched handler runs. It may call `next()` to pass control on, or end the request with `res.json()` / `res.status().end()`.
5. If no route matches, control falls through to the 404 handler you registered last.
6. If a handler calls `next(err)` or throws in an async handler, Express skips to the error-handling middleware — the function with four parameters `(err, req, res, next)`.

### 4.2 Why `res.json()` is not just `res.send()`

`res.json(obj)` sets `Content-Type: application/json`, stringifies the object, and sends it. `res.send()` guesses the content type from what you pass — an object becomes JSON, a string becomes HTML. In an API you always want `res.json()`, because a client parsing JSON that arrives labelled `text/html` will fail in confusing ways.

### 4.3 What "stateless" costs you — and what it buys

Statelessness means the server cannot remember that a client is "on page 2" — the client must send `page=2` every time. That is a small cost. What it buys is scale: any server instance can handle any request, so you can run two, ten or a hundred servers behind a load balancer with no shared memory. It also buys resilience: restart a server mid-traffic and clients just retry — nothing was stored on it.

### 4.4 The N+1 problem, in REST terms

A list endpoint that returns posts, and then the frontend asks for each post's author one by one, is N+1 requests. The REST fix is to let the list endpoint include what the client needs — `?include=author` — or to design the list response so it already carries the author's name. The same trap exists inside the server (topic 11 in Phase 03 will show it in SQL). The rule: count the requests your screen makes; if it grows with the number of items, redesign the endpoint.

## 5. Architecture or Workflow

### 5.1 The anatomy of one clean API

```text
server.js                 entry point: creates the app, listens
  └─ app.js               wires middleware + routers + error handlers
      ├─ middleware/      auth, validation, logging (topics 06, 09)
      ├─ routes/          one router file per resource (topic 04)
      │    └─ posts.js    GET/POST/PUT/PATCH/DELETE for /api/v1/posts
      ├─ controllers/     one function per endpoint (topic 07)
      ├─ services/        business logic (kept out of controllers)
      ├─ models/          data access — Phase 03 replaces the in-memory store
      └─ utils/           the response envelope helpers (ok / fail)
```

The example in this topic keeps everything in one file so you can read it end to end. In the semester project you split it into this shape — same logic, better folders.

### 5.2 The lifecycle of a POST request

```text
POST /api/v1/posts  { "title": "New post", "body": "..." }
   │
   ▼  express.json() parses the body → req.body
   │
   ▼  router matches POST /  → validatePost middleware
   │     title missing? ──yes──▶ 400 { success: false, error: {...} }
   │     no
   ▼  controller: build the post, push to the store
   │
   ▼  res.location('/api/v1/posts/6') + 201 { success: true, data: post }
```

Every layer does one thing and the error path is short: bad input never reaches the controller, and the controller never builds error JSON by hand.

### 5.3 Designing an API before writing code

1. List the resources (nouns): posts, users, comments.
2. Write the six endpoints per resource in a table — method, URL, success code.
3. Decide the envelope and the list meta shape once, for all resources.
4. Decide the validation rules per field (required? type? length?).
5. Then write the router. If you can't fill in the table, you don't understand the resource yet — and no amount of code will fix that.

## 6. Real-World Examples

- **Your semester project backend.** Q-less: `GET /api/v1/queues`, `POST /api/v1/queues/:id/tokens`, `GET /api/v1/tokens/:id` (live position), `POST /api/v1/tokens/:id/call-next`. AI Study Buddy: `POST /api/v1/notes`, `GET /api/v1/decks/:id/cards`, `POST /api/v1/quizzes/:id/answers`. Both frontends — web and mobile — call the same endpoints; the mobile app just calls fewer of them.
- **GitHub's REST API.** `GET /repos/:owner/:repo/issues?state=open&page=2` — resources, filtering, pagination, exactly the pattern in this topic.
- **JSONPlaceholder.** The free fake API (`jsonplaceholder.typicode.com/posts`) that tutorials use — it exists because the REST shape is so standard that a fake one is useful for learning.
- **A food delivery app.** `POST /orders` (201), `GET /orders/:id` (live status), `PATCH /orders/:id` (cancel). The status flow is a resource changing state, not a new endpoint per state.
- **Stripe's API.** The gold standard of API design: versioned, enveloped, idempotent POSTs via an `Idempotency-Key` header so a retried payment never charges twice.

## 7. Code Examples Where Applicable

The full working example is [`examples/rest-api.js`](./examples/rest-api.js). Its key pieces:

**The envelope helpers** — one place that builds every response:

```js
function ok(res, data, status = 200, meta) {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}
function fail(res, status, message) {
  return res.status(status).json({ success: false, error: { message } });
}
```

**List with pagination, filtering and sorting** — the whole query-string design in one handler:

```js
router.get('/', (req, res) => {
  let result = [...posts];
  if (req.query.userId) result = result.filter((p) => p.userId === Number(req.query.userId));
  if (req.query.search) {
    const q = req.query.search.toLowerCase();
    result = result.filter((p) => p.title.toLowerCase().includes(q));
  }
  const total = result.length;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  return ok(res, result.slice((page - 1) * limit, page * limit), 200,
    { total, page, limit, pages: Math.ceil(total / limit) });
});
```

**Create with 201 and Location:**

```js
router.post('/', validatePost, (req, res) => {
  const post = { id: nextId++, title: req.body.title.trim(), body: req.body.body.trim() };
  posts.push(post);
  res.location(`/api/v1/posts/${post.id}`);
  return ok(res, post, 201);
});
```

**The 404 and error handlers always come last:**

```js
app.use((req, res) => fail(res, 404, `Route ${req.method} ${req.path} does not exist`));
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return fail(res, 400, 'Request body is not valid JSON');
  return fail(res, 500, 'Internal server error');
});
```

Run it with `NODE_PATH=/tmp/express-verify/node_modules node examples/rest-api.js` and compare with [`examples/example.txt`](./examples/example.txt).

## 8. Step-by-Step Code Explanations

**The in-memory store.** `posts` is a plain array and `nextId` a counter. This is a stand-in for a database — Phase 03 replaces it with PostgreSQL, and nothing about the routes changes, because the routes never touch the array directly except through these handlers. That is the point of the controller/service split: the HTTP layer doesn't care where data lives.

**`ok` and `fail`.** Every handler returns through one of these two helpers, so the envelope can never drift. Note `ok` takes `meta` as an optional fourth argument — only list endpoints use it, and the helper adds the field only when it exists, so single-item responses stay clean.

**Validation middleware.** `validatePost` runs before the controller on POST and PUT. It checks types and trims, and on failure it returns `400` immediately — the controller never runs, so invalid data can never reach the store. PATCH deliberately skips it, because a partial update may legitimately send only one field.

**`res.location()` + 201.** After creating a post, the response tells the client where the new resource lives. A good client follows it with a GET; a good API always sends it. This is a small detail that interviewers notice.

**`DELETE` returns 204 with an empty body.** `res.status(204).end()` sends headers and no body. Returning `200` with `{ success: true }` would also work — but then the client has to parse a body for an operation that has nothing to say. Pick 204 and be consistent.

**The self-test at the bottom.** The server listens on port `0`, so the OS picks a free port — no clashes on a shared machine. `fetch` calls each route in order, prints the status and body, and `server.close()` + `process.exit(0)` end the process. The file is a demo, not a server: a real server would listen on a fixed `PORT` and never exit (see topic 11).

## 9. Common Misconceptions

- **"REST means using GET and POST only."** No. The whole point is the right method for the job — PUT, PATCH and DELETE exist for a reason, and using POST for everything throws away idempotency and caching.
- **"A 200 with `{ error: ... }` in the body is fine."** It isn't. Status codes are the first thing clients, proxies and monitoring read. An error with a 200 is invisible to all of them.
- **"URLs should contain verbs."** Verbs belong in the method. `/getPosts`, `/createPost`, `/deletePost/5` are all wrong — see section 3.2.
- **"Pagination is optimisation, add it later."** It is a correctness issue, not optimisation. The day your table grows, the unpaginated endpoint falls over, and every client that depended on getting everything breaks when you finally add it.
- **"PUT and PATCH are the same."** PUT replaces the whole resource; PATCH changes part of it. Sending a PUT with one field can wipe the others — a classic production bug.
- **"Versioning is only for big companies."** The moment a mobile app is installed, you have old clients you can't update. Version from day one; it costs one path segment.
- **"REST APIs must return HATEOAS links."** HATEOAS is one constraint in the theory, and almost nobody implements it fully. A clean, versioned, enveloped JSON API is REST in practice.

## 10. Important Technical Terminology

| Term | Meaning |
|---|---|
| REST | Architectural style: resources over HTTP, uniform interface, stateless |
| Resource | A thing the API manages, identified by a URL (a post, a user) |
| Endpoint | One method + URL pair that does one job |
| Stateless | Each request carries everything the server needs; no server-side session |
| Envelope | The fixed `{ success, data }` / `{ success: false, error }` wrapper |
| Idempotent | Repeating the request has the same effect as doing it once |
| Pagination | Returning lists in pages instead of all at once |
| Query parameter | The `?key=value` part of a URL, used for filtering/sorting/paging |
| Versioning | `/api/v1/...` in the URL so the API can evolve without breaking clients |
| CRUD | Create, Read, Update, Delete — POST, GET, PUT/PATCH, DELETE |
| 201 Created | Success code for POST, with a `Location` header to the new resource |
| 204 No Content | Success with an empty body, standard for DELETE |
| N+1 problem | One query for a list plus one query per item — fix by including data or batching |
| HATEOAS | Responses carrying links to related actions — theory, rarely built |

## 11. Summary

- REST is a contract: nouns for URLs, HTTP methods for actions, status codes for outcomes.
- Design resources first (six endpoints per resource), then write code — the table is the design.
- Use the right method: GET reads, POST creates (201 + Location), PUT replaces, PATCH updates part, DELETE removes (204).
- Use the right status code: 200/201/204 for success, 400 for bad input, 401/403 for auth, 404 for missing, 500 only for real server bugs.
- Wrap every response in one envelope, and paginate every list with `meta: { total, page, limit, pages }`.
- Version from day one (`/api/v1/...`); add fields, never rename or remove them in a released version.
- Topics 04–09 are the pieces — routing, request/response, middleware, controllers, error handling, validation. This topic is the assembled API, and it is the backend your two frontends will share.

## 12. Interview Questions and Answers

**Q1. What is REST, and what makes an API "RESTful"?**
A REST API follows Fielding's constraints: client–server separation, stateless requests, cacheable responses, and a uniform interface — resources identified by URLs, manipulated with HTTP methods, with status codes saying what happened. An API is RESTful in practice when it uses nouns for URLs, the right method per action, proper status codes, and stateless requests.

**Q2. Why should a delete be `DELETE /posts/5` and never `GET /deletePost/5`?**
Because GET is defined as safe: browsers, caches, crawlers and prefetchers may issue GETs without asking. A delete behind a GET can be triggered by a link preview or a crawler. DELETE also carries idempotency — deleting twice ends in the same state.

**Q3. What is the difference between PUT and PATCH?**
PUT replaces the entire resource — the client sends the complete new state, and omitted fields are treated as removed. PATCH changes only the fields sent. PUT is for "here is the whole new post", PATCH is for "just change the title".

**Q4. Why return 201 instead of 200 when creating a resource?**
201 says "created" precisely, and it comes with a `Location` header pointing at the new resource, so the client can fetch it without guessing its URL. 200 only says "ok", which is vague — and monitoring tools treat 201s and 200s differently.

**Q5. What is an idempotent method, and which HTTP methods are idempotent?**
Repeating the request has the same effect as doing it once. GET, PUT, DELETE, HEAD and OPTIONS are idempotent. POST is not — each call creates a new resource, which is why a retried payment POST needs an idempotency key.

**Q6. How do you paginate a list, and why is it necessary?**
With `?page=2&limit=10` and a `meta: { total, page, limit, pages }` block in the response. Without it, one request can return the whole table — slow, memory-hungry, and a denial-of-service risk. Cap `limit` so clients can't ask for a million rows.

**Q7. What is a response envelope and why use one?**
A fixed wrapper — `{ success: true, data }` or `{ success: false, error: { message } }` — around every response. It means the client handles success and failure the same way for every endpoint, instead of special-casing each one's shape.

**Q8. How do you version an API, and why?**
Put the version in the URL: `/api/v1/posts`. Old clients (especially installed mobile apps) keep calling v1 while new clients use v2. Never change a released version's response shape — add fields, don't rename or remove them.

**Q9. What is the N+1 problem?**
One query to fetch a list, then one extra query per item to fetch something related (e.g. each post's author). The fix is to include the related data in the list response or batch the follow-up queries, so the request count doesn't grow with the list size.

**Q10. When would you choose GraphQL or gRPC instead of REST?**
GraphQL when clients need different shapes of the same data and want to fetch exactly what they need in one request. gRPC for fast, typed communication between internal services. REST remains the default for public APIs and browser/mobile clients because it is simple, cacheable and universally understood.

**Q11. Your API returns 200 with `{ "error": "not found" }` in the body. What's wrong?**
The status code is lying. Caches, proxies, monitoring and client libraries all read the status code first — a 200 tells them "success". Errors must use 4xx/5xx so the whole stack, not just your frontend code, can see them.

**Q12. How does statelessness help an API scale?**
Because the server stores nothing about the client between requests, any server instance can handle any request. You can run many instances behind a load balancer, restart one mid-traffic, and lose nothing — the next request just goes to another instance with everything it needs.

## 13. References

- Roy Fielding — *Architectural Styles and the Design of Network-based Software Architectures* (2000), Chapter 5 — the original REST dissertation
- MDN — HTTP request methods and HTTP response status codes — https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods and https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
- Express.js — Routing guide — https://expressjs.com/en/guide/routing.html
- REST API Tutorial — https://restfulapi.net/
- GitHub REST API docs (a real-world reference design) — https://docs.github.com/en/rest
- Stripe API design (versioning, idempotency, envelopes) — https://docs.stripe.com/api

---

## Files in This Folder

- [README.md](./README.md) — short overview and learning objectives
- [notes.md](./notes.md) — this file
- [examples/rest-api.js](./examples/rest-api.js) — runnable REST API demo
- [examples/example.txt](./examples/example.txt) — real output of the demo
- [exercises.md](./exercises.md) — 5 practice tasks, no solutions

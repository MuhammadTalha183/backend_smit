# 03 — HTTP Fundamentals

> **Priority:** 🔴 High
> **Previous topic:** [02 — Project Setup](../02-project-setup/README.md)
> **Next topic:** [04 — Routing](../04-routing/README.md)

Every API you will ever build with Express is a conversation in HTTP: a client sends a request (a method, a URL, some headers, maybe a body) and the server answers with a response (a status code, some headers, maybe a body). The method says *what* the client wants to do, the status code says *how it went*, and the headers carry the metadata both sides need to understand each other. This topic is that vocabulary — methods, status codes, headers, and the full request/response cycle — plus how Express sits on top of Node.js's built-in `http` module to give you that conversation in a friendlier form.

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain what an HTTP request and response are made of — method, URL, headers, body, status code.
- Choose the right HTTP method (GET, POST, PUT, PATCH, DELETE) for an operation, and explain idempotency and safe methods.
- Pick the right status code for success, client errors, and server errors — and explain why 404 is not the same as 400.
- Read and set the headers that matter: `Content-Type`, `Authorization`, `Accept`, and custom headers.
- Trace the full request/response cycle from a browser or client to an Express route handler and back.
- Explain how Express builds on Node.js's `http` module — what `req` and `res` really are.
- Parse JSON and form bodies with `express.json()` and `express.urlencoded()`, and explain when each applies.
- Tell apart query strings, route parameters, and request bodies — and know where each kind of data belongs.

## Topics Covered

- HTTP requests and responses — method, URL, headers, body, status code
- HTTP methods: GET, POST, PUT, PATCH, DELETE — meaning, idempotency, safe methods
- Status codes by family: 1xx, 2xx, 3xx, 4xx, 5xx — and the ones that matter (200, 201, 204, 301, 400, 401, 403, 404, 405, 409, 422, 500, 503)
- Headers: `Content-Type`, `Authorization`, `Accept`, custom headers, request vs response headers
- The request/response cycle end to end
- How Express sits on Node.js's `http` module — `req` as `IncomingMessage`, `res` as `ServerResponse`, plus Express additions
- JSON vs form data: `application/json` vs `application/x-www-form-urlencoded` vs `multipart/form-data`
- Body parsing: `express.json()` and `express.urlencoded()`
- Query strings vs route params vs body — where each kind of data belongs

## Links

- **Notes:** [notes.md](./notes.md) — full detailed notes, diagrams, and interview questions with answers
- **Examples:** [examples/](./examples/) — run [`http-demo.js`](./examples/http-demo.js), expected output in [`example.txt`](./examples/example.txt)
- **Exercises:** [exercises.md](./exercises.md) — 5 practice tasks, no solutions
- **Module README:** [02 — Express.js](../README.md)

**How to run the examples:**

```bash
NODE_PATH=/tmp/express-verify/node_modules node examples/http-demo.js
```

## Key Takeaways

- HTTP is a request/response conversation: method says *what*, URL says *where*, headers carry metadata, the body carries data, and the status code says *how it went*.
- GET is for reading (safe and idempotent); POST creates; PUT replaces a whole resource; PATCH changes part of one; DELETE removes. PUT and DELETE are idempotent, POST is not.
- Status codes are grouped by their first digit: 2xx success, 3xx redirect, 4xx the client did something wrong, 5xx the server did something wrong. A wrong code is a wrong answer, even when the body is right.
- `Content-Type` tells the receiver how to read the body — JSON bodies need `application/json` and `express.json()` to be parsed.
- In Express, `req` and `res` are Node.js's `IncomingMessage` and `ServerResponse` with Express features added on top — Express does not replace HTTP, it organises it.
- Query strings filter and sort (`?q=...`), route params identify one resource (`/users/:id`), and the body carries the data to create or change something. Don't mix up their jobs.

---

[← Main README](../../README.md) · Previous: [02 — Project Setup](../02-project-setup/README.md) · Next: [04 — Routing](../04-routing/README.md)

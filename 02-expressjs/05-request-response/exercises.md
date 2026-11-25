# 05 — Request and Response — Exercises

> **Module:** 02 — Express.js
> **Topic:** 05 — Request and Response Objects
> **Previous topic:** [04 — Routing](../04-routing/README.md)
> **Next topic:** [06 — Middleware](../06-middleware/README.md)
>
> Do these in order. No solutions are given here — the answers to the interview-style questions are in [`notes.md`](./notes.md) (Section 12), but the practice tasks are yours to build and test. Run each task with `NODE_PATH=/tmp/express-verify/node_modules node <file>.js` and check your output with `curl`.

---

## Task 1 — A small users API (params, query, status codes)

Build an Express app with an in-memory array of at least 5 users (each with `id`, `name`, and `email`).

1. `GET /users` returns all users as JSON. Support an optional `?limit=` query parameter: `GET /users?limit=2` returns only the first 2 users. If `limit` is not a number, ignore it and return all users.
2. `GET /users/:id` returns that one user as JSON. If no user has that id, answer `404` with `{ "error": "User not found" }`.
3. `POST /users` reads a JSON body (`{ "name": ..., "email": ... }`) and adds a new user with the next id. Answer `201` with the created user. If `name` or `email` is missing, answer `400` with `{ "error": "name and email are required" }`.

Test every route with `curl`, including the `404` and `400` cases. Remember: `req.params.id` is a string, and `req.body` needs `express.json()`.

## Task 2 — Find the three bugs (body, status, double send)

The snippet below is broken in three ways. Do **not** just fix it from memory — run it first, reproduce each failure with `curl`, and write down what you observed before you fix it.

```js
const express = require('express');
const app = express();

app.post('/login', (req, res) => {
  if (!req.body.username) {
    res.status(400).json({ error: 'username is required' });
  }
  res.json({ message: `Welcome, ${req.body.username}` });
});

app.get('/secret', (req, res) => {
  res.status(401);
});

app.listen(3000);
```

1. What happens when you POST `{ "username": "talha" }` to `/login`? What happens when you POST `{}`? Which line causes the crash, and why does `return` fix it?
2. What happens when you GET `/secret`? Why does the request never finish?
3. After fixing both routes, test with `curl -v` and confirm the status codes and bodies are what you expect. Then deliberately remove `express.json()` and POST again — what does `req.body` become, and what does the client receive?

## Task 3 — Redirects and files (redirect, sendFile, download)

Build an app with a `public/` folder containing a small HTML file and a small text file of your own making.

1. `GET /old-docs` redirects to `/docs` with a `301`. `GET /docs` serves your HTML file with `res.sendFile` so the browser displays it.
2. `GET /download` serves your text file with `res.download` so the browser saves it. Give it a different filename than the one on disk (second argument) and confirm the saved name with `curl -v` (look for the `Content-Disposition` header).
3. Add a route `GET /moved/:page` that redirects to `/docs` — use a `302` here, not a `301` — and explain in a comment when you would choose each status.

Test with `curl -v` (to see the status and `Location` header) and with `curl -L` (to follow the redirect). What does `curl` show for the `301` route on the *second* request, and why?

## Task 4 — One URL, three formats (content negotiation)

Build `GET /quote` so it answers according to the client's `Accept` header, using `res.format`:

- `Accept: application/json` → `{ "quote": "...", "author": "..." }` (pick any quote you like).
- `Accept: text/plain` → the quote as plain text, e.g. `"..." — Author`.
- `Accept: text/html` → a small HTML page showing the quote.
- Anything else → `406` with a plain-text message listing the formats you support.

Test all four cases with `curl -H "Accept: ..."`. Then test with no `Accept` header at all — which format do you get, and why? (Hint: check what `curl` sends by default.) Finally, add a `?format=json` query parameter that overrides the header when present — which should win, the query or the header, and why did you choose that?

## Task 5 — Request-scoped data with `res.locals` (middleware + handler)

Build an app with two pieces of middleware and one route. You may not use any module-level variable to store per-request data.

1. A logging middleware that stamps `res.locals.startedAt = Date.now()` and logs `METHOD path` for every request.
2. An "auth" middleware for `GET /dashboard` only: read the `Authorization` header. If it is missing, answer `401` with `{ "error": "Missing Authorization header" }` and stop the chain. If it is present, store the token (the part after `Bearer `) on `res.locals.token` and call `next()`.
3. `GET /dashboard` reads `res.locals.token` and `res.locals.startedAt` and answers JSON: `{ "token": "...", "tookMs": <number> }`.

Test: no header → `401`; `Authorization: Bearer abc123` → `200` with the token echoed back. Then open two requests quickly — do the `tookMs` values differ? Explain in a comment why storing `startedAt` on `res.locals` is safe but storing it in a module-level variable would not be.

---

## Interview-Style Questions

No solutions here — work them out from [`notes.md`](./notes.md) (Section 12) and your own testing.

1. What are `req` and `res` in Express, and what does each one carry?
2. What is the difference between `req.params` and `req.query`? Give an example of each.
3. Why is `req.body` undefined in a POST handler, and what are the three usual causes?
4. What is the difference between `res.send` and `res.json`? When does the difference actually show?
5. What does `res.status()` do — and what happens if you call it without chaining a send?
6. How do you redirect in Express, and when do you use `301` vs `302`?
7. What is content negotiation, and how does `res.format` work? What should happen when no format matches?
8. What is `res.locals`, and why is it safer than a global variable for per-request data?
9. What is the difference between `res.sendFile` and `res.download`?
10. What happens if you try to send two responses in one handler, and how do you prevent it?
11. How does `express.json()` work internally, step by step?
12. A client sends `Accept: application/json` but your route only serves HTML. What should the server do, and why not just return the HTML anyway?

---

[← Main README](../../README.md) · Previous: [04 — Routing](../04-routing/README.md) · Next: [06 — Middleware](../06-middleware/README.md)

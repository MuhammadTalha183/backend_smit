# Exercises — 06 Middleware

Do these **after** reading [notes.md](./notes.md) and running `NODE_PATH=/tmp/express-verify/node_modules node examples/middleware.js`.

No solutions are provided on purpose — the exercise *is* the learning.
If you are stuck, re-read the matching part of [notes.md](./notes.md) and run the example again.

---

## Basic Understanding

### Exercise 1 — Trace the Stack ⭐ Start here

Copy `examples/middleware.js` to a scratch file (do not edit the original) and add a second logger middleware — one that prints `[second] <method> <url>` — registered **between** the `express.json()` line and the `express.static()` line. Run it and answer:

- For `GET /`, in what order do `[logger]`, `[second]`, and the response line appear?
- For `GET /hello.txt`, does `[second]` print? Why or why not?
- Now move your second logger to **after** the `app.get('/early', ...)` line. Which requests still print `[second]`, and which stop printing it?

**Done when:** you can predict, before running, whether a middleware will run for a given request — just from where it is registered.

---

## Conceptual

### Exercise 2 — Order Breaks Things (on Purpose)

In your scratch copy, move `app.use(express.json())` to **after** all the route definitions (just before the error handler). Run the example and answer:

- What does `POST /echo` return now, and why?
- Does anything else change? Check every line of the output against `examples/example.txt` and list exactly which lines differ.
- Put `express.json()` back where it belongs. In one sentence, state the rule this exercise proves.

**Done when:** you can explain the "why is req.body empty?" bug to someone else — including the two different causes (missing parser vs parser registered too late).

---

## Hands-On

### Exercise 3 — Build a Request Timer Middleware

Write a new middleware, `timer`, that records `Date.now()` when the request arrives, then logs `METHOD URL took Xms` when the response **finishes**. Hint: `res.on('finish', ...)` fires when the response is done — register the listener inside the middleware, then call `next()` immediately.

Add it as the very first `app.use()` in your scratch copy and run the example. Then answer:

- Why must you use the `finish` event instead of just logging right after `next()`?
- Move `timer` to just before the error handler. Which requests does it still time, and which does it miss?

**Done when:** every request in the output has a `took Xms` line, and you can explain why the placement matters.

---

## Hands-On

### Exercise 4 — Role-Based Access with Route-Level Middleware

Add a second auth-style middleware, `requireRole`, that reads the `x-role` header and only lets the request through when the header is `admin` — otherwise it sends 403 with `{ "error": "Forbidden: admin role required" }`.

Add a route `GET /admin` that uses **both** `checkApiKey` and `requireRole` (in that order) before its handler, and test all four combinations in the self-test section:

1. No headers at all
2. Only `x-api-key: secret123`
3. Only `x-role: admin`
4. Both headers

Answer:

- In case 2, does `requireRole` run? How do you know from the output?
- Swap the order to `requireRole` first, then `checkApiKey`. Which case changes its behaviour, and why?
- Why is chaining two small middlewares better than writing one big middleware that checks both headers?

**Done when:** all four combinations return the status you predicted before running, and the handler only runs for case 4.

---

## Build

### Exercise 5 — A Mini App with Three Scopes

Build a fresh file, `examples/my-app.js` (scratch — not part of the deliverable), that uses all three middleware levels:

- **Application-level:** a logger for every request and `express.json()`.
- **Router-level:** an `express.Router()` mounted at `/api` with a middleware that adds `req.requestId` (a short random string) to every request through the router, plus two routes: `GET /api/users` (returns a hard-coded list) and `POST /api/users` (echoes `req.body` plus the `requestId`).
- **Route-level:** a `GET /api/admin` route on the same router with an extra middleware that requires the `x-api-key` header (reuse the pattern from `checkApiKey`).
- A 4-argument error handler at the end, and the same self-test pattern as the demo: listen on port 0, `fetch` your own routes, print the results, `server.close()`, `process.exit(0)`.

Test it with and without the API key, and with a JSON body on `POST /api/users`.

**Done when:** your app runs with exit code 0, the `requestId` appears on the `/api` routes but not on any route outside the router, and `/api/admin` returns 401 without the key.

---

## Interview-Style Questions

Answer out loud, in your own words. Full answers with explanations are in [notes.md](./notes.md) Section 12 — check yourself **after** answering, not before.

1. What is middleware in Express, and what is the signature of a middleware function?
2. What does `next()` do? What happens if a middleware neither calls `next()` nor sends a response?
3. What is the difference between `app.use()` and `app.get()`?
4. Why does the order of middleware matter? Give a concrete example.
5. What is the difference between application-level, router-level, and route-level middleware?
6. What does `express.json()` do, and why is `req.body` sometimes `undefined`?
7. How does `express.static()` work — and what does it do when the file does not exist?
8. How do you recognise an error-handling middleware, and where must it be registered?
9. How would you write middleware that only allows logged-in users?
10. Can middleware be async? What should you watch out for?

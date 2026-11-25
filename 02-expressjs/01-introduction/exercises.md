# Exercises — 01 Introduction to Express.js

Do these **after** reading [notes.md](./notes.md) and running `NODE_PATH=/tmp/express-verify/node_modules node examples/hello-express.js`.

No solutions are provided on purpose — the exercise *is* the learning.
If you are stuck, re-read the matching part of [notes.md](./notes.md) and run the example again.

> All exercises run the same way as the example — no `npm install`, no `node_modules` in this repo:
>
> ```bash
> NODE_PATH=/tmp/express-verify/node_modules node <your-file>.js
> ```

---

## Basic Understanding

### Exercise 1 — Raw `http` vs Express, Side by Side ⭐ Start here

Take the raw-`http` server from [notes.md §3.1](./notes.md#3-detailed-explanations) and the Express version of the same server, and run both (on different ports — say 3000 for one and 3001 for the other). Use `curl` or your browser to hit `/`, `/hello/Talha`, and `/json` on each, plus a path that does not exist, like `/nope`.

**Questions to answer:**
- Which responses are identical between the two servers, and which (if any) differ — headers included? (`curl -i http://127.0.0.1:3000/` shows the headers.)
- What does the raw-`http` server return for `/nope`, and what does the Express server return? Which lines of code produce each answer?
- Add a fourth route (`/goodbye/:name`) to **both** servers. Count the lines you added in each. What does the difference tell you?

**Done when:** both servers answer the same four routes, and you can explain — without looking — what Express is doing for you on each route.

---

## Conceptual

### Exercise 2 — What Express Does NOT Do

For each feature below, decide: is it built into Express, or does it come from somewhere else? If somewhere else, say what provides it (a package, your own code, or another layer of the stack).

| # | Feature |
|---|---|
| 1 | Routing `GET /users/:id` to a handler |
| 2 | Storing users in PostgreSQL |
| 3 | Parsing a JSON request body into `req.body` |
| 4 | Checking that `email` is present and valid in a request |
| 5 | Serving `style.css` from a `public/` folder |
| 6 | Logging a user in and issuing a token |
| 7 | Rendering an HTML page from a template + data |
| 8 | Accepting an uploaded profile photo |
| 9 | Sending a 404 when no route matches |
| 10 | Sending a JSON response with `res.json()` |

**Questions to answer:**
- Pick any two "somewhere else" rows: what would you actually use instead, and in which later topic of this module will you meet it?
- A classmate says "Express has a database built in, like Django." Write the one-paragraph correction you would give them.

**Done when:** all ten rows are classified correctly, and you can name the real provider for every "somewhere else" row.

---

### Exercise 3 — Minimal vs Opinionated

You have three jobs. For each one, choose raw Node.js `http`, Express, or an opinionated framework (e.g. NestJS) — and defend the choice in two or three sentences.

1. A webhook receiver: one `POST /stripe-webhook` endpoint that verifies a signature and records a payment.
2. A REST API for a semester project: users, posts, and comments, built by two students over eight weeks, with a React frontend.
3. A bank's new account-opening system: twenty developers, strict audit rules, the same codebase maintained for ten years.

**Questions to answer:**
- For job 2, what breaks first if you pick raw `http` instead of Express — and at roughly how many routes?
- For job 3, what does the opinionated framework give you that Express does not — and what does it cost you?
- Is there a job here where Express is the *wrong* answer even though it would work? Which one, and why?

**Done when:** all three choices are defended, and you can state the rule you used to choose — not just the answers.

---

## Practical Coding

### Exercise 4 — Grow the Example: Query Strings, Status Codes, and a 404 You Can See

Copy `examples/hello-express.js` to a new file called `my-routes.js` (in the same `examples/` folder) and extend it — the original stays untouched:

1. Add `GET /users/:id` — answer with `res.json({ id: req.params.id })`. Check what type `id` is, and what happens when you visit `/users/42?tab=posts` (add `req.query.tab` to the response).
2. Add `GET /teapot` — answer with status `418` and the text `I'm a teapot`. (Yes, 418 is a real status code. Use `res.status(418).send(...)`.)
3. Add a `GET /search` route that reads `req.query.q` and answers `You searched for: <q>`. What does it answer when `q` is missing? Make it answer `400` with `Missing ?q=` in that case.
4. Keep the self-test pattern from the original: after the server starts, `fetch()` your new routes too, print the responses, then close the server and exit.

**Questions to answer:**
- In step 1, is `req.params.id` a number or a string? What breaks if you compare it with `=== 42`?
- In step 3, why is a missing `q` a `400` and not a `404`? (Hint: the route matched — what is wrong?)
- Visit a path you did not define, e.g. `/nothing-here`. Who answers, and with what status? Did you write any code for that?

**Done when:** `my-routes.js` runs, self-tests all routes including the new ones, prints their responses, and exits cleanly with code 0.

---

### Exercise 5 — Your First Middleware (Before Topic 05)

Middleware gets its full topic in topic 05 — but you already know enough to build the simplest useful one. In a new file `my-middleware.js`:

1. Register a middleware with `app.use()` **before** your routes that prints `${req.method} ${req.url}` for every request, then calls `next()`.
2. Add two routes (`/` and `/hello/:name`, as in the example).
3. Run it and hit both routes. Then move the `app.use()` line to **after** the routes, run it again, and hit both routes again.

**Questions to answer:**
- After the move, which requests still get logged, and which do not? Why — what does registration order have to do with it?
- Remove the `next()` call from the middleware (keep it before the routes). What happens when you hit `/` now, and why?
- Add a second middleware, also before the routes, that prints `second middleware`. In what order do the two log lines appear? What decides that order?

**Done when:** you can predict, before running, whether a request will be logged — from the order of the lines in the file alone.

---

## Interview-Style Questions

Try answering these out loud, in your own words, before checking the short answers in [notes.md §12](./notes.md#12-interview-questions-and-answers):

1. What is Express.js?
2. Why use Express instead of Node.js's built-in `http` module?
3. Is Express a server? Does it replace Node.js?
4. What is middleware? Give an example.
5. What is the difference between `app.get()` and `app.use()`?
6. What are route parameters, and how are they different from query strings?
7. What does Express NOT do?
8. What is the difference between a minimal and an opinionated framework?
9. What changed in Express 5 compared to Express 4?
10. How does a request flow through an Express app?
11. What is the difference between `res.send()` and `res.json()`?
12. When would you use raw Node.js `http` instead of Express — and when would you use something bigger than Express?

---

## Checklist

- [ ] Exercise 1 — both servers compared, fourth route added to each, line counts compared
- [ ] Exercise 2 — ten features classified, "somewhere else" providers named
- [ ] Exercise 3 — three jobs matched to a stack, each choice defended
- [ ] Exercise 4 — `my-routes.js` runs, self-tests, and exits with code 0
- [ ] Exercise 5 — middleware order and the missing-`next()` hang demonstrated

**Next topic:** [02 — Project Setup](../02-project-setup/README.md)

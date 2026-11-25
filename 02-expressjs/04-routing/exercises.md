# Exercises — 04 Routing

Do these **after** reading [notes.md](./notes.md) and running `NODE_PATH=/tmp/express-verify/node_modules node examples/routing.js`.

No solutions are provided on purpose — the exercise *is* the learning.
If you are stuck, re-read the matching part of [notes.md](./notes.md) and run the example again. Answers to the interview-style questions are in [notes.md](./notes.md) (section 12) — try them yourself first.

---

## Basic Understanding

### Exercise 1 — Predict the Match ⭐ Start here

For each request below, say which route (if any) handles it, and what `req.params` / `req.query` hold. Do not run anything yet — decide from the registration order.

```js
app.get('/users/new', (req, res) => res.send('new user form'));
app.get('/users/:id', (req, res) => res.send('user ' + req.params.id));
app.get('/users/:id/posts/:postId', (req, res) => res.send('a post'));
app.get('/search', (req, res) => res.send('search'));
app.get('/files/*splat', (req, res) => res.send('file ' + req.params.splat));
```

| # | Request | Which route? | `req.params` / `req.query` |
|---|---|---|---|
| 1 | `GET /users/new` | | |
| 2 | `GET /users/42` | | |
| 3 | `GET /users/42/posts/7` | | |
| 4 | `GET /search?q=express&page=3` | | |
| 5 | `GET /files/docs/2026/report.pdf` | | |
| 6 | `GET /users` | | |
| 7 | `POST /users/42` | | |

**Questions to answer:**
- In row 1, why does the request reach the first route and not the second — and what would happen if the two routes were registered in the opposite order?
- In row 6, why is there no match even though a `/users/:id` route exists?
- In row 7, why does the method matter — is there a route with a matching path?

**Done when:** you can trace any request through a route list by hand, and explain "first match wins" in one sentence.

---

## Conceptual

### Exercise 2 — Parameter or Query String?

For each feature below, decide whether the changing value belongs in a **route parameter** or a **query string**, and write the route path you would register. Justify each choice in one line (identity vs filter is the test).

1. Show one product: the product's id is `9`.
2. List products, filtered by category `shoes` and sorted by `price`.
3. Show one comment (`5`) on one post (`12`) by one user (`3`).
4. Search articles for the word `middleware`, showing page `2`.
5. Show the profile of the user whose username is `talha`.

**Done when:** every choice has a reason, and you can state the rule — parameters identify *which* resource, query strings modify *how* it is fetched — without looking it up.

---

## Hands-On

### Exercise 3 — Build a Small Book API

Create `books.js` (a copy of `examples/routing.js` is a good starting point) with an in-memory array of at least 3 books (`{ id, title, author }`). It must have:

- `GET /` — a welcome message.
- `GET /books` — all books; support `?author=…` to filter by author (return all books when the query is absent).
- `GET /books/:id` — one book by id; return `404` with a JSON error when the id does not exist. Remember: `req.params.id` is a string — convert it before comparing.
- `POST /books` — create a book from a JSON body (`{ "title": "…", "author": "…" }`); assign the next id yourself; answer `201` with the created book. (You need `express.json()` — where must that line go, and why?)
- `PUT /books/:id` — replace a whole book; `PATCH /books/:id` — update only the fields sent. What should each one do when the id does not exist?
- A `404` catch-all as the very last route, answering JSON.

Like the demo, listen on port `0`, `fetch()` your own routes, print the results, and exit. Test the unhappy paths too (unknown id, unknown route) — a route is only done when its failure case works.

**Done when:** every route above works, the 404 cases return JSON with status `404`, and the server exits on its own.

---

## Hands-On

### Exercise 4 — Split Into Routers and Mount Them

Take your `books.js` from Exercise 3 and split it the way a real app is split:

1. Move all `/books…` routes into a `booksRouter` built with `express.Router()` in its own file (`routes/books.js`).
2. Add a second router, `authorsRouter` (`routes/authors.js`), with at least `GET /` (list authors) and `GET /:id` (one author).
3. In your main file, mount them: `app.use('/api/books', booksRouter)` and `app.use('/api/authors', authorsRouter)`.
4. Verify with `fetch()`: `GET /api/books`, `GET /api/books/1`, `GET /api/authors`, `GET /api/authors/2`.

**Questions to answer:**
- Inside `routes/books.js`, what path do you write for "one book" — `/api/books/:id` or `/:id`? Why?
- Move the mount line `app.use('/api/books', booksRouter)` to *before* the `GET /` home route. Does anything change? Why or why not?
- Add a `router.use()` logging line inside `booksRouter` that prints every request reaching it. Which requests does it see — and which does it *not* see?

**Done when:** the main file is mostly `require` + `app.use` mount lines, and every route still answers at its new `/api/…` path.

---

## Debugging

### Exercise 5 — Find the Three Bugs

The app below has three routing bugs. Find each one, say what symptom it causes, and fix it. Do not rewrite the whole app — one-line fixes.

```js
const express = require('express');
const app = express();

app.get('/users/:id', (req, res) => {
  res.json({ userId: req.params.id });
});

app.get('/users/new', (req, res) => {
  res.send('new user form');
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.post('/users', (req, res) => {
  res.status(201).json({ created: true, name: req.body.name });
});

app.get('/files/*', (req, res) => {
  res.json({ file: req.params[0] });
});

app.listen(3000);
```

**Questions to answer:**
- Bug 1: what does `GET /users/new` return, and which two routes need to swap places?
- Bug 2: why does `POST /users` always answer `404` — and what is missing that would also break `req.body` even if the order were fixed?
- Bug 3: the app crashes at startup before serving anything. Which line throws, why (Express 5), and what is the correct wildcard form?

**Done when:** all three bugs are named with their symptom *and* their fix, and the fixed app starts and answers `GET /users/new`, `POST /users`, and `GET /files/a/b.txt` correctly.

---

## Interview-Style Questions

Try these from memory first, then check your answers against section 12 of [notes.md](./notes.md).

1. How does Express match a request to a route?
2. What is the difference between a route parameter and a query string? When would you use each?
3. Why is `req.params.id` a string even when the URL contains a number, and what goes wrong if you forget?
4. You register `app.get('/users/:id')` before `app.get('/users/new')`. A user visits `/users/new` and sees the wrong page. Why, and how do you fix it?
5. What is `express.Router()` and why does mounting matter in a real application?
6. What is `app.route()` for, and when should you *not* use it?
7. How do you handle 404s in Express, and why must the handler be last?
8. What changed about wildcards between Express 4 and Express 5?
9. Can one path have different handlers for GET and POST? How?
10. What is the difference between `app.use('/api', router)` and `app.get('/api', handler)`?

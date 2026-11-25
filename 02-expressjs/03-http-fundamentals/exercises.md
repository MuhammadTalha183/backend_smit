# Exercises — 03 HTTP Fundamentals

Do these **after** reading [notes.md](./notes.md) and running `NODE_PATH=/tmp/express-verify/node_modules node examples/http-demo.js`.

No solutions are provided on purpose — the exercise *is* the learning.
If you are stuck, re-read the matching part of [notes.md](./notes.md) and run the examples again.

---

## Basic Understanding

### Exercise 1 — Read a Request and a Response ⭐ Start here

Here is a raw request and the raw response it got back. Read both, then answer the questions — no running anything yet.

```http
POST /orders HTTP/1.1
Host: shop.example.com
Content-Type: application/json
Authorization: Bearer tok_9f2
Accept: application/json

{"item": "keyboard", "qty": 2}
```

```http
HTTP/1.1 201 Created
Content-Type: application/json
Location: /orders/1042

{"id": 1042, "item": "keyboard", "qty": 2, "status": "placed"}
```

**Questions to answer:**
- What is the method, the path, and the HTTP version of the request?
- Which header carries the client's credentials, and which header says the body is JSON?
- What does the `201` status code mean, and why is it `201` here instead of `200`?
- What is the `Location` header telling the client, and what would the client GET to fetch this order later?

**Done when:** you can read any raw request/response pair and name the method, path, status code, and the job of every header in it.

---

## Conceptual

### Exercise 2 — Pick the Method and the Status Code

For each operation below, choose the method (GET, POST, PUT, PATCH, DELETE) and the success status code — and say what the response should be when it fails in the way described.

| # | Operation | Failure case |
|---|---|---|
| 1 | Fetch one blog post by its slug | No post has that slug |
| 2 | Create a new comment on a post | The comment text is missing |
| 3 | Change only a user's profile picture URL | The user ID does not exist |
| 4 | Replace a user's entire settings object | The settings JSON is malformed |
| 5 | Delete a product | The product is part of an active order |
| 6 | Log in with email + password | The password is wrong |
| 7 | Fetch a list of products, filtered by category | The category value is not a real category |

**Questions to answer:**
- In row 3, why PATCH and not PUT — and what would go wrong if you used PUT with only the picture URL in the body?
- In row 5, which status code fits "the request is fine, but the current state refuses it" — and why is it not a 400?
- In row 6, is the failure a 401 or a 403 — and what would have to change for it to be the other one?
- In row 7, is a bad category a 400, a 404, or a 200 with an empty list? Defend your choice in one sentence.

**Done when:** you can justify every method and status code choice with the rule behind it (safe/idempotent, 4xx vs 5xx), not just "it feels right".

---

## Hands-On

### Exercise 3 — Extend the Demo App

Copy `examples/http-demo.js` to a new file called `examples/http-practice.js` (keep the original untouched) and add the following, then run it the same way and check the output:

1. A `PUT /users/:id` route that answers `200` with `{ "id": "<the param>", "updated": true }`.
2. A `DELETE /users/:id` route that answers `204` with no body — then check what your fetch call actually logs for the body of a 204.
3. A `GET /old-page` route that answers `301` with a `Location: /` header. What does `fetch()` do with a 301 by default — does your log line show the 301, or the 200 it was redirected to? Explain why.
4. A `GET /me` route that reads the `Authorization` header with `req.get()` and answers `401` with `{ "error": "Unauthorized" }` when the header is missing, and `200` with `{ "user": "talha" }` when it is present. Call it twice from the demo — once without the header, once with `Authorization: Bearer demo-token`.
5. A `POST /login` route that uses `express.urlencoded()` instead of `express.json()`: send it a URL-encoded body (`username=talha&password=secret`) with `Content-Type: application/x-www-form-urlencoded` and log what `req.body` contains.

**Done when:** all five new routes log the status codes you expected, and you can explain the 301 and 204 surprises in your own words.

---

## Debugging

### Exercise 4 — Find the Bug (Three Broken Apps)

Each snippet below has one HTTP bug. For each one, say what goes wrong when a client calls it, *why* it goes wrong (which rule from the notes it breaks), and the smallest fix.

**Bug A:**

```js
const express = require('express');
const app = express();

app.post('/users', (req, res) => {
  res.status(201).json({ name: req.body.name });
});

app.listen(3000);
```

**Bug B:**

```js
const express = require('express');
const app = express();
app.use(express.json());

app.get('/users/:id', (req, res) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(400).json({ error: 'User not found' });
  res.json(user);
});

app.listen(3000);
```

**Bug C:**

```js
const express = require('express');
const app = express();
app.use(express.json());

app.delete('/users/:id', (req, res) => {
  users = users.filter((u) => u.id !== Number(req.params.id));
  res.status(200).json({ message: 'User deleted successfully' });
});

app.listen(3000);
```

**Questions to answer:**
- In Bug A, the client sends valid JSON with `Content-Type: application/json` and gets back `{}`. Which layer failed — the client, Express, or the route — and what single line fixes it?
- In Bug B, the status code is wrong for the failure. Which code should it be, and what would have to be true about the request for 400 to be the right answer instead?
- In Bug C, the code works — so what is the *design* bug? Which status code is the better fit, and what does the response body buy the client here (hint: nothing — why?).

**Done when:** you can spot all three bugs on sight, and you have fixed each one in a copy of the snippet and verified it runs.

---

## Applied

### Exercise 5 — Design a Tiny API on Paper

Design the HTTP surface of a **library API** (books only — no code, just the design). It must support: listing all books, fetching one book by ID, adding a new book, updating a book's title only, replacing a book entirely, deleting a book, and searching books by author.

For each endpoint write down: the method, the path, where each piece of data travels (route param / query string / body), the success status code, and the failure status code(s) for at least one realistic failure.

Then answer:
- A client sends the same "add a book" request twice because the first response was lost. What happens in your design, and what would you add to the API to make the retry safe?
- Your search endpoint gets `GET /books?author=` (empty value). Do you return 400, or 200 with all books? Defend your choice.
- A book's title contains an `&` character. A client searches for it with `GET /books?author=...` — what breaks, and whose job is it to fix it (client or server)?

**Done when:** your design uses each of GET, POST, PUT, PATCH and DELETE at least once, every status code has a reason, and you can explain the retry-safety answer without re-reading the notes.

---

## Interview-Style Questions

Answer these out loud, in your own words, without looking at the notes first. The full answers are in [notes.md](./notes.md) (section 12) — check yourself after, not during.

1. What is HTTP, and what does one request/response cycle look like?
2. What is the difference between GET and POST — and why can you safely retry a GET but not a POST?
3. What does "idempotent" mean? Which methods are idempotent, and which one is not?
4. What is the difference between PUT and PATCH? What goes wrong if you use PUT with a partial object?
5. What do the status code families 2xx, 3xx, 4xx and 5xx mean? Give two codes from each family you would actually use.
6. When do you return 201 instead of 200 — and what header usually goes with a 201?
7. What is the difference between 401 and 403? Between 400 and 404? Between 400 and 422?
8. Name three request headers and three response headers, and say what each one does.
9. How does Express relate to Node.js's built-in `http` module? What are `req` and `res`, really?
10. Why is `req.body` undefined when you POST JSON to Express — and what are the two things to check?
11. Route param, query string, or body — where does each kind of data belong, and why?
12. What is the difference between `application/json`, `application/x-www-form-urlencoded`, and `multipart/form-data` — and which parser handles each one?
13. A client POSTs the same order twice and gets charged twice. What went wrong, and how do you fix it?
14. Why should a DELETE return 204 instead of 200 — and why must a 204 have no body?

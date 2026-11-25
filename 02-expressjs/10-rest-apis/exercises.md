# Exercises — 10 REST APIs

Do these **after** reading [notes.md](./notes.md) and running `NODE_PATH=/tmp/express-verify/node_modules node examples/rest-api.js`.

No solutions are provided on purpose — the exercise *is* the learning.
If you are stuck, re-read the matching part of [notes.md](./notes.md) and run the example again.

---

## Basic Understanding

### Exercise 1 — Fix the Routes ⭐ Start here

A teammate designed this API. Every route below breaks at least one REST rule — find each problem and rewrite the route properly.

| # | Route | Problem to find |
|---|---|---|
| 1 | `GET /getAllUsers` | |
| 2 | `POST /createUser` | |
| 3 | `GET /deleteUser/7` | |
| 4 | `POST /users/7/updateEmail` | |
| 5 | `GET /user/7` | |
| 6 | `GET /users/7/posts/3/comments/2/likes` | |

**Questions to answer:**
- Which of these would break if a search engine crawled the site, and why?
- For route 6, what is the flatter design you would use instead?

### Exercise 2 — Which Status Code?

For each situation, write the status code — and one line saying why.

1. `GET /api/v1/posts/42` and post 42 exists.
2. `POST /api/v1/posts` with a valid body.
3. `POST /api/v1/posts` with no `title` field.
4. `GET /api/v1/posts/999` and post 999 does not exist.
5. `DELETE /api/v1/posts/5` and it worked.
6. A logged-in student calls `DELETE /api/v1/users/1` (admin only).
7. A request with no token at all calls `GET /api/v1/profile`.
8. The database connection is down and every request fails.
9. Registering with an email that is already taken.
10. `PUT /api/v1/posts/3` replacing post 3 successfully.

---

## Conceptual

### Exercise 3 — Design the Q-less API

Design the REST API for Q-less (take a token for a uni office, watch your live queue position). Write a table: method, URL, success code, and one line of what it does. You need at least:

- List the offices (admin, fees, documents, library).
- Take a token for one office.
- Check your token's live position in the queue.
- An office counter calls the next token.
- Mark a token done or missed.

**Questions to answer:**
- Where does the version go, and why?
- Which endpoint is *not* idempotent, and what happens if the client sends it twice?
- What does the list endpoint return so the mobile app can show "you are 3rd in line, 2 people ahead"?

### Exercise 4 — The Envelope Test

You are reviewing a teammate's API. These are three real responses from it. For each one, say what is wrong and rewrite it in the envelope shape from the notes.

1. `GET /api/v1/users` → `200` with body `[{ "id": 1 }, { "id": 2 }]`
2. `GET /api/v1/users/99` → `200` with body `{ "error": "not found" }`
3. `POST /api/v1/users` → `200` with body `{ "user": { "id": 5 }, "message": "created" }`

**Questions to answer:**
- Why is response 2 invisible to monitoring tools?
- Why does response 3 force the frontend to special-case this one endpoint?

---

## Practical Coding

### Exercise 5 — Build the Comments API

Extend [`examples/rest-api.js`](./examples/rest-api.js) (copy it to a new file first — don't edit the original) with a second resource, **comments**, nested under posts: `GET /api/v1/posts/:postId/comments`, `POST /api/v1/posts/:postId/comments`, `DELETE /api/v1/posts/:postId/comments/:commentId`.

Rules:
- A comment has `id`, `postId`, `author`, `text`.
- Creating a comment for a post that doesn't exist returns 404.
- `text` is required — reuse the validation pattern from the posts example.
- Every response uses the same envelope, and deleting returns 204.
- Add self-test calls at the bottom (like the existing ones) and check the output by hand.

**Then answer:**
- Why is one level of nesting (`/posts/:postId/comments`) fine, but a second level (`/posts/:postId/comments/:commentId/replies`) a warning sign?
- Where would you put the comments logic if this file grew — routes, controllers, or a service?

---

## Interview-Style Questions

Answer these out loud, in your own words, without looking at the notes first. The answers are in [notes.md](./notes.md) (section 12) — check yourself after.

1. What is REST, and what makes an API "RESTful"?
2. Why must a delete never be a GET request?
3. What is the difference between PUT and PATCH?
4. Why return 201 instead of 200 when creating a resource?
5. What is an idempotent method, and which HTTP methods are idempotent?
6. How do you paginate a list, and why is it necessary?
7. What is a response envelope and why use one?
8. How do you version an API, and why?
9. What is the N+1 problem?
10. When would you choose GraphQL or gRPC instead of REST?

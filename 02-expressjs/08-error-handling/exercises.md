# 08 — Error Handling — Exercises

> 5 practice tasks. No solutions — check your answers against `notes.md` and by running your code. Interview questions are answered in `notes.md` §12.

## Task 1 — Find the missing handler (basic)

This app has routes but no error handling. Add a catch-all 404 middleware and a central error-handling middleware (four arguments, registered last), and make every error answer in the format `{ "error": "..." }`. Test it with `GET /users/999` and `GET /no-such-route`.

```js
const express = require('express');
const app = express();
const users = [{ id: 1, name: 'Talha' }];
app.get('/users/:id', (req, res) => {
  const user = users.find((u) => u.id === Number(req.params.id));
  if (!user) throw new Error('User not found');
  res.json(user);
});
app.listen(3000);
```

## Task 2 — Custom error classes (conceptual)

Design three custom error classes for a small shop API: `NotFoundError` (404), `BadRequestError` (400), and `UnauthorizedError` (401). All three extend one `AppError` base class that stores the status. Write the classes, then write the central handler that answers any of them correctly — and say what status it answers when a plain `Error` (no status) arrives, and why.

## Task 3 — The Express 4 trap (practical coding)

Write an async route handler that awaits a promise which rejects with `new Error('DB down')`. Run it on Express 5 and record what the client receives. Then, without changing the Express version, rewrite the same route the way Express 4 would have required it (try/catch + `next(err)`), and explain in two sentences why the wrapper pattern existed.

## Task 4 — The disappearing error handler (conceptual)

A teammate "cleaned up" the central error handler by removing the unused `next` parameter, changing `(err, req, res, next)` to `(err, req, res)`. After that, errors stopped being answered by it at all — clients started getting Express's default error page instead. Explain why, using what you know about how Express recognizes error middleware. Then explain why the `next` parameter must stay even though the function never calls it.

## Task 5 — A leak in production (scenario-based)

Your API is live. A user reports that when they request a product with an id that does not exist, the response contains a stack trace showing your file paths and the database library you use. (a) What is wrong, and what is the risk? (b) What change to the error handler fixes it, while keeping stack traces available to you in development? (c) The same API also returns raw database error text like `duplicate key value violates unique constraint "users_email_key"` — what should the client receive instead, and where should that translation happen?

## Interview-Style Questions

Answer these in your own words, then check against `notes.md` §12.

1. How does Express handle errors, and what is error-handling middleware?
2. How do async errors differ between Express 4 and Express 5?
3. What is the difference between a 404 and a 500 — and who is "at fault" in each case?
4. Why use custom error classes instead of plain `Error`?
5. Why must stack traces never reach the client in production?
6. A URL with no route returns Express's default HTML page. How do you fix that?

---

[← Module README](../README.md) · Previous: [07 — Controllers](../07-controllers/README.md) · Next: [09 — Validation](../09-validation/README.md)

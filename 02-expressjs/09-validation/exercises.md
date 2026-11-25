# 09 — Validation — Exercises

> 5 practice tasks. No solutions — check your answers against `notes.md` and by running your code. Interview questions are answered in `notes.md` §12.

## Task 1 — Write a validator from scratch (basic)

Write a `validateProductBody` middleware for `POST /products` that checks: `title` is a required string of at least 3 characters, `price` is a required number greater than 0, and `category` is optional but, when present, must be one of `'books'`, `'electronics'`, `'clothing'`. Collect all errors and answer `400 { errors: [...] }` when any check fails. Test it with a valid product, a missing title, a negative price, and a bad category — all four in one run.

## Task 2 — Params and query are strings (conceptual)

A teammate wrote this check for `GET /orders?page=2` and is confused by the results:

```js
if (req.query.page + 1 > 10) { /* ... */ }
```

Explain what goes wrong (remember what type `req.query.page` is), write the correct validation for `page` — it must be a positive number — and say where the conversion from string to number should happen.

## Task 3 — One error at a time is a bug (practical coding)

This validator returns on the first failure, so the client discovers its mistakes one round trip at a time. Rewrite it to collect all errors and return them together, and add a check for `password` (required, at least 8 characters) while you are at it.

```js
function validateSignup(req, res, next) {
  if (!req.body.email || !req.body.email.includes('@')) {
    return res.status(400).json({ error: 'bad email' });
  }
  if (!req.body.name) {
    return res.status(400).json({ error: 'name required' });
  }
  next();
}
```

## Task 4 — Sanitization before storage (conceptual)

A user signs up with the name `"  Ayesha "` and the email `"AYESHA@Example.COM"`. Later she tries to log in with `"ayesha@example.com"` and it fails, and a search for `"Ayesha"` does not find her. Explain what went wrong, where in the request flow the fix belongs (validator, controller, or database), and what the cleaned values should be.

## Task 5 — Choose the tool (scenario-based)

You are building the semester project's registration endpoint: students register with a name, university email, password, and role (`student` or `teacher`). (a) Write the validation rules for each field. (b) Say whether you would hand-write the checks or use express-validator or zod for this endpoint, and give one reason for your choice. (c) A teammate suggests skipping server validation because the React Native form already checks everything — write the two-sentence reply you would give them.

## Interview-Style Questions

Answer these in your own words, then check against `notes.md` §12.

1. Why must validation happen on the server even if the frontend already validates?
2. What is the difference between validation and sanitization?
3. Where should validation run, and why must it run before the controller?
4. What status code and response format should a validation failure use?
5. Why do `req.params` and `req.query` need special care?
6. How does validation help security — and what does it *not* replace?

---

[← Module README](../README.md) · Previous: [08 — Error Handling](../08-error-handling/README.md) · Next: [10 — REST APIs](../10-rest-apis/README.md)

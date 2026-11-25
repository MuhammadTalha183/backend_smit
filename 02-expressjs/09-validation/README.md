# 09 — Validation

> **Priority:** 🔴 High
> **Previous topic:** [08 — Error Handling](../08-error-handling/README.md)
> **Next topic:** [10 — REST APIs](../10-rest-apis/README.md)

Never trust the client. Every request body, query string, and route parameter arrives as untrusted input — wrong types, missing fields, impossible values, or something deliberately nasty. Validation is the gate at the door: check everything *before* the controller runs, answer 400 with clear messages when it fails, and let only clean data through. It is the cheapest security your API will ever have.

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain why validation must happen on the server even when the frontend already validates.
- Validate route parameters, query strings, and request bodies — and say which kind of check belongs where.
- Write a validation middleware that runs before the controller and answers 400 on failure.
- Return clear, field-by-field error messages instead of one vague "bad request".
- Explain the difference between validation (is it the right shape?) and sanitization (clean it up).
- Name the standard validation libraries (express-validator, zod) and explain what they add over hand-written checks.
- Explain why validated input is also a security measure (injection, crashes, bad data in the database).

## Topics Covered

- Why validate: garbage in, garbage out — and worse
- The three places input arrives: `req.params`, `req.query`, `req.body`
- Manual validation with plain JavaScript (type checks, ranges, regex)
- The validation middleware pattern — check before the controller runs
- Returning 400 with field-by-field messages: `{ "errors": [{ "field", "message" }] }`
- Validation vs sanitization: reject vs clean (trim, lowercase, escape)
- Common rules: required fields, string length, email format, number ranges, enums
- Libraries: express-validator and zod — what they are for, and when to reach for them
- What validation must never do (trust the client, validate after saving, leak which check failed to an attacker)

## Links

- **Notes:** [notes.md](./notes.md) — full detailed notes, diagrams, and interview questions with answers
- **Examples:** [examples/](./examples/) — run [`validation.js`](./examples/validation.js), expected output in [`example.txt`](./examples/example.txt)
- **Exercises:** [exercises.md](./exercises.md) — 5 practice tasks, no solutions
- **Module README:** [02 — Express.js](../README.md)

**How to run the examples:**

```bash
NODE_PATH=/tmp/express-verify/node_modules node examples/validation.js
```

Express 5.3.0 is used for the examples (installed outside the repo — no `node_modules` folder is created inside it). No validation library is installed: the example validates with plain JavaScript on purpose, so the pattern is visible. The server listens on an ephemeral port, calls its own routes, prints the responses, and exits by itself.

## Key Takeaways

- Validate on the server, always — frontend validation is for user experience, server validation is for safety. The frontend can be bypassed in seconds.
- Validate early: a validation middleware runs before the controller, so bad data never reaches your business logic or your database.
- One bad field should not hide the others: collect *all* the errors and return them together, so the client can fix everything in one round trip.
- Answer 400 with field-by-field messages: `{ "errors": [{ "field": "email", "message": "email must be a valid email address" }] }`.
- Validation asks "is this the right shape?"; sanitization asks "can I clean it up first?" — trim strings and normalize case before you check or store them.
- Hand-written checks teach the pattern; in a real project, express-validator or zod do the same job with less code and fewer mistakes.

---

[← Module README](../README.md) · Previous: [08 — Error Handling](../08-error-handling/README.md) · Next: [10 — REST APIs](../10-rest-apis/README.md)

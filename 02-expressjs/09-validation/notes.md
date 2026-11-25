# 09 — Validation — Notes

> Phase 02 — Express.js · Topic 09 · Priority: 🔴 High
> Previous: [08 — Error Handling](../08-error-handling/README.md) · Next: [10 — REST APIs](../10-rest-apis/README.md)

## Table of Contents

- [1. Introduction](#1-introduction)
- [2. Definition of Important Concepts](#2-definition-of-important-concepts)
- [3. Detailed Explanations](#3-detailed-explanations)
- [4. How the Technology Works Internally](#4-how-the-technology-works-internally)
- [5. Architecture or Workflow](#5-architecture-or-workflow)
- [6. Real-World Examples](#6-real-world-examples)
- [7. Code Examples Where Applicable](#7-code-examples-where-applicable)
- [8. Step-by-Step Code Explanations](#8-step-by-step-code-explanations)
- [9. Common Misconceptions](#9-common-misconceptions)
- [10. Important Technical Terminology](#10-important-technical-terminology)
- [11. Summary](#11-summary)
- [12. Interview Questions and Answers](#12-interview-questions-and-answers)
- [13. References](#13-references)

## 1. Introduction

Every request your API receives is a stranger handing you a box. The box might contain exactly what you asked for. It might contain the right fields with the wrong types — `age: "twenty-one"`. It might contain nothing at all. Or it might contain something designed to break your database.

Validation is opening the box at the door and checking the contents *before* anything inside touches your code. If the contents are wrong, the request is answered immediately with a 400 and a clear explanation of what is wrong. If they are right, the request goes through — and the controller can trust every field it reads.

This matters for three reasons at once: correctness (bad data in the database corrupts everything downstream), user experience (a clear "email must be valid" beats a silent failure), and security (unvalidated input is how injection attacks and crashes get in). Validation is the cheapest security measure in backend development, and it is the one beginners skip most often.

## 2. Definition of Important Concepts

**Validation**
Checking that incoming data has the right shape: required fields are present, types are correct, values are in range, formats match. Validation *rejects* bad data — it never fixes it.

**Sanitization**
Cleaning data before it is used: trimming whitespace, lowercasing an email, escaping characters that could be interpreted as code. Sanitization *fixes* data that is slightly off; validation decides whether what remains is acceptable. The two usually run together, sanitization first.

**Request validation**
Validating everything that arrives in a request — the three sources: `req.params` (route parameters), `req.query` (query string), and `req.body` (the request body). Each source needs different checks because each arrives in a different form.

**Validation middleware**
A normal middleware function that checks the request and either calls `next()` (valid — continue to the controller) or answers 400 (invalid — stop here). Because it is middleware, it runs *before* the controller, and it is reusable across any route that needs the same checks.

**400 Bad Request**
The HTTP status for "your request is malformed or fails validation." It is a client error: the client sent something wrong and can fix it and retry. It is not a 500 — the server did nothing wrong.

**Error format for validation**
The standard shape this repo uses: `{ "errors": [{ "field": "email", "message": "email must be a valid email address" }] }`. One entry per failed check, naming the field and saying what is wrong. The client can highlight exactly the fields that failed.

**Schema validation**
Defining the expected shape of data once — as a schema — and letting a library check every request against it. Zod and express-validator both work this way. Hand-written checks (this topic's example) are the same idea written out by hand.

**express-validator**
The most widely used validation library for Express. It provides chains of checks (`body('email').isEmail()`) as middleware, and collects all failures into one result. Battle-tested, well documented, and the default choice in most Express codebases.

**zod**
A schema-validation library (TypeScript-first, works in plain JavaScript too) that defines a shape once and can both validate incoming data and infer its type. Increasingly popular because one schema serves validation, types, and documentation.

**Injection**
An attack where unvalidated input is interpreted as code — SQL injection, NoSQL injection, cross-site scripting (XSS). Validation is not the whole defence (parameterized queries are the real one for SQL), but it is the first wall: input that never matches the expected shape never reaches the dangerous place.

## 3. Detailed Explanations

### 3.1 Why validate — and why the server, not just the frontend

Your React form already checks that the email looks right. So why check again on the server? Because the frontend is not a gate — it is a suggestion. Anyone can:

- Open the browser devtools and send a request with `curl`, bypassing the form entirely.
- Edit the JavaScript in the browser and remove the checks.
- Send a request from Postman with any body they like.

Frontend validation exists for *user experience* — instant feedback without a round trip. Server validation exists for *safety* — it is the only check that cannot be bypassed, because it runs on a machine the attacker does not control. Both are worth having; only the server one is non-negotiable.

### 3.2 The three places input arrives

| Source | Example | What it looks like | Typical checks |
|---|---|---|---|
| `req.params` | `GET /users/abc` | Always a **string**, from the URL | Is it a number? Does it match the expected pattern? |
| `req.query` | `GET /users?page=abc&limit=500` | Always **strings**, all optional | Is it numeric? In range? Is the value one of the allowed options? |
| `req.body` | `POST /users { "age": 200 }` | JSON, any type | Required fields present? Correct types? Lengths, ranges, formats? |

The trap with `req.params` and `req.query` is that they are *always strings*. `req.query.page` is `"2"`, not `2` — so `page + 1` is `"21"`, and `page > 10` compares strings. Validate them as strings first (does it look like a number?), then convert with `Number(...)` and check the result is not `NaN`.

### 3.3 Manual validation with plain JavaScript

Before reaching for a library, the checks themselves are ordinary JavaScript:

```js
// Required string, minimum length
if (typeof name !== 'string' || name.trim().length < 2) {
  errors.push({ field: 'name', message: 'name is required and must be at least 2 characters' });
}

// Email format (a practical regex, not a perfect one)
if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  errors.push({ field: 'email', message: 'email must be a valid email address' });
}

// Optional integer in a range
if (age !== undefined && (!Number.isInteger(age) || age < 13 || age > 120)) {
  errors.push({ field: 'age', message: 'age must be a whole number between 13 and 120' });
}

// Enum — value must be one of the allowed options
const roles = ['student', 'teacher', 'admin'];
if (!roles.includes(role)) {
  errors.push({ field: 'role', message: 'role must be student, teacher or admin' });
}
```

Three habits make hand-written checks reliable:

1. **Check the type first.** `typeof name !== 'string'` before `name.trim()` — otherwise a missing field crashes the validator itself with `Cannot read properties of undefined`.
2. **Collect all errors, then answer once.** Do not `return` on the first failure. The client should see every problem in one response, not discover them one round trip at a time.
3. **Distinguish required from optional.** An optional field is only checked *when present* (`age !== undefined && ...`). A required field is checked always.

### 3.4 The validation middleware pattern

```js
function validateUserBody(req, res, next) {
  const errors = [];
  // ... push an error object for every failed check ...
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  next(); // valid — the controller runs next
}

app.post('/users', validateUserBody, createUser);
```

This is the whole pattern, and it has four properties worth noticing:

- **It runs before the controller.** Bad data never reaches business logic or the database.
- **It is reusable.** The same middleware guards every route that creates a user. One place to update when the rules change.
- **It is composable.** A route can chain several validators: `app.get('/users', validateListQuery, listUsers)` — each one checks its own part.
- **It answers 400 itself.** It does not call `next(err)` — a validation failure is not an exception, it is an expected outcome with its own response format. (Forwarding to the central error handler with a `ValidationError` is also a valid design — see §3.7.)

### 3.5 Validation vs sanitization — reject vs clean

| | Validation | Sanitization |
|---|---|---|
| Question | Is this data acceptable? | Can I clean this data up first? |
| On failure | Reject with 400 | — |
| Examples | Required field missing, age 200, bad email format | `name.trim()`, `email.toLowerCase()`, escaping `<` and `>` |

The order is: **sanitize, then validate** — or validate the raw input and sanitize before storing. Either way, never store uncleaned input: `"  Ayesha "` and `"Ayesha"` would become two different names in the database, and `"AYESHA@Example.COM"` would never match a login check for `"ayesha@example.com"`. The example in this topic trims the name and lowercases the email inside the validator, after the checks pass and before `next()`.

### 3.6 Common rules — the checklist for every endpoint

- **Required fields:** present and not empty. Beware `0` and `false` — they are valid values, so check `=== undefined` rather than `!value` when a field may legitimately be zero or false.
- **Strings:** type, minimum/maximum length, and format where one exists (email, URL, phone).
- **Numbers:** is it actually a number (not `NaN`, not a string), integer when it must be one, inside the allowed range.
- **Enums:** the value is one of a fixed list — roles, statuses, categories.
- **Arrays:** is it an array, is it empty when it must not be, and is every element valid?
- **Booleans:** is it a real boolean, not the string `"true"`?
- **Dates:** does it parse, and is it in the allowed range (not in the past, for a booking)?

### 3.7 Validation errors and the central error handler

There are two honest designs, and both are used in real codebases:

- **The validator answers 400 directly** (this topic's example). Simple, visible, and the error format is right there in the validator.
- **The validator throws a `ValidationError` and the central handler answers it.** This keeps all responses in one place (topic 08's handler), and the validator stays a pure "check and throw" function:

```js
class ValidationError extends AppError {
  constructor(errors) { super(400, 'Validation failed'); this.errors = errors; }
}
// handler: if (err.errors) return res.status(400).json({ errors: err.errors });
```

Either is fine. What is not fine is mixing the two randomly across the codebase, or answering validation failures with a 500.

### 3.8 Libraries: express-validator and zod

Hand-written checks teach the pattern. In a real project, a library does the same job with less code and fewer mistakes:

```js
// express-validator — checks as middleware chains
const { body, validationResult } = require('express-validator');
app.post('/users',
  body('email').isEmail().withMessage('email must be a valid email address'),
  body('name').isLength({ min: 2 }).withMessage('name must be at least 2 characters'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    // ... controller logic ...
  });
```

```js
// zod — one schema, checked in one line
const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  age: z.number().int().min(13).max(120).optional(),
});
const result = userSchema.safeParse(req.body);
if (!result.success) return res.status(400).json({ errors: result.error.issues });
```

Choose express-validator when you want checks that read like Express middleware and a huge ecosystem of built-in validators. Choose zod when you want one schema that also gives you TypeScript types and can be shared between frontend and backend. Both are standard; neither is required to understand validation — the pattern is the same either way.

### 3.9 Validation as a security measure

Validation does not replace real security measures, but it is the first wall:

- **Injection:** a field that must be a number can never contain SQL. A string that must match an email pattern cannot contain a script tag. The narrower the accepted shape, the smaller the attack surface.
- **Crashes:** a controller that does `req.body.items.map(...)` crashes when `items` is not an array. Validation guarantees the controller only sees arrays.
- **Bad data:** a `price: -50` or an `age: 200` in the database corrupts reports, billing, and every feature built on that data. Rejecting it at the door is cheaper than cleaning the database later.
- **Denial of service:** a `limit=1000000` query parameter can make the database return a million rows. Validating `limit` to a maximum of 100 (as the example does) is a one-line defence.

The real defences still matter — parameterized queries for SQL injection, escaping output for XSS, authentication for access control. Validation sits in front of all of them and makes each one easier.

## 4. How the Technology Works Internally

Validation is not an Express feature. It is ordinary middleware that runs in the normal request flow, before the controller:

```
Request  POST /users   { "name": "Ali", "email": "not-an-email" }
   │
   ▼
express.json()              ← parses the body (topic 06)
   │
   ▼
validateUserBody            ← validation middleware
   │   checks name: ok
   │   checks email: FAIL → collects { field: 'email', ... }
   │   errors.length > 0 → answers 400, STOPS the chain
   ▼
Response  400 {"errors":[{"field":"email","message":"email must be a valid email address"}]}
   (the controller never runs — createUser is never called)
```

When validation passes, the middleware calls `next()` and the request continues to the controller exactly as if the validator were not there. When it fails, the validator answers the response itself and the chain stops — the controller, the service, and the database never see the bad data.

Because validators are plain middleware, they compose with everything from topic 06: a route can run logging, then authentication, then validation, then the controller — each step trusting the ones before it.

## 5. Architecture or Workflow

The workflow for adding validation to an endpoint:

```
1. List the inputs: params, query, body — what does this endpoint receive?
        │
2. For each input, write the rules
   required? type? length/range? format? one of a list?
        │
3. Write ONE validator middleware per input shape
   middleware/validateUser.js — checks the body for create/update user
   (or: one file per resource, like the controllers)
        │
4. Register it on the route, BEFORE the controller
   app.post('/users', validateUserBody, createUser);
        │
5. Decide the failure answer: 400 + { errors: [{ field, message }] }
   — or throw a ValidationError to the central handler (topic 08)
        │
6. Sanitize before storing: trim, lowercase, normalize
   — do it in the validator (after checks pass) or in the controller
```

File layout (grows from topics 07–08):

```
src/
  app.js
  routes/
    users.js
  controllers/
    userController.js
  services/
    userService.js
  middleware/
    auth.js
    validateUser.js     # validation middleware, one per input shape
    errorHandler.js
  errors/
    AppError.js         # + ValidationError, when using the throw design
```

Rule of thumb for where validators live: next to the controllers they protect, one file per resource, named after what they validate (`validateUser.js`, `validatePost.js`) — never inline in the route file, and never inside the controller.

## 6. Real-World Examples

- **Signup form.** The mobile app sends `{ name, email, password }`. The validator checks the email format and the password length *before* the controller hashes anything or touches the database. A bad signup is answered in milliseconds with field-by-field messages the form can display under each input.
- **Search with pagination.** `GET /products?page=2&limit=20` — the validator checks that `page` is a positive number and caps `limit` at 100, so a client cannot ask for a million rows and slow down the database for everyone.
- **Booking a slot.** `POST /bookings { date, slot }` — the validator checks the date parses, is not in the past, and the slot is one of the allowed values. The controller can then trust the date and only worry about whether the slot is free.
- **Your semester project.** Q-less: taking a token validates the office id (must be a number) and the student id (must exist in the request). AI Study Buddy: uploading notes validates the file type and size before any text extraction runs.
- **An admin action.** `DELETE /users/:id` — the validator checks the id is numeric before the controller runs, so `/users/abc` gets a clear 400 instead of a database error or a confusing 500.

## 7. Code Examples Where Applicable

The full runnable example lives in `examples/validation.js`. The key lines:

```js
// Validation middleware: checks BEFORE the controller, answers 400 itself
function validateUserBody(req, res, next) {
  const errors = [];
  if (typeof name !== 'string' || name.trim().length < 2) {
    errors.push({ field: 'name', message: 'name is required and must be at least 2 characters' });
  }
  if (errors.length > 0) return res.status(400).json({ errors });
  next();
}
```

```js
// Registered BEFORE the controller — bad data never reaches it
app.post('/users', validateUserBody, (req, res) => { /* ... */ });
```

```js
// Params and query are strings — validate the string, then convert
function validateIdParam(req, res, next) {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(400).json({ errors: [{ field: 'id', message: 'id must be a number' }] });
  }
  next();
}
```

Run it with:

```bash
NODE_PATH=/tmp/express-verify/node_modules node examples/validation.js
```

## 8. Step-by-Step Code Explanations

### 8.1 `validation.js` — the validators

1. `validateUserBody` reads `name`, `email`, and `age` from `req.body` and checks each one, pushing one `{ field, message }` object per failure into an `errors` array.
2. Each check guards its type first (`typeof name !== 'string'`) so a missing field cannot crash the validator itself.
3. `age` is optional: it is only checked when present (`age !== undefined`). A request without `age` passes; a request with `age: 200` fails.
4. If `errors` is non-empty, the middleware answers `400 { errors }` and returns — the controller never runs.
5. If the checks pass, sanitization runs: `name` is trimmed, `email` is trimmed and lowercased, and the cleaned values are written back to `req.body` before `next()`.
6. `validateIdParam` checks that the route parameter is all digits with a regex. `req.params.id` is always a string, so the regex tests the string form.
7. `validateListQuery` checks `page` and `limit` the same way — strings first, range second — and caps `limit` at 100, which is also a small denial-of-service defence.

### 8.2 The self-test — reading the output

```
POST /users (valid)       -> 201 {"id":2,"name":"Ayesha","email":"ayesha@example.com","age":21}
```

The valid request proves sanitization: the name arrived as `"  Ayesha "` and the email as `"AYESHA@Example.COM"`, and the stored user has both cleaned. Every other line is a different failure, each with its own field and message — and each failing request never created a user, because the controller never ran.

## 9. Common Misconceptions

- **"The frontend already validates, so the server does not need to."** The frontend is bypassable in seconds with curl or Postman. Frontend validation is user experience; server validation is safety. Only the server check cannot be skipped.
- **"Validation and sanitization are the same thing."** Validation rejects bad data; sanitization cleans slightly-off data. Trimming a name is sanitization; rejecting a missing name is validation. You usually need both.
- **"One error at a time is fine."** It wastes the user's time: fix the email, resubmit, now the name is wrong, resubmit again. Collect all errors and return them together.
- **"A 500 is the right answer for bad input."** No — 500 means the server failed. Bad input is the client's mistake and gets a 400 with an explanation of what to fix.
- **"A library like zod replaces understanding validation."** A library replaces hand-written checks, not the understanding. You still decide the rules, the error format, and where validation runs — the library only executes them.
- **"Checking `if (!value)` is enough for required fields."** It rejects `0` and `false`, which are legitimate values for numbers and booleans. Check presence with `=== undefined` (or `== null`) and check emptiness separately for strings.
- **"Query parameters arrive as numbers."** They do not — `req.query` and `req.params` are always strings. Validate the string, then convert, then check the converted value.

## 10. Important Technical Terminology

| Term | Meaning |
|---|---|
| Validation | Checking incoming data against rules; rejects what fails. |
| Sanitization | Cleaning data (trim, lowercase, escape) before use or storage. |
| Validation middleware | Middleware that checks a request before the controller and answers 400 on failure. |
| 400 Bad Request | The client sent malformed or invalid data; it can fix it and retry. |
| `req.params` | Route parameters from the URL — always strings. |
| `req.query` | The query string, parsed into an object of strings. |
| `req.body` | The parsed request body (needs `express.json()` first). |
| Schema validation | Defining the expected data shape once and checking requests against it (zod, express-validator). |
| express-validator | The standard Express validation library — check chains as middleware. |
| zod | A schema-validation library; one schema validates data and infers types. |
| Injection | An attack where input is interpreted as code; narrow validation shrinks the attack surface. |
| Enum validation | Checking a value is one of a fixed allowed list. |

## 11. Summary

- Never trust the client: validate on the server, always. Frontend validation is user experience; server validation is safety and cannot be bypassed.
- Input arrives in three places — `req.params`, `req.query`, `req.body` — and params and query are always strings, so validate the string, then convert.
- A validation middleware runs before the controller, collects *all* errors, and answers `400 { errors: [{ field, message }] }` — bad data never reaches business logic or the database.
- Validation rejects; sanitization cleans. Trim and normalize (lowercase emails) before storing, and validate after sanitizing where it matters.
- Check type before using a value, distinguish required from optional, and do not reject legitimate `0` or `false` with a careless `!value` check.
- Hand-written checks teach the pattern; in real projects express-validator or zod do the same job with less code — the rules, the format, and the placement are still your decisions.

## 12. Interview Questions and Answers

**Q1. Why must validation happen on the server even if the frontend already validates?**
Because the frontend can be bypassed — anyone can send a request with curl or Postman, or edit the page's JavaScript. Frontend validation is for user experience; server validation is the only check that runs on a machine the attacker does not control.

**Q2. What is the difference between validation and sanitization?**
Validation checks whether data is acceptable and rejects it when it is not. Sanitization cleans data — trimming whitespace, lowercasing an email — before it is used or stored. They usually run together, sanitization first.

**Q3. Where should validation run, and why?**
In validation middleware, before the controller. That way bad data never reaches business logic or the database, the checks are reusable across routes, and the controller can trust every field it reads.

**Q4. What status code and response format should a validation failure use?**
400 Bad Request, with field-by-field messages: `{ "errors": [{ "field": "email", "message": "email must be a valid email address" }] }`. All errors are returned together so the client can fix everything in one round trip.

**Q5. Why do `req.params` and `req.query` need special care?**
They are always strings. `req.query.page` is `"2"`, not `2`, so arithmetic and comparisons behave unexpectedly. Validate the string form first, then convert with `Number(...)` and check for `NaN`.

**Q6. What is the difference between express-validator and zod?**
express-validator provides validation chains that work as Express middleware, with a large set of built-in checks. Zod defines a schema once and validates against it, and can also infer TypeScript types from the same schema. Both implement the same pattern — rules checked before the controller — with less hand-written code.

**Q7. How does validation help security?**
It narrows what input can reach dangerous places: a field that must be a number cannot carry SQL, a string that must match an email pattern cannot carry a script tag, and a capped `limit` parameter cannot force the database to return a million rows. It is the first wall, not the whole defence — parameterized queries and output escaping still matter.

**Q8. Should a validator answer 400 itself or throw to the central error handler?**
Both are valid designs. Answering directly is simple and visible. Throwing a `ValidationError` keeps all responses in the one central handler from topic 08. What matters is picking one design and using it consistently across the codebase.

## 13. References

- Express.js docs — Writing middleware: https://expressjs.com/en/guide/writing-middleware.html
- Express.js docs — Error handling: https://expressjs.com/en/guide/error-handling.html
- express-validator docs: https://express-validator.github.io/docs/
- Zod docs: https://zod.dev/
- MDN — HTTP response status codes: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
- OWASP — Input Validation Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html

## Files in This Folder

- `README.md` — short overview, objectives, and how to run the examples
- `notes.md` — this file: full detailed notes with interview questions and answers
- `exercises.md` — 5 practice tasks, no solutions
- `examples/validation.js` — validation middleware for params, query, and body (run this file)
- `examples/example.txt` — real output from running the example

---

[← Module README](../README.md) · Previous: [08 — Error Handling](../08-error-handling/README.md) · Next: [10 — REST APIs](../10-rest-apis/README.md)

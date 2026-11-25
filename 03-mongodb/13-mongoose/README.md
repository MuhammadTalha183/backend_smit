# 13 — Mongoose

> **Priority:** 🔴 High
> **Previous topic:** [12 — Node.js Integration](../12-nodejs-integration/README.md)
> **Next topic:** [14 — Practical Project](../14-practical-project/README.md)

MongoDB is schemaless, which is freeing until a typo creates a second field, a string sneaks into a number field, or a missing `role` breaks code that assumed it was always there — and every one of those bugs is found at runtime, usually by a user. Mongoose is the fix the Node.js world settled on: an ODM (Object Document Mapper) that adds schemas, models, validation, middleware, virtuals, and population on top of the raw driver. It is the MongoDB answer to the ORM idea from earlier in the journey — schemas and models over a schemaless database, with the schema living in your code rather than in the database.

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain what Mongoose and an ODM are, and how they relate to the ORM idea.
- Define schemas with types, `required`, `default`, `enum`, `minlength`/`maxlength`, and `min`/`max`.
- Explain why `unique: true` is an index, not a validator, and handle the `E11000` duplicate-key error.
- Create models and work with documents, and use `.lean()` for read-only queries.
- Handle `ValidationError` and read its per-field errors.
- Write `pre`/`post` middleware (hooks) and explain when they do — and do not — run.
- Define virtuals, instance methods, and static methods.
- Use `populate()` to resolve references, and explain when aggregation `$lookup` wins instead.
- Decide when to use Mongoose and when to use the raw driver from topic 12.

## Topics Covered

- Mongoose and ODMs — the MongoDB answer to an ORM
- Schemas: types, `required`, `default`, `enum`, `minlength`/`maxlength`, `min`/`max`, `match`, `lowercase`/`trim`
- Models, documents, and `.lean()`
- Validation and `ValidationError` (including `CastError`)
- `unique` is an index, not a validator (`E11000`)
- Middleware / hooks: `pre('save')`, `post('save')`, and why hooks need regular `function`s
- Virtuals, instance methods, static methods
- Population vs `$lookup`
- Mongoose vs the raw driver: when to use each

## Links

- **Notes:** [notes.md](./notes.md) — full detailed notes, diagrams, and interview questions with answers
- **Examples:** [examples/](./examples/) — run [`mongoose-demo.mjs`](./examples/mongoose-demo.mjs), expected output in [`example.txt`](./examples/example.txt)
- **Exercises:** [exercises.md](./exercises.md) — 5 practice tasks, no solutions
- **Module README:** [../README.md](../README.md)

**How to run the examples:**

```bash
NODE_PATH=/tmp/mongo-verify/node_modules node examples/mongoose-demo.mjs
```

The example uses an in-memory MongoDB server, so no MongoDB installation is needed. It starts the server, runs the demo, prints the output, then stops the server and exits.

> **First run on a fresh machine:** the in-memory server downloads a `mongod` binary once (~120 MB) and prints progress lines while it does so. Later runs reuse the cached binary and start fast.

## Key Takeaways

- Mongoose is an ODM — schemas and models over a schemaless database — but the schema lives only in your code; anything that writes without Mongoose bypasses every rule.
- `unique: true` creates a unique index, not a validation rule: duplicates fail at insert time with an `E11000` error, not a `ValidationError`.
- Validation runs on `.save()`/`.create()` and collects every broken path into one `ValidationError`; updates skip it unless you pass `{ runValidators: true }`.
- `pre('save')` hooks only run on save/create, and hooks and methods must use regular `function`s so `this` is the document.
- Virtuals are computed, never stored, and cannot be queried.
- `populate()` is a convenient application-side join; `$lookup` is the database-side join that wins for heavy work.
- `.lean()` returns plain objects — faster for read-only responses, but with no `.save()`, virtuals, or methods.
- Use Mongoose for normal CRUD apps with a stable shape; use the raw driver for scripts, bulk loads, and wildly varying documents — and `Model.collection` lets you mix both.

---

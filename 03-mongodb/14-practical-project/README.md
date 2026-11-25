# 14 — Practical Project

> **Priority:** 🔴 High
> **Previous topic:** [13 — Mongoose](../13-mongoose/README.md)
> **Next topic:** Phase 04 — Authentication and Authorization *(coming next — folder not created yet)*

This is the capstone of Module 03. Everything from topics 01–13 comes together in one small, complete, working API: a notes/tasks API built with Express 5 and the native MongoDB driver, backed by an in-memory MongoDB server. You will see the project layout, the seed script, all five CRUD routes, validation middleware, a central error handler, and ObjectId validation — the same pieces a real backend is made of, just small enough to read in one sitting.

## Learning Objectives

By the end of this lesson, you will be able to:

- Lay out a small Express + MongoDB project so each piece has one clear home.
- Start an in-memory MongoDB server, connect the native driver, and seed a collection with fixed, deterministic data.
- Build all five CRUD routes for a resource: `GET /tasks`, `GET /tasks/:id`, `POST /tasks`, `PATCH /tasks/:id`, `DELETE /tasks/:id`.
- Write validation middleware that returns `400` with one error message per bad field.
- Add a central error handler so every error in the app returns the same JSON shape.
- Validate ObjectIds: return `400` for a malformed id and `404` for a well-formed id with no matching task.
- Explain what this project deliberately leaves out — and what Phase 04 (authentication) and the Mongoose exercise will add.

## Topics Covered

- Capstone project layout: one file, five clear sections (server, helpers, app, self-test, cleanup)
- In-memory MongoDB with `mongodb-memory-server` and a data directory under `~/.cache`
- Seeding a collection with fixed ObjectIds for deterministic output
- Express 5 app with `express.json()`, route parameters, and `async` route handlers
- Validation middleware (Module 02, topic 09): required vs optional fields, enums, booleans
- Central error handler (Module 02, topic 08): one JSON error shape, no leaked stack traces
- ObjectId validation: `ObjectId.isValid()` → `400`; missing document → `404`
- Client-supplied `_id` on `POST` and why it makes the output reproducible
- Self-testing an API with `fetch` against an ephemeral port (`listen(0)`)
- Cleaning up: closing the server and client, stopping the memory server, deleting the data directory
- What to build next: authentication in Phase 04, and the same API rebuilt with Mongoose

## Links

- **Notes:** [notes.md](./notes.md) — full detailed notes, diagrams, and interview questions with answers
- **Examples:** [examples/](./examples/) — run [`tasks-api.mjs`](./examples/tasks-api.mjs), expected output in [`example.txt`](./examples/example.txt)
- **Exercises:** [exercises.md](./exercises.md) — 5 practice tasks, no solutions
- **Module README:** [../README.md](../README.md)

**How to run the examples:**

```bash
NODE_PATH=/tmp/mongo-verify/node_modules:/tmp/express-verify/node_modules node examples/tasks-api.mjs
```

The example uses an in-memory MongoDB server, so no MongoDB installation is needed. It starts the server, seeds three tasks, runs the Express app, self-tests all nine steps with `fetch`, prints the results, then stops the server, deletes the data directory, and exits.

On a fresh machine the first run downloads the `mongod` binary once (~120MB) and prints progress lines; later runs start from the cache and are fast.

## Key Takeaways

- A real backend is a small set of patterns repeated: connect, seed, route, validate, handle errors, clean up.
- Validation belongs in middleware, before the route handler touches the database — the handler should only ever see clean input.
- One central error handler means the client always gets the same JSON shape, and a `500` never leaks a stack trace.
- `400` means "your request was wrong" (malformed id, bad field); `404` means "your request was fine, but that task does not exist" — never mix them up.
- Deterministic output is a feature: fixed ObjectIds, no timestamps, and a never-printed ephemeral port make the example verifiable by `diff`.
- This API has no authentication on purpose — anyone can call it. Phase 04 is where that gap gets closed.

---

# 14 — Practical Project: Exercises

> **Module:** [03 — MongoDB](../README.md) · **Notes:** [notes.md](./notes.md) · **Example:** [examples/tasks-api.mjs](./examples/tasks-api.mjs)
>
> 5 practice tasks, no solutions. Attempt first, then check the answers in `notes.md` §12.

## Basic understanding

**1.** Run `examples/tasks-api.mjs` and compare the output with `example.txt` — it should be byte-identical (`diff` should print nothing). Then change the seed so the second task has `priority: 'high'` and `done: true`, and predict the new output before running it again. Which lines change, and which lines stay exactly the same? Explain why the `POST /tasks -> 400` line is unaffected.

## Conceptual

**2.** The example returns `400` for `GET /tasks/not-an-id` and `404` for `GET /tasks/000000000000000000000099`. Explain in your own words why these are different failures, and what a client should do differently in each case. Then answer: what status should `DELETE /tasks/not-an-id` return, and what status should `DELETE /tasks/000000000000000000000099` return — and why is the answer the same pattern as `GET`?

**3.** `publicTask` is a whitelist of four fields. Suppose you add a `createdAt` timestamp and an `ownerId` to the stored document, but forget to update `publicTask`. What does the client see — and is that a bug or a feature? Now suppose you add `createdAt` to `publicTask` as well: what breaks in the verification workflow, and how would you fix the example so the output stays checkable?

## Practical coding

**4.** Rebuild the same API with Mongoose (topic 13) instead of the raw driver — same five routes, same validation rules, same status codes, same self-test output. You will need to:
- Define a `Task` schema with `title` (required, non-empty string), `done` (boolean, default `false`), and `priority` (enum `low`/`medium`/`high`, default `'medium'`).
- Decide where validation lives now: Mongoose schema validation, the Express validation middleware, or both — and justify the choice in a comment.
- Handle the two id cases yourself: a malformed id must still be `400` (Mongoose throws a `CastError` — catch it and convert it), and a missing task must still be `404`.
- Keep the output deterministic: same fixed `_id`s, same nine self-test lines, no timestamps in the printed output (either leave `timestamps` off the schema or strip them in your public-shape helper).
- Run it twice and `diff` the outputs — they must be byte-identical, just like the driver version.

## Scenario-based

**5.** You are turning the tasks API into the backend for Q-less (the semester project idea). A queue token is `{ office, status, position }` where `status` is one of `waiting`, `called`, `done`, `missed` and `position` is a positive integer. Adapt the capstone:
- Change the seed to three tokens at two different offices, and change the validation middleware to the new field rules.
- Add one new route the tasks API does not have: `GET /tokens/next?office=admin` — the waiting token with the lowest `position` at that office. What should it return when no token is waiting?
- Write down, without building it yet, what Phase 04 (authentication) would have to add before this could serve real students: who can create a token, who can call the next one, and what stops a student from deleting someone else's token.

## Interview-style questions

- Walk me through how you would structure a small Express + MongoDB API.
- Why is validation middleware instead of code inside each route handler?
- What is the difference between a 400 and a 404, and when do you return each?
- How do you validate an ObjectId from the URL, and what happens if you don't?
- Why use PATCH instead of PUT for updating a task?
- What does the central error handler do, and why must it be registered last?
- Why does `GET /tasks` sort by `{ _id: 1 }`?
- What is `findOneAndUpdate` with `returnDocument: 'after'`, and why not `updateOne` + `findOne`?
- Why does the example use an in-memory MongoDB server, and is the data "fake"?
- Why does the example listen on port 0, and why is the port never printed?
- Why are there no `createdAt` / `updatedAt` fields in this project?
- This API has no authentication. Is that a bug?

---

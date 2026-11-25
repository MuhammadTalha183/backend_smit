# 06 — CRUD Operations

> **Priority:** 🔴 High
> **Previous topic:** [05 — Databases, Collections and Documents](../05-databases-collections-documents/README.md)
> **Next topic:** [07 — Query Operators](../07-query-operators/README.md)

CRUD is the alphabet of databases: **Create, Read, Update, Delete**. Every application you will ever build is CRUD with extra steps. In MongoDB it is a small set of methods on a collection — `insertOne` / `insertMany`, `find` / `findOne`, `updateOne` / `updateMany` / `replaceOne`, `deleteOne` / `deleteMany` — and the skill is knowing what each one returns, how to aim it with a filter, and what happens when the filter matches nothing.

## Learning Objectives

By the end of this lesson, you will be able to:

- Insert one and many documents, and explain what `insertedId` and `insertedCount` mean.
- Read with filters, projection, sorting, skip, and limit — and explain what a cursor is.
- Update with `$set`, `$inc`, and the other update operators, and explain the difference from `replaceOne`.
- Read an update result: `matchedCount` vs `modifiedCount`, and why they can differ.
- Use upsert (`{ upsert: true }`) to "update or insert".
- Delete one and many documents, and explain why `deleteMany({})` is dangerous.
- Handle the "not found" cases: `findOne` returns `null`, an update matching nothing is not an error.

## Topics Covered

- Create — `insertOne`, `insertMany`, duplicate `_id` (error 11000), ordered vs unordered inserts
- Read — `find` and the cursor, `findOne`, filters and comparison operators, projection, sort/skip/limit, `countDocuments`
- Update — `$set`, `$inc`, `$unset`, `$push`, `$pull`, `$addToSet`, `$rename`; `updateOne` vs `updateMany` vs `replaceOne`; upsert
- Delete — `deleteOne`, `deleteMany`, `deletedCount`, soft deletes
- Result objects — `acknowledged`, `matchedCount`, `modifiedCount`, `deletedCount`, `upsertedId`
- Single-document atomicity

## Links

- **Notes:** [notes.md](./notes.md) — full detailed notes, diagrams, and interview questions with answers
- **Examples:** [examples/](./examples/) — run [`crud-demo.mjs`](./examples/crud-demo.mjs), expected output in [`example.txt`](./examples/example.txt)
- **Exercises:** [exercises.md](./exercises.md) — 5 practice tasks, no solutions
- **Module README:** [../README.md](../README.md)

**How to run the examples:**

```bash
NODE_PATH=/tmp/mongo-verify/node_modules node examples/crud-demo.mjs
```

## Key Takeaways

- `find()` returns a **cursor**, not documents — consume it with `toArray()` or `for await`.
- Without a `$` operator, an update **replaces** the whole document. Use `$set` unless you mean to replace.
- `matchedCount` can be bigger than `modifiedCount` — setting a field to its current value changes nothing.
- An update or delete that matches nothing is **not** an error — check the counts yourself when "not found" matters.
- `deleteMany({})` deletes **everything**. Check the filter, and consider soft deletes for real data.
- Upsert (`{ upsert: true }`) turns an update into "update or insert" — the one-call way to write "ensure this exists".

---

[← Main README](../../README.md) · Previous: [05 — Databases, Collections and Documents](../05-databases-collections-documents/README.md) · Next: [07 — Query Operators](../07-query-operators/README.md) · Module: [../README.md](../README.md)

# 09 — Relationships

> **Priority:** 🔴 High
> **Previous topic:** [08 — Schema Design](../08-schema-design/README.md)
> **Next topic:** [10 — Indexing](../10-indexing/README.md)

Users have orders, authors have books, students take courses. SQL expresses these with foreign keys and JOINs. MongoDB has no foreign keys — it has embedding, referencing, and one join tool: **`$lookup`**. This topic maps the three relationship shapes — one-to-one, one-to-many, many-to-many — onto MongoDB's tools, and shows how to keep references consistent when the database won't do it for you.

## Learning Objectives

By the end of this lesson, you will be able to:

- Model one-to-one relationships (embed by default) and state the exceptions.
- Model one-to-many relationships with a manual reference on the "many" side.
- Model many-to-many relationships with a join collection — and explain why two-sided id arrays are wrong.
- Use `$lookup` to join collections inside an aggregation pipeline.
- Flatten `$lookup` results with `$arrayElemAt` or `$unwind`.
- Explain why MongoDB never enforces references, and state a delete policy for orphaned references.
- Choose the right implementation from a decision table, and justify it in one sentence.

## Topics Covered

- One-to-one: embedded profile, when to reference instead
- One-to-many: `authorId` on the "many" side, indexed lookup
- Many-to-many: join (junction) collections, relationship fields (`grade`, `enrolledAt`)
- `$lookup`: left outer join in aggregation, array results, `$arrayElemAt`, `$unwind`
- Denormalised references (`authorId` + `authorName`)
- Reference consistency: cascade, block, or tolerate orphans
- ObjectId structure and why `_id` sorting approximates creation order

## Links

- **Notes:** [notes.md](./notes.md) — full detailed notes, diagrams, and interview questions with answers
- **Examples:** [examples/](./examples/) — run [`relationships.mjs`](./examples/relationships.mjs), expected output in [`example.txt`](./examples/example.txt)
- **Exercises:** [exercises.md](./exercises.md) — 5 practice tasks, no solutions
- **Module README:** [../README.md](../README.md)

**How to run the examples:**

```bash
NODE_PATH=/tmp/mongo-verify/node_modules node examples/relationships.mjs
```

The example uses an in-memory MongoDB server, so no MongoDB installation is needed. It starts the server, runs the demo, prints the output, then stops the server and exits.

## Key Takeaways

- One-to-one: embed. One-to-many: reference from the "many" side. Many-to-many: join collection.
- A join collection is the single source of truth — and it can carry data about the relationship itself.
- `$lookup` is a left outer join that returns an **array** — flatten it with `$arrayElemAt` or `$unwind`.
- MongoDB never enforces a reference: deleting a user does not delete their orders. Your application owns that policy.

---

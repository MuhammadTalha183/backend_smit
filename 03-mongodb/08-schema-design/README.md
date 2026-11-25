# 08 — Schema Design

> **Priority:** 🔴 High
> **Previous topic:** [07 — Query Operators](../07-query-operators/README.md)
> **Next topic:** [09 — Relationships](../09-relationships/README.md)

MongoDB is famous for having "no schema" — and that freedom is the fastest way to build a database nobody can maintain. Schema design is choosing your documents' shape on purpose. The one decision that matters most: **embed or reference?** Do related data live inside the same document, or in a separate collection linked by ObjectId? This topic gives you the six rules of thumb for that decision, plus `$jsonSchema` validation — how to enforce a schema without losing MongoDB's flexibility.

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain the difference between embedding and referencing, and when each wins.
- Apply the six rules of thumb for MongoDB schema design.
- Decide when data should be duplicated — and state the update cost of doing so.
- Recognise unbounded arrays and other shapes that break the 16 MB document limit.
- Enforce a schema with `$jsonSchema` validation, including `required`, types, and ranges.
- Explain validation levels (`strict` vs `moderate`) and actions (`error` vs `warn`).
- Design a schema from a real screen: "what does one read need?"

## Topics Covered

- Embedding vs referencing — reads, writes, size, duplication
- The six rules of thumb (MongoDB's own guidance)
- When to embed / when to reference — checklists
- Denormalisation and the hybrid pattern (embed a summary, reference the detail)
- The 16 MB document limit and document growth
- `$jsonSchema` validation: types, required fields, ranges, error code 121
- Validation levels and actions
- Flexible-schema discipline: one shape per collection, `schemaVersion`, no mixed types

## Links

- **Notes:** [notes.md](./notes.md) — full detailed notes, diagrams, and interview questions with answers
- **Examples:** [examples/](./examples/) — run [`schema-design.mjs`](./examples/schema-design.mjs), expected output in [`example.txt`](./examples/example.txt)
- **Exercises:** [exercises.md](./exercises.md) — 5 practice tasks, no solutions
- **Module README:** [../README.md](../README.md)

**How to run the examples:**

```bash
NODE_PATH=/tmp/mongo-verify/node_modules node examples/schema-design.mjs
```

The example uses an in-memory MongoDB server, so no MongoDB installation is needed. It starts the server, runs the demo, prints the output, then stops the server and exits.

## Key Takeaways

- Design for how you **read**, not how you store: if a screen needs the post *and* its comments in one go, embed them.
- Favour embedding by default; reference data that is read alone, large, shared, or fast-changing.
- Never let an array grow without bound — it will hit the 16 MB limit.
- Duplication is a tool, not a sin: duplicate data that rarely changes, and know what you must update if it does.
- `$jsonSchema` is the safety net at the database (error code 121); application validation is the friendly face in front of it.

---

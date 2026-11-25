# 10 — Indexing

> **Priority:** 🔴 High
> **Previous topic:** [09 — Relationships](../09-relationships/README.md)
> **Next topic:** [11 — Aggregation](../11-aggregation/README.md)

A query without an index reads every document in the collection to find its answer. A query with an index jumps straight to the matches. Same answer — a thousand times faster on real data. Indexing is the single most impactful performance topic in MongoDB: single-field, compound, multikey, text, unique, and TTL indexes, what each one costs, and how to *prove* a query is fast with `explain()`. Including the discipline that matters most: when **not** to index.

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain what an index is (a B-tree catalogue) and why it makes queries fast.
- Create single-field, compound, multikey, text, unique, and TTL indexes.
- Apply the leftmost prefix rule and the ESR rule when ordering compound index fields.
- Use `explain('executionStats')` to read `winningPlan.stage` and `totalDocsExamined`.
- Distinguish COLLSCAN from IXSCAN and know which one you want.
- Enforce uniqueness with a unique index (error code 11000) and auto-expire data with a TTL index.
- State what indexes cost (write speed, disk, RAM) and when not to create one.

## Topics Covered

- What an index is — the book-catalogue analogy, B-trees
- Single-field indexes (`1` / `-1`)
- Compound indexes, leftmost prefix rule, ESR (Equality, Sort, Range)
- Multikey indexes (automatic for arrays, one array field per compound index)
- Text indexes and `$text` search (one per collection)
- Unique indexes and error code 11000
- TTL indexes and self-deleting data
- Index costs: writes, disk, RAM, unused indexes
- `explain()`: `winningPlan.stage`, `totalDocsExamined`, covered queries
- When NOT to index

## Links

- **Notes:** [notes.md](./notes.md) — full detailed notes, diagrams, and interview questions with answers
- **Examples:** [examples/](./examples/) — run [`indexing.mjs`](./examples/indexing.mjs), expected output in [`example.txt`](./examples/example.txt)
- **Exercises:** [exercises.md](./exercises.md) — 5 practice tasks, no solutions
- **Module README:** [../README.md](../README.md)

**How to run the examples:**

```bash
NODE_PATH=/tmp/mongo-verify/node_modules node examples/indexing.mjs
```

The example uses an in-memory MongoDB server, so no MongoDB installation is needed. It starts the server, runs the demo, prints the output, then stops the server and exits.

## Key Takeaways

- Without an index MongoDB scans the whole collection (COLLSCAN); with one it jumps to the matches (IXSCAN) — prove it with `explain()`, don't assume it.
- A compound index serves its leftmost prefix only: `{ city: 1, age: -1 }` helps `city` and `city + age` queries, never `age`-only ones.
- A unique index is a *correctness* tool (error 11000), the only reliable uniqueness guarantee under concurrent requests.
- Indexes cost write speed, disk, and RAM — index the queries you actually run, and remove the ones nobody uses.

---

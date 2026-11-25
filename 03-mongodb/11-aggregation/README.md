# 11 — Aggregation

> **Priority:** 🔴 High
> **Previous topic:** [10 — Indexing](../10-indexing/README.md)
> **Next topic:** [12 — Node.js Integration](../12-nodejs-integration/README.md)

`find()` can filter and sort, but it cannot answer "how much revenue did each category make this month?" or "who are my top 10 customers?" — questions that need documents to be grouped, summed, joined, and reshaped. That is what the aggregation framework does: documents flow through a pipeline of stages, each stage transforms them, and the final stage hands you the answer. It is MongoDB's built-in reporting engine, and it runs inside the database — so the heavy work happens where the data lives, not in your Node.js process.

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain what an aggregation pipeline is and how documents flow through stages.
- Build pipelines with `$match`, `$group`, `$project`, `$sort`, `$limit`, `$count`, `$set`, and `$addFields`.
- Use accumulator operators (`$sum`, `$avg`, `$min`, `$max`, `$push`) inside `$group`.
- Join collections with `$lookup` and flatten arrays with `$unwind`.
- Write real reporting queries: revenue per category, top customers, monthly totals.
- Order stages for performance: filter early, use indexes, limit early.
- Decide when aggregation is the right tool and when plain `find()` is enough.
- Explain the difference between `$lookup` and Mongoose `populate()`.

## Topics Covered

- Pipelines: stages, documents flowing through, pipeline as an array
- `$match`, `$group`, `$project`, `$sort`, `$limit`, `$skip`
- `$lookup` (joins), `$unwind` (flattening arrays)
- `$addFields`, `$set`, `$count`
- Accumulators: `$sum`, `$avg`, `$min`, `$max`, `$push`, `$first`, `$last`
- Expression operators: `$multiply`, `$round`, `$concat`, `$cond`
- Real reporting: revenue per category, top customers, monthly totals
- Pipeline optimization: `$match` early, index use, `$limit` early, `$project` early
- Aggregation vs `find()`: when each one wins
- `$lookup` vs Mongoose `populate()`

## Links

- **Notes:** [notes.md](./notes.md) — full detailed notes, diagrams, and interview questions with answers
- **Examples:** [examples/](./examples/) — run [`aggregation.mjs`](./examples/aggregation.mjs), expected output in [`example.txt`](./examples/example.txt)
- **Exercises:** [exercises.md](./exercises.md) — 5 practice tasks, no solutions
- **Module README:** [../README.md](../README.md)

**How to run the examples:**

```bash
NODE_PATH=/tmp/mongo-verify/node_modules node examples/aggregation.mjs
```

The example uses an in-memory MongoDB server, so no MongoDB installation is needed. It starts the server, runs the demo, prints the output, then stops the server and exits. On a fresh machine the first run downloads the `mongod` binary once (~120MB) and prints progress lines — later runs start fast.

## Key Takeaways

- A pipeline is an array of stages; each stage takes documents in and passes (usually different) documents out.
- `$match` first: filtering early means every later stage does less work, and `$match` can use an index.
- `$group` is the heart of reporting — `_id` says what to group by, accumulators say what to compute.
- `$lookup` joins collections inside the database; Mongoose `populate()` joins them in your app code (full detail in topic 13).
- If `find()` can answer the question, use `find()` — aggregation is for questions `find()` cannot ask.

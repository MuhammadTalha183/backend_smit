# 03 — MongoDB Architecture

> **Priority:** 🔴 High
> **Previous topic:** [02 — SQL vs NoSQL](../02-sql-vs-nosql/README.md)
> **Next topic:** 04 — Installation and Setup *(coming next — folder not created yet)*

Topics 01 and 02 taught you what MongoDB is and when to choose it. This topic opens the box: what actually runs when you start MongoDB, how the pieces fit together, and how your data is stored on disk. You will meet `mongod` and `mongosh`, replica sets and sharding, the WiredTiger storage engine, BSON, and namespaces — the vocabulary every MongoDB discussion uses, and the mental model that makes later topics (indexing, aggregation, Mongoose) make sense instead of feeling like magic.

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain what `mongod` and `mongosh` are, and that `mongosh` is just a client like your code.
- Explain what WiredTiger does: data files, cache, compression, indexes, journal.
- Explain what BSON is and why a Date stays a Date and money stays exact.
- Explain what a namespace is (`database.collection`).
- Explain replica sets: primary, secondaries, the oplog, elections — and why three members is the minimum.
- Explain sharding: shard keys, chunks, `mongos`, config servers — and why it is for scale, not safety.
- Explain the difference between replication (copies, for safety) and sharding (splitting, for scale).
- Read a MongoDB connection string and say what topology it describes.
- Explain the 16 MB document limit and what it means for embedding vs referencing.

## Topics Covered

- `mongod` — the server process: connections, query planning, durability
- `mongosh` — the shell, and why it is just another client
- WiredTiger — the storage engine: data files, cache, compression, indexes, journal, checkpoints
- BSON on disk — typed fields, Decimal128, Int64, binary data
- Namespaces — `database.collection`
- Replica sets — primary, secondaries, oplog, elections, why three members
- Sharding — shard keys, chunks, `mongos`, config servers, the hot-shard trap
- Connection strings — one server, replica set, sharded cluster
- The 16 MB document limit — and what it means for design

## Links

- **Notes:** [notes.md](./notes.md) — full detailed notes, diagrams, and interview questions with answers
- **Examples:** [examples/](./examples/) — run [`architecture-demo.mjs`](./examples/architecture-demo.mjs), expected output in [`example.txt`](./examples/example.txt)
- **Exercises:** [exercises.md](./exercises.md) — 5 practice tasks, no solutions
- **Module README:** [03 — MongoDB](../README.md)

**How to run the examples:**

```bash
NODE_PATH=/tmp/mongo-verify/node_modules node examples/architecture-demo.mjs
```

> The mongodb packages are **not** installed inside this repo — they live only in `/tmp/mongo-verify/node_modules` and are found through the `~/workspace/node_modules` symlink. In your own project you would run `npm install mongodb` and the import would just work. The example uses `mongodb-memory-server`, which starts a real MongoDB in memory and stops it when the script ends, so nothing is installed on your machine.

## Key Takeaways

- **`mongod`** is the server; **`mongosh`** is just a client, like your Node.js code.
- **WiredTiger** owns the disk: data files, cache, compression, indexes, and the journal that makes acknowledged writes crash-safe.
- Data is stored as **BSON**, addressed by **namespace** (`database.collection`), one document max **16 MB**.
- A **replica set** copies the same data for safety — primary + secondaries, oplog, elections, three members minimum.
- **Sharding** splits data for scale, by shard key, in chunks; `mongos` routes and config servers hold the metadata.
- The connection string describes the topology; the driver handles discovery and reconnection.
- `buildInfo` lists *available* storage engines — the *active* one is in `serverStatus`.

---

[← Main README](../../README.md) · Previous: [02 — SQL vs NoSQL](../02-sql-vs-nosql/README.md) · Next: 04 — Installation and Setup *(coming next — folder not created yet)*

# 12 — Node.js Integration

> **Priority:** 🔴 High
> **Previous topic:** [11 — Aggregation](../11-aggregation/README.md)
> **Next topic:** [13 — Mongoose](../13-mongoose/README.md)

Topics 01–11 taught you MongoDB itself — documents, CRUD, operators, schema design, relationships, indexes, aggregation. This topic is the other half: how a Node.js application actually talks to MongoDB, using the official `mongodb` driver. You will create one `MongoClient`, connect it once when the app starts, reuse it for every request, run CRUD through it, read results with cursors, and handle connection failures gracefully. Mongoose (topic 13) is built on top of exactly this driver, so learning it first makes everything after it make sense.

## Learning Objectives

By the end of this lesson, you will be able to:

- Install and import the official `mongodb` driver and create a `MongoClient`.
- Read a connection string (`mongodb://` and `mongodb+srv://`) from the environment instead of hardcoding credentials.
- Connect once at startup and reuse the same client for every operation.
- Explain connection pooling, including the default pool size of 100.
- Run CRUD through the driver (`insertOne`, `find`, `findOne`, `updateOne`, `deleteOne`, `countDocuments`) and check the returned counts.
- Use cursors correctly: `find()` is lazy, `toArray()` runs the query, streaming with `for await...of` handles large results.
- Close the client safely with the `try/finally` pattern.
- Handle connection failures with `serverSelectionTimeoutMS` and retryable writes, and explain how the driver recovers.
- Explain how Mongoose (topic 13) relates to the driver.

## Topics Covered

- The official MongoDB Node.js driver (`mongodb` package)
- Connection strings: `mongodb://` vs `mongodb+srv://`, hosts, credentials, database, options
- Reading the URI from `process.env.MONGODB_URI` (`.env` in development) — never hardcoding credentials
- `MongoClient`: connect once, reuse everywhere, close at shutdown
- Connection pooling: default `maxPoolSize: 100`, `minPoolSize`
- `async`/`await` patterns for driver operations
- The `try/finally` close pattern
- CRUD through the driver (ties back to topic 06)
- Cursors: lazy `find()`, `toArray()`, `next()`, streaming with `for await...of`
- Handling connection failures: `serverSelectionTimeoutMS`, `MongoServerSelectionError`, retryable writes
- Driver vs Mongoose preview (full detail in topic 13)

## Links

- **Notes:** [notes.md](./notes.md) — full detailed notes, diagrams, and interview questions with answers
- **Examples:** [examples/](./examples/) — run [`node-integration.mjs`](./examples/node-integration.mjs), expected output in [`example.txt`](./examples/example.txt)
- **Exercises:** [exercises.md](./exercises.md) — 5 practice tasks, no solutions
- **Module README:** [../README.md](../README.md)

**How to run the examples:**

```bash
NODE_PATH=/tmp/mongo-verify/node_modules node examples/node-integration.mjs
```

The example uses an in-memory MongoDB server, so no MongoDB installation is needed. It starts the server, runs the demo, prints the output, then stops the server and exits. On a fresh machine the first run downloads the `mongod` binary once (~120MB) and prints progress lines — later runs reuse the cached binary and start fast.

## Key Takeaways

- One `MongoClient`, connected once at startup, reused for every request — never connect per request.
- One client still serves parallel requests: it owns a pool of up to 100 connections by default.
- The connection string lives in the environment (`MONGODB_URI`), never in source code.
- `find()` returns a lazy cursor; the query runs only when you call `toArray()`, `next()`, or iterate it.
- Always check the counts (`matchedCount`, `modifiedCount`, `deletedCount`) — "nothing matched" is not an error.
- Close the client in `finally`, so a failure mid-run never leaks connections.
- Mongoose is a layer on top of this driver — learn the driver first, then the layer.

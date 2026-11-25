# 01 — Introduction to MongoDB

> **Priority:** ⭐ Start here
> **Previous topic:** [Module 02 — Express.js](../../02-expressjs/README.md)
> **Next topic:** [02 — SQL vs NoSQL](../02-sql-vs-nosql/README.md)

Your Express server can route requests, validate input and return JSON — but so far its data lived in a JavaScript array that vanished on restart. MongoDB is where the data lives permanently. It is a document database: it stores data as JSON-like documents, so the shape of your data in the database looks almost exactly like the objects in your JavaScript code. This topic is the introduction: what MongoDB is, why it exists, where it fits in the stack, and when to use it — then a first working database, collection and documents.

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain what MongoDB is and why it exists.
- Explain the difference between a document, a collection, and a database.
- Explain what BSON is and why MongoDB uses it instead of plain JSON.
- Explain what an ObjectId is and why it is the default `_id`.
- Describe where MongoDB fits in the stack: your code → driver → `mongod` → disk.
- Explain the difference between a flexible schema and no schema design.
- Connect a Node.js app to MongoDB with the official driver and run basic operations.
- Explain when MongoDB is a good choice — and when SQL is better.

## Topics Covered

- What MongoDB is — a document-oriented NoSQL database
- Why MongoDB exists — messy, nested, fast-changing data
- Documents vs rows — nested data in one document instead of five tables
- Flexible schema — fields can differ between documents, and why that is a responsibility
- The `_id` field and ObjectId — 12 bytes, unique without coordination
- Where MongoDB fits in the stack — Express → driver → `mongod` → WiredTiger → disk
- BSON — JSON plus Date, ObjectId, Decimal128, binary data
- `mongod`, `mongosh`, and the driver — the three pieces you talk to
- The driver API chain — `MongoClient` → `Db` → `Collection` → Cursor
- When to use MongoDB — and when not to

## Links

- **Notes:** [notes.md](./notes.md) — full detailed notes, diagrams, and interview questions with answers
- **Examples:** [examples/](./examples/) — run [`intro-demo.mjs`](./examples/intro-demo.mjs), expected output in [`example.txt`](./examples/example.txt)
- **Exercises:** [exercises.md](./exercises.md) — 5 practice tasks, no solutions
- **Module README:** [03 — MongoDB](../README.md)

**How to run the examples:**

```bash
NODE_PATH=/tmp/mongo-verify/node_modules node examples/intro-demo.mjs
```

> The mongodb packages are **not** installed inside this repo — they live only in `/tmp/mongo-verify/node_modules` and are found through the `~/workspace/node_modules` symlink. In your own project you would run `npm install mongodb` and the import would just work. The example uses `mongodb-memory-server`, which starts a real MongoDB in memory and stops it when the script ends, so nothing is installed on your machine.

## Key Takeaways

- MongoDB stores data as **documents** (JSON-like, BSON on disk) grouped into **collections** inside **databases**.
- A document maps directly to a JavaScript object — that is why MongoDB pairs so well with Node.js.
- The schema is **flexible**, not absent: you still design your documents, and inconsistent field types become your code's problem.
- Every document has a unique **`_id`**, by default an **ObjectId** (timestamp + random value + counter).
- The chain is `MongoClient` → `Db` → `Collection` → Cursor, and `find()` returns a **cursor**, not an array.
- Databases and collections are created **lazily**, on first write — a typo in a name silently creates a new empty collection.
- Always close the client (and stop the memory server) at the end, or the script never exits.

---

[← Main README](../../README.md) · Previous: [Module 02 — Express.js](../../02-expressjs/README.md) · Next: [02 — SQL vs NoSQL](../02-sql-vs-nosql/README.md)

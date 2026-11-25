# 04 — Installation and Setup

> **Priority:** 🔴 High
> **Previous topic:** [03 — MongoDB Architecture](../03-mongodb-architecture/README.md)
> **Next topic:** [05 — Databases, Collections and Documents](../05-databases-collections-documents/README.md)

MongoDB is useless until it is running somewhere your code can reach it. This topic gets it running: installing MongoDB locally, starting `mongod`, talking to it with `mongosh`, seeing your data in Compass, and connecting from the cloud with MongoDB Atlas. It also covers the one habit that protects every project you will ever build — keeping the connection string in an environment variable instead of in your code.

## Learning Objectives

By the end of this lesson, you will be able to:

- Install MongoDB on Windows, macOS, and Linux.
- Start and stop the `mongod` server, as a service or by hand.
- Use `mongosh` to check the server version and run commands.
- Create a free Atlas cluster and connect to it.
- Read a connection string piece by piece — `mongodb://` vs `mongodb+srv://`, host, port, credentials, database.
- Keep the connection string in an environment variable (`.env`) and out of git.
- Connect from Node.js with the `mongodb` driver and verify the connection with a `ping`.
- Explain what MongoDB Compass is for, and when to use `mongodb-memory-server` for tests and demos.

## Topics Covered

- The three ways to run MongoDB — local install, Atlas, in-memory server
- Installing on Windows (MSI), macOS (Homebrew), Linux (apt)
- Starting and stopping `mongod`, `--dbpath`, `--port`, `--bind_ip`
- `mongosh` — `db.version()`, `show dbs`, `use <db>`
- MongoDB Atlas — free M0 cluster, network access, database user, connect
- Connection strings — `mongodb://` vs `mongodb+srv://`, `authSource`, options
- Secrets — environment variables, `.env`, `.gitignore`
- Compass — the official GUI
- Verifying from Node.js — `MongoClient`, `connect()`, `ping`

## Links

- **Notes:** [notes.md](./notes.md) — full detailed notes, diagrams, and interview questions with answers
- **Examples:** [examples/](./examples/) — run [`setup-demo.mjs`](./examples/setup-demo.mjs), expected output in [`example.txt`](./examples/example.txt)
- **Exercises:** [exercises.md](./exercises.md) — 5 practice tasks, no solutions
- **Module README:** [../README.md](../README.md)

**How to run the examples:**

```bash
NODE_PATH=/tmp/mongo-verify/node_modules node examples/setup-demo.mjs
```

## Key Takeaways

- Installing MongoDB and running MongoDB are different things — `mongod` is the server, and if it is not running, nothing connects.
- `use <db>` does not create a database; the database appears on the first write.
- Atlas is free to start (M0 tier), and its connection string uses `mongodb+srv://` — DNS holds the cluster addresses.
- A connection string with a password is a secret: it lives in an environment variable, never in source code, never in git.
- From Node.js: `npm install mongodb`, `new MongoClient(uri)`, `connect()`, and `ping` to prove it works — `{ ok: 1 }` means alive.

---

[← Main README](../../README.md) · Previous: [03 — MongoDB Architecture](../03-mongodb-architecture/README.md) · Next: [05 — Databases, Collections and Documents](../05-databases-collections-documents/README.md) · Module: [../README.md](../README.md)

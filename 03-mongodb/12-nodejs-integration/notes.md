# 12 — Node.js Integration

> **Module:** [03 — MongoDB](../README.md) · **Previous:** [11 — Aggregation](../11-aggregation/README.md) · **Next:** [13 — Mongoose](../13-mongoose/README.md)

## Table of Contents

- [1. Introduction](#1-introduction)
- [2. Definition of Important Concepts](#2-definition-of-important-concepts)
- [3. Detailed Explanations](#3-detailed-explanations)
- [4. How the Technology Works Internally](#4-how-the-technology-works-internally)
- [5. Architecture or Workflow](#5-architecture-or-workflow)
- [6. Real-World Examples](#6-real-world-examples)
- [7. Code Examples Where Applicable](#7-code-examples-where-applicable)
- [8. Step-by-Step Code Explanations](#8-step-by-step-code-explanations)
- [9. Common Misconceptions](#9-common-misconceptions)
- [10. Important Technical Terminology](#10-important-technical-terminology)
- [11. Summary](#11-summary)
- [12. Interview Questions and Answers](#12-interview-questions-and-answers)
- [13. References](#13-references)
- [Files in This Folder](#files-in-this-folder)

---

## 1. Introduction

Topics 01–11 taught you MongoDB itself: documents, CRUD, operators, schema design, relationships, indexes, aggregation. All of that was the database side. This topic is the other half — how a Node.js application actually talks to MongoDB.

The bridge between the two is the **official MongoDB Node.js driver**: the `mongodb` package on npm, written and maintained by MongoDB itself. Every Node.js application that uses MongoDB — whether it is a plain Express API, a Next.js server, or a script like the ones in this module — uses this driver, either directly or through a library built on top of it (Mongoose, topic 13, is built on this driver).

By the end of this topic you will know how to create one `MongoClient`, connect it once when your app starts, reuse it for every request, run all the CRUD you learned in topic 06 through it, read results with cursors, and handle the two failure modes every production app must survive: the database being unreachable at startup, and the database going away while the app is running.

Nothing in this topic replaces what you learned before — it wires it up. The queries are the same queries from topics 06 and 07; the difference is that now they run from inside a Node.js process, over a network connection, inside `async` functions, with real error handling.

---

## 2. Definition of Important Concepts

- **Driver** — a library that lets a programming language talk to a database. The official MongoDB Node.js driver is the `mongodb` npm package. It speaks the MongoDB wire protocol so your code does not have to.
- **MongoClient** — the driver's main object. It represents your application's connection to a MongoDB deployment (a standalone server, a replica set, or an Atlas cluster). You create one, connect it once, and reuse it everywhere.
- **Connection string (URI)** — a single string that tells the driver where MongoDB lives and how to authenticate, e.g. `mongodb://localhost:27017/shop` or `mongodb+srv://user:pass@cluster0.example.net/shop`. It encodes host(s), port, database, credentials, and options.
- **mongodb:// vs mongodb+srv://** — `mongodb://` lists hosts directly (`mongodb://host1:27017,host2:27017/db`). `mongodb+srv://` looks up the hosts through a DNS SRV record instead, so the string stays short; Atlas connection strings use this form. Both are the same protocol once the hosts are known.
- **Connection pool** — a set of open TCP connections the driver keeps ready inside one `MongoClient`. Requests borrow a connection from the pool, use it, and return it. The default pool size is **100 connections per client** (`maxPoolSize: 100`).
- **Database handle (`Db`)** — what `client.db('shop')` returns: a handle to one database on the server. Cheap to create, safe to call repeatedly.
- **Collection handle (`Collection`)** — what `db.collection('users')` returns: a handle to one collection. Also cheap; calling it does not hit the network.
- **Cursor** — the object `find()` returns. It does not contain results yet; it is a lazy pointer to results on the server. Calling `toArray()`, `next()`, or iterating it actually fetches documents.
- **Server selection** — the driver's process of choosing which MongoDB server to send an operation to (one server for standalone, the primary or a suitable secondary for a replica set). If no server answers within `serverSelectionTimeoutMS` (default 30,000 ms), the operation fails with a `MongoServerSelectionError`.
- **Retryable writes** — the driver automatically retrying a write (insert, update, delete) once if it fails with a retryable network error. On by default (`retryWrites: true`) for replica sets and sharded clusters.
- **Environment variable** — a value read from the process environment (`process.env.MONGODB_URI`), used to keep secrets such as connection strings out of source code. In practice the value is loaded from a `.env` file in development.
- **Mongoose** — an ODM (Object Document Mapper) library built on top of the official driver. It adds schemas, models, and validation. Covered in full in topic 13; this topic shows the driver underneath it.

---

## 3. Detailed Explanations

### 3.1 The official driver

Install it with `npm install mongodb`. Import what you need:

```js
import { MongoClient, ObjectId } from 'mongodb';
```

There is no other package to install for basic use. The driver includes everything: connection handling, pooling, BSON encoding (turning JavaScript objects into the binary format MongoDB stores), cursors, and error types. Community wrappers exist, but every one of them either uses this driver or reimplements it badly — learn the driver first and every wrapper becomes easy.

### 3.2 Connection strings

A connection string has four parts: scheme, credentials, hosts, and options.

```text
mongodb://username:password@host1:27017,host2:27017/shop?retryWrites=true&w=majority
└── scheme ──┘└── credentials ──┘└────── hosts ──────┘└db┘└────── options ──────┘
```

| Form | When you see it |
|---|---|
| `mongodb://localhost:27017/shop` | Local development, a standalone server on your machine. No credentials, default port 27017. |
| `mongodb://user:pass@host:27017/shop` | A server with authentication enabled. Username and password travel in the URI. |
| `mongodb://host1:27017,host2:27017,host3:27017/shop?replicaSet=rs0` | A replica set: list every member, name the set. The driver finds the primary itself. |
| `mongodb+srv://user:pass@cluster0.example.net/shop` | Atlas (or any DNS SRV setup). The `+srv` tells the driver to ask DNS for the host list instead of spelling it out. |

Two rules that never change:

1. **Read the URI from the environment, never hardcode it.** A hardcoded URI with a real password is a leaked credential the moment the code is pushed to GitHub. The pattern is:

   ```js
   const uri = process.env.MONGODB_URI;
   if (!uri) throw new Error('MONGODB_URI is not set');
   ```

   In development the variable is loaded from a `.env` file (with the `dotenv` package); in production the hosting platform sets it. The `.env` file itself is never committed — it belongs in `.gitignore`.

2. **The database name in the URI is the default database.** `client.db()` with no argument uses it. Passing a name to `client.db('shop')` overrides it. Pick one place to name the database and be consistent.

### 3.3 Connect once, reuse the client

This is the single most important rule of this topic:

```js
// Do this ONCE, when your app starts:
const client = new MongoClient(uri);
await client.connect();

// Then reuse `client` (or a collection handle made from it) everywhere:
// in every route handler, every service function, every script.
```

**Why not connect per request?** A new `MongoClient` per request means a new connection pool per request: a fresh TCP handshake, a fresh authentication, a fresh round of server discovery — hundreds of milliseconds of overhead on every single request, plus a connection leak on the server as pools pile up. Under load the database runs out of connections and starts refusing them. One client, created at startup, shared by the whole app, is the design the driver is built for.

In an Express app this usually means: connect in your entry file (`server.js` / `app.js`), store the client (or the `db` handle) somewhere your routes can reach it — a module export, `app.locals`, or a small `db.js` helper — and close it only when the process shuts down.

### 3.4 Connection pooling

One `MongoClient` does not mean one connection. Inside the client is a **pool** of connections — by default up to **100** (`maxPoolSize: 100`). When ten requests run at the same time, they borrow ten different connections from the pool and run in parallel; when a request finishes, its connection goes back into the pool for the next request.

Practical consequences:

- The default of 100 is right for most apps. A small API serving a few dozen concurrent requests will never need more.
- If you do raise it, the database must be able to handle it: every connection costs memory on the server. Raising `maxPoolSize` to 1000 on a small Atlas free tier will hurt, not help.
- `minPoolSize` (default 0) keeps that many connections open even when idle. Raising it slightly (e.g. 5) avoids the cost of opening a fresh connection on the first request after a quiet period.
- The pool is per client, which is why one client is the rule: ten clients means ten pools of up to 100 connections each — up to 1,000 connections from one app.

```js
new MongoClient(uri, { maxPoolSize: 50, minPoolSize: 5 });
```

### 3.5 Async/await patterns

Every driver operation returns a promise. There is no callback API in modern driver versions, and there is no synchronous way to talk to a database over a network. The patterns are the same `async`/`await` you already know from Node.js:

```js
// Top level of a .mjs script — top-level await works in ES modules.
await client.connect();
const users = await collection.find({ city: 'Karachi' }).toArray();

// Inside a function (route handler, service, script helper):
async function getKarachiUsers() {
  return collection.find({ city: 'Karachi' }).toArray();
}
```

**Do not mix `await` with `.then()` chains in the same function** — it is not wrong, but it makes error handling inconsistent: a `try/catch` around `await` catches everything, while a forgotten `.catch()` on a chain silently swallows a failure. Pick `async`/`await` and keep it.

### 3.6 The try/finally close pattern

A client that is never closed leaks connections. The pattern that guarantees closing is `try/finally` — `finally` runs whether the work succeeded or threw:

```js
const client = new MongoClient(uri);
try {
  await client.connect();
  // ... all database work here ...
} finally {
  await client.close(); // runs even if the work above threw
}
```

For a long-running server the same idea applies at shutdown instead: listen for `SIGINT`/`SIGTERM` and close the client there, so a deploy or a Ctrl+C does not leave connections hanging on the server until they time out.

### 3.7 CRUD through the driver

This is topic 06's CRUD, now called from Node.js. The method names and shapes are identical — only the caller changes:

| Operation | Driver call | Returns |
|---|---|---|
| Create one | `insertOne(doc)` | `{ acknowledged, insertedId }` |
| Create many | `insertMany([doc, doc])` | `{ acknowledged, insertedCount, insertedIds }` |
| Read many | `find(filter).toArray()` | array of documents |
| Read one | `findOne(filter)` | one document, or `null` |
| Update one | `updateOne(filter, { $set: ... })` | `{ matchedCount, modifiedCount }` |
| Update many | `updateMany(filter, { $set: ... })` | `{ matchedCount, modifiedCount }` |
| Delete one | `deleteOne(filter)` | `{ deletedCount }` |
| Delete many | `deleteMany(filter)` | `{ deletedCount }` |
| Count | `countDocuments(filter)` | number |

Two details worth remembering:

- **`insertedId` is the `_id` you gave (or the driver generated).** When you insert a document without `_id`, the driver generates an `ObjectId` for you before sending — the returned `insertedId` is that value, and the document in the database has it too.
- **Always check the counts.** `updateOne` returning `matchedCount: 0` is not an error — it means no document matched your filter. The driver will not throw for "nothing matched"; your code has to notice. The same applies to `modifiedCount: 0` when the new value equals the old one, and `deletedCount: 0` when there was nothing to delete.

### 3.8 Cursors and toArray()

`find()` does not run the query. It returns a **cursor** — a lazy object that knows the query and will fetch results when asked. This is why you can chain `.sort()`, `.limit()`, and `.skip()` after `find()` and before anything reaches the server:

```js
const cursor = users.find({ city: 'Karachi' }).sort({ age: -1 }).limit(10);
const page = await cursor.toArray(); // NOW the query runs
```

- `toArray()` fetches everything into memory. Fine for tens or hundreds of documents; dangerous for a million. For large result sets, iterate instead: `for await (const doc of cursor)` streams documents one at a time, and `cursor.next()` fetches a single document.
- A cursor can only be used once. After `toArray()` or a full iteration it is exhausted; call `find()` again for a fresh one.
- `findOne()` is a convenience: it is `find(filter).limit(1)` plus taking the first document (or `null`).

### 3.9 Handling connection failures

Two settings control how the driver behaves when MongoDB cannot be reached:

- **`serverSelectionTimeoutMS`** (default 30,000): how long the driver keeps trying to find a usable server before giving up. An operation against a dead server waits this long, then throws `MongoServerSelectionError`. In a script or a startup check, 30 seconds is a long time to wait — this topic's example uses `1000` ms for the deliberately-failing connection so the demo fails fast. In production, keep the default or lower it only deliberately.
- **`retryWrites`** (default `true`): retry a write once after a retryable network error. This is safe because the driver tracks the operation and will not apply it twice.

How failures surface depends on when they happen:

- **At startup** (`await client.connect()` throws): the app cannot work at all. The correct response is to log the error and exit (or crash and let the process manager restart you). Never start an HTTP server that cannot reach its database and hope for the best — every request would fail anyway, more confusingly.
- **During a request** (an operation throws): catch it in the route handler, log it, and return a 500. The driver keeps its pool and will recover automatically when the server comes back — the next request retries server selection from scratch. This is the payoff of connecting once and reusing the client: recovery is free.
- **After a long idle period**: the server or a firewall may have closed idle connections. The driver detects the dead connection on next use and opens a fresh one — this is `MongoNetworkError` territory, and retryable operations retry. Your code usually never sees it.

### 3.10 Driver vs Mongoose — a preview

Mongoose (topic 13) is a layer on top of this driver. It adds **schemas** (a declared shape for each collection), **models** (a class-like object per collection with helper methods), validation, middleware (hooks), and query building. Underneath, every Mongoose call becomes a driver call — `User.find()` becomes a driver `find()`.

| | Driver (this topic) | Mongoose (topic 13) |
|---|---|---|
| What you write | `collection.find({ age: { $gt: 21 } })` | `User.find({ age: { $gt: 21 } })` |
| Schema enforcement | None — any shape is allowed | Declared in the model, enforced before saving |
| Validation | You write it yourself | Built in (required, min/max, custom validators) |
| Learning curve | Small — it is just the database API | Larger — schemas, models, hooks, population |
| Control | Full — every option is yours | Some behaviour is Mongoose's, not yours |

Rule of thumb: learn the driver first (this topic), then choose Mongoose when you want its guarantees. Teams that skip the driver end up debugging Mongoose behaviour they cannot explain, because they have never seen the layer underneath.

---

## 4. How the Technology Works Internally

### 4.1 From `new MongoClient(uri)` to a query result

1. **Parsing.** The constructor parses the connection string: scheme, credentials, host list, database, and options. Nothing touches the network yet — constructing a client is cheap and lazy.
2. **Connecting.** `await client.connect()` opens TCP connections to the listed hosts (or the hosts DNS returns for `+srv`), authenticates with the credentials, and runs server discovery: it asks each server "who are you — standalone, primary, or secondary?" and records the topology.
3. **Monitoring.** In the background, the driver keeps a monitor per server, sending a `hello` command every 10 seconds (`heartbeatFrequencyMS`). If a primary steps down or a server disappears, the driver learns about it from the heartbeat, not from your next failed request.
4. **Server selection.** When you call an operation, the driver picks a server: the primary for writes, the primary (by default) for reads. If no server is suitable, it waits up to `serverSelectionTimeoutMS`, retrying the check, then throws `MongoServerSelectionError`.
5. **Checkout.** The operation borrows a connection from the pool (or opens a new one if the pool is below `maxPoolSize` and none is free). If every connection is busy, the operation waits up to `waitQueueTimeoutMS` (default: no timeout — it waits).
6. **Wire protocol.** Your JavaScript filter is encoded as BSON (Binary JSON — the binary format MongoDB stores) and sent as an OP_MSG wire-protocol message over the TCP connection. The server executes it and streams the reply back as BSON.
7. **Decoding.** The driver decodes the BSON reply into plain JavaScript objects (with `ObjectId`, `Date`, and other BSON types preserved as their driver classes) and resolves the promise you awaited.
8. **Check-in.** The connection returns to the pool. Your `await` resumes with the result.

### 4.2 What `await client.connect()` actually waits for

Not for "the database is up" in the abstract — for the first successful server selection: the driver must have discovered at least one usable server and completed authentication. On a replica set it waits until it knows which member is primary. That is why `connect()` against a dead server hangs until `serverSelectionTimeoutMS` expires instead of failing instantly.

### 4.3 BSON: the encoding layer

MongoDB does not store JSON text; it stores BSON, a binary encoding of JSON-like documents. The driver converts on both sides of every operation. The practical effects: JavaScript `Date` becomes BSON datetime (so date queries and sorting work), `ObjectId` stays a 12-byte value (not a string), and numbers keep their type — a JavaScript number that is an integer may be stored as `int32` or `int64`, and `NumberDecimal` exists for exact decimal money values. This is also why `_id` values printed with `JSON.stringify` appear as plain hex strings: `ObjectId` serializes to its hex form.

### 4.4 The pool under load

When requests arrive faster than the pool can serve them, checkout requests queue. With the default `maxPoolSize: 100` and short queries, this queue is almost always empty. If you see operations timing out at checkout, the fix is almost never "raise the pool" — it is "find the slow query holding connections", usually a missing index (topic 10) or an unbounded `toArray()` on a huge collection.

---

## 5. Architecture or Workflow

### 5.1 The shape of a Node.js + MongoDB application

```text
                 ┌──────────────────────────────┐
                 │        Node.js process       │
                 │                              │
  HTTP request ──►  Express route handler       │
                 │        │                     │
                 │        ▼                     │
                 │   Service / business logic   │
                 │        │                     │
                 │        ▼                     │
                 │  Collection handle (users)   │  ← created once, reused
                 │        │                     │
                 │        ▼                     │
                 │  MongoClient (ONE per app)   │  ← owns the pool
                 │        │  pool: up to 100    │
                 └────────┼─────────────────────┘
                          │  MongoDB wire protocol (BSON over TCP)
                          ▼
                 ┌──────────────────────────────┐
                 │   MongoDB server / cluster   │
                 │   database: shop             │
                 │   collection: users          │
                 └──────────────────────────────┘
```

### 5.2 The lifecycle, step by step

1. **Startup.** Read `MONGODB_URI` from the environment. Create one `MongoClient`. `await client.connect()`. If it throws, log and exit — do not start listening.
2. **Wiring.** Create the `db` and collection handles once (`client.db('shop').collection('users')`) and export them, or pass them into your services. Handles are cheap and stateless; creating them per request is harmless but pointless.
3. **Requests.** Each route handler `await`s driver calls on the shared handles. Errors are caught per request and become a 500 response. The driver recovers from transient failures by itself.
4. **Shutdown.** On `SIGINT`/`SIGTERM`, `await client.close()` and then exit. This returns connections to the server cleanly instead of letting them die by timeout.

### 5.3 Where the example fits

`examples/node-integration.mjs` is a compressed version of this lifecycle: it starts a memory server (standing in for a real MongoDB), connects once, runs create → read → update → delete on one shared client, shows a failed connection handled gracefully, and closes everything in `finally`. The only parts a real app adds are the HTTP layer on top and the URI coming from `.env` instead of the memory server.

---

## 6. Real-World Examples

- **Signup endpoint.** `POST /users` — `insertOne({ name, email, passwordHash })`. The returned `insertedId` goes into the response (or into a JWT/session). A unique index on `email` (topic 10) turns a duplicate signup into error code `11000`, which the handler maps to "email already registered".
- **Login lookup.** `findOne({ email })` fetches the one user row needed to check a password hash. One document, one indexed lookup, no `toArray()`.
- **Feed / list page.** `find({}).sort({ createdAt: -1 }).limit(20)` — the newest 20 posts. `.limit()` keeps the result small; without it, `toArray()` would load the whole collection.
- **Queue tokens (Q-less, the semester project idea).** A token is claimed with `findOneAndUpdate({ status: 'waiting' }, { $set: { status: 'called' } }, { sort: { position: 1 }, returnDocument: 'after' })` — one atomic operation that picks the next waiting token and marks it called, so two staff members can never call the same token.
- **Dashboard counts.** `countDocuments({ status: 'done' })` for the "tokens served today" number — a count query, not a fetch-all-and-count in JavaScript.
- **Startup health check.** Before an API starts listening, it runs `await client.db().command({ ping: 1 })`. If the ping fails, the deploy fails loudly instead of serving 500s to users.

---

## 7. Code Examples Where Applicable

### 7.1 Minimal connect-and-query (the whole topic in 15 lines)

```js
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);

try {
  await client.connect();
  const users = client.db('shop').collection('users');
  await users.insertOne({ name: 'Talha', city: 'Karachi', age: 21 });
  const karachi = await users.find({ city: 'Karachi' }).toArray();
  console.log(karachi);
} finally {
  await client.close();
}
```

### 7.2 A reusable `db.js` module (the pattern real apps use)

```js
// db.js — one client for the whole app
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI is not set');

const client = new MongoClient(uri);
await client.connect(); // top-level await: the module is ready when imported

export const db = client.db('shop');
export const users = db.collection('users');
export async function closeDb() { await client.close(); }
```

```js
// routes.js — imports the shared handles, never creates a client
import { users } from './db.js';

export async function listUsers(req, res) {
  try {
    const list = await users.find({}).sort({ name: 1 }).toArray();
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'database unavailable' });
  }
}
```

### 7.3 Streaming a large result instead of toArray()

```js
const cursor = users.find({});
for await (const user of cursor) {
  console.log(user.name); // one document at a time, constant memory
}
```

### 7.4 Failing fast on a bad connection (from this topic's example)

```js
const bad = new MongoClient('mongodb://127.0.0.1:27099', {
  serverSelectionTimeoutMS: 1000, // fail after 1s instead of the 30s default
});
try {
  await bad.connect();
} catch (err) {
  console.log('failed connection error code:', err.code);
} finally {
  await bad.close();
}
```

Note: in driver 7.x the `ECONNREFUSED` code is not on `err.code` itself — it sits two causes deep (`MongoServerSelectionError` → `MongoNetworkError` → `Error { code: 'ECONNREFUSED' }`). The example walks the `cause` chain and prints only the first code found; the full error message is never printed because it contains variable text (host, port, topology details).

---

## 8. Step-by-Step Code Explanations

The full demo is `examples/node-integration.mjs`. Here is what each part does, in order.

1. **Imports.** `MongoMemoryServer` (in-memory server for practice), `fs`/`os`/`path` (data-directory housekeeping), `MongoClient` and `ObjectId` from the driver.
2. **Data directory.** `path.join(os.homedir(), '.cache', 'mongo-mem', 'nodejs-integration')` — under `~/.cache`, not `/tmp`, because `/tmp` on this machine is a small tmpfs. Created with `mkdir(..., { recursive: true })`, deleted at the end.
3. **Start the memory server.** `MongoMemoryServer.create({ instance: { dbPath } })`. On a fresh machine the first run downloads the `mongod` binary once (~120MB) and prints progress lines; later runs reuse the cached binary and start fast.
4. **Resolve the URI.** `const uri = process.env.MONGODB_URI || mongod.getUri()`. In a real app the left side is the whole story — the URI comes from `.env`. Here the memory server supplies it when no variable is set, so the same code shape works in both cases.
5. **Connect once.** `new MongoClient(uri)` then `await client.connect()`. One client for the entire demo; every operation below reuses it.
6. **Collection handle.** `client.db('shop').collection('users')` — no network call, just a handle.
7. **Create.** Three `insertOne` calls with fixed `_id` values (`0000...001`, `...002`, `...003`), printing each `insertedId`. `countDocuments()` after the first insert prints `1`; after all three it prints `3`. Fixed ids keep the output byte-identical on every run.
8. **Read.** `find({}).sort({ name: 1 }).toArray()` — `find()` builds the cursor, `sort()` orders it, `toArray()` runs it. Prints `[ 'Ayesha', 'Bilal', 'Talha' ]`.
9. **Update.** `updateOne({ _id: ...003 }, { $set: { age: 20 } })` prints `matched: 1 modified: 1`. A `findOne` then prints the whole updated document as JSON, proving the change landed. Count is still `3` — an update never changes the count.
10. **Delete.** `deleteOne({ _id: ...002 })` prints `deleted: 1`. Count drops to `2`, and a final sorted `find` prints `[ 'Bilal', 'Talha' ]`.
11. **Failed connection.** A second client points at `mongodb://127.0.0.1:27099`, where nothing listens, with `serverSelectionTimeoutMS: 1000`. `connect()` throws after one second; the `catch` walks the error's `cause` chain, finds `ECONNREFUSED`, and prints only that code.
12. **Cleanup.** The outer `finally` closes the main client, closes the bad client (ignoring its own close errors), stops the memory server, and deletes the data directory — then the script prints `DONE` and exits `0`.

---

## 9. Common Misconceptions

- **"I should connect in every route handler."** No. Connecting per request opens a new pool per request, adds hundreds of milliseconds of handshake and auth to every request, and leaks connections on the server. Connect once at startup; reuse the client everywhere.
- **"One client means one connection, so my app can't handle parallel requests."** No. One client owns a pool of up to 100 connections by default. Parallel requests borrow different connections from the same pool.
- **"`find()` runs the query."** No. `find()` returns a cursor; the query runs when you call `toArray()`, `next()`, or iterate the cursor. That is why `sort()`/`limit()` can be chained after `find()`.
- **"`updateOne` throwing means it failed; returning normally means it worked."** Not quite. A normal return with `matchedCount: 0` means nothing matched your filter — no error, but nothing changed either. Always check the counts.
- **"A connection string in the code is fine if the repo is private."** No. Repos become public, screenshots leak, and credentials in git history are almost impossible to fully erase. The URI lives in the environment, always.
- **"Mongoose replaces the driver."** No. Mongoose is built *on* the driver. Every Mongoose query becomes a driver call, and Mongoose connection problems are driver connection problems. Knowing the driver is what lets you debug Mongoose.
- **"The driver retries everything automatically."** No. Only retryable writes retry by default, and only once. A failed read does not retry; your code (or the next request) retries it. And a write that already reached the server is never applied twice.
- **"Closing the client after every operation is tidy."** No. It destroys the pool and forces a full reconnect on the next operation. Close once, at shutdown.
- **"`mongodb+srv://` is a different database."** No. It is the same protocol; only host discovery differs (DNS SRV lookup instead of a listed host). Atlas uses it because cluster hosts change.

---

## 10. Important Technical Terminology

| Term | Meaning |
|---|---|
| Driver | The `mongodb` npm package: the official library that lets Node.js talk to MongoDB over the wire protocol. |
| MongoClient | The driver's main object; owns the connection pool and represents the app's link to a deployment. |
| Connection string / URI | One string encoding scheme, credentials, hosts, database, and options, e.g. `mongodb://localhost:27017/shop`. |
| mongodb+srv:// | URI scheme where hosts are discovered via a DNS SRV record (used by Atlas) instead of listed directly. |
| Connection pool | The set of open TCP connections held inside one `MongoClient`; default `maxPoolSize` is 100. |
| Db / Collection | Handles returned by `client.db(name)` and `db.collection(name)`; cheap, stateless, safe to reuse. |
| Cursor | Lazy result object returned by `find()`; fetches documents only when iterated or `toArray()` is called. |
| BSON | Binary JSON — the binary format MongoDB stores and the driver encodes/decodes on every operation. |
| Server selection | Choosing which server handles an operation; fails with `MongoServerSelectionError` after `serverSelectionTimeoutMS` (default 30,000 ms). |
| Retryable writes | The driver automatically retrying a write once after a retryable network error (`retryWrites: true` by default). |
| serverSelectionTimeoutMS | How long to keep looking for a usable server before an operation fails. |
| maxPoolSize / minPoolSize | Upper/lower bounds on connections in a client's pool (defaults 100 / 0). |
| ObjectId | MongoDB's default 12-byte `_id` type, generated by the driver when a document has no `_id`. |
| ODM (Mongoose) | Object Document Mapper — a library (topic 13) that adds schemas and models on top of the driver. |
| Environment variable | A process-level setting such as `MONGODB_URI`, used to keep secrets out of source code. |
| Heartbeat | The driver's background `hello` check (every 10 s) that tracks which servers are up and who is primary. |

---

## 11. Summary

- The official `mongodb` driver is the bridge between Node.js and MongoDB; Mongoose and every other wrapper sit on top of it.
- The connection string (`mongodb://` or `mongodb+srv://`) encodes hosts, credentials, database, and options — and it is read from the environment (`process.env.MONGODB_URI`), never hardcoded.
- Create **one** `MongoClient`, `connect()` it once at startup, and reuse it for every request. It owns a pool of up to 100 connections, so one client still serves parallel requests.
- Close the client once, at shutdown, inside `try/finally` (or a shutdown handler) so failures never leak connections.
- CRUD through the driver is topic 06's CRUD with the same method names — `insertOne`, `find`, `findOne`, `updateOne`, `deleteOne`, `countDocuments` — and the returned counts (`matchedCount`, `modifiedCount`, `deletedCount`) must be checked, because "no document matched" is not an error.
- `find()` returns a lazy cursor; `toArray()` runs the query and loads everything into memory, while `for await...of` streams large results.
- When MongoDB is unreachable, operations fail with `MongoServerSelectionError` after `serverSelectionTimeoutMS` (default 30 s). Fail at startup loudly; per request, return a 500 and let the driver recover on its own.
- Learn the driver before Mongoose: topic 13's schemas and models are a layer over exactly this.

---

## 12. Interview Questions and Answers

**1. What is the official MongoDB Node.js driver, and how do you install it?**

The `mongodb` npm package, written and maintained by MongoDB: `npm install mongodb`. It speaks the MongoDB wire protocol, handles connections, pooling, and BSON encoding. Import `MongoClient` (and `ObjectId` when you need it) from `'mongodb'`.

**2. How should a Node.js app manage its MongoDB connection?**

Create one `MongoClient`, call `await client.connect()` once when the app starts, and reuse that client (or collection handles made from it) for every request. Close it once at shutdown. Never create a client per request.

**3. Why is connecting per request a bad idea?**

Each new client opens a new connection pool: a fresh TCP handshake, authentication, and server discovery — hundreds of milliseconds per request — and pools accumulate on the server until it runs out of connections. One client reuses one pool for the whole app.

**4. What is a connection pool, and what is its default size?**

The set of open TCP connections a `MongoClient` keeps ready. Requests borrow a connection, use it, and return it. The default `maxPoolSize` is 100 connections per client, settable via `new MongoClient(uri, { maxPoolSize: 50 })`.

**5. What is the difference between `mongodb://` and `mongodb+srv://`?**

`mongodb://` lists the hosts directly in the string; `mongodb+srv://` looks the hosts up through a DNS SRV record. The protocol and behaviour after discovery are identical. Atlas connection strings use `+srv`.

**6. Where should the connection string live, and why?**

In an environment variable such as `MONGODB_URI`, loaded from a `.env` file in development and set by the hosting platform in production. Never hardcoded in source code: a URI contains credentials, and code gets pushed, copied, and screenshotted.

**7. What does `find()` return, and when does the query actually run?**

A cursor — a lazy object describing the query. Nothing reaches the server until you call `toArray()`, `next()`, or iterate it (`for await...of`). That laziness is what lets you chain `.sort()`, `.limit()`, and `.skip()` after `find()`.

**8. When should you use `toArray()` and when should you stream a cursor?**

`toArray()` for small result sets (tens to hundreds of documents) where you need the whole list at once. Stream with `for await (const doc of cursor)` for large result sets, because `toArray()` loads everything into memory and can exhaust it.

**9. What does `updateOne` return, and how do you know whether anything changed?**

An object with `matchedCount` and `modifiedCount` (plus `acknowledged`). `matchedCount: 0` means no document matched the filter — not an error, but nothing happened. `modifiedCount: 0` with `matchedCount: 1` means the document matched but already had the new value.

**10. What happens when MongoDB is unreachable, and how do you handle it?**

The driver keeps trying server selection until `serverSelectionTimeoutMS` (default 30,000 ms), then the operation throws `MongoServerSelectionError`. At startup, log and exit rather than starting a server that cannot serve. During a request, catch it, return a 500, and let the driver recover automatically — the next request retries server selection.

**11. What is the try/finally close pattern, and why does it matter?**

```js
const client = new MongoClient(uri);
try { await client.connect(); /* work */ }
finally { await client.close(); }
```

`finally` runs whether the work succeeded or threw, so the client (and its pooled connections) is always released. Without it, an exception mid-script leaks connections on the server.

**12. What is the relationship between the driver and Mongoose?**

Mongoose is an ODM built on top of this driver: it adds schemas, models, validation, and hooks, but every Mongoose operation becomes a driver call underneath. Learn the driver first, then use Mongoose (topic 13) when you want its guarantees — and debug Mongoose problems at the driver level when they appear.

---

## 13. References

- MongoDB docs — Node.js driver, quick start: https://www.mongodb.com/docs/drivers/node/current/quick-start/
- MongoDB docs — `MongoClient` and connection options: https://www.mongodb.com/docs/drivers/node/current/fundamentals/connection/
- MongoDB docs — Connection strings (`mongodb://` and `mongodb+srv://`): https://www.mongodb.com/docs/manual/reference/connection-string/
- MongoDB docs — Connection pooling (`maxPoolSize`, `minPoolSize`): https://www.mongodb.com/docs/drivers/node/current/fundamentals/connection/connection-pools/
- MongoDB docs — CRUD operations with the driver: https://www.mongodb.com/docs/drivers/node/current/usage-examples/
- MongoDB docs — Cursors (`find`, `toArray`, iteration): https://www.mongodb.com/docs/drivers/node/current/fundamentals/crud/read-operations/cursor/
- MongoDB docs — Retryable writes: https://www.mongodb.com/docs/manual/core/retryable-writes/
- MongoDB docs — Server selection and `serverSelectionTimeoutMS`: https://www.mongodb.com/docs/drivers/node/current/fundamentals/connection/server-selection/
- npm — `mongodb` package (driver 7.x): https://www.npmjs.com/package/mongodb
- npm — `mongodb-memory-server` package (in-memory server used by the examples): https://www.npmjs.com/package/mongodb-memory-server

---

## Files in This Folder

- `README.md` — topic overview, learning objectives, and how to run the examples
- `notes.md` — this file: full detailed notes and interview questions with answers
- `examples/node-integration.mjs` — runnable demo: connect once, CRUD on a `users` collection, graceful failed-connection handling
- `examples/example.txt` — expected output of the demo (byte-identical on every run)
- `exercises.md` — 5 practice tasks (no solutions) and interview-style questions

# 03 — MongoDB Architecture — Full Notes

> **Module:** [03 — MongoDB](../README.md) · **Short version:** [README.md](./README.md) · **Examples:** [examples/](./examples/) · **Exercises:** [exercises.md](./exercises.md)

## Table of Contents

- [1. Introduction](#1-introduction)
- [2. Definitions](#2-definitions)
- [3. Detailed Explanations](#3-detailed-explanations)
- [4. How It Works Internally](#4-how-it-works-internally)
- [5. Architecture / Workflow](#5-architecture--workflow)
- [6. Real-World Examples](#6-real-world-examples)
- [7. Code Examples](#7-code-examples)
- [8. Step-by-Step Code Explanations](#8-step-by-step-code-explanations)
- [9. Common Misconceptions](#9-common-misconceptions)
- [10. Important Terminology](#10-important-terminology)
- [11. Summary](#11-summary)
- [12. Interview Questions and Answers](#12-interview-questions-and-answers)
- [13. References](#13-references)

---

## 1. Introduction

Topics 01 and 02 taught you what MongoDB is and when to choose it. This topic opens the box: what actually runs when you start MongoDB, how the pieces fit together, and how your data is stored on disk. You will meet `mongod` and `mongosh`, replica sets and sharding, the WiredTiger storage engine, BSON, and namespaces — the vocabulary every MongoDB discussion uses, and the mental model that makes later topics (indexing, aggregation, Mongoose) make sense instead of feeling like magic.

You do not need to operate a production cluster after this topic. You need to be able to draw the architecture on a whiteboard and explain what each box does.

---

## 2. Definitions

- **`mongod`** — The MongoDB server process. It stores data, answers queries, and manages indexes. One `mongod` is one database server; a cluster is several of them working together.
- **`mongosh`** — The MongoDB Shell. A command-line (and JavaScript) client for talking to `mongod`: run queries, inspect data, administer the server.
- **Replica set** — A group of `mongod` servers holding copies of the same data: one primary (takes writes) and one or more secondaries (copy the primary, can take reads). If the primary dies, the secondaries elect a new one. Replica sets exist for **high availability** and data safety.
- **Sharding** — Splitting one collection's data across many servers (shards), so no single machine holds everything. Sharding exists for **scale** — more data and more writes than one machine can handle.
- **`mongos`** — The query router in a sharded cluster. Your application talks to `mongos`; it works out which shard holds the data and forwards the query.
- **Config servers** — In a sharded cluster, the servers that store the metadata: which chunk of data lives on which shard.
- **WiredTiger** — MongoDB's default storage engine since version 3.2. It is the layer that actually writes documents to disk files, manages the cache, compresses data, and keeps indexes.
- **Storage engine** — The pluggable layer inside `mongod` that owns on-disk storage. WiredTiger is the one you will meet; older MongoDB used MMAPv1.
- **BSON** — Binary JSON, the on-disk and on-the-wire format (topic 01). It adds types JSON lacks: ObjectId, Date, Decimal128, binary data.
- **Namespace** — The full name of a collection: `database.collection`, for example `architecture.users`. Internally, every collection is addressed by its namespace.
- **Journal (write-ahead log)** — A log WiredTiger writes *before* the main data files, so a crash cannot lose writes that were already acknowledged.
- **Oplog (operations log)** — A special capped collection on the primary that records every write, in order. Secondaries copy the oplog to stay in sync. It is the mechanism that makes replica sets work.
- **Chunk** — A range of shard-key values. Sharding moves whole chunks between shards to balance the data.
- **Shard key** — The field (or fields) whose values decide which shard a document lives on. Choosing it badly is the most common sharding mistake.
- **Primary / Secondary** — In a replica set, the primary is the only member that accepts writes; secondaries replicate from it. Reads can go to either, depending on the read preference.

---

## 3. Detailed Explanations

### 3.1 The pieces on one machine

On a single machine, MongoDB is simple: one `mongod` process, one data directory, and clients connecting over TCP (default port 27017).

```text
Your Node.js app (mongodb driver)
        │  MongoDB wire protocol, TCP :27017
        ▼
┌─────────────────────────────────────────────┐
│ mongod                                      │
│  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Query engine │  │ WiredTiger           │ │
│  │ (parse, plan,│  │ (cache, compression, │ │
│  │  execute)    │  │  indexes, disk I/O)  │ │
│  └──────────────┘  └──────┬───────────────┘ │
│                          │                  │
│  ┌──────────────┐        ▼                  │
│  │ Journal (WAL)│   Data files on disk     │
│  └──────────────┘   /data/db (or configured)│
└─────────────────────────────────────────────┘

mongosh ── also a client, same protocol ──► mongod
```

`mongosh` is not special — it is just another client, like your Node.js app. Anything `mongosh` can do, your code can do through the driver, and vice versa. That is worth remembering when you debug: if a query works in `mongosh` but not in your code, the difference is in your code, not in the database.

### 3.2 mongod: the server process

`mongod` does four jobs:

1. **Accepts connections** — each client gets a connection; the driver pools them (by default up to 100 per client).
2. **Parses and plans queries** — turns `{ name: "Talha" }` into a plan: use the `_id` index, or scan the collection? (Indexing is topic 10.)
3. **Executes operations** — reads and writes through the storage engine.
4. **Manages durability** — journal, checkpoints, and (in a replica set) the oplog.

You start it with `mongod --dbpath /data/db` (or a config file). The examples in this module do not start it by hand — `mongodb-memory-server` starts a real `mongod` for you and stops it afterwards — but the server running inside is the same program.

### 3.3 WiredTiger: the storage engine

WiredTiger owns everything on disk:

- **Data files** — collections are stored in files in the data directory. A document is stored as BSON, compressed by default (snappy compression).
- **Cache** — WiredTiger keeps hot data in memory (by default, half of RAM minus 1 GB, or 256 MB minimum). Reads hit the cache first; only a miss goes to disk. This is why MongoDB is fast on repeated reads and why RAM matters.
- **Indexes** — stored as B-trees, also managed by WiredTiger (topic 10).
- **Journal** — every write goes to the journal first. If the machine loses power a millisecond after acknowledging your write, the journal replays it on restart. That is the "D" in ACID for a single server.
- **Checkpoints** — every 60 seconds (or 2 GB of journal), WiredTiger flushes a consistent snapshot to the data files.

The practical consequence for you: a write that returns successfully is safe. A write that was never acknowledged may or may not have happened — which is why write concerns (how many servers must confirm) exist, and why your code should handle the error, not assume.

### 3.4 Replica sets: copies for safety

A replica set is three (or more) `mongod` servers holding the **same** data:

```text
            ┌─────────────┐
            │  PRIMARY    │  ◄── all writes go here
            │  (elected)  │
            └──────┬──────┘
                   │ oplog (every write, in order)
          ┌────────┴────────┐
          ▼                 ▼
   ┌─────────────┐   ┌─────────────┐
   │ SECONDARY   │   │ SECONDARY   │
   │ (copy)      │   │ (copy)      │
   └─────────────┘   └─────────────┘
```

- **Writes** go only to the primary. The primary records each write in its **oplog**.
- **Secondaries** copy (replicate) the oplog and apply it, staying a few milliseconds behind.
- **If the primary dies**, the remaining members hold an election and promote a secondary. Your driver notices and reconnects automatically.
- **Reads** can go to the primary (always up to date) or to secondaries (possibly slightly stale — "eventual consistency" in practice).

Why three members and not two? An election needs a majority. With two members, one dying leaves one survivor — not a majority of two — so no new primary can be elected. Three is the minimum that survives one failure. This is the kind of fact interviewers love.

### 3.5 Sharding: splitting for scale

A replica set gives you copies of the *same* data — safety, not more capacity. When one machine cannot hold the data or handle the writes, you **shard**: split one collection across many servers by a **shard key**.

```text
Your app ──► mongos (query router) ──► config servers (metadata)
                        │
           ┌────────────┼────────────┐
           ▼            ▼            ▼
      Shard A      Shard B      Shard C
   (users A–M)  (users N–Z)   (overflow)
   each shard is itself a replica set
```

- The **shard key** decides placement: a document with `country: "PK"` might live on Shard A. A good shard key spreads writes evenly; a bad one (like a timestamp that always increases) sends every new write to the same shard — the "hot shard" problem.
- Data moves in **chunks** (ranges of shard-key values). A balancer migrates chunks between shards to keep the distribution even.
- Each shard is itself a replica set, so sharding and replication combine: sharding for scale, replica sets for safety.

For your semester project, a single `mongod` is plenty. Sharding is something you explain in an interview, not something you operate in a coursework project.

### 3.6 BSON on disk: what a document really looks like

A document is stored as BSON: a length, then a sequence of typed field–value pairs. The type byte is why a `Date` stays a `Date` and `Decimal128("19.99")` stays exactly `19.99`. The example in this topic inserts one document with an ObjectId, a Date, a Decimal128, an Int32, an Int64, binary data, and a nested object — and reads them back with their types intact. That round-trip is the proof that BSON is doing its job.

One limit to know: a single document cannot exceed **16 MB**. If your embedded array grows without bound (a post with a million comments), the design is wrong — that is when you reference instead of embedding (topic 02's rule, topic 08's detail).

---

## 4. How It Works Internally

### 4.1 A write, step by step

```js
await users.insertOne({ name: "Talha" });
```

1. The driver converts the object to BSON and sends an `insert` command over TCP.
2. `mongod` receives it, checks the namespace (`learn.users`), and hands the BSON to WiredTiger.
3. WiredTiger writes the change to the **journal** first.
4. It updates the in-memory cache and the `_id` index.
5. `mongod` replies `{ acknowledged: true, insertedId: ... }`.
6. Later, a **checkpoint** flushes the cached change to the data files on disk.

### 4.2 A read, step by step

```js
await users.findOne({ _id: TALHA_ID });
```

1. The driver sends a `find` command with the filter.
2. The query engine plans it: `_id` has an index, so it uses the index to locate the document instead of scanning the collection.
3. WiredTiger checks the cache; on a miss, it reads the data file from disk.
4. The BSON document travels back over TCP; the driver converts it to a JavaScript object.

### 4.3 How replication works, step by step

1. A write arrives at the primary. It is applied and recorded in the **oplog** (a capped collection called `local.oplog.rs`).
2. Each secondary tails the oplog — it keeps asking "anything new?" — and applies new entries in order.
3. A secondary that falls too far behind (beyond the oplog's size) cannot catch up incrementally and must resync from scratch.

---

## 5. Architecture / Workflow

### 5.1 Three deployments, three sizes

```text
LEARNING / DEVELOPMENT (this module)
  ┌────────────────┐
  │  one mongod    │   mongodb-memory-server starts it for you
  │  (in memory)   │   data disappears when the script ends
  └────────────────┘

PRODUCTION — SAFETY (replica set)
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ Primary  │  │Secondary │  │Secondary │
  └──────────┘  └──────────┘  └──────────┘
  same data × 3 — survives one server dying

PRODUCTION — SCALE (sharded cluster)
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ mongos   │  │ config   │  │ shards   │
  │ (router) │  │ servers  │  │ (each a  │
  └──────────┘  └──────────┘  │ replica  │
                              │  set)    │
                              └──────────┘
```

### 5.2 The connection string tells the driver the topology

```text
mongodb://localhost:27017/learn            → one server
mongodb://host1,host2,host3/learn?replicaSet=rs0
                                            → replica set (driver finds the primary)
mongodb://mongos-host:27017/learn          → sharded cluster (via mongos)
```

Your code barely changes between these. `MongoClient` accepts any of them; the driver discovers the topology, tracks the primary, and reconnects after elections. That is why the examples can use a memory server and production can use a replica set with the same code.

### 5.3 Namespaces

Every collection's full name is `database.collection`:

```text
learn.students        → database "learn", collection "students"
architecture.users    → database "architecture", collection "users"
```

The driver exposes this as `collection.namespace` (shown in the example). Internally, WiredTiger files and indexes are organised by namespace.

---

## 6. Real-World Examples

- **A startup's first database** — one `mongod` (often MongoDB Atlas, the hosted version) holds everything. No replica set to operate; Atlas provides it.
- **An e-commerce site on sale day** — a replica set keeps the shop up when one server dies mid-sale; reads are spread across secondaries.
- **A global chat app** — sharded by region or by user ID range, so no single machine holds all messages.
- **Your Express app in Module 02** — the semester-project starter used an in-memory store. Replacing it with MongoDB means swapping the store for a `MongoClient` — the routes stay the same shape.
- **Atlas (MongoDB's cloud)** — the same architecture, operated for you: replica sets by default, sharding when you outgrow one set. Most Node.js projects you will meet use Atlas rather than self-hosting `mongod`.

---

## 7. Code Examples

The full runnable example is [`examples/architecture-demo.mjs`](./examples/architecture-demo.mjs). Expected output is in [`examples/example.txt`](./examples/example.txt).

```js
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, ObjectId, Decimal128, Int32, Long } from 'mongodb';

const mongod = await MongoMemoryServer.create();
const client = new MongoClient(mongod.getUri());
await client.connect();

// The server answers: ping + build info
await client.db('admin').command({ ping: 1 });            // { ok: 1 }
const build = await client.db('admin').command({ buildInfo: 1 });
// build.version → "8.2.6"
const status = await client.db('admin').command({ serverStatus: 1 });
// status.storageEngine.name → "wiredTiger"

// Namespaces
const users = client.db('architecture').collection('users');
users.namespace; // "architecture.users"

// BSON types round-trip with their types intact
await db.collection('bson-types').insertOne({
  objectId: USER_ID,
  date: new Date('2026-11-25T10:00:00.000Z'),
  decimal: Decimal128.fromString('19.99'),
  int32: new Int32(42),
  int64: Long.fromString('9007199254740993'),
  binary: new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
});

await client.close();
await mongod.stop();
```

---

## 8. Step-by-Step Code Explanations

### 8.1 Ping and build info

```js
await client.db('admin').command({ ping: 1 });
```

`ping` is the cheapest possible command — it proves the server is alive and answering, returning `{ ok: 1 }`. `buildInfo` returns the server version and the list of available storage engines. Both run against the `admin` database, the built-in database for server-level commands.

### 8.2 The active storage engine is in serverStatus, not buildInfo

```js
const status = await client.db('admin').command({ serverStatus: 1 });
status.storageEngine.name; // "wiredTiger"
```

`buildInfo.storageEngines` lists every engine the binary *can* use — the first one alphabetically is `devnull`, which is not the active one. The active engine is `serverStatus.storageEngine.name`. This is a real trap the example hit during development: reading the wrong field gives a confident, wrong answer.

### 8.3 Namespaces

```js
const users = client.db('architecture').collection('users');
users.namespace; // "architecture.users"
```

The `namespace` property is the collection's full name. You will see this string in logs, error messages, and `mongosh` output — now you know what it means.

### 8.4 Database stats — printing only stable fields

```js
const stats = await db.stats();
console.log('Database:', stats.db);
console.log('Collections:', stats.collections, '| Documents:', stats.objects);
```

`db.stats()` also reports `dataSize` and `indexSize`, which vary between runs even with identical data. The example prints only the fields that are stable for the same data, so `example.txt` matches on every run.

### 8.5 BSON types

```js
decimal: Decimal128.fromString('19.99'),
int64: Long.fromString('9007199254740993'),
binary: new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
```

- `Decimal128` holds money exactly. `9007199254740993` is `2^53 + 1` — one more than the largest integer a JavaScript float holds exactly — so `Long` is the proof that Int64 survives the round-trip.
- Binary data is inserted as a `Uint8Array` and comes back as a BSON `Binary` object; its bytes live in `.buffer`. The example prints them as hex (`de ad be ef`).
- The `date` comes back as a real `Date` (`instanceof Date === true`), not a string — BSON doing its job.

---

## 9. Common Misconceptions

- **"MongoDB stores JSON."** Wrong. It stores **BSON** — binary JSON with extra types. JSON is the shape you see; BSON is the shape on disk.
- **"A replica set is for scaling."** Wrong — it is for **safety**. All members hold the same data, so capacity does not grow. Sharding is for scale.
- **"Sharding and replication are alternatives."** Wrong. They combine: each shard *is* a replica set. Replication copies data; sharding splits it.
- **"The primary does all the work."** Partly wrong. All *writes* go to the primary, but reads can be spread across secondaries (with the trade-off of possibly stale data).
- **"More secondaries means more write capacity."** Wrong. Writes still go through the one primary. Secondaries add read capacity and safety, not write throughput.
- **"I need to choose a shard key later."** Dangerous. Changing a shard key on a large collection is painful. If you ever shard, the shard key is a design decision made early — it should spread writes evenly and match your common queries.
- **"16 MB per document is plenty, I never need to think about it."** Usually true, never safe to assume. An unbounded embedded array (all comments ever, all log lines ever) will hit the limit — that is the signal to reference instead.

---

## 10. Important Terminology

| Term | Meaning |
|---|---|
| mongod | The MongoDB server process |
| mongosh | The command-line shell (a client, like your code) |
| Replica set | Copies of the same data on several servers; primary + secondaries |
| Sharding | Splitting a collection across servers by a shard key |
| mongos | Query router for a sharded cluster |
| Config servers | Hold sharding metadata (which chunk lives where) |
| WiredTiger | Default storage engine: disk files, cache, compression, indexes |
| Journal | Write-ahead log — crash safety for acknowledged writes |
| Oplog | Ordered log of writes on the primary; secondaries copy it |
| BSON | Binary JSON — the storage format |
| Namespace | `database.collection` |
| Shard key | Field(s) deciding which shard holds a document |
| Chunk | A range of shard-key values, moved as one unit |
| Primary / Secondary | The write-taking member / the copying members |
| 16 MB | Maximum size of one document |

---

## 11. Summary

- **`mongod`** is the server; **`mongosh`** is just a client, like your Node.js code.
- **WiredTiger** is the storage engine: data files, cache, compression, indexes, and the journal that makes acknowledged writes crash-safe.
- Data is stored as **BSON**, addressed by **namespace** (`database.collection`), one document max **16 MB**.
- A **replica set** copies the same data across servers for safety (primary + secondaries, oplog, elections). Three members is the minimum that survives one failure.
- **Sharding** splits data across servers for scale, by shard key, in chunks; `mongos` routes queries and config servers hold the metadata.
- The connection string describes the topology; the driver handles discovery, elections, and reconnection.
- The example proves the live server answers (`ping`, version, `wiredTiger`) and that BSON types round-trip intact.

---

## 12. Interview Questions and Answers

**1. What are `mongod` and `mongosh`?**
`mongod` is the database server process that stores data and answers queries. `mongosh` is the command-line shell — a client, like your application code, that talks to `mongod` over the same protocol.

**2. What is WiredTiger?**
MongoDB's default storage engine. It owns the data files on disk, the in-memory cache, compression, indexes, and the journal. It is the layer that turns "store this document" into bytes on disk.

**3. What is BSON, and how is it different from JSON?**
Binary JSON. It is the format MongoDB stores and sends, and it adds types JSON lacks: ObjectId, Date, Decimal128, binary data, Int32/Int64. A Date stored in MongoDB comes back as a Date, not a string.

**4. What is a replica set, and why three members?**
A group of servers holding copies of the same data: one primary takes writes, secondaries copy via the oplog. Three is the minimum that survives one failure, because electing a new primary needs a majority — with two members, one survivor is not a majority.

**5. What is the difference between a replica set and sharding?**
A replica set copies the *same* data for safety; sharding splits *different* data across servers for scale. They combine: each shard is itself a replica set.

**6. What is a shard key, and why does choosing it badly hurt?**
The field whose values decide which shard holds a document. A bad key (like an ever-increasing timestamp) sends all new writes to one shard — a hot shard — defeating the point of sharding.

**7. What is the oplog?**
A special capped collection on the primary recording every write in order. Secondaries tail it and apply the entries to stay in sync. It is the mechanism behind replication.

**8. What is a namespace?**
The full name of a collection: `database.collection`, for example `architecture.users`.

**9. What is the journal, and what does it protect against?**
A write-ahead log WiredTiger writes before the main data files. If the machine crashes after acknowledging a write, the journal replays it on restart — so acknowledged writes are not lost.

**10. What is the maximum document size, and what does it imply for design?**
16 MB. It means unbounded embedded arrays (a post's comments forever) are a design bug — that is when you reference instead of embed.

**11. How does your application find the primary in a replica set?**
It doesn't have to. The connection string lists the members; the driver discovers the topology, tracks which member is primary, and reconnects automatically after an election.

**12. What is `mongos`?**
The query router in a sharded cluster. Your application talks to `mongos`, which consults the config servers and forwards the query to the shard(s) that hold the data.

---

## 13. References

- MongoDB documentation — architecture — [https://www.mongodb.com/docs/manual/core/replica-set-architecture/](https://www.mongodb.com/docs/manual/core/replica-set-architecture/)
- MongoDB manual — replica sets — [https://www.mongodb.com/docs/manual/replication/](https://www.mongodb.com/docs/manual/replication/)
- MongoDB manual — sharding — [https://www.mongodb.com/docs/manual/sharding/](https://www.mongodb.com/docs/manual/sharding/)
- MongoDB manual — WiredTiger storage engine — [https://www.mongodb.com/docs/manual/core/wiredtiger/](https://www.mongodb.com/docs/manual/core/wiredtiger/)
- MongoDB manual — BSON types — [https://www.mongodb.com/docs/manual/reference/bson-types/](https://www.mongodb.com/docs/manual/reference/bson-types/)
- MongoDB manual — journaling — [https://www.mongodb.com/docs/manual/core/journal/](https://www.mongodb.com/docs/manual/core/journal/)
- MongoDB Node.js driver — [https://www.mongodb.com/docs/drivers/node/current/](https://www.mongodb.com/docs/drivers/node/current/)

---

[← Main README](../../README.md) · [Module README](../README.md) · Previous: [02 — SQL vs NoSQL](../02-sql-vs-nosql/README.md) · Next: 04 — Installation and Setup *(coming next — folder not created yet)*

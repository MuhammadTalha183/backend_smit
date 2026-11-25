# 02 — SQL vs NoSQL — Full Notes

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

Every backend developer gets asked the same question sooner or later: **"SQL or NoSQL?"** — usually asked as if one of them is the right answer and the other is a mistake. It is not that kind of question. SQL and NoSQL are two different answers to the same problem — "where do I keep my data?" — and each one is better for a different shape of data and a different pattern of access.

Topic 01 showed you MongoDB. This topic puts it next to the relational world (PostgreSQL, MySQL) and compares them honestly: the data model, the schema, the joins, the scaling, the consistency guarantees, and the cost of getting it wrong. By the end you should be able to look at a real feature — a user profile, a bank transfer, a product catalogue — and say which side fits, and why.

---

## 2. Definitions

- **SQL (relational) database** — A database that stores data in tables with rows and columns, a fixed schema, and relationships expressed through keys and joins. Examples: PostgreSQL, MySQL, SQLite.
- **NoSQL database** — "Not only SQL". Any database that does not use the relational table model. The four main families are document stores (MongoDB), key–value stores (Redis), wide-column stores (Cassandra), and graph databases (Neo4j).
- **Schema** — The structure of your data: which tables/collections exist, which fields they have, and what types those fields are. In SQL the schema is enforced by the database; in MongoDB it is flexible by default.
- **Table / Row / Column** — The SQL units. A table holds rows; each row has the same columns. Roughly: table ≈ collection, row ≈ document, column ≈ field.
- **Join** — Combining rows from two or more tables in one query, matched on a key (for example `users.id = posts.user_id`). The core operation of SQL, and the thing MongoDB mostly avoids.
- **Embedding** — Storing related data *inside* one document (for example, a user's posts as an array inside the user document) instead of in a separate table.
- **Referencing** — Storing only an ID that points at a document in another collection (for example, a post holding `userId`), like a foreign key in SQL.
- **ACID** — Atomicity, Consistency, Isolation, Durability. The guarantees of a traditional database transaction: it either fully happens or fully does not, and the data is never left half-changed.
- **BASE** — Basically Available, Soft state, Eventually consistent. The looser guarantees NoSQL systems traditionally offered in exchange for scale and availability.
- **Normalisation** — Splitting data into many tables to avoid duplication (1NF, 2NF, 3NF). The SQL way of keeping one fact in one place.
- **Denormalisation** — Deliberately duplicating data (for example, copying a user's name into each of their posts) so a read needs no join. Common in MongoDB design.
- **Horizontal scaling (scale out)** — Adding more machines to handle more data or traffic. **Vertical scaling (scale up)** is buying a bigger single machine.
- **Sharding** — Splitting one collection's data across many machines by a shard key. MongoDB's way of scaling out; topic 03 covers it.

---

## 3. Detailed Explanations

### 3.1 The data model is the whole difference

Everything else in this topic follows from one choice: **how is related data stored?**

**SQL — normalise, then join:**

```text
users table:                 posts table:
| id | name  | course |    | id | user_id | title          |
| 1  | Talha | CS     |    | 1  | 1       | Hello MongoDB  |
| 2  | Ayesha| CS     |    | 2  | 1       | SQL vs NoSQL   |

To show Talha with his posts:
  SELECT * FROM users JOIN posts ON users.id = posts.user_id WHERE users.id = 1;
```

Each fact lives in exactly one place. The user's name exists once. If it changes, one row changes. The price is paid at read time: every query that needs the full picture must join tables together.

**MongoDB — embed, then read once:**

```js
{
  _id: ObjectId("...001"),
  name: "Talha",
  course: "CS",
  posts: [
    { title: "Hello MongoDB" },
    { title: "SQL vs NoSQL" }
  ]
}
```

One document holds the whole picture. One read returns it. The price is paid at write time: if the user's name changes and you copied it into ten places, ten documents change — or you reference instead of embedding, which brings back a join-like step (`$lookup`, shown in the example).

Neither is "correct". The question is always: **which price do you want to pay, and how often?**

### 3.2 Schema: rigid vs flexible

| | SQL | MongoDB |
|---|---|---|
| Schema | Fixed, enforced by the database | Flexible by default, enforced by your code (or by validation rules you add) |
| Adding a field | `ALTER TABLE` migration, planned and applied | Just write the field in the next document |
| Wrong type in a field | Rejected by the database | Accepted silently, becomes a bug in your code |
| Best when | The shape of the data is known and stable | The shape evolves quickly or varies per record |

The SQL rigidity feels slow at the start of a project and saves you at the end of one. MongoDB's flexibility feels fast at the start and demands discipline at the end. Both are real costs — they just arrive at different times.

### 3.3 Joins vs embedding: the decision rule

Use this rule of thumb, and you will get most designs right:

- **Embed** when the related data is always used together, is small, and does not change independently. Comments inside a blog post. Items inside an order. Cards inside a flashcard set.
- **Reference** when the related data is large, is shared by many documents, or changes on its own. A user referenced by a thousand posts. A product referenced by a thousand orders.

And the honest middle: MongoDB *can* join, with `$lookup` (the example does exactly this). It is just slower and less natural than a SQL join, so if every query in your app is a join, you picked the wrong database.

### 3.4 Scaling: up vs out

- **SQL scales up first.** One big machine, tuned well, handles an enormous amount. Scaling out (splitting tables across machines) is possible but hard — joins across machines are expensive, so the database fights you.
- **MongoDB scales out by design.** Sharding splits a collection across machines by a key, and each machine holds a slice. Adding a machine adds capacity roughly linearly.

For a semester project this barely matters — one small server handles everything. For an interview answer it matters a lot: "MongoDB was built to scale horizontally; SQL was built to be correct on one machine, and scaling out is work."

### 3.5 ACID vs BASE — consistency, honestly

- **ACID (SQL default):** a transaction is atomic — ten writes either all happen or none do. After a write succeeds, every later read sees it. This is what money needs.
- **BASE (old NoSQL reputation):** the system stays available, and data becomes consistent *eventually* — a read right after a write might see the old value for a moment.

The honest modern picture: **MongoDB supports multi-document ACID transactions** (since version 4.0). The difference is not "MongoDB has no transactions" — it is that transactions in MongoDB are heavier and slower than in PostgreSQL, and the idiomatic MongoDB design avoids needing them by keeping related data in one document, where a single write is already atomic. A single document write in MongoDB is fully atomic, always.

### 3.6 The comparison table

| | SQL (PostgreSQL) | NoSQL — MongoDB |
|---|---|---|
| Data model | Tables, rows, columns | Documents (BSON), collections |
| Schema | Fixed, enforced | Flexible, enforced by code |
| Relationships | Joins on keys | Embedding (preferred) or references + `$lookup` |
| Query language | SQL (standard, one language everywhere) | Query API / MQL (MongoDB's own) |
| Transactions | ACID by default, cheap | ACID available, heavier; single-document atomicity is free |
| Scaling | Up first, out is hard | Out by design (sharding) |
| Best for | Banking, ledgers, heavy reporting, deeply relational data | Profiles, content, catalogues, fast-evolving data |
| Weakest at | Schema changes, nested/variable data | Multi-table joins, whole-dataset analytics |

---

## 4. How It Works Internally

### 4.1 What a SQL query does

```sql
SELECT users.name, posts.title
FROM users JOIN posts ON users.id = posts.user_id
WHERE users.id = 1;
```

The database reads the `users` row, then uses an index on `posts.user_id` to find matching rows, then merges them into one result set. The join is computed at read time, every time. Indexes make it fast; without them, the database scans whole tables.

### 4.2 What a MongoDB query does

```js
db.profiles.findOne({ _id: TALHA_ID });
```

The database looks up the document by its `_id` index, reads one contiguous chunk of data from disk (the whole document, posts included), and returns it. There is no merge step, because the data was stored merged. That is why this read is fast — and why the write that created the document did more work, assembling the nested structure up front.

### 4.3 Why `$lookup` is not a free join

`$lookup` runs a second lookup per input document inside the aggregation pipeline. It works, and the example proves it — but it cannot use the same optimisations a relational engine applies to joins, and it returns nested arrays you then have to shape with `$project`. Rule: if you find yourself writing `$lookup` in most queries, your data is modelled relationally and belongs in a relational database.

---

## 5. Architecture / Workflow

### 5.1 Choosing, step by step

```text
New feature — what does the data look like?
        │
        ├─ Fixed shape, known in advance, heavily joined,
        │  money or ledger involved?
        │      → SQL (PostgreSQL)
        │
        ├─ Nested / variable shape, read as one whole object,
        │  schema still evolving?
        │      → MongoDB (embed)
        │
        └─ Both?
               → Both. Real systems use two databases:
                 PostgreSQL for payments, MongoDB for content.
                 This is called polyglot persistence, and it is
                 normal, not a failure to decide.
```

### 5.2 The same feature, two models (from the example)

```text
Relational-style (two collections + $lookup):
  users:  { _id, name, course }
  posts:  { _id, userId, title }
  Read:   users.aggregate([ $match, $lookup, $project ])   ← 2 steps

Document-style (one collection, embedded):
  profiles: { _id, name, course, posts: [ { title } ] }
  Read:   profiles.findOne({ _id })                       ← 1 step
```

### 5.3 Where each database lives in your stack

```text
Express server (Module 02)
   ├─ pg driver ──────► PostgreSQL   (Phase 03, later topics — if used)
   └─ mongodb driver ─► MongoDB      (this module)
```

Your Express routes do not care which one is underneath. The route handler asks a data layer; the data layer asks the database. That separation is exactly what lets a real project use both.

---

## 6. Real-World Examples

- **Banking and payments** — SQL. A transfer is two writes that must both happen or neither: debit one account, credit another. ACID is not optional here.
- **Content and social apps** — MongoDB. A post with its comments, likes, and tags is one document; the feed reads whole documents, fast.
- **E-commerce** — often both. Orders and payments in SQL (money must be exact); the product catalogue in MongoDB (a laptop and a shirt have nothing in common structurally).
- **User profiles and settings** — MongoDB. Nested, variable, read whole on login.
- **Analytics and reporting** — SQL. "Total sales by region by month" is a `GROUP BY` — the query SQL was born to answer.
- **Your semester project** — Q-less: tokens belong to offices, positions change constantly, and a token is mostly read as one whole object → MongoDB fits. If Q-less ever took real payments, that part would belong in SQL.

---

## 7. Code Examples

The full runnable example is [`examples/sql-vs-nosql.mjs`](./examples/sql-vs-nosql.mjs). Expected output is in [`examples/example.txt`](./examples/example.txt).

```js
// Relational-style: two collections, joined with $lookup
await users.insertOne({ _id: TALHA_ID, name: 'Talha', course: 'CS' });
await posts.insertMany([
  { _id: POST_1, userId: TALHA_ID, title: 'Hello MongoDB' },
  { _id: POST_2, userId: TALHA_ID, title: 'SQL vs NoSQL' },
]);

const joined = await users.aggregate([
  { $match: { _id: TALHA_ID } },
  { $lookup: { from: 'posts', localField: '_id', foreignField: 'userId', as: 'posts' } },
  { $project: { _id: 0, name: 1, posts: { title: 1 } } },
]).toArray();

// Document-style: everything embedded, one read
await profiles.insertOne({
  _id: TALHA_ID, name: 'Talha', course: 'CS',
  posts: [{ title: 'Hello MongoDB' }, { title: 'SQL vs NoSQL' }],
});
await profiles.findOne({ _id: TALHA_ID }, { projection: { _id: 0 } });
```

---

## 8. Step-by-Step Code Explanations

### 8.1 The relational-style half

```js
await users.insertOne({ _id: TALHA_ID, name: 'Talha', course: 'CS' });
await posts.insertMany([
  { _id: POST_1, userId: TALHA_ID, title: 'Hello MongoDB' },
  { _id: POST_2, userId: TALHA_ID, title: 'SQL vs NoSQL' },
]);
```

Two collections, linked by `userId` — exactly like a foreign key. Note that MongoDB does not enforce the link: nothing stops you from inserting a post with a `userId` that matches no user. Referential integrity is your code's job here, where SQL would reject it.

### 8.2 The `$lookup` stage

```js
{ $lookup: { from: 'posts', localField: '_id', foreignField: 'userId', as: 'posts' } }
```

`$lookup` is MongoDB's join. For each user document coming in, it finds all `posts` whose `foreignField` (`userId`) equals the user's `localField` (`_id`) and attaches them as an array under `as` (`posts`). It runs inside `aggregate()`, MongoDB's pipeline engine (topic 11 covers aggregation properly).

### 8.3 The `$project` stage

```js
{ $project: { _id: 0, name: 1, posts: { title: 1 } } }
```

`$project` shapes the output: `1` means keep the field, `0` means drop it. Here it drops `_id` (so the output has no random-looking IDs) and keeps only each post's `title`. This is also why the output is deterministic.

### 8.4 The document-style half

```js
await profiles.insertOne({
  _id: TALHA_ID, name: 'Talha', course: 'CS',
  posts: [{ title: 'Hello MongoDB' }, { title: 'SQL vs NoSQL' }],
});
await profiles.findOne({ _id: TALHA_ID }, { projection: { _id: 0 } });
```

One insert, one read. No join, no pipeline. The `projection` option in `findOne` works like `$project`: `{ _id: 0 }` hides the `_id` field from the result.

### 8.5 The flexible-schema proof

```js
await users.insertOne({ _id: AYESHA_ID, name: 'Ayesha', course: 'CS', hostel: true });
```

Ayesha has a `hostel` field; Talha does not. Same collection, no error, no migration. In SQL this would be an `ALTER TABLE ... ADD COLUMN` first. The output shows both documents side by side — the point of the demo.

### 8.6 `console.dir` with `depth: null`

Plain `console.log` prints nested objects deeper than two levels as `[Object]`. The example uses `console.dir(result, { depth: null })` for the aggregation result so the joined posts are actually visible. Remember this whenever your output shows `[Object]` — the data is there, the printer is just hiding it.

---

## 9. Common Misconceptions

- **"NoSQL is better than SQL" (or the reverse).** Wrong. They optimise for different shapes. Anyone selling one as universally better is selling something.
- **"MongoDB has no joins."** Wrong. `$lookup` joins collections. It is just slower and less central than a SQL join — which is a design signal, not a missing feature.
- **"MongoDB has no transactions."** Wrong. Multi-document ACID transactions exist since MongoDB 4.0. They cost more than in PostgreSQL, and good document design usually avoids needing them.
- **"Flexible schema means I never think about schema."** Wrong. It means the database won't think about it for you. Embedding vs referencing, field types, and index choices are still design decisions — topics 08 and 09 exist for exactly this.
- **"SQL can't scale."** Wrong. SQL scales up very far, and read replicas, partitioning, and careful design take it further than most apps ever need. It scales *out* less naturally than MongoDB — that is the precise claim.
- **"If I pick wrong, the project is dead."** Wrong. Data access lives behind your route handlers. Migrating is work, but the Express layer does not care which database is underneath — that is the whole point of separating them.

---

## 10. Important Terminology

| Term | Meaning |
|---|---|
| SQL / relational | Tables, fixed schema, joins — PostgreSQL, MySQL |
| NoSQL | Not only SQL — document, key–value, wide-column, graph |
| Embedding | Related data stored inside one document |
| Referencing | Related data stored in another collection, linked by ID |
| `$lookup` | MongoDB's join, inside an aggregation pipeline |
| Normalisation | Splitting data into tables to avoid duplication |
| Denormalisation | Duplicating data on purpose to avoid joins |
| ACID | Atomicity, Consistency, Isolation, Durability |
| BASE | Basically Available, Soft state, Eventually consistent |
| Polyglot persistence | Using more than one database, each for what it fits |
| Scale out / up | More machines vs a bigger machine |
| Sharding | Splitting a collection across machines |

---

## 11. Summary

- SQL and NoSQL differ first in the **data model**: tables + joins vs documents + embedding.
- SQL enforces a fixed schema and gives cheap ACID transactions; MongoDB is flexible and scales out by design.
- **Embed** when data is always used together; **reference** when it is large, shared, or changes independently.
- MongoDB *can* join (`$lookup`) and *can* do transactions — the question is cost, not possibility.
- Choose by the data and the access pattern, not by fashion. Real systems often use both (polyglot persistence).
- The example proves it with one dataset in two shapes: two collections + `$lookup` vs one embedded document + one read.

---

## 12. Interview Questions and Answers

**1. What is the difference between SQL and NoSQL?**
SQL databases store data in fixed-schema tables joined by keys; NoSQL databases use other models — MongoDB stores flexible, nested documents in collections.

**2. What does NoSQL actually stand for?**
"Not only SQL". It is a family of non-relational models, not a rejection of SQL.

**3. When should you embed data, and when should you reference it?**
Embed when the data is always used together, is small, and doesn't change on its own (comments in a post). Reference when it is large, shared across many documents, or changes independently (a user referenced by many posts).

**4. Does MongoDB support joins?**
Yes — `$lookup` in an aggregation pipeline joins collections. It works, but it is slower and less natural than a SQL join, so needing it everywhere is a sign the data belongs in SQL.

**5. What is the difference between ACID and BASE?**
ACID (atomicity, consistency, isolation, durability) guarantees a transaction fully happens or not at all, and later reads see it. BASE (basically available, soft state, eventually consistent) trades immediate consistency for availability and scale. Modern MongoDB supports ACID multi-document transactions — the difference is cost, not capability.

**6. Which scales better, SQL or MongoDB?**
MongoDB scales out (sharding) more naturally; SQL scales up first and scaling out is harder because joins across machines are expensive.

**7. What is normalisation, and why does MongoDB often skip it?**
Normalisation splits data into tables to store each fact once. MongoDB often denormalises (duplicates data inside documents) on purpose, so a read needs no join — paying at write time instead of read time.

**8. What is polyglot persistence?**
Using more than one database in one system, each for what it fits — for example, PostgreSQL for payments and MongoDB for a content catalogue.

**9. A banking app and a blog — which database for each, and why?**
Banking: SQL — transfers need cheap, guaranteed ACID transactions. Blog: MongoDB — a post with comments is one document, read in one operation, and the schema evolves.

**10. What is the cost of MongoDB's flexible schema?**
Nothing stops inconsistent data: one document can store `semester: "five"` while another stores `semester: 5`. Consistency becomes the application's job, usually handled with Mongoose schemas or validation rules.

**11. What does `$lookup` do?**
It joins documents from another collection inside an aggregation pipeline: for each input document it finds matching documents by a local/foreign field pair and attaches them as an array.

**12. If MongoDB is so flexible, why would anyone still use SQL?**
For data that is deeply relational, for heavy reporting (`GROUP BY` across the dataset), and for transactions that must be cheap and guaranteed — money, ledgers, inventory. Flexibility is not free; it trades away the guarantees SQL gives you by default.

---

## 13. References

- MongoDB documentation — data modelling — [https://www.mongodb.com/docs/manual/core/data-modeling-introduction/](https://www.mongodb.com/docs/manual/core/data-modeling-introduction/)
- MongoDB documentation — $lookup — [https://www.mongodb.com/docs/manual/reference/operator/aggregation/lookup/](https://www.mongodb.com/docs/manual/reference/operator/aggregation/lookup/)
- MongoDB documentation — transactions — [https://www.mongodb.com/docs/manual/core/transactions/](https://www.mongodb.com/docs/manual/core/transactions/)
- MongoDB — SQL to MongoDB mapping chart — [https://www.mongodb.com/docs/manual/reference/sql-comparison/](https://www.mongodb.com/docs/manual/reference/sql-comparison/)
- PostgreSQL documentation — [https://www.postgresql.org/docs/](https://www.postgresql.org/docs/)
- Martin Kleppmann, *Designing Data-Intensive Applications* — the standard book on this whole comparison (chapters 1–2)

---

[← Main README](../../README.md) · [Module README](../README.md) · Previous: [01 — Introduction to MongoDB](../01-introduction/README.md) · Next: [03 — MongoDB Architecture](../03-mongodb-architecture/README.md)

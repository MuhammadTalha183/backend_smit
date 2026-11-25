# 01 — Introduction to MongoDB — Full Notes

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

So far in this journey you have learned Node.js (Module 01) and Express.js (Module 02). You can build a server, route requests, validate input and return JSON. But there is one thing missing: **where does the data live?**

Every example so far kept its data in a JavaScript array in memory. Restart the server and the data is gone. Two servers cannot share it. A thousand users cannot search it efficiently. That is the problem a database solves — and MongoDB is the database this phase teaches.

MongoDB is the most widely used **document database** in the Node.js world. It stores data as JSON-like documents, which means the shape of your data in the database looks almost exactly like the shape of your objects in JavaScript. That is the whole reason it pairs so well with Node.js: there is almost no translation between your code and your storage.

This topic answers four questions: what MongoDB is, why it exists, where it fits in the stack, and when you should — and should not — use it.

---

## 2. Definitions

- **MongoDB** — An open-source, document-oriented NoSQL database. Data is stored in flexible, JSON-like documents grouped into collections, instead of rows in tables.
- **Document** — One record in MongoDB. A document is a set of field–value pairs, written in BSON (Binary JSON). Example: `{ name: "Talha", course: "CS", semester: 5 }`. A document is roughly the MongoDB equivalent of one row in a SQL table — except it can contain nested objects and arrays.
- **Collection** — A group of documents, roughly the MongoDB equivalent of a table. Example: a `students` collection holds student documents. Collections do not enforce a fixed schema by default.
- **Database** — A container for collections. One MongoDB server can hold many databases (for example `learn`, `shop`, `blog`).
- **BSON** — Binary JSON. The format MongoDB actually stores on disk. It is JSON plus extra types JSON does not have: dates, binary data, decimal numbers, and ObjectIds.
- **NoSQL** — "Not only SQL". A family of databases that do not use the relational table model. MongoDB is one kind (document store); others are key–value stores, wide-column stores, and graph databases.
- **`mongod`** — The MongoDB server process. It is the program that stores your data and answers queries.
- **`mongosh`** — The MongoDB Shell. A command-line tool for talking to `mongod`: create databases, run queries, inspect data.
- **Driver** — A library that lets your code talk to MongoDB. In Node.js the official one is the `mongodb` package. Mongoose (topic 13) is built on top of it.
- **ObjectId** — MongoDB's default unique identifier for a document's `_id` field: a 12-byte value that is unique across machines and time, so two servers can create IDs without coordinating.

---

## 3. Detailed Explanations

### 3.1 Why MongoDB exists

Relational databases (PostgreSQL, MySQL) were designed in an era when data was neat, tabular, and known in advance: customers, orders, products. Modern applications are messier. A user profile has a variable list of skills. A blog post has comments nested inside it. A product has specifications that differ wildly between a laptop and a shirt.

Forcing that kind of data into rigid tables means either many tables joined together, or columns that are empty for most rows. MongoDB was built for this reality: store the data the way your application actually uses it — as a document.

### 3.2 Documents, not rows

Compare the same student in both worlds:

```text
SQL table "students":
| id | name  | course | semester |
| 1  | Talha | CS     | 5        |

MongoDB document in the "students" collection:
{ _id: ObjectId("...001"), name: "Talha", course: "CS", semester: 5 }
```

The difference looks small here. It becomes large when the data is nested:

```js
// One MongoDB document can hold everything about a student:
{
  _id: ObjectId("...001"),
  name: "Talha",
  course: "CS",
  semester: 5,
  skills: ["JavaScript", "Node.js", "Express"],
  address: { city: "Karachi", area: "Gulshan" },
  courses: [
    { code: "CS301", title: "Operating Systems", marks: 85 },
    { code: "CS302", title: "Databases", marks: 92 }
  ]
}
```

In SQL, that one student would be spread across four or five tables (`students`, `skills`, `addresses`, `enrolments`, `courses`) and reassembled with joins every time you read it. In MongoDB it is one document, read in one operation. That is the core trade-off of the whole phase, and topic 02 compares it honestly.

### 3.3 Flexible schema

A MongoDB collection does **not** require every document to have the same fields. These two documents can live in the same `students` collection:

```js
{ _id: ..., name: "Talha", course: "CS", semester: 5 }
{ _id: ..., name: "Ayesha", course: "CS", semester: 5, hostel: true, room: "B-12" }
```

This is powerful early in a project — you add a field by just writing it, no migration to alter a table. It is also dangerous later: nothing stops one document from storing `semester: "five"` (a string) while another stores `semester: 5` (a number). The flexibility moves the responsibility for consistency from the database to your code. That is exactly why Mongoose and schema validation exist (topics 12–13), and why "schemaless" does not mean "no design".

### 3.4 The `_id` field

Every MongoDB document has an `_id` field, and it is unique within its collection — it is the primary key. If you do not provide one, MongoDB generates an ObjectId for you.

An ObjectId is 12 bytes:

```text
| 4 bytes timestamp | 5 bytes random value | 3 bytes counter |
```

Because the timestamp and a random value are inside it, two different machines can generate IDs at the same time without ever colliding, and sorting by `_id` roughly sorts by creation time. You will see ObjectIds everywhere in this phase — in URLs (`/students/000000000000000000000001`), in references between documents, and in query filters.

### 3.5 Where MongoDB fits in the stack

```text
Client (browser / mobile app)
        │  HTTP request
        ▼
Express.js server (Module 02)
        │  driver call, e.g. db.collection('students').find()
        ▼
MongoDB server (mongod)
        │  reads / writes BSON documents on disk
        ▼
Disk (WiredTiger storage engine)
```

Your Express routes stay the same shape you learned in Module 02. The only change is where the data comes from: instead of an array in memory, a route handler asks MongoDB. That is why this phase comes after Express — the server part is already familiar, so you can focus on the database part.

### 3.6 What MongoDB is good at — and what it is not

**Good at:**

- Data that is naturally nested or varies in shape (profiles, posts with comments, product catalogues).
- Fast development — add a field without a migration.
- Read-heavy workloads where one document holds everything a screen needs.
- Horizontal scaling — splitting data across many machines (sharding, topic 03).

**Not the best choice for:**

- Data that is deeply relational with many joins (for example, a banking ledger where every query joins five tables).
- Transactions across many documents (MongoDB supports multi-document transactions, but they are heavier than in PostgreSQL — topic 02 explains the ACID vs BASE trade-off).
- Heavy reporting and analytics over the whole dataset (aggregation exists, but a relational database or a warehouse is often simpler).

The professional answer is never "MongoDB is better" or "SQL is better". It is "better for this data, for this access pattern". Topic 02 teaches you how to make that call.

---

## 4. How It Works Internally

### 4.1 From JavaScript object to disk

When you insert a document, this is the journey it takes:

1. **Your code** builds a plain JavaScript object.
2. **The driver** (`mongodb` package) converts it to **BSON** — binary JSON. JavaScript has no `Date` type in JSON, no `ObjectId`, no `Decimal128`; BSON adds them.
3. **The driver** sends the BSON over a TCP connection to `mongod`, using the MongoDB wire protocol.
4. **`mongod`** hands it to the **WiredTiger storage engine**, which writes it to disk files in the data directory (by default `/data/db` on Linux, or wherever you configure it).
5. **WiredTiger** first writes the change to a **journal** (a write-ahead log) so that a crash cannot lose data that was already acknowledged, then to the main data files.

Reading is the reverse: WiredTiger finds the document (using an index if one exists — topic 10), returns BSON, the driver converts it back into a JavaScript object.

### 4.2 Why BSON, not plain JSON?

JSON cannot represent everything a database needs. BSON adds:

| BSON type | Why it exists |
|---|---|
| `ObjectId` | Unique ID, generated without coordination |
| `Date` | A real date with millisecond precision, not a string |
| `Decimal128` | Exact decimal arithmetic — money must never be a float |
| `BinData` | Binary data (images, files) |
| `Int32` / `Int64` / `Double` | Numbers with a known size and precision |

The practical consequence: a `Date` stored in MongoDB comes back as a `Date` object in Node.js, and `Decimal128("19.99")` stays exactly `19.99` — while a JavaScript float `0.1 + 0.2` is famously `0.30000000000000004`.

### 4.3 The in-memory example server

The examples in this module use `mongodb-memory-server`: it downloads (once) a real `mongod` binary and starts a real MongoDB server in memory for the duration of the script, then stops it. The database behaves exactly like a production MongoDB for learning purposes — the only difference is that the data disappears when the server stops. That is a feature for learning: every run starts clean.

---

## 5. Architecture / Workflow

### 5.1 The pieces and how they connect

```text
┌─────────────────────────────────────────────────────────┐
│  Your Node.js application                               │
│  ┌───────────────────────────────────────────────────┐  │
│  │  mongodb driver  (or Mongoose, topic 13)          │  │
│  │  MongoClient → Db → Collection → Cursor           │  │
│  └───────────────────────┬───────────────────────────┘  │
└──────────────────────────┼──────────────────────────────┘
                           │  MongoDB wire protocol (TCP, port 27017)
                           ▼
┌─────────────────────────────────────────────────────────┐
│  mongod — the MongoDB server                            │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Query engine│  │ WiredTiger   │  │ Journal (WAL)  │  │
│  │ (find,      │  │ storage      │  │ crash safety   │  │
│  │  aggregate) │  │ engine       │  │                │  │
│  └─────────────┘  └──────┬───────┘  └────────────────┘  │
│                         │  data files on disk            │
└─────────────────────────────────────────────────────────┘
```

### 5.2 The driver API chain

Every operation follows the same chain:

```js
const client = new MongoClient(uri);   // 1. connect to the server
const db = client.db('learn');         // 2. pick a database
const students = db.collection('students'); // 3. pick a collection
await students.find({}).toArray();     // 4. run an operation
```

- **`MongoClient`** — one connection pool to one server (or cluster). Create it once, reuse it for the whole application.
- **`Db`** — a handle to one database. Databases are created lazily: using a name that does not exist yet creates it on first write.
- **`Collection`** — a handle to one collection. Also created lazily on first insert.
- **Cursor** — `find()` returns a cursor, not an array. You pull documents from it with `.toArray()`, `.next()`, or `for await`. This matters for large results: a cursor streams, an array loads everything into memory at once.

### 5.3 The typical request flow in your Express app

```text
GET /students
  → Express route handler
    → students.find({}).toArray()        (driver → mongod → disk)
      → documents back as JS objects
    → res.json(documents)
  → client receives JSON
```

---

## 6. Real-World Examples

- **Content platforms** — a blog post document holds its title, body, tags, and comments together. One read returns the whole page. (Medium-style apps, D CODES-style content apps.)
- **E-commerce catalogues** — a product document holds its variants, specifications, and reviews. A laptop and a shirt have completely different specs, and the flexible schema handles both in one collection.
- **User profiles** — name, settings, preferences, social links, skills — all nested in one document, fetched in one query when the user logs in.
- **Real-time apps and games** — leaderboards, chat messages, and game state change shape often; MongoDB's flexible documents and fast writes fit.
- **Your semester project** — the Q-less queue (offices, tokens, positions) and the Study Buddy (notes, flashcards, quizzes) both map naturally to documents: a token document holds everything about one token; a flashcard set is one document with an array of cards.
- **Famous users** — MongoDB is used at companies like Adobe, eBay, and Forbes, and in tools like the MEAN/MERN stack (MongoDB, Express, Angular/React, Node.js) — the stack you are learning.

---

## 7. Code Examples

The full runnable example is [`examples/intro-demo.mjs`](./examples/intro-demo.mjs). Expected output is in [`examples/example.txt`](./examples/example.txt).

```js
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, ObjectId } from 'mongodb';

const TALHA_ID = new ObjectId('000000000000000000000001');

const mongod = await MongoMemoryServer.create();
const client = new MongoClient(mongod.getUri());

await client.connect();
const db = client.db('learn');
const students = db.collection('students');

await students.insertMany([
  { _id: TALHA_ID, name: 'Talha', course: 'CS', semester: 5 },
  { _id: new ObjectId('000000000000000000000002'), name: 'Ayesha', course: 'CS', semester: 5 },
]);

console.log(await students.find().toArray());
console.log(await students.findOne({ name: 'Talha' }));
console.log('Count:', await students.countDocuments());

await client.close();
await mongod.stop();
```

---

## 8. Step-by-Step Code Explanations

### 8.1 The imports

```js
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, ObjectId } from 'mongodb';
```

Two packages: `mongodb-memory-server` starts a throwaway MongoDB for the demo; `mongodb` is the official driver. `MongoClient` is the entry point to the database; `ObjectId` builds fixed IDs so the output is identical on every run.

### 8.2 Fixed ObjectIds

```js
const TALHA_ID = new ObjectId('000000000000000000000001');
```

A real application lets MongoDB generate IDs. Here the IDs are fixed (24 hex characters) so `example.txt` matches every run. Without this, each run would print different IDs and the output could never be compared.

### 8.3 Starting the server and connecting

```js
const mongod = await MongoMemoryServer.create();
const client = new MongoClient(mongod.getUri());
await client.connect();
```

`MongoMemoryServer.create()` starts a real `mongod` on a random free port and returns its connection string with `getUri()`. `new MongoClient(uri)` only creates the client — nothing connects until `await client.connect()`.

### 8.4 Database and collection handles

```js
const db = client.db('learn');
const students = db.collection('students');
```

Neither line touches the server. They just create local handles. The database `learn` and the collection `students` do not exist yet — they are created automatically by the first write. This is called **lazy creation**, and it surprises beginners: `db.collection('typo')` never errors, it just gives you an empty collection with a wrong name.

### 8.5 Inserting and reading

```js
await students.insertMany([ ... ]);
await students.find().toArray();
await students.findOne({ name: 'Talha' });
await students.countDocuments();
```

- `insertMany` inserts several documents in one call.
- `find()` with no filter returns a cursor over every document; `.toArray()` pulls them all into an array.
- `findOne({ name: 'Talha' })` returns the first matching document, or `null`.
- `countDocuments()` counts without loading the documents.

### 8.6 Cleaning up

```js
await client.close();
await mongod.stop();
```

Close the client first (ends the connection pool), then stop the memory server. Forgetting either leaves the Node.js process hanging — the script never exits, because an open socket keeps the event loop alive. This is the most common reason a MongoDB script "does nothing" after printing its output.

---

## 9. Common Misconceptions

- **"MongoDB has no schema, so I don't need to design my data."** Wrong. MongoDB has no *enforced* schema by default. You still need to design documents, decide what to embed and what to reference, and keep field types consistent. "Schemaless" means the database won't stop you from making a mess — not that a mess is fine.
- **"MongoDB is always faster than SQL."** Wrong. It is faster for the access patterns it is designed for (fetching one document with everything inside). A query that joins five tables is faster in PostgreSQL, because that is what relational databases are built for.
- **"NoSQL means no SQL at all, and no ACID."** Wrong on both counts. NoSQL means "not only SQL", and MongoDB supports multi-document ACID transactions. The difference is in the defaults and the cost, not in the possibility.
- **"`find()` returns an array."** Wrong. It returns a cursor. Forgetting `.toArray()` (or `await` iteration) is a classic beginner bug — you print a cursor object instead of your data.
- **"MongoDB is only for small projects."** Wrong. It runs at very large scale (sharding, replica sets — topic 03). The choice is about data shape, not project size.
- **"The `_id` must be an ObjectId."** Wrong. `_id` can be a string, a number, or anything unique. ObjectId is only the default when you don't provide one.

---

## 10. Important Terminology

| Term | Meaning |
|---|---|
| MongoDB | Document-oriented NoSQL database |
| Document | One JSON-like record (BSON) in a collection |
| Collection | A group of documents (like a table) |
| Database | A container for collections |
| BSON | Binary JSON — the on-disk format, with extra types |
| mongod | The MongoDB server process |
| mongosh | The MongoDB Shell (command-line client) |
| Driver | A library (here, the `mongodb` npm package) that connects code to MongoDB |
| ObjectId | The default 12-byte unique `_id` |
| Cursor | A pointer to query results, streamed instead of loaded at once |
| Namespace | `database.collection` — the full name of a collection |
| WiredTiger | MongoDB's default storage engine |
| Replica set | Copies of the same data on several servers, for safety |
| Sharding | Splitting data across servers, for scale |

---

## 11. Summary

- MongoDB is a **document database**: data lives in JSON-like documents, grouped into collections, inside databases.
- Documents map directly to JavaScript objects, which is why MongoDB pairs so well with Node.js.
- The schema is **flexible** — documents in one collection can have different fields — but that moves consistency work to your code.
- Every document has a unique **`_id`**; by default it is an **ObjectId**.
- The stack is: your code → **driver** (`mongodb` package) → **`mongod`** server → **WiredTiger** storage engine → disk. Data is stored as **BSON**.
- `find()` returns a **cursor**, not an array.
- Use MongoDB when your data is nested, varies in shape, or is read as one whole document. Use SQL when your data is deeply relational. Topic 02 teaches you to choose.

---

## 12. Interview Questions and Answers

**1. What is MongoDB?**
A document-oriented NoSQL database. It stores data as flexible, JSON-like documents (BSON) in collections, instead of rows in tables.

**2. What is a document, a collection, and a database?**
A document is one record (a set of field–value pairs). A collection is a group of documents, like a table. A database is a container for collections.

**3. What is BSON, and why not plain JSON?**
Binary JSON. It adds types JSON lacks — ObjectId, Date, Decimal128, binary data — so values keep their real types instead of becoming strings.

**4. What is an ObjectId?**
The default unique `_id`: 12 bytes (timestamp + random value + counter). Unique across machines without coordination, and roughly sortable by creation time.

**5. How is MongoDB different from a relational database?**
Relational databases store data in fixed-schema tables joined by keys. MongoDB stores flexible, nested documents; related data is usually embedded in one document instead of joined across tables.

**6. What does "schemaless" really mean?**
That MongoDB does not enforce a schema by default. It does not mean you skip data design — inconsistent field types across documents become bugs your code has to handle.

**7. What are `mongod` and `mongosh`?**
`mongod` is the database server process that stores data and answers queries. `mongosh` is the command-line shell for talking to it.

**8. What is a cursor, and why does `find()` return one?**
A cursor is a pointer to results that streams documents as you pull them, instead of loading everything into memory at once. Call `.toArray()` (or iterate) to get the documents.

**9. When would you choose MongoDB over PostgreSQL?**
When the data is nested or varies in shape, when one read should return a whole object (a post with its comments), and when the schema evolves quickly. For deeply relational data and heavy cross-table reporting, PostgreSQL is usually the better pick.

**10. Does MongoDB support transactions?**
Yes — multi-document ACID transactions exist. They are heavier than single-document atomicity (which is the default and the common case), so the usual design is to keep related data in one document and avoid transactions.

**11. How do you connect a Node.js app to MongoDB?**
With the official `mongodb` driver: create a `MongoClient` with a connection string, `await client.connect()`, then `client.db(name).collection(name)` to work with data. Create the client once and reuse it.

**12. What happens if you insert into a collection that does not exist?**
MongoDB creates the collection (and the database) automatically on first write. This is lazy creation — it also means a typo in a collection name silently creates a new, empty collection instead of an error.

---

## 13. References

- MongoDB documentation — [https://www.mongodb.com/docs/](https://www.mongodb.com/docs/)
- MongoDB manual — introduction — [https://www.mongodb.com/docs/manual/introduction/](https://www.mongodb.com/docs/manual/introduction/)
- MongoDB manual — documents — [https://www.mongodb.com/docs/manual/core/document/](https://www.mongodb.com/docs/manual/core/document/)
- MongoDB manual — BSON types — [https://www.mongodb.com/docs/manual/reference/bson-types/](https://www.mongodb.com/docs/manual/reference/bson-types/)
- MongoDB Node.js driver — [https://www.mongodb.com/docs/drivers/node/current/](https://www.mongodb.com/docs/drivers/node/current/)
- mongodb-memory-server — [https://github.com/nodkz/mongodb-memory-server](https://github.com/nodkz/mongodb-memory-server)

---

[← Main README](../../README.md) · [Module README](../README.md) · Next: [02 — SQL vs NoSQL](../02-sql-vs-nosql/README.md)

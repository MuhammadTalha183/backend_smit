# 05 — Databases, Collections and Documents

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

---

## 1. Introduction

MongoDB has three levels, and everything else in this module hangs off them: a **database** holds **collections**, a **collection** holds **documents**, and a **document** is a JSON-like object. If you can picture those three levels, you can picture any MongoDB database.

Think of a filing cabinet. The cabinet is the database. Each drawer is a collection — one drawer for students, one for courses, one for teachers. Each file inside a drawer is a document — one file per student, with their name, age, courses, and address written on it. In SQL you would cut every file into identical rows and spread the pieces across several tables; in MongoDB the whole file stays together in one document, and different files in the same drawer can have different fields.

By the end of this topic you will be able to: explain the three levels and how they map to SQL terms; describe every BSON type and when to use it; explain `_id` and `ObjectId` — what it is made of and why it is the default; create and drop databases and collections; state the naming rules; and explain capped collections and when they are useful.

---

## 2. Definition of Important Concepts

| Concept | Definition |
|---|---|
| **Database** | A container for collections. One MongoDB server holds many databases; one app usually uses one database. |
| **Collection** | A container for documents — roughly a table in SQL, but with no fixed schema. All documents about one kind of thing go in one collection (e.g. `students`). |
| **Document** | One JSON-like record inside a collection, e.g. `{ name: 'Talha', age: 21 }`. A document is the unit MongoDB stores, reads, and updates. |
| **BSON** | Binary JSON — the binary format MongoDB uses to store documents on disk and send them over the network. It is JSON plus extra types (Date, ObjectId, binary data) that plain JSON does not have. |
| **Field** | A key inside a document (`name`, `age`). The same as a column in SQL, except each document can have different fields. |
| **`_id`** | The primary key of a document. Every document has one, it is unique inside its collection, and it cannot be changed after insert. |
| **`ObjectId`** | The default type of `_id`: a 12-byte value (24 hex characters) that is unique across machines without asking the server. |
| **Schema (flexible)** | MongoDB does not enforce a fixed shape per collection. Two documents in `students` can have different fields — but your application should still treat the shape as a contract. |
| **Capped collection** | A fixed-size collection that keeps documents in insertion order and overwrites the oldest when full. Used for logs. |
| **Namespace** | The full address of a collection: `database.collection`, e.g. `school.students`. |

---

## 3. Detailed Explanations

### 3.1 The three levels, and the SQL mapping

| MongoDB | SQL equivalent | Example |
|---|---|---|
| Database | Database | `school` |
| Collection | Table | `students` |
| Document | Row | `{ name: 'Talha', age: 21 }` |
| Field | Column | `name` |
| `_id` | Primary key | `ObjectId('...')` |
| Embedded document | Join (avoided) | `address: { city: 'Karachi' }` |

The mapping helps you translate, but do not take it literally. A SQL row must fit the table's fixed columns; a MongoDB document can have fields its neighbours do not. And where SQL splits related data across tables and joins it back, MongoDB usually embeds the related data inside one document — the address lives *inside* the student document, not in a separate `addresses` table.

### 3.2 Documents and BSON

A document looks like JSON, but MongoDB stores it as **BSON** (Binary JSON). BSON keeps JSON's readable structure and adds types JSON cannot express. These are the types you will actually use:

| BSON type | Example | Use for |
|---|---|---|
| String | `"Talha"` | names, titles, codes |
| Int32 / Int64 / Double | `21`, `9007199254740993`, `19.99` | counts, ages, prices |
| Boolean | `true` | flags like `enrolled` |
| Date | `ISODate("2026-01-15")` | timestamps — always store dates as Date, never as strings |
| Array | `["CS-301", "CS-302"]` | lists: courses, tags, phone numbers |
| Embedded document | `{ city: "Karachi", area: "Gulshan" }` | one-to-one data that belongs with the parent |
| ObjectId | `ObjectId("...")` | `_id` values and references |
| Null | `null` | "no value yet" — different from a missing field |
| Decimal128 | `NumberDecimal("19.99")` | money, where floating-point rounding is unacceptable |

Two rules matter in practice. First, **dates are Date, not strings**: `"2026-01-15"` as a string cannot be compared, sorted, or used in date arithmetic; a real Date can. Second, **money is Decimal128, not Double**: `0.1 + 0.2` is `0.30000000000000004` in floating point, and that error in a price column is a real bug.

A document cannot be larger than **16 MB**. That sounds big, and it is — but it is the reason you never embed an unbounded list (like all of a user's posts forever) inside one document. Lists that grow without limit belong in their own collection.

### 3.3 `_id` and ObjectId

Every document has an `_id` field. It is the primary key: unique inside the collection, indexed automatically, and immutable — you cannot change a document's `_id` after inserting it.

If you do not provide `_id`, the driver generates an `ObjectId` for you. An ObjectId is 12 bytes, written as 24 hex characters:

```text
507f1f77bcf86cd799439011
└──┬──┘└──┬──┘└──┬──┘└──┬──┘
 4 bytes  3 bytes 2 bytes 3 bytes
 timestamp machine  process  counter
  (seconds)  id      id
```

- **4-byte timestamp** — seconds since 1970. Because of this, ObjectIds sort roughly in creation order, and you can read a document's creation time from its `_id` without a separate field.
- **3-byte machine id + 2-byte process id** — different machines and processes generate different values, so two servers never collide.
- **3-byte counter** — increments per ObjectId generated in the same process, so even two documents created in the same second are different.

That design is the point: ObjectIds are unique **without asking the server**. Your application can generate an `_id` before inserting, which is how you link documents together before any of them exist in the database. You can also use your own `_id` — a string like a student roll number, or a number — but then uniqueness is your problem, and sorting by `_id` no longer means sorting by creation time.

### 3.4 Creating and dropping databases and collections

MongoDB is lazy: databases and collections are created on first use, not by declaration.

```javascript
// Nothing exists on disk yet — these are just handles.
const db = client.db('school');
const students = db.collection('students');

// The first write creates the database AND the collection.
await students.insertOne({ name: 'Talha', age: 21 });
```

To create a collection explicitly (for example, to set options like a maximum size), use `createCollection`:

```javascript
await db.createCollection('logs', { capped: true, size: 1048576, max: 1000 });
```

Dropping is the reverse, and it is permanent — there is no undo:

```javascript
await db.collection('temp-notes').drop();   // drops one collection
await db.dropDatabase();                    // drops the whole database
```

Useful shell commands for the same work: `show dbs` (list databases), `use schooldb` (switch database), `show collections`, `db.createCollection('name')`, `db.students.drop()`, `db.dropDatabase()`.

### 3.5 Naming rules

- **Database names** are case-sensitive, cannot contain `/`, `\`, `.`, `"`, or space, and cannot be empty. They are usually lowercase: `schooldb`, `shop`, `blog`. Avoid the reserved names `admin`, `local`, and `config` — those are MongoDB's own system databases.
- **Collection names** are case-sensitive, cannot contain `$`, cannot be empty, and cannot start with `system.` (reserved). Use lowercase plural nouns: `students`, `courses`, `orders`. Do not use a dot to fake hierarchy — `school.students` is a namespace, not a collection name.
- **Field names** cannot contain `.` or start with `$` (both have special meaning in queries and updates), and `_id` is reserved.

### 3.6 Capped collections

A capped collection has a fixed size, set at creation, and keeps documents in insertion order:

```javascript
await db.createCollection('logs', { capped: true, size: 1048576, max: 1000 });
```

When it fills up, the oldest documents are overwritten automatically. You cannot delete a single document from a capped collection, and you cannot update a document in a way that makes it bigger. That sounds limiting, and it is — capped collections exist for exactly one job: **logs and streams** where you only ever care about the recent past. Application logs, sensor readings, activity feeds. For everything else, use a normal collection.

### 3.7 Enforcing shape with JSON Schema validation

Flexible schema does not have to mean *no* schema. MongoDB lets you attach a JSON Schema validator to a collection, and the server then rejects any document that breaks the rules:

```javascript
await db.createCollection('students', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'age'],
      properties: {
        name: { bsonType: 'string', description: 'must be a string and is required' },
        age: { bsonType: 'int', minimum: 0, maximum: 120, description: 'must be an integer between 0 and 120' },
        enrolled: { bsonType: 'bool' },
      },
    },
  },
  validationAction: 'error', // or 'warn': log the violation but accept the document
});
```

This is the middle ground between SQL's rigid tables and MongoDB's total freedom: the shape is enforced, but you can evolve it by updating the validator — no migration that rewrites every row. The rule for this course is: **validate in the application first** (your API checks the input before it reaches the database), and use a collection validator as a second line of defence for the fields that must never be wrong — `_id` type, required fields, value ranges. Topic 08 (Schema Design) goes deeper into designing validators that match your application.

### 3.8 Using `_id` in your own code

You will write `_id` in queries constantly, so three practical facts matter:

- **In the shell and in code, `_id` is an ObjectId, not a string.** `db.students.find({ _id: '000000000000000000000001' })` finds nothing — the string `'0000...'` is not the ObjectId `ObjectId('0000...')`. Convert first: `new ObjectId('000000000000000000000001')`. This type mismatch is the single most common "my query returns nothing" bug in MongoDB.
- **You can read the creation time from an `_id`.** `ObjectId('507f1f77bcf86cd799439011').getTimestamp()` returns the Date the id was generated. Handy for "when was this created?" without storing a separate field — but do not rely on it for business logic; store an explicit `createdAt` field when the time matters.
- **Never let users choose an `_id` from untrusted input.** If a client can set `_id`, it can overwrite another document's id and cause duplicate-key errors — or worse, guess ids. Generate ids server-side, and treat `_id` in a URL as an opaque value to look up, never as something the client invents.

---

## 4. How the Technology Works Internally

When you insert a document, this is what happens inside `mongod`:

1. **The driver encodes the document as BSON.** Your JavaScript object becomes a binary buffer: field names as strings, values with a one-byte type tag each. A Date becomes an 8-byte millisecond count; an ObjectId stays 12 raw bytes.
2. **The server writes it to a collection.** A collection is a set of data files managed by the WiredTiger storage engine. The document is appended, and an index entry is created for `_id` (every collection has an `_id` index, created automatically).
3. **The `_id` index is a B-tree.** Lookups by `_id` walk the tree in logarithmic time — this is why `findOne({ _id })` is fast even with millions of documents, and why a query on an unindexed field scans every document instead.
4. **Reads decode BSON back to objects.** The driver receives BSON and turns it into JavaScript objects: BSON Date becomes a JS `Date`, ObjectId becomes an `ObjectId` instance, and so on. That is why `doc.admittedOn` is a real Date you can call `.getFullYear()` on, not a string.
5. **Nothing is validated by default.** MongoDB does not check that your document has the fields you expect — that is the application's job (or a JSON Schema validator, which you can attach to a collection if you want the database to enforce shape — see topic 08, Schema Design).

---

## 5. Architecture or Workflow

```text
MongoDB server
  │
  ├── Database: school
  │     ├── Collection: students        (documents: one per student)
  │     ├── Collection: courses         (documents: one per course)
  │     └── Collection: teachers        (documents: one per teacher)
  │
  ├── Database: shop
  │     ├── Collection: products
  │     └── Collection: orders
  │
  └── System databases (do not touch): admin, config, local

One document (BSON, max 16 MB):
  {
    _id: ObjectId("000000000000000000000001"),
    name: "Talha",
    age: 21,
    enrolled: true,
    courses: ["CS-301", "CS-302"],          ← array
    address: { city: "Karachi", ... },      ← embedded document
    admittedOn: ISODate("2026-01-15"),      ← Date type
    guardianPhone: null
  }
```

Working with the three levels, in order:

```text
1. Pick (or create) a database     client.db('school')
2. Pick (or create) a collection   db.collection('students')
3. Work with documents            insertOne / find / updateOne / deleteOne
```

---

## 6. Real-World Examples

- **A school system** has one database (`school`) with collections `students`, `teachers`, `courses`, and `enrolments`. Each student is one document with their courses embedded as an array and their address embedded as a sub-document — no joins needed to show a student profile.
- **A blog** stores each post as one document: title, body, author, tags array, and an embedded array of comments. Reading a post is one `findOne`, not a join across four tables.
- **An e-commerce store** keeps `products` and `orders` as separate collections. An order embeds the items bought (name, price, quantity at purchase time) — because the price at purchase time must never change when the product price changes later.
- **An application log** uses a capped collection: the newest 1,000 log entries are always there, the oldest vanish automatically, and nothing ever has to run a cleanup job.

---

## 7. Code Examples Where Applicable

The runnable example for this topic is [`examples/documents-demo.mjs`](./examples/documents-demo.mjs). It creates the `school` database and `students` collection, inserts two documents with fixed ObjectIds, reads them back, lists collections, creates and drops a temporary collection, and counts the documents. Its real output is in [`example.txt`](./examples/example.txt).

The core patterns:

```javascript
import { MongoClient, ObjectId } from 'mongodb';

const client = new MongoClient('mongodb://localhost:27017/schooldb');
await client.connect();

const db = client.db('school');              // database handle
const students = db.collection('students');  // collection handle

// Insert — creates the database and collection on first write.
await students.insertOne({
  _id: new ObjectId(),                        // or leave it out: generated for you
  name: 'Talha',
  age: 21,
  courses: ['CS-301'],
  address: { city: 'Karachi', area: 'Gulshan' },
  admittedOn: new Date('2026-01-15T00:00:00.000Z'),
});

// List collections, create one explicitly, drop one.
const collections = await db.listCollections().toArray();
await db.createCollection('logs', { capped: true, size: 1048576, max: 1000 });
await db.collection('temp-notes').drop();
```

---

## 8. Step-by-Step Code Explanations

The example file, section by section:

1. **Imports and fixed ObjectIds.** `MongoClient` connects, `ObjectId` builds ids. Two ids are fixed (`...000001`, `...000002`) so the printed output is identical on every run — random ids would make `example.txt` useless for comparison.
2. **Connect.** `MongoMemoryServer.create()` starts a real `mongod` in memory; `new MongoClient(uri)` + `connect()` opens the connection.
3. **`client.db('school')` and `db.collection('students')`.** These only create handles — nothing exists on the server yet. The handles are cheap; creating them costs nothing.
4. **`insertMany([...])`.** Inserts both documents in one round trip and returns `insertedCount: 2`. Each document shows a different BSON type: string, number, boolean, array, embedded document, Date, null, ObjectId.
5. **`_id` printing.** `toHexString()` turns the 12 bytes into the 24-character hex string you see in Compass and in query results. The length check (`=== 24`) proves the format.
6. **`find().toArray()`.** `find()` returns a cursor (a lazy pointer to results); `toArray()` drains it into an array. The printed JSON shows the documents exactly as stored — including the ISO date string form of the Date.
7. **List, create, drop.** `listCollections()` shows `students`; `createCollection('temp-notes')` adds one; `drop()` removes it; listing again shows only `students`. This is the whole create/drop lifecycle in five lines.
8. **`countDocuments()`.** Returns `2` — the count query, not a full read. Use it instead of `find().toArray().length` when you only need the number.
9. **Shutdown.** `client.close()` then `mongod.stop()`, so the process exits.

---

## 9. Common Misconceptions

- **"A collection is like a table, so every document must have the same fields."** No. A collection groups similar documents, but MongoDB enforces no shape. Flexibility is a feature — and also a responsibility: your application must still agree on what a "student" looks like.
- **"I need to create the database before I use it."** No. `client.db('school')` is just a handle. The database is created on the first write. (This is also why `show dbs` hides empty databases.)
- **"Documents are JSON."** They look like JSON, but they are stored and sent as **BSON**. The difference matters: BSON has Date, ObjectId, and binary types that JSON does not, and it stores numbers with their real types instead of "everything is a double".
- **"I can use any string as `_id`."** You can — `_id` accepts strings, numbers, anything unique. But you lose the free creation timestamp and the guaranteed cross-machine uniqueness of ObjectId. Use a natural key (like a roll number) only when it is truly stable and unique.
- **"A missing field and a `null` field are the same."** They are not. `{ guardianPhone: null }` says "we know there is no phone". A document without the field says nothing at all — and `{ guardianPhone: null }` as a query matches *both*, which surprises people. Be deliberate about which one you store.
- **"Capped collections are for small data."** They are for *temporary* data. Size is the point: old data deletes itself. Never use one for data you must keep.
- **"Embedding everything is always right."** Embedding is right for data that belongs together and does not grow forever. A student's address: embed. A student's ten thousand forum posts: separate collection. The 16 MB document limit is the hard wall.

---

## 10. Important Technical Terminology

| Term | Meaning |
|---|---|
| **Database** | Container for collections. |
| **Collection** | Container for documents; roughly a table, without a fixed schema. |
| **Document** | One BSON record; the unit of storage. |
| **BSON** | Binary JSON — MongoDB's storage and wire format. |
| **Field** | A key/value pair inside a document. |
| **`_id`** | A document's primary key; unique per collection, immutable. |
| **ObjectId** | The default `_id` type: 12 bytes, 24 hex characters, globally unique without a server round trip. |
| **Namespace** | `database.collection`, e.g. `school.students`. |
| **Capped collection** | Fixed-size collection, insertion-ordered, oldest data overwritten when full. |
| **Cursor** | A lazy pointer to query results; `find()` returns one, `toArray()` drains it. |
| **WiredTiger** | The storage engine that writes collections to disk. |

---

## 11. Summary

- MongoDB has three levels: **database → collection → document**. One app usually uses one database; one kind of thing gets one collection; one record is one document.
- Documents are stored as **BSON** — JSON plus Date, ObjectId, Decimal128, and binary types. Dates are Date, money is Decimal128.
- Every document has an **`_id`**. The default, ObjectId, is 12 bytes (timestamp + machine + process + counter) and unique without asking the server.
- Databases and collections are created **lazily**, on first write. `createCollection` exists for setting options like capped size.
- Naming: lowercase plural collections, no `$` or leading `system.`, field names cannot contain `.` or start with `$`.
- Capped collections are fixed-size, insertion-ordered, self-cleaning — for logs only.
- A document cannot exceed 16 MB, so unbounded lists belong in their own collection.

---

## 12. Interview Questions and Answers

**1. What are the three levels of MongoDB, and how do they map to SQL?**
Database → database, collection → table, document → row. The difference is that documents are flexible JSON-like objects, not fixed rows, and related data is usually embedded instead of joined.

**2. What is BSON, and why does MongoDB not just use JSON?**
BSON is Binary JSON: JSON's structure plus types JSON lacks — Date, ObjectId, Decimal128, binary data — and real number types. It is what MongoDB stores on disk and sends over the network.

**3. What is `_id`, and what happens if you do not provide one?**
`_id` is the document's primary key: unique per collection, indexed automatically, immutable. If you omit it, the driver generates an ObjectId.

**4. What is an ObjectId made of?**
12 bytes: a 4-byte timestamp, 3-byte machine id, 2-byte process id, 3-byte counter. Written as 24 hex characters. It is unique across machines without a server round trip, and it sorts roughly in creation order.

**5. How are databases and collections created?**
Lazily — on the first write. `client.db('school')` and `db.collection('students')` only create handles. `createCollection()` exists when you need options, like a capped size.

**6. What is a capped collection, and when would you use one?**
A fixed-size collection that keeps insertion order and overwrites the oldest documents when full. Use it for logs or streams where only the recent past matters.

**7. What is the maximum size of a document, and why does it matter?**
16 MB. It means you cannot embed an unbounded list (all of a user's posts, ever) in one document — growing lists go in their own collection.

**8. What is the difference between a missing field and a `null` field?**
A missing field says nothing; `null` explicitly says "no value". A query for `{ field: null }` matches both, so store deliberately.

**9. Why should dates be stored as Date and not as strings?**
A Date supports comparison, sorting, and date arithmetic; a string does not (and string sorting of dates only works if the format is exactly right). Store dates as Date, always.

**10. When should you embed data and when should you reference it?**
Embed data that belongs together, is read together, and does not grow forever (address inside a student). Reference (store an `_id`) when the data is large, shared by many documents, or grows without bound.

**11. How do you list all collections in a database?**
`await db.listCollections().toArray()` — or `show collections` in `mongosh`.

**12. What are the naming rules for collections?**
Lowercase plural nouns, case-sensitive, no `$`, cannot start with `system.`, and a dot in a name does not create hierarchy — `school.students` is a namespace, not a collection name.

---

## 13. References

- MongoDB manual — databases and collections — [https://www.mongodb.com/docs/manual/core/databases-and-collections/](https://www.mongodb.com/docs/manual/core/databases-and-collections/)
- MongoDB manual — documents — [https://www.mongodb.com/docs/manual/core/document/](https://www.mongodb.com/docs/manual/core/document/)
- MongoDB manual — BSON types — [https://www.mongodb.com/docs/manual/reference/bson-types/](https://www.mongodb.com/docs/manual/reference/bson-types/)
- MongoDB manual — ObjectId — [https://www.mongodb.com/docs/manual/reference/method/ObjectId/](https://www.mongodb.com/docs/manual/reference/method/ObjectId/)
- MongoDB manual — capped collections — [https://www.mongodb.com/docs/manual/core/capped-collections/](https://www.mongodb.com/docs/manual/core/capped-collections/)
- Node.js MongoDB driver — collections — [https://www.mongodb.com/docs/drivers/node/current/fundamentals/crud/](https://www.mongodb.com/docs/drivers/node/current/fundamentals/crud/)

---

[← Main README](../../README.md) · Previous: [04 — Installation and Setup](../04-installation-setup/README.md) · Next: [06 — CRUD Operations](../06-crud-operations/README.md) · Module: [../README.md](../README.md)

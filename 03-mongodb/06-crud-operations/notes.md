# 06 — CRUD Operations

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

CRUD is the alphabet of databases: **Create, Read, Update, Delete**. Every application you will ever build — a to-do list, a shop, a social network, your semester project — is CRUD with extra steps. If you can do these four operations well, you can build the data layer of almost anything.

In MongoDB, CRUD is done with a small set of methods on a collection: `insertOne` / `insertMany`, `find` / `findOne`, `updateOne` / `updateMany` / `replaceOne`, `deleteOne` / `deleteMany`. That is nearly the whole API. The skill is not memorising the method names — it is knowing what each one returns, how to aim it with a filter, and what happens when the filter matches nothing.

Think of a collection as a box of files. Create puts a new file in the box. Read takes files out to look at them (without removing them). Update edits files in place. Delete throws files away. Every method takes the same two ingredients: a **filter** (which files?) and a **change** (what to do to them?). Get the filter wrong and you edit or delete the wrong files — which is why this topic spends as much time on filters and return values as on the methods themselves.

By the end of this topic you will be able to: insert one and many documents; read with filters, projection, sorting, and limits; update with `$set`, `$inc`, and the other update operators; replace a whole document; delete one and many; read the result objects (`acknowledged`, `matchedCount`, `modifiedCount`, `deletedCount`, `upsertedId`); and use upsert to "update or insert".

---

## 2. Definition of Important Concepts

| Concept | Definition |
|---|---|
| **CRUD** | Create, Read, Update, Delete — the four basic operations on stored data. |
| **Filter (query)** | A document describing which documents an operation applies to, e.g. `{ stock: { $gt: 0 } }`. An empty filter `{}` matches everything. |
| **Projection** | Which fields to return: `{ title: 1, stock: 1 }` returns only those fields. `_id` is returned unless you exclude it with `_id: 0`. |
| **Cursor** | What `find()` returns: a lazy pointer to the results. Nothing is fetched until you consume it with `toArray()`, `for await`, or `next()`. |
| **`matchedCount`** | How many documents matched the filter of an update. |
| **`modifiedCount`** | How many documents were actually changed by an update. It can be less than `matchedCount` — setting a field to the value it already has changes nothing. |
| **`deletedCount`** | How many documents a delete removed. |
| **`upsert`** | "Update or insert": if no document matches the filter, create one from the filter + the update. Enabled with `{ upsert: true }`. |
| **Update operator** | A `$`-prefixed instruction in an update, e.g. `$set` (set fields), `$inc` (add to a number), `$push` (append to an array). Without one, an update document *replaces* the whole document. |
| **`acknowledged`** | `true` when the server confirmed the write. With the default write concern, every write in this module is acknowledged. |
| **Atomicity (single document)** | In MongoDB, one write to one document is atomic — it fully happens or fully does not. Multi-document atomicity needs a transaction (Phase 03, later topic). |

---

## 3. Detailed Explanations

### 3.1 Create — `insertOne` and `insertMany`

```javascript
// One document. The result tells you what happened.
const one = await books.insertOne({ title: 'Clean Code', price: 40, stock: 5 });
// one.acknowledged → true
// one.insertedId   → ObjectId (generated, or the _id you provided)

// Many documents, one round trip — much faster than a loop of insertOne.
const many = await books.insertMany([
  { title: 'Book A', price: 25, stock: 0 },
  { title: 'Book B', price: 30, stock: 3 },
]);
// many.insertedCount → 2
// many.insertedIds   → { 0: ObjectId, 1: ObjectId }
```

Notes:

- If you do not provide `_id`, the driver generates an ObjectId for each document.
- `insertMany` is **ordered by default**: if document 2 of 5 fails (e.g. a duplicate `_id`), the operation stops and documents 3–5 are never inserted. Pass `{ ordered: false }` to insert the rest anyway and report the failures at the end.
- A duplicate `_id` throws a `MongoServerError` with code `11000` (duplicate key). Your code should expect this — it is the normal "this already exists" signal, not a crash.

### 3.2 Read — `find`, `findOne`, and `countDocuments`

`find()` does not return documents. It returns a **cursor** — a lazy pointer. The query runs when you consume it:

```javascript
// All books, cheapest first, as an array:
const all = await books.find().sort({ price: 1 }).toArray();

// One document — the first match, or null if there is none:
const one = await books.findOne({ _id: someId });

// Stream large results instead of loading them all into memory:
for await (const book of books.find()) {
  console.log(book.title);
}
```

**Filters.** A filter is a document. Fields match exactly unless you use an operator:

```javascript
{ stock: 0 }                    // stock equals 0
{ stock: { $gt: 0 } }           // stock greater than 0
{ price: { $gte: 20, $lte: 50 } } // price between 20 and 50
{ author: { $in: ['A', 'B'] } } // author is A or B
{ title: { $regex: 'java', $options: 'i' } } // title contains "java", case-insensitive
{ $or: [{ stock: 0 }, { price: { $gt: 50 } }] } // either condition
```

The comparison operators are `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`. (The full set — including array and logical operators — is topic 07, Query Operators.)

**Projection.** Return only the fields you need. This is not cosmetic: less data over the network, less memory, and no leaking of fields like internal notes or password hashes.

```javascript
// Only title and stock. _id is included unless excluded.
await books.find({}, { projection: { title: 1, stock: 1 } }).toArray();
// Exclude _id too:
await books.find({}, { projection: { _id: 0, title: 1, stock: 1 } }).toArray();
```

**Sort, skip, limit.** Always sort when order matters — without a sort, MongoDB returns documents in no guaranteed order (usually insertion order, but never rely on it).

```javascript
await books.find().sort({ price: 1 }).toArray();        // cheapest first (1 = ascending)
await books.find().sort({ price: -1 }).limit(5).toArray(); // five most expensive
await books.find().skip(20).limit(10).toArray();        // page 3 of 10-per-page
```

**Counting.** `countDocuments(filter)` counts matching documents. Never use `find().toArray().length` for a count — it loads every document into memory just to count them.

```javascript
await books.countDocuments();              // all books
await books.countDocuments({ stock: 0 });  // out-of-stock books
```

### 3.3 Update — `updateOne`, `updateMany`, `replaceOne`

Updates come in two flavours, and confusing them is the classic beginner bug:

- **Operator updates** change specific fields. The document keeps everything else.
- **Replacement** swaps the whole document. Anything not in the new document is gone.

```javascript
// OPERATOR UPDATE — only the stock field changes, the rest stays.
await books.updateOne({ _id: id }, { $set: { stock: 4 } });

// Add 5 to every price under 35.
await books.updateMany({ price: { $lt: 35 } }, { $inc: { price: 5 } });

// REPLACEMENT — the old document is thrown away entirely.
// If you forget a field here (say, stock), it is gone.
await books.replaceOne({ _id: id }, { title: '...', author: '...', price: 60, stock: 2 });
```

The most-used update operators:

| Operator | What it does | Example |
|---|---|---|
| `$set` | Sets fields (creates them if missing) | `{ $set: { stock: 4 } }` |
| `$inc` | Adds a number (negative to subtract) | `{ $inc: { price: 5 } }` |
| `$unset` | Removes fields | `{ $unset: { discount: '' } }` |
| `$push` | Appends to an array | `{ $push: { tags: 'node' } }` |
| `$pull` | Removes matching values from an array | `{ $pull: { tags: 'old' } }` |
| `$addToSet` | Appends only if not already present | `{ $addToSet: { tags: 'node' } }` |
| `$rename` | Renames a field | `{ $rename: { name: 'fullName' } }` |

**Reading the result.** Every update returns the same shape:

```javascript
const r = await books.updateOne({ _id: id }, { $set: { stock: 4 } });
r.matchedCount;  // documents matching the filter
r.modifiedCount; // documents actually changed
```

`matchedCount` can be bigger than `modifiedCount`: if the field already has the value you set, MongoDB matches the document but changes nothing. And if the filter matches nothing, both are 0 — **an update that matches nothing is not an error**. Your code must check `matchedCount` when "not found" is a real outcome (e.g. updating a book that does not exist should be a 404, not a silent success).

**Upsert.** Add `{ upsert: true }` and the update becomes "update or insert": no match → MongoDB creates a document from the filter's equality fields plus the update:

```javascript
const r = await books.updateOne(
  { _id: new ObjectId('000000000000000000000005') },
  { $set: { title: 'Refactoring', price: 45, stock: 1 } },
  { upsert: true },
);
// r.matchedCount → 0, r.modifiedCount → 0, r.upsertedId → the new _id
```

Upsert is how you write "ensure this exists" logic — a settings document, a user profile, a daily counter — in one call instead of find-then-insert.

### 3.4 Delete — `deleteOne` and `deleteMany`

```javascript
const one = await books.deleteOne({ _id: id });       // first match only
const many = await books.deleteMany({ stock: 0 });    // every match
// one.deletedCount, many.deletedCount → how many were removed
```

Two rules:

1. **Delete is permanent.** There is no recycle bin and no undo. In real applications, many teams *soft-delete* instead: set a field like `{ deleted: true, deletedAt: <date> }` and filter it out of normal reads. The data stays recoverable.
2. **`deleteMany({})` deletes everything.** An empty filter matches all documents. That is correct behaviour and a famous foot-gun — always double-check the filter before a `deleteMany`, and never build one from raw user input.

---

## 4. How the Technology Works Internally

What happens when you call `books.updateOne({ _id }, { $set: { stock: 4 } })`:

1. **The driver encodes the command as BSON** and sends it over a pooled connection to `mongod`.
2. **The server finds the documents.** It uses the `_id` index to locate the document in logarithmic time. (A filter on an unindexed field scans the whole collection — topic 10, Indexing, explains why that matters.)
3. **The server applies the update atomically.** For a single document, the whole update happens or none of it does — another reader never sees a half-updated document.
4. **The server writes to the journal first, then to the data files.** The journal is a write-ahead log: if the server crashes mid-write, it replays the journal on restart and the data is not lost.
5. **The server replies with the result document** — `matchedCount`, `modifiedCount`, and so on — and the driver returns it to your code as a JavaScript object.

For reads, the same path runs in reverse: the server walks the index (or scans), decodes BSON documents, and streams them back through the cursor. A cursor is lazy on purpose — `find()` without `toArray()` has not fetched anything yet, which is what lets you stream a million documents without loading them into memory.

---

## 5. Architecture or Workflow

CRUD, as a decision flow:

```text
CREATE
  insertOne(doc)              → one document, returns insertedId
  insertMany([docs])          → many at once, returns insertedCount
  duplicate _id → error 11000

READ
  find(filter)                → cursor (lazy)
    .sort({ field: 1 | -1 })  → order (always sort when order matters)
    .skip(n).limit(m)         → pagination
    .project({ ... })         → return only needed fields
    .toArray()                → drain into an array
  findOne(filter)             → first match, or null
  countDocuments(filter)      → count without loading documents

UPDATE
  updateOne(filter, { $set / $inc / ... })   → first match only
  updateMany(filter, { ... })                → every match
  replaceOne(filter, newDoc)                 → whole document swapped
  { upsert: true }                           → insert if no match
  result: matchedCount / modifiedCount / upsertedId

DELETE
  deleteOne(filter)           → first match only
  deleteMany(filter)          → every match ({} = everything!)
  result: deletedCount
```

---

## 6. Real-World Examples

- **A bookshop API.** `POST /books` → `insertOne`. `GET /books?inStock=true` → `find` with a filter, projection, sort, and limit. `PATCH /books/:id` → `updateOne` with `$set`. `DELETE /books/:id` → `deleteOne`. The whole backend is these four operations plus auth.
- **A to-do app.** Toggling a task is `updateOne({ _id }, { $set: { done: true } })`. Clearing completed tasks is `deleteMany({ done: true })`. The UI's "mark all as done" is one `updateMany`.
- **A shopping cart.** Adding an item is `$push` to the cart's items array; changing a quantity is `$inc` on the quantity field; removing an item is `$pull`. The cart is one document — no joins, no separate cart-items table.
- **A daily counter.** "How many logins today?" is an upsert: `updateOne({ date: today }, { $inc: { count: 1 } }, { upsert: true })`. First login of the day creates the document; the rest just increment it.
- **A settings page.** Each user has one settings document, created by upsert the first time they save. No "does it exist yet?" check in code — the upsert handles both cases.

---

## 7. Code Examples Where Applicable

The runnable example for this topic is [`examples/crud-demo.mjs`](./examples/crud-demo.mjs). It runs a full CRUD cycle on a `books` collection with fixed ObjectIds: insert, read with sort/projection/count, update with `$set`/`$inc`/`replaceOne`/upsert, delete, and a final read of what remains. Its real output is in [`example.txt`](./examples/example.txt).

The core patterns, all in one place:

```javascript
import { MongoClient, ObjectId } from 'mongodb';

const client = new MongoClient('mongodb://localhost:27017/library');
await client.connect();
const books = client.db('library').collection('books');

// CREATE
await books.insertOne({ title: 'Clean Code', price: 40, stock: 5 });
await books.insertMany([{ title: 'A', price: 25 }, { title: 'B', price: 30 }]);

// READ
const cheap = await books.find({ stock: { $gt: 0 } }).sort({ price: 1 }).toArray();
const one = await books.findOne({ _id: new ObjectId('...') });
const count = await books.countDocuments({ stock: 0 });

// UPDATE
await books.updateOne({ _id: id }, { $set: { stock: 4 } });
await books.updateMany({ price: { $lt: 35 } }, { $inc: { price: 5 } });
await books.replaceOne({ _id: id }, { title: '...', price: 60, stock: 2 });
await books.updateOne({ _id: id }, { $set: { title: 'X' } }, { upsert: true });

// DELETE
await books.deleteOne({ _id: id });
await books.deleteMany({ stock: 0 });
```

---

## 8. Step-by-Step Code Explanations

The example file, section by section:

1. **Imports and fixed ObjectIds.** Four ids (`...000001` to `...000004`) are fixed so the output is byte-identical on every run. The fifth (`...000005`) is created inline for the upsert.
2. **Connect.** Memory server starts, client connects, `books` is the `library.books` collection handle.
3. **CREATE — `insertOne`.** One book, `Clean Code`. The result prints `acknowledged: true` and the inserted id in hex — proof the server accepted the write.
4. **CREATE — `insertMany`.** Three books in one call; `insertedCount: 3`. One round trip instead of three.
5. **READ — `find().sort({ price: 1 }).toArray()`.** All four books, cheapest first. The printed lines prove the sort worked (25, 30, 40, 55).
6. **READ — `findOne` with a filter and a sort.** `{ stock: { $gt: 0 } }` plus sort by price picks the cheapest *in-stock* book — `Eloquent JavaScript` at $30, not the $25 book, which has stock 0.
7. **READ — projection.** `{ _id: 0, title: 1, stock: 1 }` returns only those two fields. The printed JSON has no `_id` and no price — projection in action.
8. **READ — counts.** `countDocuments()` with no filter (4) and with `{ stock: 0 }` (1).
9. **UPDATE — `updateOne` with `$set`.** Stock 0 → 4 for one book. `matched: 1, modified: 1`.
10. **UPDATE — `updateMany` with `$inc`.** Prices under 35 rise by 5: 25 → 30, 30 → 35. `matched: 2, modified: 2`.
11. **UPDATE — `replaceOne`.** `Design Patterns` is replaced wholesale, price 55 → 60, and gains an `edition` field. `matched: 1, modified: 1`.
12. **UPDATE — upsert.** No document has id `...000005`, so the update inserts `Refactoring` instead: `matched: 0, modified: 0, upsertedId: ...000005`.
13. **DELETE — `deleteOne`.** Removes `Eloquent JavaScript`: `deletedCount: 1`. Then `deleteMany({ stock: 0 })` finds nothing left with stock 0 (the earlier `$set` fixed it): `deletedCount: 0` — a delete that matches nothing is not an error.
14. **Final read.** The remaining books, sorted by title, prove every earlier step: `Clean Code` $40, `Design Patterns` $60, `Refactoring` $45, `You Don't Know JS` $30.
15. **Shutdown.** `client.close()` then `mongod.stop()`.

---

## 9. Common Misconceptions

- **"`find()` returns the documents."** It returns a **cursor**. Nothing is fetched until you call `toArray()`, loop with `for await`, or call `next()`. Forgetting `toArray()` and printing the cursor is a rite of passage.
- **"`updateOne` without an operator updates one field."** No — without a `$` operator, the second argument is a **replacement document**. `updateOne({ _id }, { stock: 4 })` throws away every other field. Always use `$set` unless you mean to replace.
- **"If `matchedCount` is 1, the document changed."** Not necessarily. Setting a field to the value it already holds matches the document but modifies nothing — `modifiedCount` is 0. Check `modifiedCount` when "did it actually change?" matters.
- **"An update that matches nothing throws an error."** It does not. `matchedCount: 0` is a normal result. If "not found" should be an error in your API, check it yourself and return a 404.
- **"`deleteMany({})` deletes one document."** It deletes **all** of them — `{}` matches everything. The most dangerous line in MongoDB is a `deleteMany` with the wrong filter.
- **"`findOne` throws when nothing matches."** It returns `null`. Always check for `null` before reading properties, or your code crashes with "Cannot read properties of null".
- **"Sort order is guaranteed without `.sort()`."** It is not. MongoDB returns documents in whatever order is convenient (usually insertion order, but never promised). If order matters, sort explicitly.
- **"Upsert is just insert."** Upsert is *update or insert*: with a match it updates, without one it creates a document from the filter plus the update. The created document only contains the filter's equality fields and the `$set` fields — nothing else.

---

## 10. Important Technical Terminology

| Term | Meaning |
|---|---|
| **CRUD** | Create, Read, Update, Delete. |
| **Filter** | A document selecting which documents an operation applies to. `{}` matches all. |
| **Projection** | Which fields a read returns. |
| **Cursor** | Lazy pointer to query results, returned by `find()`. |
| **`matchedCount` / `modifiedCount`** | Update result: how many matched vs how many actually changed. |
| **`deletedCount`** | Delete result: how many were removed. |
| **`acknowledged`** | Whether the server confirmed the write. |
| **Upsert** | Update-or-insert, enabled with `{ upsert: true }`. |
| **Update operator** | `$set`, `$inc`, `$push`, `$pull`, `$unset`, `$addToSet`, `$rename`. |
| **Soft delete** | Marking a document `{ deleted: true }` instead of removing it. |
| **Write concern** | How strongly the server must confirm a write before the driver reports success. |

---

## 11. Summary

- **Create:** `insertOne` (one document, returns `insertedId`) and `insertMany` (many at once, returns `insertedCount`). Duplicate `_id` throws error 11000.
- **Read:** `find()` returns a lazy cursor — consume it with `toArray()` or `for await`. `findOne` returns the first match or `null`. Filters use operators like `$gt`, `$in`, `$or`. Projection returns only the fields you need; always sort when order matters; count with `countDocuments()`.
- **Update:** use operators (`$set`, `$inc`, `$push`…) to change fields; a bare document *replaces* the whole document. Read `matchedCount` vs `modifiedCount` — they differ when the value was already set. `{ upsert: true }` creates the document when nothing matches.
- **Delete:** `deleteOne` (first match) and `deleteMany` (every match). `deleteMany({})` deletes everything — check the filter. Deletes are permanent; consider soft deletes.
- One document, one write, is atomic. An update matching nothing is not an error — check the counts yourself.

---

## 12. Interview Questions and Answers

**1. What are the four CRUD operations in MongoDB, and which methods do them?**
Create: `insertOne` / `insertMany`. Read: `find` / `findOne`. Update: `updateOne` / `updateMany` / `replaceOne`. Delete: `deleteOne` / `deleteMany`.

**2. What does `find()` return, and why does that matter?**
A cursor — a lazy pointer, not the documents. Nothing is fetched until you consume it (`toArray()`, `for await`, `next()`). That lets you stream huge result sets without loading them into memory.

**3. What is the difference between `updateOne` with `$set` and `replaceOne`?**
`$set` changes only the named fields and keeps the rest of the document. `replaceOne` throws the whole document away and stores the new one — any field you forget is gone.

**4. `matchedCount` is 1 but `modifiedCount` is 0. What happened?**
The filter matched a document, but the update changed nothing — the field already had the value you set. The document was found, not modified.

**5. What is an upsert, and when would you use one?**
An update with `{ upsert: true }`: if no document matches, MongoDB creates one from the filter plus the update. Use it for "ensure this exists" logic — settings, profiles, daily counters.

**6. How do you delete all documents in a collection, and why is it dangerous?**
`deleteMany({})` — the empty filter matches everything. It is dangerous because it is permanent and looks almost identical to a filtered delete; always double-check the filter.

**7. `findOne` found nothing. What does it return, and what should your code do?**
It returns `null`. Check for `null` (and return a 404 in an API) before reading properties, or the code crashes.

**8. How do you page through results — say, 10 books per page, page 3?**
`find().sort({ ... }).skip(20).limit(10)` — skip the first 20, take 10. Always sort first, or pages overlap and repeat.

**9. Why use projection?**
It returns only the fields you need: less data over the network, less memory, and no accidental leaking of fields like password hashes or internal notes.

**10. What does `insertMany` do when one document fails, and how do you change that?**
By default it is ordered: it stops at the first failure and the rest are never inserted. Pass `{ ordered: false }` to insert the remaining documents and report the failures at the end.

**11. What is the difference between `deleteOne` and soft delete?**
`deleteOne` removes the document permanently. Soft delete sets `{ deleted: true }` and filters it out of reads — the data stays recoverable and auditable.

**12. Is a single-document update atomic?**
Yes. One write to one document fully happens or fully does not — no reader ever sees a half-updated document. Multi-document atomicity needs a transaction.

---

## 13. References

- MongoDB manual — CRUD operations — [https://www.mongodb.com/docs/manual/crud/](https://www.mongodb.com/docs/manual/crud/)
- MongoDB manual — insert documents — [https://www.mongodb.com/docs/manual/tutorial/insert-documents/](https://www.mongodb.com/docs/manual/tutorial/insert-documents/)
- MongoDB manual — query documents — [https://www.mongodb.com/docs/manual/tutorial/query-documents/](https://www.mongodb.com/docs/manual/tutorial/query-documents/)
- MongoDB manual — update documents — [https://www.mongodb.com/docs/manual/tutorial/update-documents/](https://www.mongodb.com/docs/manual/tutorial/update-documents/)
- MongoDB manual — delete documents — [https://www.mongodb.com/docs/manual/tutorial/remove-documents/](https://www.mongodb.com/docs/manual/tutorial/remove-documents/)
- MongoDB manual — update operators — [https://www.mongodb.com/docs/manual/reference/operator/update/](https://www.mongodb.com/docs/manual/reference/operator/update/)
- Node.js MongoDB driver — CRUD fundamentals — [https://www.mongodb.com/docs/drivers/node/current/fundamentals/crud/](https://www.mongodb.com/docs/drivers/node/current/fundamentals/crud/)

---

[← Main README](../../README.md) · Previous: [05 — Databases, Collections and Documents](../05-databases-collections-documents/README.md) · Next: [07 — Query Operators](../07-query-operators/README.md) · Module: [../README.md](../README.md)

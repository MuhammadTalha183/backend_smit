# 07 — Query Operators

> **Module:** [03 — MongoDB](../README.md) · **Previous:** [06 — CRUD Operations](../06-crud-operations/README.md) · **Next:** [08 — Schema Design](../08-schema-design/README.md)

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
- [10. Important Technical Terminology](#10-important-technical-terminology)
- [11. Summary](#11-summary)
- [12. Interview Questions and Answers](#12-interview-questions-and-answers)
- [13. References](#13-references)

---

## 1. Introduction

CRUD (topic 06) taught you the four verbs: create, read, update, delete. But real applications almost never want *all* documents — they want "users over 21 from Karachi", "orders that contain a laptop with quantity 3 or more", "products whose name starts with A". Query operators are how you ask those questions.

A query operator is a special key that starts with `$` — `$gt`, `$in`, `$and`, `$regex` — placed inside a query document. Without them you can only ask for exact matches. With them you can express ranges, sets, logic, array conditions, and text patterns. This topic is the full operator toolkit: comparison, logical, element, array, and evaluation operators, plus projection, sorting, and pagination — the everyday reading half of MongoDB.

## 2. Definitions

- **Query document** — the first argument to `find()`: a document describing which documents to return, e.g. `{ age: { $gt: 21 } }`.
- **Query operator** — a key beginning with `$` that changes how a field is matched, e.g. `$gt` (greater than), `$in` (in a list), `$regex` (pattern match).
- **Comparison operators** — `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`. They compare a field's value against one value (or a list).
- **Logical operators** — `$and`, `$or`, `$not`, `$nor`. They combine whole conditions.
- **Element operators** — `$exists`, `$type`. They test whether a field is present, and what BSON type it has.
- **Array operators** — `$all`, `$elemMatch`, `$size`. They test the contents of array fields.
- **Evaluation operators** — `$regex`, `$expr`, `$text`, `$where`. They evaluate expressions, patterns, or text search against a document.
- **Projection** — the second argument to `find()`: which fields to include (`1`) or exclude (`0`) from returned documents.
- **Cursor** — the object `find()` returns. It fetches results lazily, and methods like `sort()`, `limit()`, `skip()`, and `toArray()` shape what you get.

## 3. Detailed Explanations

### 3.1 Comparison operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `$eq` | equals | `{ age: { $eq: 21 } }` — same as `{ age: 21 }` |
| `$ne` | not equal | `{ city: { $ne: 'Karachi' } }` |
| `$gt` / `$gte` | greater than / or equal | `{ age: { $gt: 21 } }` |
| `$lt` / `$lte` | less than / or equal | `{ age: { $lt: 20 } }` |
| `$in` | value is one of the list | `{ city: { $in: ['Karachi', 'Lahore'] } }` |
| `$nin` | value is none of the list | `{ city: { $nin: ['Karachi'] } }` |

Two things beginners miss. First, `{ age: 21 }` is shorthand for `{ age: { $eq: 21 } }` — the plain form only does equality. Second, comparison against a field that holds an **array** matches if *any* element satisfies the comparison: `{ skills: 'node' }` matches a document whose `skills` array contains `'node'`. That is why array fields feel so easy to query in MongoDB.

### 3.2 Logical operators

- `$and: [cond1, cond2]` — all conditions must be true. Note: `{ a: 1, b: 2 }` already means AND, so you only need explicit `$and` when the same field appears twice, e.g. `{ $and: [{ age: { $gt: 18 } }, { age: { $lt: 30 } }] }`.
- `$or: [cond1, cond2]` — at least one must be true.
- `$not: { ... }` — inverts a single operator expression, e.g. `{ age: { $not: { $gt: 21 } } }`.
- `$nor: [cond1, cond2]` — none of the conditions may be true.

`$or` is the one that surprises people on performance: each clause of an `$or` can use a different index, and MongoDB runs the clauses almost like separate queries and merges the results. That is powerful, but it is also why `$or` with many clauses can be slow (see topic 10, Indexing).

### 3.3 Element operators

- `$exists: true/false` — does the field exist at all? Useful because MongoDB documents in one collection can have different fields. `{ active: { $exists: false } }` finds documents that never got an `active` field.
- `$type: 'string'` (or a BSON type number) — what type is the value? `{ age: { $type: 'string' } }` finds documents where age was accidentally stored as text — a common data-quality bug.

### 3.4 Array operators

- `{ skills: 'mongodb' }` — the array contains this value (plain equality already works element-wise).
- `$all: ['node', 'react']` — the array contains **all** of these values, in any order.
- `$elemMatch: { product: 'laptop', qty: { $gte: 3 } }` — **one single element** satisfies all the conditions together. This is the critical one: without `$elemMatch`, `{ 'items.product': 'laptop', 'items.qty': { $gte: 3 } }` would match a document where one item is a laptop and a *different* item has qty 3. `$elemMatch` forces both conditions onto the same element.
- `$size: 3` — the array has exactly this many elements. Note: `$size` cannot be combined with other operators on the same field in one expression — a known limitation.

### 3.5 Evaluation operators

- `$regex: '^A'` — the string matches a regular expression. `^A` means "starts with A". Add `$options: 'i'` for case-insensitive matching. Regexes that do not start with `^` (an anchor) usually cannot use an index and scan the whole collection — slow on big data.
- `$expr: { $gt: ['$price', '$cost'] }` — compare two fields *of the same document* against each other. Normal query operators can only compare a field against a fixed value; `$expr` lets you write `$price > $cost`.
- `$text: { $search: 'developer' }` — full-text search, but only if a text index exists (topic 10).
- `$where` — runs JavaScript per document. It exists, it is slow, and you should almost never use it.

### 3.6 Projection, sort, limit, skip, count

- **Projection:** `find(filter, { projection: { _id: 0, name: 1, city: 1 } })`. `1` means include, `0` means exclude. You cannot mix include and exclude — except `_id`, which is the only field you can exclude while including others. `_id` is included by default; set `_id: 0` to drop it. Projection is a performance tool, not just cosmetics: returning smaller documents means less data over the network.
- **Sort:** `.sort({ age: -1 })` — `1` ascending, `-1` descending. Sort on multiple fields: `.sort({ city: 1, age: -1 })`.
- **Limit / skip:** `.limit(10)` returns at most 10 documents; `.skip(20)` skips the first 20. Together they are pagination: page 3 with 10 per page is `.skip(20).limit(10)`. But `skip` gets slower as the number grows — for large collections, range-based pagination (remember the last `_id` and query `{ _id: { $gt: lastId } }`) is the professional pattern.
- **Count:** `countDocuments({ active: true })` counts matching documents exactly. (The older `count()` is deprecated; `estimatedDocumentCount()` is fast but counts the *whole* collection with no filter.)

### 3.7 Dot notation — reaching into nested documents

Dots let a query reach inside subdocuments and arrays:

```js
// Nested document: the user's address city
await users.find({ 'address.city': 'Karachi' });

// Array of subdocuments: any element's field (see the $elemMatch warning in §3.4)
await orders.find({ 'items.product': 'laptop' });

// Array index: the FIRST skill only
await users.find({ 'skills.0': 'node' });
```

Dot notation is how you query embedded data. It is also how updates target nested fields (`$set: { 'address.city': 'Lahore' }`), which you will use constantly in topic 06-style updates and in Mongoose (topic 13).

### 3.8 Building a query step by step — a shop dashboard

A common beginner mistake is trying to write the whole filter at once. Build it in layers instead. The dashboard needs: "active users from Karachi, aged 21 or over, who know Node, newest first, 10 per page."

```js
// Layer 1 — the base set
{ active: true }
// Layer 2 — add the city
{ active: true, city: 'Karachi' }
// Layer 3 — add the range
{ active: true, city: 'Karachi', age: { $gte: 21 } }
// Layer 4 — add the array condition
{ active: true, city: 'Karachi', age: { $gte: 21 }, skills: 'node' }
// Layer 5 — shape the result
await users.find({ active: true, city: 'Karachi', age: { $gte: 21 }, skills: 'node' })
  .sort({ createdAt: -1 })
  .limit(10)
  .toArray();
```

Each layer is testable on its own: run it, count the results, then add the next condition. When a query returns nothing, remove layers until results appear — the last layer you removed holds the bug. This is also how you debug in production: `countDocuments()` after each layer tells you where the results disappeared.

### 3.9 Comparing values of different types

MongoDB compares values with BSON type ordering when types differ: numbers sort before strings, strings before objects, and so on. Practically, this means `{ age: { $gt: 21 } }` will **not** match a document where `age` is the *string* `'25'` — string `'25'` is not greater than number `21` in a numeric sense; BSON ordering puts all numbers before all strings, so the comparison fails in the direction you would not expect. Mixed types in one field are a data-quality bug (topic 08, §3.6), and `$type` queries are how you hunt them down:

```js
// Find every document where age is stored as text by mistake
await users.find({ age: { $type: 'string' } }).toArray();
```

## 4. How It Works Internally

When you call `find(filter)`, the driver does **not** run the query immediately. It returns a **cursor** — a pointer to results that do not exist yet. Chaining `.sort().limit(10)` only configures the cursor. The query is sent to the server when you iterate the cursor (`toArray()`, `for await`, or `next()`).

On the server, the query planner looks at the filter and decides how to find matching documents. With no usable index it does a **COLLSCAN** — reads every document in the collection and tests each one against the filter. With an index it can jump straight to the matching entries (topic 10 explains this in detail). The planner's choice is visible with `.explain()`, which you will use in topic 10.

Matching itself is per-document: MongoDB walks the query document field by field and tests each operator against the document's value. For arrays, a condition on the array field is tested against *each element* — that is why `{ skills: 'node' }` matches when any element equals `'node'`, and why `$elemMatch` exists for conditions that must hold on one element.

## 5. Architecture / Workflow

```text
Your code
  │
  ▼
find({ age: { $gt: 21 }, city: 'Karachi' })
  .sort({ age: -1 })
  .limit(10)
  │
  ▼
Driver builds a cursor (nothing sent yet)
  │
  ▼
toArray() → query sent to the server
  │
  ▼
Server: query planner picks COLLSCAN or an index
  │
  ▼
Server: tests each candidate document against the filter
  │
  ▼
Server: sorts, skips, limits — returns matching documents
  │
  ▼
Driver: documents arrive as plain JavaScript objects
```

## 6. Real-World Examples

- **E-commerce:** "products in stock, priced between 1000 and 5000, in category electronics, sorted by rating" — `{ inStock: true, price: { $gte: 1000, $lte: 5000 }, category: 'electronics' }` with `.sort({ rating: -1 })`.
- **Q-less (your semester project idea):** "tokens waiting at the admin office, created today, position less than 5" — `{ office: 'admin', status: 'waiting', createdAt: { $gte: today } }` with `.sort({ position: 1 })`.
- **AI Study Buddy:** "flashcards for this user, due today, not yet mastered" — `{ userId, nextReview: { $lte: now }, mastered: { $ne: true } }`.
- **Admin dashboards:** "users who signed up this month but never verified their email" — `{ createdAt: { $gte: firstOfMonth }, verified: { $ne: true } }` (note `$ne: true` also matches documents where the field is missing — a classic trap; `{ verified: false }` is usually what you mean).
- **Search boxes:** "name starts with what the user typed" — `{ name: { $regex: '^' + input, $options: 'i' } }`, with the input escaped so a user cannot inject regex.
- **Moderation queue:** "comments flagged more than twice, newest first" — `{ 'flags.count': { $gt: 2 } }` with `.sort({ createdAt: -1 })`. Dot notation reaches into the embedded `flags` subdocument.
- **Finding bad data:** "users whose age is stored as a string" — `{ age: { $type: 'string' } }`. This is a data-quality query you run after an import, and it is the fastest way to prove a flexible schema has gone wrong somewhere.

## 7. Code Examples

The runnable example is [`examples/query-operators.mjs`](./examples/query-operators.mjs). It inserts 5 users and 2 orders with fixed ObjectIds, then runs 12 queries. Expected output is in [`example.txt`](./examples/example.txt).

```js
// Comparison: age greater than 21
await users.find({ age: { $gt: 21 } }).toArray();

// $in: city is Karachi or Lahore
await users.find({ city: { $in: ['Karachi', 'Lahore'] } }).toArray();

// Logical: active AND from Karachi
await users.find({ $and: [{ active: true }, { city: 'Karachi' }] }).toArray();

// Element: documents where the "active" field does not exist
await users.find({ active: { $exists: false } }).toArray();

// Array: has BOTH node and react in skills
await users.find({ skills: { $all: ['node', 'react'] } }).toArray();

// $elemMatch: ONE item must be a laptop with qty >= 3
await orders.find({ items: { $elemMatch: { product: 'laptop', qty: { $gte: 3 } } } }).toArray();

// Evaluation: name starts with "A"
await users.find({ name: { $regex: '^A' } }).toArray();

// Projection + sort + pagination
await users.find({}, { projection: { _id: 0, name: 1, city: 1 } }).toArray();
await users.find().sort({ age: -1 }).skip(1).limit(2).toArray();

// Count
await users.countDocuments({ active: true });
```

**How to run the examples:**

```bash
NODE_PATH=/tmp/mongo-verify/node_modules node examples/query-operators.mjs
```

The example uses an in-memory MongoDB server (`mongodb-memory-server`), so no MongoDB installation is needed. It starts the server, connects, runs the demo, prints the output, then closes the client, stops the server, and exits. Output is deterministic — fixed ObjectIds, no timestamps — so re-running it produces output byte-identical to `example.txt`.

## 8. Step-by-Step Code Explanations

1. **Fixed ObjectIds** — every inserted document gets an `_id` like `new ObjectId('000000000000000000000001')`. Real applications let MongoDB generate ObjectIds, but fixed ones make the example output identical on every run, so you can diff it against `example.txt`.
2. **`{ age: { $gt: 21 } }`** — the field `age` is compared with the operator `$gt`. MongoDB returns Ayesha (25), Sara (30), and Omar (22). Talha (21) is excluded because `$gt` is strict.
3. **`{ city: { $in: ['Karachi', 'Lahore'] } }`** — one operator tests membership in a list. This replaces writing `{ $or: [{ city: 'Karachi' }, { city: 'Lahore' }] }`.
4. **`$and`** — used here for clarity, though `{ active: true, city: 'Karachi' }` would mean the same thing. Explicit `$and` becomes necessary when one field needs two conditions.
5. **`{ active: { $exists: false } }`** — Omar has no `active` field at all, so he is the only match. This is how you find "incomplete" documents.
6. **`{ skills: 'mongodb' }`** — plain equality against an array field matches when *any* element equals the value. No operator needed for the simple case.
7. **`{ skills: { $all: ['node', 'react'] } }`** — Ayesha and Omar have both skills. Talha has `node` but not `react`, so he is excluded.
8. **`$elemMatch`** — the orders collection proves why it exists. Order `...012` has a laptop item with qty 3; order `...011` has a laptop (qty 1) and a mouse (qty 2). Without `$elemMatch`, separate dot-notation conditions would wrongly match `...011` too.
9. **`{ name: { $regex: '^A' } }`** — `^` anchors the pattern to the start. Only Ayesha matches.
10. **Projection `{ _id: 0, name: 1, city: 1 }`** — the returned documents contain only `name` and `city`. Note `_id: 0`: without it, `_id` would be included by default.
11. **`.sort({ age: -1 }).skip(1).limit(2)`** — sorted descending: Sara (30), Ayesha (25), Omar (22), Talha (21), Bilal (19). Skip Sara, take the next two: Ayesha, Omar.
12. **`countDocuments({ active: true })`** — returns 3 (Talha, Ayesha, Sara). Omar is not counted: his `active` field is missing, and missing is not `true`.

## 9. Common Misconceptions

- **"`find()` returns an array."** No — it returns a cursor. Forgetting `.toArray()` (or iteration) is the most common beginner error; you get a cursor object, not your documents.
- **"`{ age: 21 }` and `{ age: { $eq: 21 } }` are different."** They are identical. The plain form is shorthand for `$eq`.
- **"`$ne: true` means false."** It means "not true" — which includes documents where the field is missing entirely. If you mean exactly `false`, write `{ verified: false }`.
- **"Dot notation on arrays checks one element."** Wrong — `{ 'items.product': 'laptop', 'items.qty': { $gte: 3 } }` can match different elements. Use `$elemMatch` when the conditions must hold on the *same* element.
- **"`skip()` pagination is fine at any scale."** It is fine for small data, but `skip(100000)` still reads and discards 100,000 documents. Range-based pagination (`_id: { $gt: lastSeenId }`) is the scalable pattern.
- **"Regex search is always slow."** Only unanchored regexes are. A regex anchored with `^` can use an index on that field; `/developer/` with no anchor cannot.
- **"`$where` is a handy shortcut."** It runs JavaScript once per document, cannot use indexes, and is a security risk if user input reaches it. Avoid it.

## 10. Important Technical Terminology

- **Operator** — a `$`-prefixed key that changes how a value is matched.
- **Cursor** — a lazy pointer to query results; nothing is fetched until you iterate it.
- **Projection** — choosing which fields come back from a query.
- **COLLSCAN** — a full collection scan: reading every document to find matches. The slow path, visible in `explain()` (topic 10).
- **BSON** — Binary JSON, the format MongoDB stores documents in. It has more types than JSON (ObjectId, Date, Decimal128).
- **Dot notation** — addressing a nested field as `'address.city'`, or an array element's field as `'items.qty'`.
- **Pagination** — returning results a page at a time, with `limit`/`skip` or with range queries.

## 11. Summary

- Query operators (`$gt`, `$in`, `$and`, `$exists`, `$all`, `$elemMatch`, `$regex`, …) turn exact-match lookups into real questions.
- Comparison operators handle ranges and sets; logical operators combine conditions; element operators test presence and type; array operators test array contents — with `$elemMatch` for same-element conditions.
- Projection controls which fields come back; `sort`/`limit`/`skip` control order and paging; `countDocuments` counts matches.
- `find()` returns a cursor, not an array — the query only runs when you iterate it.
- Watch out for `$ne` matching missing fields, dot notation matching different array elements, and `skip()` getting slow at scale.

## 12. Interview Questions and Answers

**Q1. What is the difference between `{ age: 21 }` and `{ age: { $eq: 21 } }`?**
A: Nothing — the first is shorthand for the second. Plain equality is `$eq` under the hood.

**Q2. How do you find documents where age is between 18 and 30?**
A: `{ age: { $gte: 18, $lte: 30 } }` — two operators on the same field in one object. Or explicit `$and` with two conditions.

**Q3. What does `$in` do, and when is it better than `$or`?**
A: `$in` tests whether a field's value is in a list: `{ city: { $in: ['Karachi', 'Lahore'] } }`. It is shorter and clearer than an `$or` of equalities on the same field.

**Q4. Why does `{ 'items.product': 'laptop', 'items.qty': { $gte: 3 } }` sometimes match the wrong order?**
A: Dot notation tests each condition against *any* element — the laptop and the qty-3 item can be different elements. `$elemMatch` forces both conditions onto the *same* element.

**Q5. What is the difference between `$all` and `$in`?**
A: `$in` matches if the field equals *any* value in the list. `$all` (for arrays) matches only if the array contains *every* value in the list.

**Q6. When would you use `$exists`?**
A: To find documents missing a field (or having it) — common in flexible schemas, e.g. finding users who never got an `active` flag: `{ active: { $exists: false } }`.

**Q7. What does `find()` return, and when does the query actually run?**
A: A cursor. The query is only sent to the server when you iterate it — `toArray()`, `for await...of`, or `next()`.

**Q8. How does projection work, and what is the one rule?**
A: `{ field: 1 }` includes, `{ field: 0 }` excludes. You cannot mix include and exclude in one projection — except `_id`, which you may exclude (`_id: 0`) while including others. `_id` is included by default.

**Q9. How do you paginate, and why is `skip()` a problem at scale?**
A: `.skip((page - 1) * size).limit(size)`. It gets slower as the offset grows because the server still reads and discards the skipped documents. Range pagination (`{ _id: { $gt: lastId } }`) scales better.

**Q10. What is `$expr` for?**
A: Comparing two fields of the *same* document, e.g. `{ $expr: { $gt: ['$price', '$cost'] } }`. Normal operators can only compare a field against a fixed value.

**Q11. Why is an unanchored `$regex` slow?**
A: `/developer/` must scan every document because the match can start anywhere. An anchored regex like `/^dev/` can use an index on that field.

**Q12. `countDocuments()` vs `estimatedDocumentCount()` — which and when?**
A: `countDocuments(filter)` counts exactly the documents matching a filter. `estimatedDocumentCount()` is fast but counts the whole collection with no filter. The old `count()` is deprecated.

## 13. References

- MongoDB manual — Query operators — https://www.mongodb.com/docs/manual/reference/operator/query/
- MongoDB manual — Comparison operators — https://www.mongodb.com/docs/manual/reference/operator/query-comparison/
- MongoDB manual — Logical operators — https://www.mongodb.com/docs/manual/reference/operator/query-logical/
- MongoDB manual — Array operators — https://www.mongodb.com/docs/manual/reference/operator/query-array/
- MongoDB manual — `find()` and projection — https://www.mongodb.com/docs/manual/reference/method/db.collection.find/
- MongoDB manual — Cursors — https://www.mongodb.com/docs/manual/reference/method/js-cursor/
- MongoDB Node.js driver — https://www.mongodb.com/docs/drivers/node/current/

---

[← Module 03 README](../README.md) · [Previous: 06 — CRUD Operations](../06-crud-operations/README.md) · [Next: 08 — Schema Design →](../08-schema-design/README.md)

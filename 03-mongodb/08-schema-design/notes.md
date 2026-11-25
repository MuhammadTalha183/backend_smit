# 08 — Schema Design

> **Module:** [03 — MongoDB](../README.md) · **Previous:** [07 — Query Operators](../07-query-operators/README.md) · **Next:** [09 — Relationships](../09-relationships/README.md)

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

MongoDB is famous for having "no schema" — you can insert any document into any collection. That freedom is real, and it is also the fastest way to build a database nobody can maintain. Schema design is the discipline of *choosing* a shape for your documents on purpose, instead of letting it happen by accident.

The single most important decision in MongoDB schema design is one question: **embed or reference?** Do related data live inside the same document (embedded), or in a separate collection connected by an ObjectId (referenced)? Get this decision right and your queries are fast and simple. Get it wrong and every read becomes a join, or every update touches a hundred documents.

This topic gives you the rules for that decision, the six rules of thumb MongoDB's own designers teach, and the tool that lets you enforce a schema without losing flexibility: `$jsonSchema` validation.

## 2. Definitions

- **Schema** — the shape of your documents: which fields exist, what types they have, and how documents relate to each other. In MongoDB the schema is a design decision, not something the database forces on you (unless you add validation).
- **Embedding** — storing related data *inside* the parent document, e.g. a post document containing its `comments` array.
- **Referencing** — storing related data in a *separate* collection and linking to it with an ObjectId, e.g. an order storing `userId`.
- **Denormalisation** — deliberately duplicating data (e.g. storing the author's name inside each post) so reads need no join. The price is keeping the copies in sync.
- **Schema validation (`$jsonSchema`)** — rules attached to a collection that reject documents breaking them (wrong types, missing required fields, negative prices).
- **Document growth** — a document getting bigger over time (e.g. an ever-growing comments array). MongoDB documents have a 16 MB limit, and growing documents can hurt performance.
- **Working set** — the data your application actually touches day to day. Good schema design keeps the working set small and in memory.

## 3. Detailed Explanations

### 3.1 Embedding vs referencing — the core decision

| | Embedding | Referencing |
|---|---|---|
| **Read** | One read gets everything — fast | Needs a second query or `$lookup` |
| **Write** | One atomic update of the whole document | Update each document separately |
| **Size** | Document grows; 16 MB limit | Documents stay small |
| **Duplication** | Data lives in one place | Same data may be referenced from many places |
| **Best when** | Data is read together, small, rarely changes alone | Data is large, shared, or changes independently |

The rule of thumb: **design for how you read, not how you store.** Ask "when I show this screen, what do I need in one go?" If the answer is "the post *and* its comments", embed the comments. If the answer is "the order, and *sometimes* the buyer", reference the buyer.

### 3.2 The six rules of thumb

MongoDB's documentation teaches six rules for deciding. Learn them by heart — interviewers ask about them.

1. **Favour embedding unless there is a good reason not to.** Embedding is the default in MongoDB; it is what the document model is for.
2. **Needing to access an object on its own is a good reason not to embed it.** If comments are listed, searched, or moderated without their post, they deserve their own collection.
3. **Arrays should not grow without bound.** A comments array with 10 entries is fine; a `likes` array with 2 million entries will hit the 16 MB document limit and slow every read of the parent. If it can grow forever, reference it.
4. **Don't be afraid to duplicate data — but know the cost.** Storing `authorName` inside each post makes reads instant, but renaming the author means updating every post. Duplicate data that rarely changes; reference data that changes often.
5. **Consider the write-to-read ratio.** Data written once and read a thousand times (a blog post) wants embedding and duplication. Data written constantly (a live counter) wants its own small document.
6. **Apply the rules to your *actual* use cases, not hypothetical ones.** Design for the queries you really run, not the ones you imagine you might run one day.

### 3.3 When to embed — a checklist

Embed when **all** of these are mostly true: the child data is always read with the parent; it is small and bounded; it is never queried on its own; it changes together with the parent. Classic examples: a user's address, a post's comments (while small), an order's line items, a product's specifications.

### 3.4 When to reference — a checklist

Reference when **any** of these is true: the data is large or unbounded; it is accessed on its own; many documents share it (one author, many books); it changes independently and often; you need many-to-many relationships (topic 09). Classic examples: users referenced by orders, courses referenced by enrolments, authors referenced by books.

### 3.5 Schema validation with `$jsonSchema`

Flexible does not have to mean lawless. When you create a collection you can attach a validator:

```js
await db.createCollection('products', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'price'],
      properties: {
        name: { bsonType: 'string' },
        price: { bsonType: 'number', minimum: 0 },
      },
    },
  },
});
```

Now an insert missing `price`, or with `price: -100`, is rejected by the *database* with error code 121 — no matter which application, script, or teammate wrote it. Validation has two levels: `strict` (the default — every insert and update is checked) and `moderate` (only new documents and changed fields are checked, so old bad data can stay). And two actions: `error` (reject, the default) or `warn` (log and allow — useful when tightening rules on an existing collection).

Validation is your safety net, not your whole schema: it checks types and required fields, but it cannot check business rules like "this email must belong to a real user". That is the application's job.

### 3.6 Flexible schema discipline

Because MongoDB lets every document differ, teams need discipline:

- **One shape per collection, by convention.** All `users` documents have the same core fields. Optional fields are fine; surprise fields are not.
- **Version your documents.** Add a `schemaVersion: 1` field when you change a shape, so old and new documents can coexist and migrate gradually.
- **Validate at the boundary.** The database validator catches bad data; the application (Mongoose schemas in topic 13, or validation middleware in Express) catches it earlier with better error messages.
- **Never store two types in one field.** An `age` that is sometimes a number and sometimes a string will break sorting, `$gt` queries, and your sanity. `$type` queries (topic 07) find these mistakes.

### 3.7 Three named schema patterns (from MongoDB's own pattern catalogue)

Beyond embed/reference, MongoDB documents three reusable patterns worth knowing by name:

- **Attribute pattern** — when a document has many similar fields that you need to *search* (e.g. a product with `color`, `size`, `material` filters that vary per product), store them as an array of `{ k, v }` pairs instead: `attributes: [{ k: 'color', v: 'red' }, { k: 'size', v: 'M' }]`. Now one query — `{ attributes: { $elemMatch: { k: 'color', v: 'red' } } }` — searches any attribute, and adding a new attribute needs no schema change.
- **Bucket pattern** — for time-series data (sensor readings, logs, token history): group many small measurements into one document per time bucket, e.g. one document per device per hour holding an array of readings. It cuts the document count dramatically and makes range reads one fetch instead of thousands.
- **Computed pattern** — when a read needs an expensive calculation (a product's average rating, a user's total spend), store the *result* in the document and update it on write, instead of computing it on every read. It trades a little write cost for a lot of read speed, and it is the same idea as denormalisation applied to numbers.

### 3.8 Worked case — designing a small shop from scratch

Requirements: products, customers, orders. The screens: product list, product page, checkout, "my orders".

- **Products** — one collection. Fields: `name`, `price`, `stock`, `category`, `specs` (embedded subdocument — specs are read with the product and never alone).
- **Customers** — one collection. `address` embedded (read with the customer, small, bounded). `orders` NOT embedded — unbounded, and orders are read on their own ("my orders" page).
- **Orders** — one collection, referencing `customerId`. Line items **embedded** as an array of `{ productId, productName, price, qty }` — the snapshot pattern: the price at purchase time is frozen, and the order reads in one fetch. The `productName` copy is deliberate duplication (rule 4): names rarely change, and the order must show what was bought even if the product is later renamed or deleted.
- **Validation** — `$jsonSchema` on `products` (price ≥ 0, stock ≥ 0, name required) and on `orders` (items non-empty, total ≥ 0). The database is the last line of defence; Express validation (Module 02, topic 09) gives the friendly errors.

Four collections, two embeddings, two references, one hybrid — and every decision traces back to a screen and a rule of thumb. That traceability is the whole skill.

### 3.9 Changing a schema in production — migration strategies

Schemas change. The question is how to change them without downtime or data loss:

- **Lazy migration (read-time):** old documents stay as they are; application code handles both shapes (check `schemaVersion`, fill in defaults for missing fields) and rewrites the document in the new shape on the next update. No big-bang rewrite, no downtime. Best for most cases.
- **Backfill script:** a one-off script walks the collection and rewrites every document to the new shape. Simple and complete, but on a large collection it takes time and load — run it off-peak, in batches, with a resumable cursor.
- **Dual-write:** during a transition, the application writes both the old and new shape. Old readers keep working; new readers use the new shape. Once all readers are migrated, stop writing the old shape and backfill the stragglers. The most careful option, used for high-traffic collections.
- **Expand then contract:** first add the new field (expand), migrate the data, then remove the old field (contract) — never both at once. The same discipline as API versioning.

Whatever you choose, never run an untested migration against production data, and always have a rollback: the migration script should be reversible, or the old shape recoverable from a backup.

## 4. How It Works Internally

A MongoDB document is stored as **BSON** — binary JSON. Fields are stored in the order you write them, and the whole document is stored contiguously. That is why embedding is fast: reading a post reads its embedded comments in the same disk read, with no second lookup.

The 16 MB document limit exists because documents are loaded into memory whole. A document that grows without bound (an ever-growing array) eventually forces MongoDB to move it on disk when it no longer fits its allocated space — this is called **document relocation**, and it costs performance. Referencing avoids it: each document stays small and stable.

`$jsonSchema` validation runs inside the server on every insert and update (at `strict` level). The server parses the document against the schema before writing; a failure aborts the write with error code 121 and nothing is stored. Validation costs a little CPU per write — negligible compared to the bugs it prevents.

## 5. Architecture / Workflow

```text
Design question: "What does one screen need in one read?"
  │
  ├─ Read together, small, bounded ──> EMBED
  │     e.g. post + comments, order + line items
  │
  ├─ Read alone, large, shared ──> REFERENCE (ObjectId)
  │     e.g. user ← orders, author ← books
  │
  └─ Both? ──> EMBED a summary, REFERENCE the detail
        e.g. order embeds { productName, price } AND
        references productId for the full product

Then enforce the shape:
  $jsonSchema validator on the collection (types, required, ranges)
  + application-level checks (Mongoose / Express validation)
```

## 6. Real-World Examples

- **Blog (embedding):** a post embeds its comments while they are few. When a post goes viral and comments pass a few hundred, the team moves comments to their own collection — rule 3 (unbounded arrays).
- **E-commerce order (mixed):** an order embeds line items `{ productName, price, qty }` — a snapshot of what was bought at that price — *and* references `productId`, so the shop can still link to the live product page. The embedded copy is deliberate duplication: even if the product price changes later, the old order still shows what the customer paid.
- **Q-less:** a queue embeds nothing big — a token references `officeId` and `userId`. Tokens are created and completed constantly (high write rate, rule 5), and offices are shared by thousands of tokens.
- **AI Study Buddy:** a flashcard deck embeds its cards while the deck is small; a user's progress (which cards are mastered, next review date) lives in a separate collection because it changes on every study session.
- **Social app:** a user's `followers` list is referenced, never embedded — it grows without bound and is read on its own (rule 2 and 3).

## 7. Code Examples

The runnable example is [`examples/schema-design.mjs`](./examples/schema-design.mjs). It demonstrates embedding (post + comments), referencing (order → user), and `$jsonSchema` validation (a valid product inserts, a negative price is rejected with error code 121). Expected output is in [`example.txt`](./examples/example.txt).

```js
// 1. EMBEDDING: comments live inside the post document
await posts.insertOne({
  _id: new ObjectId('000000000000000000000001'),
  title: 'Why MongoDB?',
  author: 'Talha',
  comments: [
    { text: 'Great post!', by: 'Ayesha' },
    { text: 'Very helpful.', by: 'Bilal' },
  ],
});

// 2. REFERENCING: the order stores only the user's ObjectId
await orders.insertOne({
  userId: new ObjectId('000000000000000000000002'),
  total: 2500,
});
const buyer = await users.findOne({ _id: order.userId });

// 3. VALIDATION: $jsonSchema rejects a negative price (error code 121)
await db.createCollection('products', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'price'],
      properties: {
        name: { bsonType: 'string' },
        price: { bsonType: 'number', minimum: 0 },
      },
    },
  },
});
```

**How to run the examples:**

```bash
NODE_PATH=/tmp/mongo-verify/node_modules node examples/schema-design.mjs
```

The example uses an in-memory MongoDB server (`mongodb-memory-server`), so no MongoDB installation is needed. It starts the server, runs the demo, prints the output, then stops the server, cleans up its data directory, and exits. Output is deterministic — fixed ObjectIds, no timestamps — so re-running it produces output byte-identical to `example.txt`.

## 8. Step-by-Step Code Explanations

1. **Embedded comments** — the post document contains a `comments` array with two subdocuments. One `findOne` returns the post *and* both comments: a single read, no join. This is the payoff of embedding.
2. **Subdocument `_id`s** — each comment gets its own fixed ObjectId (`...101`, `...102`). Giving subdocuments ids lets you update or delete one comment later (`{ 'comments._id': ... }`), which is impossible to target cleanly without them.
3. **Referenced order** — the order stores only `userId`. To show the buyer's name you do a second query: `users.findOne({ _id: order.userId })`. Two reads instead of one — the price of referencing. In a real API this second read is often done with `$lookup` (topic 09) instead.
4. **Validation setup** — `createCollection` with a `validator` attaches the rules to the collection itself. `required: ['name', 'price']` means both fields must exist; `price: { minimum: 0 }` rejects negative prices.
5. **Valid insert** — `{ name: 'Keyboard', price: 4500 }` passes every rule and is stored. The output prints `valid product inserted: ok`.
6. **Invalid insert** — `{ name: 'Mouse', price: -100 }` violates `minimum: 0`. The driver throws; the `catch` prints `invalid product rejected: code 121`. Error code **121** is `DocumentValidationFailure` — the number to recognise in logs. Nothing is stored: `products.countDocuments()` is 1, not 2.

## 9. Common Misconceptions

- **"MongoDB has no schema, so I don't need to design one."** MongoDB has no *enforced* schema by default — but your application still assumes a shape. Undesigned schemas become inconsistent ones: the same field as a string in one document and a number in another.
- **"Embedding is always better because joins are slow."** Embedding is better *when the data is read together*. Embed a million-entry array and you hit the 16 MB limit; embed shared data and every copy must be updated.
- **"Referencing is just SQL with extra steps."** Referencing in MongoDB is a deliberate choice for shared or unbounded data, not a default. The default is embedding.
- **"Duplicating data is always wrong."** In MongoDB, controlled duplication is a normal optimisation — the order snapshotting the product price is the textbook case. The rule is: duplicate data that rarely changes, and know what you must update if it does.
- **"Validation replaces application checks."** Validation is the last line of defence at the database. It gives database-level errors (code 121), not friendly messages. Validate in the application for good errors *and* in the database so bad data can never sneak in another way.
- **"A 16 MB document limit means I can embed anything small."** The limit is a hard ceiling, not a target. A document that grows toward megabytes slows every read of it, because MongoDB loads documents whole.

## 10. Important Technical Terminology

- **Denormalisation** — deliberately duplicating data across documents to make reads faster.
- **Working set** — the data your app actually uses regularly; it should fit in RAM.
- **Document relocation** — MongoDB moving a grown document to a bigger space on disk; a cost of unbounded growth.
- **Validator** — rules attached to a collection; `validationLevel` (`strict`/`moderate`) and `validationAction` (`error`/`warn`) control how strictly they apply.
- **BSON type** — the data types MongoDB stores (`string`, `int`, `double`, `objectId`, `date`, …) — what `$jsonSchema` checks with `bsonType`.

## 11. Summary

- The core schema question is **embed or reference**: embed data read together, small, and bounded; reference data read alone, large, shared, or fast-changing.
- The six rules of thumb: favour embedding; don't embed what is accessed alone; never let arrays grow without bound; duplication is fine if you know the cost; consider the write-to-read ratio; design for real queries.
- `$jsonSchema` validation enforces types, required fields, and ranges at the database (error code 121), without giving up flexibility.
- Flexible schema needs discipline: one shape per collection, version your documents, never mix types in one field.

## 12. Interview Questions and Answers

**Q1. Embed or reference — how do you decide?**
A: Ask how the data is read. If it is always read with the parent, is small and bounded, embed it. If it is read alone, large, shared by many documents, or changes independently, reference it with an ObjectId.

**Q2. What are the six rules of thumb for MongoDB schema design?**
A: (1) Favour embedding unless there is a good reason not to. (2) Data accessed on its own should not be embedded. (3) Arrays must not grow without bound. (4) Duplicating data is acceptable if you know the update cost. (5) Consider the write-to-read ratio. (6) Design for your real use cases.

**Q3. What happens if an embedded array grows forever?**
A: The document grows toward the 16 MB limit, reads get slower (documents load whole), and MongoDB may have to relocate the document on disk. Reference unbounded data instead.

**Q4. When is duplicating data a good idea?**
A: When the duplicated data rarely changes and is read together with the parent — e.g. an order snapshotting the product name and price at purchase time, so old orders stay correct even if the price changes.

**Q5. What is `$jsonSchema` validation and what error does it produce?**
A: Rules attached to a collection (types, required fields, ranges) that the server enforces on insert/update. A violation fails the write with error code 121 (`DocumentValidationFailure`).

**Q6. What is the difference between validation levels `strict` and `moderate`?**
A: `strict` (default) checks every insert and update. `moderate` checks only new documents and fields being changed, so pre-existing bad data is tolerated.

**Q7. What is the 16 MB document limit, and why does it matter for design?**
A: No single document may exceed 16 MB. It matters because it caps embedding: unbounded arrays or huge embedded data will eventually break inserts.

**Q8. How do you handle documents whose shape changed over time?**
A: Add a `schemaVersion` field, let old and new shapes coexist, and migrate documents gradually (lazily on read, or with a migration script) instead of a big-bang rewrite.

**Q9. Why would you embed a summary AND reference the detail?**
A: The hybrid pattern: the order embeds `{ productName, price }` for fast display and references `productId` for the full product. Fast reads plus a single source of truth.

**Q10. Does schema validation replace validation in Express (topic 09 of Module 02)?**
A: No — they complement each other. Express validation gives friendly, field-by-field errors to the client; database validation is the last line of defence that no other writer can bypass.

## 13. References

- MongoDB manual — Data modelling introduction — https://www.mongodb.com/docs/manual/core/data-modeling-introduction/
- MongoDB manual — Schema design patterns — https://www.mongodb.com/docs/manual/data-modeling/schema-design-patterns/
- MongoDB manual — Schema validation — https://www.mongodb.com/docs/manual/core/schema-validation/
- MongoDB manual — `$jsonSchema` — https://www.mongodb.com/docs/manual/reference/operator/query/jsonSchema/
- MongoDB manual — Document size limit — https://www.mongodb.com/docs/manual/reference/limits/#mongodb-limit-BSON-Document-Size

---

[← Module 03 README](../README.md) · [Previous: 07 — Query Operators](../07-query-operators/README.md) · [Next: 09 — Relationships →](../09-relationships/README.md)

# 09 — Relationships

> **Module:** [03 — MongoDB](../README.md) · **Previous:** [08 — Schema Design](../08-schema-design/README.md) · **Next:** [10 — Indexing](../10-indexing/README.md)

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

Every real application is a web of relationships: users have orders, authors have books, students take courses, posts have comments. SQL databases express these with foreign keys and JOINs. MongoDB has no foreign keys and no JOINs in the SQL sense — it has two tools instead: **embedding** and **referencing**, which you met in topic 08.

This topic puts those tools to work on the three relationship shapes — one-to-one, one-to-many, and many-to-many — and adds the tool that does the joining for you: **`$lookup`**, MongoDB's aggregation-stage join. By the end you can look at any two collections and say, in one sentence, how they should be connected and why.

## 2. Definitions

- **One-to-one (1:1)** — each document on side A relates to exactly one document on side B, e.g. a user and their profile.
- **One-to-many (1:N)** — one document relates to many, e.g. one author and many books.
- **Many-to-many (M:N)** — many documents relate to many, e.g. students and courses.
- **Manual reference** — storing another document's `_id` (an ObjectId) in a field, e.g. `authorId`. MongoDB does not enforce it — your application must keep it consistent.
- **Join collection (junction / linking collection)** — a collection whose documents exist only to connect two other collections, e.g. `enrolments` with `{ studentId, courseId }`.
- **`$lookup`** — an aggregation pipeline stage that joins documents from another collection, like a SQL LEFT JOIN, and attaches the matches as an array field.
- **Denormalised reference** — storing both the id *and* a copy of a frequently needed field, e.g. `{ authorId, authorName }`, so most reads need no join.

## 3. Detailed Explanations

### 3.1 One-to-one — embed by default

A user and their profile, an order and its shipping address, a student and their emergency contact. Ask: is the second half ever read alone? Almost never — you show a profile *with* its user. So **embed it**:

```js
{ _id: ..., name: 'Talha', profile: { bio: 'CS student', city: 'Karachi' } }
```

One read, no join, atomic updates. Reference a 1:1 only when the second half is large (a full CV document), shared (one address used by many users), or protected (sensitive data in a collection with different access rules).

### 3.2 One-to-many — the most common shape

One author, many books. One user, many orders. One post, many comments (while small). Two implementations:

**Referenced (the usual choice):** the "many" side stores the parent's id.

```js
// books collection
{ _id: ..., title: 'Node.js Guide', authorId: ObjectId('...001') }
{ _id: ..., title: 'Express in Practice', authorId: ObjectId('...001') }
```

Finding an author's books is one indexed query: `books.find({ authorId })`. The books can also be listed, searched, and paginated on their own — which is why referencing wins here (rule 2 from topic 08).

**Embedded (the small case):** the parent stores an array of child ids, or the children themselves.

```js
{ _id: ..., name: 'Talha', bookIds: [ObjectId('...021'), ObjectId('...022')] }
```

Storing an array of ids on the parent works while the array stays small. Storing the whole children embedded works only while they are small *and* never read alone. For books, referencing is right: books are searched and opened on their own.

### 3.3 Many-to-many — the join collection

Students and courses: each student takes many courses, each course has many students. Neither side can hold the other without duplication exploding. The answer is a **join collection**:

```js
// enrolments collection — one document per (student, course) pair
{ _id: ..., studentId: ObjectId('...001'), courseId: ObjectId('...011') }
{ _id: ..., studentId: ObjectId('...001'), courseId: ObjectId('...012') }
{ _id: ..., studentId: ObjectId('...002'), courseId: ObjectId('...011') }
```

To find Talha's courses: read his enrolments, then fetch those courses (`courses.find({ _id: { $in: [...] } })`). To find a course's students: the same, in reverse. The join collection can also carry relationship data — `enrolledAt`, `grade`, `completed` — which belongs to *neither* side alone. That is the giveaway that you need one: if the relationship itself has fields, it is a collection.

The alternative — arrays of ids on both sides (`student.courseIds` and `course.studentIds`) — duplicates the relationship and the two copies drift apart. Avoid it.

### 3.4 `$lookup` — the database does the join

When you need the joined data in one query, `$lookup` does it inside an aggregation pipeline:

```js
await orders.aggregate([
  { $lookup: {
      from: 'users',          // collection to join
      localField: 'userId',   // field in orders
      foreignField: '_id',    // field in users
      as: 'buyer',            // result array field
  } },
  { $project: { _id: 0, total: 1, buyerName: { $arrayElemAt: ['$buyer.name', 0] } } },
]);
```

`$lookup` is a **left outer join**: every order appears in the result, even one whose `userId` matches nobody — its `buyer` array is just empty. That is why the example uses `$arrayElemAt: ['$buyer.name', 0]` to pull the first (and only) buyer's name out of the array. A plain `$lookup` returns the joined documents as an **array**, even when you know there is at most one match.

Two practical notes. First, `$lookup` can be slow on large collections without an index on the `foreignField` — `_id` is indexed by default, which is one reason to join on `_id`. Second, `$lookup` runs in the aggregation pipeline (topic 11 covers pipelines properly); here you only need to know it exists and what it returns.

### 3.5 Which shape, which implementation — the decision table

| Relationship | Usually implemented as | When to do it differently |
|---|---|---|
| One-to-one | Embed the second half | Reference if large, shared, or separately secured |
| One-to-many | Reference from the "many" side (`authorId`) | Embed if the children are small, bounded, never read alone |
| Many-to-many | Join collection (`enrolments`) | Arrays of ids only for tiny, fixed sets |

### 3.6 Keeping references consistent

MongoDB does **not** enforce references. Nothing stops you from storing an `authorId` that points at a deleted author, or deleting a user who still has orders. Consistency is the application's job:

- **On delete, decide the policy:** delete the children too (cascade), block the delete while children exist, or leave orphaned references and filter them out on read. Pick one per relationship and write it down.
- **On read, expect orphans:** a `$lookup` that finds nothing returns an empty array — handle it instead of crashing on `buyer[0].name`.
- **Mongoose (topic 13)** adds `populate()`, which automates the second query, and can validate that referenced ids exist — but it still does not enforce anything at the database level.

### 3.7 `$lookup` with a pipeline — filtering the joined side

The simple `$lookup` joins everything, then you filter. The pipeline form filters *during* the join, which is much cheaper on large collections:

```js
await orders.aggregate([
  {
    $lookup: {
      from: 'users',
      localField: 'userId',
      foreignField: '_id',
      pipeline: [{ $project: { _id: 0, name: 1, email: 1 } }],
      as: 'buyer',
    },
  },
]);
```

Here only `name` and `email` come back from the users collection — the join never loads full user documents. Two more pipeline tricks: `$lookup` with `let` + `$expr` can join on conditions more complex than field equality (e.g. "orders from the last 30 days"), and `$unwind` after a `$lookup` turns the result array into one document per match, which is what you want when you know there is exactly one match and want a flat row.

### 3.8 Decision walkthrough — comments on a post

Apply the whole topic to one decision, step by step:

1. **Shape:** one post has many comments — 1:N.
2. **Read pattern:** comments are shown *with* the post, in order, newest first. → Embed looks right.
3. **Rule 2 check:** are comments ever read alone? Yes — moderation lists all flagged comments across posts, and a user profile lists "my comments". → That pushes toward referencing.
4. **Rule 3 check:** can comments grow without bound? A viral post can collect thousands. → Embedding risks the 16 MB limit and slows every post read.
5. **Decision:** reference — a `comments` collection with `postId`, and the post page does `comments.find({ postId }).sort({ createdAt: -1 })`. The moderation page and the profile page reuse the same collection.
6. **The exception that proves it:** a *small, closed* discussion — e.g. feedback on an assignment, capped at a handful of replies, never moderated separately — stays embedded. Same shape, different use case, different answer. That is why the rules say "design for your real use cases".

### 3.9 Self-referencing and polymorphic relationships

Two shapes that confuse beginners:

- **Self-referencing** — a collection that references itself. Employees have a `managerId` pointing at another employee; categories have a `parentId` pointing at another category; comments have a `replyToId` pointing at another comment. Same tools, one collection: store the parent's ObjectId and query `find({ parentId })` for children. Trees (categories, org charts) are the classic case — and the reason MongoDB has `$graphLookup`, an aggregation stage that walks a tree recursively, which plain `$lookup` cannot do.
- **Polymorphic references** — one field that can point at *different* collections, e.g. a `likes` document whose `targetId` is sometimes a post and sometimes a comment. MongoDB has no built-in support: store both `targetId` *and* `targetType` (`'post'` / `'comment'`), and let the application decide which collection to query. It works, but it is a smell — if you find yourself doing it often, the design usually wants a rethink (often the targets should be one collection with a `kind` field).

## 4. How It Works Internally

A manual reference is just an ObjectId value sitting in a field. MongoDB treats it as opaque data — it has no idea it "points" anywhere. The join happens entirely in your code (two queries) or in the aggregation pipeline (`$lookup`).

`$lookup` works like this internally: for each input document, MongoDB looks up matching documents in the `from` collection. When the `foreignField` is `_id` (or otherwise indexed), it uses that index — fast. Without an index it scans. The matches are attached as an array under the `as` field, and the pipeline continues. Because `$lookup` is a pipeline stage, you can `$match`, `$sort`, and `$project` before and after it — for example, filter orders first, *then* look up only the surviving buyers, which is much cheaper than joining everything.

ObjectIds themselves are 12 bytes: 4 bytes of timestamp, 5 bytes of random value, 3 bytes of counter. They are roughly time-ordered, which is why sorting by `_id` approximates sorting by creation time — a useful property when you paginate with `{ _id: { $gt: lastId } }`.

## 5. Architecture / Workflow

```text
Relationship? ── one-to-one ──> embed (unless large/shared/sensitive)
  │
  ├─ one-to-many ──> "many" side stores parent ObjectId
  │     books.authorId ──> authors._id
  │     read: books.find({ authorId })  (indexed)
  │
  ├─ many-to-many ──> join collection
  │     enrolments { studentId, courseId, ... }
  │     read: enrolments → $in lookup on the other side
  │
  └─ need it joined in one query? ──> $lookup in an aggregation
        orders + users → orders with buyer array
        (then $project to flatten what you need)
```

## 6. Real-World Examples

- **Q-less:** one office has many tokens (1:N, `token.officeId`); one user has many tokens (1:N, `token.userId`). No many-to-many anywhere — the schema stays simple.
- **AI Study Buddy:** one deck has many cards (1:N, `card.deckId` — cards are also studied alone, so referencing wins over embedding); students and decks are many-to-many through a `progress` join collection that also stores `mastered` and `nextReview` — relationship data that belongs to neither side alone.
- **E-commerce:** customers and products are many-to-many through `orders`/`orderItems` — and the order itself is the join document, carrying `qty` and `priceAtPurchase`.
- **University:** students and courses (M:N via `enrolments`); teachers and courses (M:N via `assignments`, which also stores the semester); a student and their transcript (1:1, embedded — never read alone).
- **Social app:** users follow users — a self-referencing many-to-many through a `follows` collection `{ followerId, followingId }`.

## 7. Code Examples

The runnable example is [`examples/relationships.mjs`](./examples/relationships.mjs). It builds a small school database with fixed ObjectIds and demonstrates all four patterns: embedded 1:1 profile, referenced 1:N books, M:N enrolments, and a `$lookup` join of orders to users. Expected output is in [`example.txt`](./examples/example.txt).

```js
// 1. ONE-TO-ONE (embedded): profile lives inside the user
{ _id: TALHA, name: 'Talha', profile: { bio: 'CS student', city: 'Karachi' } }

// 2. ONE-TO-MANY (referenced): each book stores its author's id
{ _id: BOOK1, title: 'Node.js Guide', authorId: TALHA }

// 3. MANY-TO-MANY (join collection): one document per enrolment
{ studentId: TALHA, courseId: NODE_COURSE }
{ studentId: TALHA, courseId: REACT_COURSE }

// 4. $lookup: orders joined to users, buyer name flattened out
await orders.aggregate([
  { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'buyer' } },
  { $project: { _id: 0, total: 1, buyerName: { $arrayElemAt: ['$buyer.name', 0] } } },
  { $sort: { total: -1 } },
]);
```

**How to run the examples:**

```bash
NODE_PATH=/tmp/mongo-verify/node_modules node examples/relationships.mjs
```

The example uses an in-memory MongoDB server (`mongodb-memory-server`), so no MongoDB installation is needed. It starts the server, runs the demo, prints the output, then stops the server, cleans up its data directory, and exits. Output is deterministic — fixed ObjectIds, no timestamps — so re-running it produces output byte-identical to `example.txt`.

## 8. Step-by-Step Code Explanations

1. **Fixed ObjectIds as constants** — `TALHA`, `AYESHA`, `NODE_COURSE` etc. are declared once at the top and reused everywhere. This is both readable and the reason the output is deterministic.
2. **One-to-one** — the profile is a subdocument inside the user. `(await users.findOne({ _id: TALHA })).profile` returns `{ bio: 'CS student', city: 'Karachi' }` in a single read.
3. **One-to-many** — both books store `authorId: TALHA`. `books.find({ authorId: TALHA })` returns both titles. Note the books know their author, but the author document does not list its books — the reference lives on one side only, the "many" side.
4. **Many-to-many** — three enrolment documents encode the whole picture: Talha takes Node and React, Ayesha takes Node. To list Talha's courses the code does two queries: enrolments for his `courseId`s, then `courses.find({ _id: { $in: [...] } })`. The `$in` query is the standard second half of a manual join.
5. **`$lookup`** — the pipeline joins `orders` to `users` on `userId = _id`. The result field `buyer` is an *array*, so `$project` uses `$arrayElemAt: ['$buyer.name', 0]` to pull out the single name. `$sort: { total: -1 }` orders the joined results by total, highest first: Talha (2500), then Ayesha (1800).

## 9. Common Misconceptions

- **"MongoDB has joins, so I can design like SQL."** It has `$lookup`, which is a left outer join inside aggregation — but there are no foreign keys, no enforcement, and no query planner joining across collections for you in `find()`. Design embedded-first; reach for `$lookup` deliberately.
- **"I should store arrays of ids on both sides of a many-to-many."** That duplicates the relationship and the copies drift. One join collection is the single source of truth.
- **"`$lookup` returns the joined document."** It returns an *array* of joined documents under the `as` field — even when there is at most one match. Always handle the array (usually with `$arrayElemAt` or `$unwind`).
- **"If I delete a user, their orders disappear."** Nothing happens automatically. Orphaned references are your application's problem — decide the delete policy (cascade, block, or tolerate) per relationship.
- **"Embedding comments means comments can never be a collection."** Designs evolve. Start embedded while comments are small and read with the post; move them out when rule 2 or 3 bites. MongoDB lets you change the design — that is the point of a flexible schema.
- **"ObjectIds are random."** They are roughly time-ordered (timestamp + random + counter), which is why `_id` sorting approximates creation order.

## 10. Important Technical Terminology

- **Foreign key** — the SQL concept MongoDB does not have: a database-enforced link between tables. In MongoDB the equivalent is a manual reference, enforced by nobody.
- **Left outer join** — a join that keeps every document from the left side, even with no match on the right (`$lookup` behaves this way).
- **`$unwind`** — an aggregation stage that turns an array field into one document per element — the usual partner of `$lookup` when you want one row per joined match.
- **Orphaned reference** — an ObjectId pointing at a document that no longer exists.
- **Cascade delete** — deleting a parent also deletes its children; a policy you implement yourself in MongoDB.

## 11. Summary

- One-to-one: embed by default; reference only if large, shared, or separately secured.
- One-to-many: the "many" side stores the parent's ObjectId; one indexed query finds all children.
- Many-to-many: a join collection is the single source of truth — and it can carry relationship data like `grade` or `enrolledAt`.
- `$lookup` joins inside aggregation (left outer join, result is an array); use `$arrayElemAt` or `$unwind` to flatten it.
- MongoDB never enforces references — your application owns delete policies and orphan handling.

## 12. Interview Questions and Answers

**Q1. How do you model a one-to-many relationship in MongoDB?**
A: Store the parent's ObjectId on each child document (e.g. `book.authorId`), then query `books.find({ authorId })`. Embed only if the children are small, bounded, and never read alone.

**Q2. How do you model many-to-many?**
A: With a join (junction) collection — one document per pair, e.g. `enrolments { studentId, courseId }`. It is the single source of truth and can also hold relationship fields like `grade`.

**Q3. What is `$lookup` and what does it return?**
A: An aggregation stage that joins another collection, like a SQL LEFT JOIN. It attaches matches as an *array* under the `as` field — even when there is at most one match — so you flatten it with `$arrayElemAt` or `$unwind`.

**Q4. Why not store arrays of ids on both sides of a many-to-many?**
A: The relationship is duplicated in two places and the copies drift apart on updates. A join collection stores it once.

**Q5. What happens when you delete a document that others reference?**
A: Nothing, automatically. The references become orphans. Your application must implement a policy: cascade-delete the children, block the delete, or tolerate and filter orphans on read.

**Q6. When would you embed a one-to-one instead of referencing it?**
A: Almost always — a profile is read with its user, never alone. Reference only if the second half is large, shared by many documents, or needs separate access control.

**Q7. How is `$lookup` different from a SQL JOIN?**
A: It runs inside an aggregation pipeline (not in `find()`), it always returns an array, it is a left outer join, and it needs an index on the foreign field to be fast. There is no foreign-key enforcement behind it.

**Q8. What is a denormalised reference, and when is it useful?**
A: Storing the id *plus* a copy of a hot field, e.g. `{ authorId, authorName }`. Most reads then need no join at all; you only join when you need the full author document.

**Q9. How do you find all courses a student takes, given an enrolments collection?**
A: Two queries: `enrolments.find({ studentId })` to get the course ids, then `courses.find({ _id: { $in: courseIds } })`. Or one aggregation with `$lookup` from enrolments to courses.

**Q10. What is `$unwind` and why does it pair with `$lookup`?**
A: `$unwind` splits an array field into one document per element. After a `$lookup` you often `$unwind` the joined array so each joined match becomes its own pipeline document.

## 13. References

- MongoDB manual — Data modelling: one-to-one — https://www.mongodb.com/docs/manual/core/data-modeling-introduction/
- MongoDB manual — Model one-to-many relationships — https://www.mongodb.com/docs/manual/tutorial/model-referenced-one-to-many-relationships/
- MongoDB manual — Model many-to-many relationships — https://www.mongodb.com/docs/manual/tutorial/model-referenced-many-to-many-relationships/
- MongoDB manual — `$lookup` — https://www.mongodb.com/docs/manual/reference/operator/aggregation/lookup/
- MongoDB manual — `$unwind` — https://www.mongodb.com/docs/manual/reference/operator/aggregation/unwind/

---

[← Module 03 README](../README.md) · [Previous: 08 — Schema Design](../08-schema-design/README.md) · [Next: 10 — Indexing →](../10-indexing/README.md)

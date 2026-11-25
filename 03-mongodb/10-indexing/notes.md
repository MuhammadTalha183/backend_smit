# 10 — Indexing

> **Module:** [03 — MongoDB](../README.md) · **Previous:** [09 — Relationships](../09-relationships/README.md) · **Next:** [11 — Aggregation](../11-aggregation/README.md)

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

A query without an index is a librarian who reads every book in the library to find one title. A query with an index is the same librarian using the catalogue. Both give the right answer — one just takes a thousand times longer. Indexing is the single most impactful performance topic in MongoDB: the difference between a query that examines 4 documents and one that examines 4 million.

This topic covers what an index is, the five kinds you will actually use (single-field, compound, multikey, text, unique, TTL), what indexes cost, and how to prove a query is fast with `explain()`. You will also learn the discipline that matters most: **when NOT to index**.

## 2. Definitions

- **Index** — a data structure (a B-tree) that maps field values to the documents containing them, so MongoDB can find matches without scanning the whole collection.
- **Single-field index** — an index on one field, e.g. `{ city: 1 }`.
- **Compound index** — an index on several fields in a fixed order, e.g. `{ city: 1, age: -1 }`.
- **Multikey index** — an index on an array field; MongoDB creates one index entry per array element automatically.
- **Text index** — an index that tokenises string content for full-text search (`$text`).
- **Unique index** — an index that rejects duplicate values (error code 11000).
- **TTL index** — a time-to-live index that automatically deletes documents after a set time.
- **`explain()`** — a method that shows how MongoDB executed a query: which plan won, how many documents were examined, and whether an index was used.
- **COLLSCAN / IXSCAN** — the two plan stages that matter most: COLLSCAN reads the whole collection; IXSCAN reads the index.
- **Covered query** — a query answered entirely from the index, without fetching any documents.

## 3. Detailed Explanations

### 3.1 What an index is — the book analogy

A collection without an index is a book with no index pages: to find "Karachi" you read every page. A single-field index on `city` is the book's index: a sorted list of cities, each pointing at the pages (documents) where it appears. Looking something up becomes "find it in the sorted list, jump to the page" — logarithmic time instead of linear. That is the whole idea; everything else is detail.

Every collection already has one index: `_id_`, on `_id`, created automatically. Every other index you create yourself, deliberately, for queries you actually run.

### 3.2 Single-field indexes

```js
await users.createIndex({ city: 1 });   // ascending
await users.createIndex({ age: -1 });   // descending
```

`1` means ascending, `-1` descending. For a single-field index the direction matters only for sorting: an ascending index can serve both ascending and descending sorts on that field. Create indexes for fields that appear in your `find()` filters and sorts — the fields your application actually queries, not every field you can think of.

### 3.3 Compound indexes — order matters

```js
await users.createIndex({ city: 1, age: -1 });
```

A compound index serves queries on `city` alone, and on `city` + `age` together — but **not** on `age` alone. This is the **leftmost prefix rule**: the index is useful for queries that use a left-hand prefix of its fields. It also serves the sort `{ city: 1, age: -1 }` directly, without an in-memory sort step.

Rule of thumb for field order inside a compound index — **ESR**: **E**quality first (fields matched with `=`), then **S**ort (fields you sort by), then **R**ange (fields matched with `$gt`/`$lt`). `{ city: 1, age: -1 }` in the example follows it: `city` is an equality filter, `age` is the sort.

### 3.4 Multikey indexes — arrays are automatic

Index an array field and MongoDB creates a multikey index: one index entry per element.

```js
await users.createIndex({ skills: 1 });
// a user with skills ['node', 'react'] gets two index entries
```

You do not declare anything special — if the field holds arrays, the index becomes multikey by itself. One limitation: a compound index may contain **at most one** array field.

### 3.5 Text indexes — search, not filter

```js
await users.createIndex({ bio: 'text' });
await users.find({ $text: { $search: 'developer' } });
```

A text index tokenises the text (splits it into words, stems them, drops stop-words) and supports `$text` search with relevance scoring. Notes: a collection may have only **one** text index (though it can cover several fields: `{ bio: 'text', name: 'text' }`), and `$text` cannot be combined with all operators. For real search products teams usually reach for Atlas Search or Elasticsearch — the built-in text index is for the simple cases.

### 3.6 Unique indexes — constraints, not just speed

```js
await users.createIndex({ email: 1 }, { unique: true });
```

A duplicate insert is rejected with error code **11000** (`DuplicateKey`). This is how you enforce "one account per email" at the database level — the only place that guarantee can truly live, because two requests racing past an application-level check will both pass it. Unique indexes also work on compound fields (`{ officeId: 1, tokenNumber: 1 }` — one token number per office, but the same number in different offices is fine).

### 3.7 TTL indexes — data that deletes itself

```js
await sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 });
```

A TTL index tells MongoDB to delete documents once the indexed date field is older than `expireAfterSeconds`. Perfect for sessions, one-time codes, and temporary tokens — the exact thing Q-less needs for expired tokens. Deletion runs on a background thread roughly once a minute, so documents may live up to ~60 seconds past expiry. TTL only works on a single date field (or an array of dates).

### 3.8 What indexes cost — the other side

Indexes are not free, and this is where beginners go wrong:

- **Writes get slower.** Every insert, update, and delete must update every index on the collection. Five indexes means five B-tree writes per insert.
- **Disk and RAM.** Indexes live on disk and compete with your data for RAM. An index that does not fit in memory is barely better than no index.
- **They only help queries they match.** An index on `email` does nothing for a query on `city`. Unused indexes are pure cost — audit them (MongoDB Atlas shows index usage; `$indexStats` shows it on self-hosted servers).

The professional rule: **index the queries you run, measure with `explain()`, and remove indexes nobody uses.**

### 3.9 `explain()` — proving a query is fast

```js
const plan = await users.find({ city: 'Karachi' }).explain('executionStats');
```

The two fields to read first:

- `queryPlanner.winningPlan.stage` — `COLLSCAN` (bad: read everything) or `IXSCAN` (good: used the index), usually wrapped in a `FETCH` stage that loads the matched documents.
- `executionStats.totalDocsExamined` — how many documents MongoDB actually looked at. For a selective query this should be close to `nReturned`. If it examined 10,000 documents to return 3, the query needs an index (or a better one).

`explain('executionStats')` actually runs the query; `explain('queryPlanner')` only shows the plan without running it. Use `executionStats` when you want the real numbers.

### 3.10 When NOT to index

- **Tiny collections.** A hundred documents scan faster than an index lookup — the planner will ignore your index anyway.
- **Write-heavy collections with rare reads.** Logs, event streams: every index taxes every write.
- **Low-selectivity fields.** An index on `active` (only `true`/`false`) matches half the collection — barely better than scanning.
- **Fields you never query.** An index nobody's query uses is pure overhead.
- **Too many indexes.** Each additional index slows writes and eats RAM. A handful of well-chosen indexes beats twenty hopeful ones.

### 3.11 Partial and sparse indexes — indexing less

Not every index has to cover every document:

- **Partial index** — indexes only documents matching a filter: `createIndex({ email: 1 }, { partialFilterExpression: { active: true } })`. The index is smaller and faster, but it only serves queries that include the same filter — a query without `active: true` cannot use it.
- **Sparse index** — indexes only documents that *have* the field: `createIndex({ phone: 1 }, { sparse: true })`. Useful for optional fields like a phone number that most users never provide. Note: sparse indexes can surprise you — a `find({ phone: { $exists: false } })` cannot use one.
- **Index intersection** — MongoDB can sometimes combine two single-field indexes for one query (an AND of two index scans). It exists, but relying on it is a smell: a proper compound index is almost always better.

### 3.12 Reading a full `explain()` — a worked walkthrough

```js
const plan = await users.find({ city: 'Karachi' }).sort({ age: -1 }).explain('executionStats');
```

Read it top-down:

1. `queryPlanner.winningPlan.stage` — if it says `SORT`, MongoDB sorted in memory (no index served the sort). If it says `FETCH` with an `IXSCAN` input stage, the index served both filter and sort.
2. `winningPlan.inputStage.indexName` — *which* index won. If it is not the one you expected, your compound index may have the wrong field order.
3. `executionStats.nReturned` — documents returned (2 here).
4. `executionStats.totalDocsExamined` — documents MongoDB looked at (2 here — ideal).
5. `executionStats.totalKeysExamined` — index entries scanned. If keys examined is far above docs returned, the index is doing more work than it should.
6. `executionStats.executionTimeMillis` — wall-clock time. On tiny data this is 0–1 ms and meaningless; compare it on realistic data volumes.

The one number to remember: **examined ÷ returned**. Near 1:1 is good. 10,000 examined for 3 returned means the query is scanning and needs a better index.

## 4. How It Works Internally

An index is a **B-tree** (balanced tree): a sorted structure where finding a value takes roughly log(n) steps. The leaf entries point at documents by their location on disk. For `{ city: 1 }`, the tree is sorted by city; a query for `'Karachi'` walks down the tree, finds the range of Karachi entries, and follows their pointers — that is the **IXSCAN** stage. A **FETCH** stage then loads those documents (unless the query is covered by the index alone).

A compound index `{ city: 1, age: -1 }` is one B-tree sorted first by city, then by age within each city — which is exactly why the leftmost prefix rule holds: the tree is only ordered by `age` *within* a city, so it cannot answer an age-only query efficiently.

Multikey indexes work the same way, with one entry per array element pointing at the same document. Text indexes are different internally (an inverted index: word → documents), which is why they have their own rules.

Index builds: on small collections they are instant; on large production collections, build them in the background (`{ background: true }` in older versions; modern MongoDB builds are non-blocking by default) and never during peak traffic.

## 5. Architecture / Workflow

```text
Query arrives:  find({ city: 'Karachi' }).sort({ age: -1 })
  │
  ▼
Query planner: which indexes exist?  (city_1, city_1_age_-1, ...)
  │
  ├─ No usable index ──> COLLSCAN: read every document, filter, sort in memory
  │
  └─ Usable index ──> IXSCAN on city_1_age_-1:
        jump to 'Karachi' entries (already sorted by age) ──> FETCH docs
        totalDocsExamined ≈ nReturned  ✓

Verify with explain('executionStats'):
  winningPlan.stage + totalDocsExamined tell you the truth.
  If examined >> returned, add or fix an index.
```

## 6. Real-World Examples

- **Login by email:** `users.createIndex({ email: 1 }, { unique: true })` — every login does `findOne({ email })`, and the unique index both speeds it up and guarantees one account per email.
- **Q-less dashboard:** "waiting tokens at the admin office, in position order" — compound index `{ officeId: 1, status: 1, position: 1 }` serves the filter *and* the sort.
- **AI Study Buddy:** "cards due today for this user, least recently reviewed first" — `{ userId: 1, nextReview: 1 }` with a sort on `nextReview`.
- **Sessions that clean themselves:** a TTL index on `sessions.createdAt` with `expireAfterSeconds: 86400` deletes day-old sessions without a cleanup job.
- **Search box:** a text index on `{ title: 'text', body: 'text' }` powers "search my notes" — until the product outgrows it and moves to Atlas Search.
- **The classic mistake:** indexing `createdAt` alone for a query that filters by `userId` *and* sorts by `createdAt`. The planner uses one index per query (mostly); the right index is the compound `{ userId: 1, createdAt: -1 }`.

## 7. Code Examples

The runnable example is [`examples/indexing.mjs`](./examples/indexing.mjs). It inserts 4 users, shows a COLLSCAN before any index, creates five indexes (single, compound, unique, text, TTL), re-runs the same query to show IXSCAN with only the matching documents examined, demonstrates text search, and proves the unique index by rejecting a duplicate email with error code 11000. Expected output is in [`example.txt`](./examples/example.txt).

```js
// BEFORE: no index → COLLSCAN, all 4 documents examined
const before = await users.find({ city: 'Karachi' }).explain('executionStats');
// before.queryPlanner.winningPlan.stage === 'COLLSCAN'
// before.executionStats.totalDocsExamined === 4

// Create the indexes
await users.createIndex({ city: 1 }, { name: 'city_1' });
await users.createIndex({ city: 1, age: -1 }, { name: 'city_1_age_-1' });
await users.createIndex({ email: 1 }, { name: 'email_1', unique: true });
await users.createIndex({ bio: 'text' }, { name: 'bio_text' });
await users.createIndex({ createdAt: 1 }, { name: 'createdAt_1', expireAfterSeconds: 3600 });

// AFTER: IXSCAN on city_1, only the 2 Karachi documents examined
const after = await users.find({ city: 'Karachi' }).explain('executionStats');
// after.queryPlanner.winningPlan.inputStage.indexName === 'city_1'
// after.executionStats.totalDocsExamined === 2

// Text search + unique enforcement
await users.find({ $text: { $search: 'developer' } }).toArray();
await users.insertOne({ email: 'talha@example.com', /* ... */ }); // throws, code 11000
```

**How to run the examples:**

```bash
NODE_PATH=/tmp/mongo-verify/node_modules node examples/indexing.mjs
```

The example uses an in-memory MongoDB server (`mongodb-memory-server`), so no MongoDB installation is needed. It starts the server, runs the demo, prints the output, then stops the server, cleans up its data directory, and exits. Output is deterministic — fixed ObjectIds, index names and `explain()` summary fields only (never full explain output, which varies) — so re-running it produces output byte-identical to `example.txt`. Note: the example stores its temporary data under `~/.cache` rather than `/tmp`, because this machine's `/tmp` is small and MongoDB refuses index builds when disk space is low.

## 8. Step-by-Step Code Explanations

1. **Before any index** — `find({ city: 'Karachi' }).explain('executionStats')` returns `winningPlan.stage: 'COLLSCAN'` and `totalDocsExamined: 4`. With 4 documents in the collection, MongoDB read all 4 to find the 2 in Karachi. On a million documents it would read a million.
2. **Five indexes, one call each** — `createIndex` takes the field spec and an options object. Names are given explicitly (`city_1`, `email_1`, …) so the output is readable; without a name MongoDB generates one from the spec. The TTL index is created on `createdAt` even though no document has that field yet — TTL indexes are allowed on empty/missing fields; they simply have nothing to expire.
3. **`listIndexes()`** — prints only the index *names*: `_id_`, `city_1`, `city_1_age_-1`, `email_1`, `bio_text`, `createdAt_1`. Full index documents contain creation metadata that varies, so names only keeps the output deterministic.
4. **After the index** — the same query now reports `winningPlan.stage: 'FETCH'`, `inputStage.stage: 'IXSCAN'`, `inputStage.indexName: 'city_1'`, and `totalDocsExamined: 2`. Two documents examined for two returned — the ideal ratio. Note the planner picked `city_1`, not the compound index: for this filter both could serve, and the planner chose the smaller one.
5. **Compound query** — `find({ city: 'Karachi' }).sort({ age: -1 })` examines 2 documents: the compound index `{ city: 1, age: -1 }` serves the filter and the sort together, with no in-memory sort step.
6. **Text search** — `$text: { $search: 'developer' }` returns Ayesha and Talha (both bios contain "developer"). Order between them is by relevance score, and the example's two runs agree because the data never changes.
7. **Unique index** — inserting a second document with `email: 'talha@example.com'` throws. The `catch` prints `duplicate email rejected: code 11000`. Error code **11000** is `DuplicateKey` — the number to recognise in logs.

## 9. Common Misconceptions

- **"More indexes = faster database."** More indexes make *reads* faster and *writes* slower, and eat RAM. An unused index is pure cost.
- **"I indexed the field, so my query is fast now."** Only if the query actually uses the index. `explain()` is the proof — check `winningPlan.stage` and `totalDocsExamined`, don't assume.
- **"A compound index works for any of its fields."** No — the leftmost prefix rule: `{ city: 1, age: -1 }` serves `city` queries and `city + age` queries, but not `age`-only queries.
- **"Indexes make sorting free."** Only when the sort order matches the index order. Otherwise MongoDB sorts in memory, which is slow and capped at 32 MB unless you allow disk use.
- **"Unique index is just a speed thing."** It is a *correctness* tool: the only way to guarantee uniqueness under concurrent requests.
- **"TTL deletes documents exactly on time."** A background thread runs roughly every 60 seconds, so documents can live up to a minute past expiry.
- **"Text search with `$text` replaces a search engine."** It handles simple cases. Real search products (fuzzy matching, ranking, filters) outgrow it and move to Atlas Search or Elasticsearch.
- **"Small collections need indexes too."** On a hundred documents the planner will often ignore your index and scan — correctly, because scanning 100 documents is faster than an index lookup.

## 10. Important Technical Terminology

- **B-tree** — the sorted tree structure behind most indexes; lookups cost roughly log(n).
- **Selectivity** — how much an index narrows the search. High selectivity (email) is good; low selectivity (a boolean) is barely useful.
- **Covered query** — a query answered from the index alone, with no document fetch (FETCH stage absent).
- **ESR rule** — field order for compound indexes: Equality, Sort, Range.
- **Index cardinality** — the number of distinct values in an indexed field; low cardinality means low selectivity.
- **`$indexStats`** — an aggregation stage showing how often each index has been used since the server started.

## 11. Summary

- An index is a sorted catalogue of field values: without one, MongoDB scans the whole collection (COLLSCAN); with one, it jumps to the matches (IXSCAN).
- Single-field, compound (leftmost prefix rule, ESR order), multikey (automatic for arrays), text (one per collection), unique (error 11000), TTL (self-deleting data).
- `explain('executionStats')` proves performance: read `winningPlan.stage` and `totalDocsExamined` — examined should be close to returned.
- Indexes cost write speed, disk, and RAM. Index the queries you actually run, and don't index tiny collections, low-selectivity fields, or fields nobody queries.

## 12. Interview Questions and Answers

**Q1. What is an index, and what problem does it solve?**
A: A B-tree mapping field values to documents, so MongoDB can find matches without scanning the whole collection. Without one, a query is a COLLSCAN — it reads every document.

**Q2. What is the difference between COLLSCAN and IXSCAN?**
A: COLLSCAN reads the entire collection to find matches. IXSCAN walks the index to the matching entries and fetches only those documents. `explain()` shows which one your query used.

**Q3. What is the leftmost prefix rule?**
A: A compound index `{ city: 1, age: -1 }` serves queries on `city` alone and on `city + age`, but not on `age` alone — the index is only ordered by `age` *within* each city.

**Q4. What is the ESR rule for ordering compound index fields?**
A: Equality fields first, then Sort fields, then Range fields. It puts the most selective, most-used parts of the query first in the index.

**Q5. What is a multikey index?**
A: An index on an array field. MongoDB creates one index entry per array element automatically. A compound index may contain at most one array field.

**Q6. How does a unique index differ from a normal index?**
A: It also enforces uniqueness: a duplicate insert is rejected with error code 11000. It is the only reliable way to guarantee uniqueness under concurrent requests.

**Q7. What is a TTL index, and what is it for?**
A: An index on a date field with `expireAfterSeconds` that auto-deletes documents after that time — sessions, one-time codes, temporary tokens. Deletion runs about every 60 seconds, so expiry is approximate.

**Q8. How do you prove a query is using an index?**
A: `explain('executionStats')`: check `queryPlanner.winningPlan.stage` (want IXSCAN, not COLLSCAN) and `executionStats.totalDocsExamined` (want it close to `nReturned`).

**Q9. What do indexes cost?**
A: Every write must update every index (slower inserts/updates/deletes), plus disk space and RAM. Unused indexes are pure cost — audit and remove them.

**Q10. When should you NOT create an index?**
A: On tiny collections, on low-selectivity fields (booleans), on write-heavy rarely-read collections, on fields no query uses, and when you already have too many indexes.

**Q11. Can a collection have more than one text index?**
A: No — one text index per collection, though it can cover multiple fields. For serious search, use Atlas Search or Elasticsearch.

**Q12. What is a covered query?**
A: A query answered entirely from the index, with no FETCH stage — possible only when every field the query needs (filter, sort, projection) is in the index.

## 13. References

- MongoDB manual — Indexes — https://www.mongodb.com/docs/manual/indexes/
- MongoDB manual — Single field, compound, multikey, text, unique, TTL indexes — https://www.mongodb.com/docs/manual/core/indexes/index-types/
- MongoDB manual — Compound index and the ESR rule — https://www.mongodb.com/docs/manual/tutorial/sort-results-with-indexes/
- MongoDB manual — `explain()` — https://www.mongodb.com/docs/manual/reference/method/db.collection.explain/
- MongoDB manual — Index strategies — https://www.mongodb.com/docs/manual/applications/indexes/
- MongoDB Node.js driver — https://www.mongodb.com/docs/drivers/node/current/

---

[← Module 03 README](../README.md) · [Previous: 09 — Relationships](../09-relationships/README.md) · [Next: 11 — Aggregation →](../11-aggregation/README.md)

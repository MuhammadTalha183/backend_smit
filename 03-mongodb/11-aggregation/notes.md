# 11 — Aggregation: Notes

> **Module:** [03 — MongoDB](../README.md) · **Topic README:** [README.md](./README.md) · **Example:** [examples/aggregation.mjs](./examples/aggregation.mjs)

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

## 1. Introduction

Every real application eventually needs answers that are *computed from* its data, not just *read out of* it. A shop owner does not ask "show me order #42" — she asks "how much did we earn per category this month?", "who are my top 5 customers?", "how many orders were cancelled last week?". A single `find()` cannot answer those questions: it returns documents, it does not group them, sum them, or join them.

The aggregation framework is MongoDB's answer. It is a pipeline: you hand MongoDB an array of stages, and each stage transforms the stream of documents and passes the result to the next stage. Filter with `$match`, group with `$group`, reshape with `$project`, join with `$lookup`, sort with `$sort`, and cut the result down with `$limit`. The pipeline runs inside the database, close to the data, so instead of pulling 100,000 orders into Node.js and summing them in JavaScript, you send one pipeline and get back three numbers.

Aggregation is the reporting engine of MongoDB, and it is also the tool you reach for whenever a question needs more than one document at a time. It is a high-priority topic because almost every backend — dashboards, analytics, admin panels, leaderboards — is built on it.

## 2. Definition of Important Concepts

**Aggregation pipeline:** An ordered array of stages passed to `db.collection.aggregate([...])`. Documents enter the first stage, each stage transforms them, and the last stage's output is the result. A pipeline with zero stages returns all documents unchanged.

**Stage:** One step of the pipeline, written as an object with a single operator key, e.g. `{ $match: { status: 'delivered' } }`. Stages run in array order, and the output of one stage is the input of the next.

**$match:** Filters documents, exactly like the query object of `find()`. Only documents that satisfy the condition pass to the next stage. It is the first stage in most pipelines.

**$group:** Groups documents by a key and computes one result document per group. `_id` holds the grouping key (a field path like `'$category'`, or `null` for "everything in one group"); the other fields use accumulator operators.

**Accumulator:** An operator that combines many values into one — `$sum`, `$avg`, `$min`, `$max`, `$first`, `$last`, `$push`, `$addToSet`. Accumulators only make sense inside `$group` (and a few other stages such as `$setWindowFields`).

**$project:** Reshapes each document: include or exclude fields, rename them, or compute new ones with expressions. `{ _id: 0, name: 1, total: { $multiply: ['$price', '$qty'] } }`.

**$sort / $limit / $skip:** `$sort` orders documents (`1` ascending, `-1` descending); `$limit` keeps only the first N; `$skip` drops the first N. Together they do "top 10" and pagination.

**$lookup:** Joins documents from another collection — MongoDB's version of a SQL JOIN. It adds an array field containing the matching documents from the foreign collection.

**$unwind:** Turns one document with an array field into many documents, one per array element. It is the usual partner of `$lookup`, flattening the one-element array `$lookup` produces for a one-to-one join.

**$addFields / $set:** Adds new fields (or overwrites existing ones) on each document without listing every other field, unlike `$project`, which drops anything you do not mention. `$set` is the alias of `$addFields`.

**$count:** Counts the documents that reach it and outputs a single document `{ <name>: <count> }`. It is a shorthand for `{ $group: { _id: null, n: { $sum: 1 } } }` followed by a project.

**Expression:** A value computed from a document, such as `{ $multiply: ['$amount', 0.9] }` or `{ $concat: ['$firstName', ' ', '$lastName'] }`. Field references start with `$`; literal values do not.

## 3. Detailed Explanations

### 3.1 The pipeline idea

Think of a factory conveyor belt. Raw documents roll in at one end. At the first station (`$match`) the defective ones are thrown away. At the second (`$group`) identical items are boxed together and counted. At the third (`$project`) each box gets a new label. At the end, finished answers roll out. Nothing is stored between stations except the documents themselves, and the order of the stations matters — you would not box items before throwing away the defective ones.

That is the whole mental model. A pipeline is a plain JavaScript array, and `aggregate()` returns a cursor (like `find()` does), so you call `.toArray()` on it.

```js
const result = await orders.aggregate([
  { $match: { status: 'delivered' } },
  { $group: { _id: '$category', total: { $sum: '$amount' } } },
  { $sort: { total: -1 } },
]).toArray();
```

### 3.2 $match — filter first, always

`$match` takes the same query object you already know from `find()` and topic 07: `{ status: 'delivered' }`, `{ amount: { $gte: 1000 } }`, `{ category: { $in: ['books', 'clothing'] } }`. It is the cheapest stage when it can use an index (see §3.9), and it shrinks the stream for everything after it. A pipeline that groups 100,000 orders is slow; a pipeline that first matches the 2,000 delivered ones and then groups is fast. Put `$match` as early as possible — ideally first.

One restriction: `$match` cannot use `$where`, `$text` in the middle of a pipeline has limits, and `$expr` inside `$match` lets you compare two fields of the same document (`{ $expr: { $gt: ['$paid', '$due'] } }`).

### 3.3 $group — the heart of reporting

`$group` collects documents that share a key and produces one document per key:

```js
{ $group: { _id: '$category', totalRevenue: { $sum: '$amount' }, orderCount: { $sum: 1 } } }
```

- `_id: '$category'` — group by the `category` field. The output document's `_id` is the category name.
- `_id: null` — put everything in one group (grand totals).
- `_id: { year: { $year: '$date' }, month: { $month: '$date' } }` — group by a compound key; the output `_id` is an object.
- `totalRevenue: { $sum: '$amount' }` — add up `amount` in the group.
- `orderCount: { $sum: 1 }` — count documents by adding 1 per document.

Accumulators available in `$group`:

| Accumulator | What it computes | Example |
|---|---|---|
| `$sum` | Total of numbers, or count when given `1` | `{ $sum: '$amount' }` |
| `$avg` | Arithmetic mean | `{ $avg: '$amount' }` |
| `$min` / `$max` | Smallest / largest value | `{ $max: '$amount' }` |
| `$first` / `$last` | First / last document in the group (group order is the order documents arrive, so sort first if it matters) | `{ $first: '$date' }` |
| `$push` | Array of all values in the group | `{ $push: '$category' }` |
| `$addToSet` | Array of unique values in the group | `{ $addToSet: '$category' }` |

After `$group`, only the `_id` and the accumulator fields exist — every other field is gone. If you need a field later, carry it into the group (e.g. with `$first`) or re-join it.

### 3.4 $project — reshape each document

`$project` is the stage that decides the shape of the output. `1` keeps a field, `0` drops it, a string or expression computes a new one:

```js
{ $project: { _id: 0, customerName: '$name', total: { $multiply: ['$price', '$qty'] } } }
```

Two rules beginners trip over: you cannot mix inclusion and exclusion in one `$project` (except for `_id`), and any field you do not mention is dropped. That second rule is also a feature — projecting early drops heavy fields and makes later stages faster.

### 3.5 $sort, $limit, $skip — ordering and cutting

`{ $sort: { totalRevenue: -1 } }` sorts descending; `{ $sort: { createdAt: 1 } }` ascending. Sort keys can be several fields. `$limit: 10` keeps the first 10 documents that reach it; `$skip: 20` drops the first 20. The classic "top 10" is `$sort` then `$limit`; the classic page 3 (10 per page) is `$sort`, `$skip: 20`, `$limit: 10`. Note the warning from topic 07 still applies: deep `$skip` gets slow, because the database still walks past the skipped documents.

### 3.6 $lookup — joining collections

MongoDB has no SQL JOIN, but `$lookup` is the equivalent inside a pipeline:

```js
{
  $lookup: {
    from: 'customers',        // the other collection
    localField: 'customer',   // field in the current documents
    foreignField: '_id',      // field in the other collection
    as: 'customerDoc',        // name of the new array field
  },
}
```

Every order gains a `customerDoc` array with the matching customer(s). For a one-to-one join the array has exactly one element, so the usual next stage is `{ $unwind: '$customerDoc' }`, which replaces the array with the single document. `$lookup` can also do richer joins with `let` + `pipeline` (a sub-pipeline on the foreign collection), which is how you join on more than one condition — but the simple form above covers most cases.

### 3.7 $unwind — flattening arrays

`{ $unwind: '$items' }` takes a document whose `items` array has 3 elements and emits 3 documents, identical except that `items` is now one element each. Uses:

- After `$lookup`, to turn the one-element array into a plain embedded document.
- Before `$group`, to aggregate *per array element* — e.g. total quantity sold per product across orders that each contain many items.
- With `preserveNullAndEmptyArrays: true`, documents with a missing or empty array survive instead of being dropped (the default drops them — a classic silent-data-loss bug).

### 3.8 $addFields / $set and $count

`$addFields` adds computed fields and keeps everything else, which is exactly what `$project` cannot do without listing all fields:

```js
{ $addFields: { discountedTotal: { $multiply: ['$amount', 0.9] } } }
```

`$set` is the same stage under a newer name; use either. `$count: 'totalDelivered'` at the end of a pipeline outputs one document, `{ totalDelivered: 42 }` — handy for "how many matched?" without pulling the documents back.

### 3.9 Pipeline optimization — stage order is performance

MongoDB applies a few automatic optimizations (it moves a `$match` before a `$project` when safe, and coalesces a `$sort` + `$limit`), but the big wins are yours to make:

1. **`$match` as early as possible.** Every document filtered out early is a document no later stage has to process. An early `$match` on an indexed field can use the index; a late one cannot.
2. **`$limit` early when you only need a few results.** `$sort` + `$limit` together let MongoDB keep only the top N in memory instead of sorting everything.
3. **`$project` early to drop heavy fields.** If documents carry a 50 KB `description` you never use, project it away before a `$group` or `$sort`.
4. **Put `$sort` before `$group` only when the group needs order** (e.g. `$first` / `$last`). Otherwise it is wasted work.
5. **Avoid `$unwind` on huge arrays followed by `$group`** unless you need per-element math — it multiplies the document count.
6. **Watch memory.** Each stage may use at most 100 MB of RAM by default; a `$group` or `$sort` over millions of documents can hit that limit. The escape hatch is `{ allowDiskUse: true }` on `aggregate()`, which spills to disk (slower, but it finishes). The real fix is usually filtering earlier or adding an index.
7. **Indexes still matter.** A `$match` + `$sort` on the same indexed fields can run as an indexed scan; a `$group` on the leading field of an index can sometimes stream in order. Aggregation does not magically ignore indexes — it uses them through its early stages.

### 3.10 Aggregation vs find() — which tool?

Use `find()` when the question is about individual documents: "get this order", "list delivered orders, newest first, page 2". `find()` is simpler, and it can use indexes directly.

Use aggregation when the question is about *many* documents at once: totals, averages, counts per group, joins, computed fields, top-N lists. If you catch yourself fetching 10,000 documents into Node.js and looping over them to compute a sum, that loop belongs in a pipeline.

### 3.11 $lookup vs Mongoose populate()

Both answer "give me the order *with* its customer", but in different places:

- **`$lookup`** runs inside MongoDB, in one round trip, as part of a pipeline. It returns plain objects, works with any driver, and can join on any fields. It is the right choice for reports and dashboards.
- **Mongoose `populate()`** runs in your Node.js app: Mongoose first fetches the orders, then fetches the matching customers with extra queries, then stitches them together into Mongoose documents. It is convenient in application code (virtuals, type casting, document methods) but costs extra round trips.

Rule of thumb: reporting and analytics → `$lookup`; loading documents for your app logic with Mongoose models → `populate()`. Topic 13 covers `populate()` in full detail.

## 4. How the Technology Works Internally

When you call `collection.aggregate(pipeline)`, the driver sends the pipeline array to the server as one command. The server builds an execution plan — one operator object per stage — and then streams documents through it.

Each stage is a small machine with an input and an output:

- **Streaming stages** (`$match`, `$project`, `$addFields`, `$unwind`, `$limit`) process one document at a time. A document arrives, the stage transforms or drops it, and it moves on. These stages use almost no memory.
- **Blocking stages** (`$group`, `$sort`) must see many (or all) documents before they can emit anything. `$group` keeps one accumulator state per group key in memory; `$sort` keeps all documents until it knows the order. This is why they have the 100 MB memory limit, and why filtering before them matters so much.

The server also runs an **optimizer** before execution. The documented rewrites include:

- **Predicate pushdown:** a `$match` after a `$project` is moved before it when the filter only uses fields the project keeps — so filtering happens on the raw documents, where an index can serve it.
- **Sort + limit coalescing:** `{ $sort: {...} }, { $limit: 10 }` becomes a single top-N sort that keeps only 10 documents in memory instead of sorting the whole stream.
- **Projection pushdown:** if a later stage only needs two fields, the optimizer may drop the rest earlier.

The cursor you get back is lazy, exactly like a `find()` cursor: nothing runs until you iterate (`.toArray()`, `for await`), and documents stream back in batches. If a stage fails — an unknown operator, a type error such as dividing by a string — the whole pipeline errors and no partial result is returned.

One more internal fact worth knowing: `$group`'s `_id` is hashed to keep the per-group state. Grouping by a high-cardinality key (say, a unique `_id`) creates one group per document, which is both slow and pointless — if every document is its own group, you did not need `$group` at all.

## 5. Architecture or Workflow

A typical reporting pipeline follows the same five-step shape. Learn the shape, and most pipelines write themselves:

```
                    ┌─────────────────────────────────────────────┐
                    │           AGGREGATION PIPELINE            │
                    │                                             │
  orders            │  1. $match    keep only the relevant docs  │
  collection ─────► │  2. $lookup   join related data (optional) │
  (8 docs in the   │  3. $unwind   flatten joined arrays         │
   example,        │  4. $group    compute totals / averages     │
   millions in     │  5. $project  shape the output              │
   real life)      │  6. $sort     order the results             │
                    │  7. $limit    keep the top N                │
                    └──────────────────────┬──────────────────────┘
                                           ▼
                                   result documents
                              (plain JS objects, via
                               cursor / .toArray())
```

The workflow for building a pipeline, step by step:

1. **Write the question in one sentence.** "Total revenue per category for delivered orders, biggest first." If you cannot say it in one sentence, the pipeline will be a mess.
2. **Start with `$match`.** Translate the sentence's filters ("delivered orders") into a match.
3. **Add the join if the answer needs another collection.** `$lookup` + `$unwind`.
4. **Add `$group`.** Decide the `_id` (the "per what?") and the accumulators (the "compute what?").
5. **Shape with `$project`.** Rename `_id` to something readable, drop what the client does not need.
6. **Order and cut.** `$sort` + `$limit` for "top N".
7. **Test with a small dataset first.** Run it against the example data, read the output, and only then point it at real data. Add one stage at a time and print the intermediate result — debugging a 7-stage pipeline is easy when you watch each stage's output.

Data flow rules to remember:

- Documents only flow **forward** — a stage cannot see documents from a later stage, and there are no loops.
- A stage can **change the number of documents**: `$match` and `$limit` reduce it, `$unwind` increases it, `$group` collapses it, `$count` collapses it to one.
- A stage can **change the shape of documents**: after `$group`, only `_id` and accumulator fields exist; after `$project`, only the fields you kept exist. Referencing a dropped field later silently yields `null`/`undefined` — the most common pipeline bug.

## 6. Real-World Examples

**E-commerce dashboard — revenue per category.** The shop's admin page shows a bar chart of revenue by category, delivered orders only. That is exactly pipeline 1 in the example: `$match` delivered, `$group` by `$category` with `$sum: '$amount'`, `$sort` by revenue descending. One query, one round trip, no JavaScript loop.

**Top customers.** "Our 10 best customers this year" drives loyalty emails. Group orders by `customer`, sum `amount`, sort descending, limit 10 — then `$lookup` the customers collection to attach names and emails for the email list. The same pipeline with `$avg` instead of `$sum` answers "which customers place the biggest single orders?".

**Monthly totals.** A finance report needs revenue per month. Group by a compound key built from the order date — `_id: { year: { $year: '$date' }, month: { $month: '$date' } }` — sum `amount`, sort by year and month. The chart on the finance page is this pipeline's output, rendered directly.

**Q-less (semester project idea) — tokens per office.** "How many `done` tokens did each office process today?" is a `$match` on `status: 'done'` and today's date, then `$group` by `office` with `$sum: 1`. Doing it with plain queries would mean one `countDocuments` call per office; the pipeline answers it in one call, for all offices at once.

**Leaderboard.** A learning app ranks students by total quiz points: `$group` by `studentId` with `$sum: '$points'`, `$sort` descending, `$limit: 10`, `$lookup` to attach student names. Add `$setWindowFields` with `$rank` if you need the actual rank number next to each row.

**Log analysis.** An API stores one document per request with `route`, `statusCode`, and `durationMs`. The on-call dashboard needs error rate per route: `$match` on `statusCode >= 500`, `$group` by `route` with `$sum: 1` and `$avg: '$durationMs'`. That is a pipeline an engineer writes in two minutes and re-runs every incident.

## 7. Code Examples Where Applicable

### 7.1 Revenue per category (delivered only)

```js
const revenue = await orders.aggregate([
  { $match: { status: 'delivered' } },
  { $group: { _id: '$category', totalRevenue: { $sum: '$amount' }, orderCount: { $sum: 1 } } },
  { $sort: { totalRevenue: -1 } },
]).toArray();
// [
//   { _id: 'electronics', totalRevenue: 85000, orderCount: 3 },
//   { _id: 'clothing', totalRevenue: 3500, orderCount: 1 },
//   { _id: 'books', totalRevenue: 2700, orderCount: 2 },
// ]
```

### 7.2 Average order value per customer

```js
const avgValue = await orders.aggregate([
  { $group: { _id: '$customer', averageOrderValue: { $avg: '$amount' }, orderCount: { $sum: 1 } } },
  { $project: { _id: 1, orderCount: 1, averageOrderValue: { $round: ['$averageOrderValue', 2] } } },
  { $sort: { _id: 1 } },
]).toArray();
// [
//   { _id: ObjectId('...001'), orderCount: 3, averageOrderValue: 15900 },
//   { _id: ObjectId('...002'), orderCount: 3, averageOrderValue: 7433.33 },
//   { _id: ObjectId('...003'), orderCount: 2, averageOrderValue: 12400 },
// ]
```

Note the two-stage trick: `$round` is not an accumulator, so it cannot sit inside `$group`. Compute `$avg` in the group, then round it in a later `$project`. The same trick applies to any expression operator you want to apply to a grouped result.

### 7.3 Join with $lookup, flatten with $unwind

```js
const withNames = await orders.aggregate([
  { $lookup: { from: 'customers', localField: 'customer', foreignField: '_id', as: 'customerDoc' } },
  { $unwind: '$customerDoc' },
  { $project: { _id: 0, customerName: '$customerDoc.name', category: 1, amount: 1, status: 1 } },
  { $sort: { amount: -1 } },
]).toArray();
// [
//   { category: 'electronics', amount: 45000, status: 'delivered', customerName: 'Ali' },
//   { category: 'electronics', amount: 22000, status: 'delivered', customerName: 'Bilal' },
//   ...
// ]
```

### 7.4 Computed fields with $addFields and $limit

```js
const discounted = await orders.aggregate([
  { $sort: { _id: 1 } },
  { $limit: 3 },
  { $addFields: { discountedTotal: { $multiply: ['$amount', 0.9] } } },
  { $project: { _id: 0, category: 1, amount: 1, discountedTotal: 1 } },
]).toArray();
// [
//   { category: 'books', amount: 1200, discountedTotal: 1080 },
//   { category: 'electronics', amount: 45000, discountedTotal: 40500 },
//   { category: 'clothing', amount: 3500, discountedTotal: 3150 },
// ]
```

### 7.5 Monthly totals with a compound group key

```js
const monthly = await orders.aggregate([
  { $match: { status: 'delivered' } },
  {
    $group: {
      _id: { year: { $year: '$date' }, month: { $month: '$date' } },
      totalRevenue: { $sum: '$amount' },
    },
  },
  { $sort: { '_id.year': 1, '_id.month': 1 } },
]).toArray();
```

### 7.6 Counting with $count

```js
const [result] = await orders.aggregate([
  { $match: { status: 'cancelled' } },
  { $count: 'cancelledOrders' },
]).toArray();
// { cancelledOrders: 1 }
```

### 7.7 Collecting values with $push

```js
const perCustomer = await orders.aggregate([
  { $group: { _id: '$customer', categories: { $push: '$category' }, amounts: { $push: '$amount' } } },
  { $sort: { _id: 1 } },
]).toArray();
// { _id: ObjectId('...001'), categories: ['books', 'electronics', 'books'], amounts: [1200, 45000, 1500] }
```

Use `$addToSet` instead of `$push` when you want each value only once.

## 8. Step-by-Step Code Explanations

The full runnable version of this section is [`examples/aggregation.mjs`](./examples/aggregation.mjs); its expected output is in [`examples/example.txt`](./examples/example.txt). The walk-through below follows that file.

**Setup — in-memory server, fixed data.** The script starts a `MongoMemoryServer` with its data directory under `~/.cache/mongo-mem/aggregation` (never `/tmp`, which is a small tmpfs), connects a `MongoClient`, and seeds two collections: `customers` (3 documents) and `orders` (8 documents). Every `_id` is a fixed `ObjectId` and every `date` is a fixed ISO string, so the output is byte-identical on every run. At the end the client closes, the server stops, and the data directory is deleted.

**Pipeline 1 — revenue per category.** `[{ $match: { status: 'delivered' } }, ...]` drops the 1 pending and 1 cancelled order, leaving 6. `{ $group: { _id: '$category', ... } }` collapses them into 3 groups — electronics (45000 + 22000 + 18000 = 85000), clothing (3500), books (1200 + 1500 = 2700) — while `$sum: 1` counts the orders in each group. `{ $sort: { totalRevenue: -1 } }` puts the biggest category first. Each result row is printed with `JSON.stringify`, one line per group.

**Pipeline 2 — average order value per customer.** `{ $group: { _id: '$customer', averageOrderValue: { $avg: '$amount' }, orderCount: { $sum: 1 } } }` groups all 8 orders by the `customer` ObjectId — no `$match`, because the question is about *all* orders. Ayesha's average is 22300 / 3 = 7433.333…, so the next stage `{ $project: { ..., averageOrderValue: { $round: ['$averageOrderValue', 2] } } }` rounds it to 7433.33 (see §7.2 for why the rounding cannot happen inside `$group`). `{ $sort: { _id: 1 } }` orders the three customers by their ObjectId, which is stable across runs.

**Pipeline 3 — orders with customer names.** `{ $lookup: { from: 'customers', localField: 'customer', foreignField: '_id', as: 'customerDoc' } }` attaches a one-element `customerDoc` array to each order. `{ $unwind: '$customerDoc' }` replaces the array with the customer document itself. `{ $project: { _id: 0, customerName: '$customerDoc.name', category: 1, amount: 1, status: 1 } }` keeps only the readable fields — note `_id: 0` hiding the order id, and `customerName` being renamed from the joined document. `{ $sort: { amount: -1 } }` puts the biggest order first.

**Pipeline 4 — discounted totals.** `{ $sort: { _id: 1 } }` orders by insertion order, `{ $limit: 3 }` keeps the first three orders, `{ $addFields: { discountedTotal: { $multiply: ['$amount', 0.9] } } }` computes a 10%-off total on each surviving document (other fields untouched — that is the point of `$addFields` over `$project`), and a final `$project` trims the output to `category`, `amount`, and `discountedTotal`.

**Printing.** A small `print(title, docs)` helper logs the section title and then one `JSON.stringify` line per document, so the output is easy to diff against `example.txt`.

## 9. Common Misconceptions

**"Aggregation is only for analytics."** Reports are the headline use, but pipelines also do everyday work: joining data for a response, computing a field before sending it to the client, and building "top N" lists. If the work touches many documents, it is aggregation work.

**"`$group` keeps the other fields."** It does not. After `$group`, only `_id` and the accumulator fields exist. If you need a field afterwards, bring it along with `$first` / `$last` / `$push`, or `$lookup` it back. Referencing a dropped field later gives `null`, silently.

**"Stage order doesn't matter."** It is the main performance lever and sometimes changes the answer: `$match` before `$group` filters the input; `$match` after `$group` filters the groups (a different question). `$limit` before `$sort` returns arbitrary documents; `$sort` before `$limit` returns the top N.

**"`$lookup` is a SQL JOIN."** Close, but not identical. `$lookup` always produces an *array* field, even for a one-to-one match — you need `$unwind` to flatten it. And unlike a SQL JOIN there is no cross-collection transaction or foreign-key enforcement; if the referenced customer is deleted, the order simply matches nothing.

**"`$unwind` is harmless."** It multiplies documents. Unwinding an array of 1,000 items turns 1 document into 1,000, and a `$group` after it processes all 1,000. It also *drops* documents whose array is missing or empty unless you pass `preserveNullAndEmptyArrays: true` — the classic way to silently lose data.

**"Aggregation always uses indexes."** Only its early stages can. A `$match` on an indexed field at the start of the pipeline can use the index; a `$match` buried after a `$group` cannot. And `$group` / `$sort` over unindexed data do in-memory work with a 100 MB cap.

**"I should compute totals in Node.js — it's more flexible."** Fetching 100,000 documents to sum them in JavaScript moves 100,000 documents over the network and through your process. The database does the same sum without moving the data. Flexibility is real, but for totals and grouping it is the wrong trade.

**"`$where` / JavaScript expressions work everywhere."** `$where` is a `find()` feature and is not available in aggregation; `$expr` is the pipeline equivalent for comparing fields within a document.

**"One pipeline should answer everything."** A pipeline answers one question well. A dashboard with five charts is five pipelines (or five `$facet` branches), not one monster pipeline that tries to do everything at once.

## 10. Important Technical Terminology

| Term | Meaning |
|---|---|
| Pipeline | Ordered array of stages passed to `aggregate()`; documents flow through it |
| Stage | One transformation step, e.g. `$match`, `$group`, `$lookup` |
| Accumulator | Operator that combines many values into one inside `$group` (`$sum`, `$avg`, `$min`, `$max`, `$push`) |
| Expression | A computed value in a stage, e.g. `{ $multiply: ['$amount', 0.9] }`; field references start with `$` |
| `$match` | Filter stage; same query language as `find()` |
| `$group` | Group documents by `_id` and compute accumulators |
| `$project` | Reshape documents: include, exclude, rename, compute |
| `$sort` / `$limit` / `$skip` | Order documents, keep the first N, drop the first N |
| `$lookup` | Join documents from another collection into an array field |
| `$unwind` | Split one document per array element |
| `$addFields` / `$set` | Add or overwrite fields, keeping all others |
| `$count` | Emit one document with the count of documents that reached it |
| `$facet` | Run several sub-pipelines on the same input in one pass (advanced) |
| `$setWindowFields` | Window functions: rank, running totals (advanced, MongoDB 5.0+) |
| allowDiskUse | `aggregate()` option letting blocking stages spill to disk past the 100 MB memory limit |
| Blocking stage | A stage that must see many/all documents before emitting (`$group`, `$sort`) |
| Streaming stage | A stage that processes one document at a time (`$match`, `$project`, `$limit`) |

## 11. Summary

- An aggregation pipeline is an array of stages; documents flow through them in order, and each stage transforms the stream.
- `$match` filters (use it first), `$group` computes per-group totals with accumulators, `$project` reshapes, `$sort` + `$limit` give top-N results.
- `$lookup` joins another collection (result is an array — flatten it with `$unwind`); `$addFields` / `$set` add computed fields without dropping the rest; `$count` counts what reached it.
- Accumulators: `$sum`, `$avg`, `$min`, `$max`, `$first`, `$last`, `$push`, `$addToSet`. `$round` and other expression operators cannot run inside `$group` — apply them in a later stage.
- Stage order is performance: filter early, limit early, project away heavy fields, and let early `$match` use indexes. Blocking stages (`$group`, `$sort`) have a 100 MB memory limit unless `allowDiskUse: true`.
- Use `find()` for questions about individual documents; use aggregation when the answer is computed from many documents.
- `$lookup` joins inside the database in one round trip; Mongoose `populate()` joins in your app code with extra queries (full detail in topic 13).
- Build pipelines one stage at a time on small data, and print the intermediate output — that is how you debug them.

## 12. Interview Questions and Answers

**1. What is the aggregation framework?**

It is MongoDB's pipeline for processing data: you pass an array of stages to `aggregate()`, documents flow through the stages in order, and each stage filters, groups, reshapes, or joins them. It is how MongoDB answers reporting and analytics questions — totals, averages, top-N lists, joins — inside the database instead of in application code.

**2. How does a pipeline execute?**

The driver sends the stage array to the server, the server builds one operator per stage, and documents stream through them: the output of one stage is the input of the next. The result is a cursor, like `find()` — lazy, so nothing runs until you iterate it with `.toArray()` or `for await`.

**3. What does `$group` do, and what is `_id` in it?**

`$group` collapses documents that share a key into one document per key. `_id` is the grouping key — a field path like `'$category'`, `null` for a single grand-total group, or an object for a compound key. All other fields in the `$group` stage must be accumulators (`$sum`, `$avg`, …). After `$group`, only `_id` and the accumulator fields exist.

**4. What is the difference between `$project` and `$addFields`?**

`$project` reshapes a document and drops every field you do not mention; `$addFields` (alias `$set`) adds or overwrites fields and keeps everything else. Use `$project` when you want a clean, minimal output shape; use `$addFields` when you want to add one computed field to an otherwise unchanged document.

**5. Why should `$match` come first in a pipeline?**

Because every document filtered out early is a document no later stage has to process, and an early `$match` on an indexed field can use the index. A `$match` after `$group` filters groups instead of documents — a different question — and cannot use an index. Filtering early is the single biggest pipeline optimization.

**6. What does `$lookup` return, and why do you usually pair it with `$unwind`?**

`$lookup` adds an array field containing the matching documents from the other collection — always an array, even when exactly one document matches. `$unwind` flattens that one-element array into a plain embedded document, which is what you want for a one-to-one join. Without `$unwind` you would access the customer as `customerDoc[0].name` instead of `customerDoc.name`.

**7. What is the difference between `$lookup` and Mongoose `populate()`?**

`$lookup` runs inside MongoDB as part of a pipeline, in one round trip, and returns plain objects. `populate()` runs in your Node.js app: Mongoose fetches the main documents, then runs extra queries for the referenced documents and stitches them into Mongoose documents. Use `$lookup` for reports and dashboards; use `populate()` when working with Mongoose models in application code. (Topic 13 covers `populate()` in full.)

**8. When would you use aggregation instead of `find()`?**

When the answer is computed from many documents: totals, averages, counts per group, joins, computed fields, top-N lists. `find()` returns documents; it cannot group or sum. If you find yourself fetching thousands of documents into Node.js just to loop over them and compute a number, that loop belongs in a pipeline.

**9. What are accumulator operators? Name five.**

Operators that combine many values into one inside `$group`: `$sum` (total, or count with `1`), `$avg` (mean), `$min` / `$max` (smallest / largest), `$push` (array of all values), `$addToSet` (array of unique values), `$first` / `$last` (first / last value in the group).

**10. What is the 100 MB memory limit, and how do you handle it?**

Blocking stages (`$group`, `$sort`) may use at most 100 MB of RAM each by default; exceeding it errors the pipeline. The escape hatch is passing `{ allowDiskUse: true }` to `aggregate()`, which spills to disk. The better fix is usually to filter earlier with `$match`, project away heavy fields, or add an index that serves the early stages.

**11. What does `$unwind` do, and what is its gotcha?**

It turns one document with an array into one document per array element — used after `$lookup` and before grouping per element. The gotcha: documents whose array is missing or empty are dropped by default, silently losing data. Pass `{ $unwind: { path: '$items', preserveNullAndEmptyArrays: true } }` to keep them.

**12. How do you get the "top 10" of something?**

`$sort` on the computed value descending, then `$limit: 10` — in that order. `$limit` before `$sort` would keep 10 arbitrary documents and then sort only those. MongoDB optimizes the `$sort` + `$limit` pair into a top-N sort that keeps only 10 documents in memory.

## 13. References

- MongoDB Manual — Aggregation: https://www.mongodb.com/docs/manual/aggregation/
- MongoDB Manual — Aggregation Pipeline Stages: https://www.mongodb.com/docs/manual/reference/operator/aggregation-pipeline/
- MongoDB Manual — `$group` and accumulator operators: https://www.mongodb.com/docs/manual/reference/operator/aggregation/group/
- MongoDB Manual — `$lookup`: https://www.mongodb.com/docs/manual/reference/operator/aggregation/lookup/
- MongoDB Manual — Aggregation Pipeline Optimization: https://www.mongodb.com/docs/manual/core/aggregation-pipeline-optimization/
- MongoDB Manual — Aggregation Pipeline Limits: https://www.mongodb.com/docs/manual/core/aggregation-pipeline-limits/
- MongoDB Node.js Driver — `Collection.aggregate()`: https://mongodb.github.io/node-mongodb-native/
- `mongodb-memory-server` (used by the example): https://github.com/nodkz/mongodb-memory-server

## Files in This Folder

- [README.md](./README.md) — short topic overview, objectives, and how to run the example
- [notes.md](./notes.md) — full notes (this file)
- [examples/aggregation.mjs](./examples/aggregation.mjs) — runnable demo: revenue per category, average order value, `$lookup` join, discounted totals
- [examples/example.txt](./examples/example.txt) — expected output of the demo
- [exercises.md](./exercises.md) — 5 practice tasks, no solutions

# 05 — Databases, Collections and Documents

> **Priority:** 🔴 High
> **Previous topic:** [04 — Installation and Setup](../04-installation-setup/README.md)
> **Next topic:** [06 — CRUD Operations](../06-crud-operations/README.md)

MongoDB has three levels: a **database** holds **collections**, a **collection** holds **documents**, and a **document** is a JSON-like object. That is the whole mental model — everything else in this module hangs off it. This topic covers the three levels, the BSON types a document can hold, the `_id` field and the `ObjectId` that fills it by default, creating and dropping databases and collections, the naming rules, and capped collections.

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain the three levels and how they map to SQL terms (database, table, row).
- Describe every BSON type and when to use it — including Date for dates and Decimal128 for money.
- Explain `_id` and `ObjectId`: what an ObjectId is made of and why it is unique without asking the server.
- Create and drop databases and collections, and explain why MongoDB creates them lazily.
- State the naming rules for databases, collections, and fields.
- Explain capped collections and when they are useful.
- Decide when to embed data in a document and when to reference it.

## Topics Covered

- The three levels — database → collection → document
- The SQL mapping — and where it breaks down
- BSON types — String, numbers, Boolean, Date, Array, embedded document, ObjectId, Null, Decimal128
- The 16 MB document limit
- `_id` — primary key, immutable, indexed automatically
- ObjectId — 12 bytes: timestamp + machine + process + counter
- Creating and dropping — lazy creation, `createCollection`, `drop()`, `dropDatabase()`
- Naming rules — case, reserved names, forbidden characters
- Capped collections — fixed size, insertion order, logs only

## Links

- **Notes:** [notes.md](./notes.md) — full detailed notes, diagrams, and interview questions with answers
- **Examples:** [examples/](./examples/) — run [`documents-demo.mjs`](./examples/documents-demo.mjs), expected output in [`example.txt`](./examples/example.txt)
- **Exercises:** [exercises.md](./exercises.md) — 5 practice tasks, no solutions
- **Module README:** [../README.md](../README.md)

**How to run the examples:**

```bash
NODE_PATH=/tmp/mongo-verify/node_modules node examples/documents-demo.mjs
```

## Key Takeaways

- Three levels: database → collection → document. One kind of thing gets one collection; one record is one document.
- Documents are stored as **BSON**, not JSON — that is where Date, ObjectId, and Decimal128 come from.
- Every document has an **`_id`**; the default ObjectId is 12 bytes and unique across machines without a server round trip, and it sorts roughly in creation order.
- Databases and collections are created **lazily**, on the first write — `use` and `db.collection()` only create handles.
- Dates are Date, money is Decimal128, and a document cannot exceed 16 MB — so unbounded lists belong in their own collection.
- Capped collections are fixed-size and self-cleaning: logs only, never data you must keep.

---

[← Main README](../../README.md) · Previous: [04 — Installation and Setup](../04-installation-setup/README.md) · Next: [06 — CRUD Operations](../06-crud-operations/README.md) · Module: [../README.md](../README.md)

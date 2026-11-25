# 07 — Query Operators

> **Priority:** 🔴 High
> **Previous topic:** [06 — CRUD Operations](../06-crud-operations/README.md)
> **Next topic:** [08 — Schema Design](../08-schema-design/README.md)

CRUD lets you read documents — but real apps never want *all* documents. They want "users over 21 from Karachi", "orders containing a laptop with quantity 3 or more", "products whose name starts with A". Query operators are how you ask those questions: `$gt`, `$in`, `$and`, `$or`, `$exists`, `$all`, `$elemMatch`, `$regex` — plus projection, sorting, and pagination. This topic is the full reading toolkit for MongoDB.

## Learning Objectives

By the end of this lesson, you will be able to:

- Use comparison operators (`$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`) for ranges and sets.
- Combine conditions with logical operators (`$and`, `$or`, `$not`, `$nor`).
- Test field presence and type with `$exists` and `$type`.
- Query arrays correctly with `$all`, `$elemMatch`, and `$size`.
- Use `$regex` and `$expr` for pattern and field-to-field comparisons.
- Control returned fields with projection, and order/page results with `sort`, `limit`, and `skip`.
- Count matching documents with `countDocuments`.
- Explain why `find()` returns a cursor, not an array.

## Topics Covered

- Comparison operators: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`
- Logical operators: `$and`, `$or`, `$not`, `$nor`
- Element operators: `$exists`, `$type`
- Array operators: `$all`, `$elemMatch`, `$size`, and element-wise matching
- Evaluation operators: `$regex`, `$expr`, `$text`, `$where`
- Projection: include/exclude rules, `_id: 0`
- Sorting, `limit`, `skip`, pagination (and why `skip` gets slow)
- `countDocuments` vs `estimatedDocumentCount`
- Cursors: lazy execution, `toArray()`

## Links

- **Notes:** [notes.md](./notes.md) — full detailed notes, diagrams, and interview questions with answers
- **Examples:** [examples/](./examples/) — run [`query-operators.mjs`](./examples/query-operators.mjs), expected output in [`example.txt`](./examples/example.txt)
- **Exercises:** [exercises.md](./exercises.md) — 5 practice tasks, no solutions
- **Module README:** [../README.md](../README.md)

**How to run the examples:**

```bash
NODE_PATH=/tmp/mongo-verify/node_modules node examples/query-operators.mjs
```

The example uses an in-memory MongoDB server, so no MongoDB installation is needed. It starts the server, runs the demo, prints the output, then stops the server and exits.

## Key Takeaways

- `{ age: 21 }` is shorthand for `{ age: { $eq: 21 } }` — plain equality is just one operator.
- `$elemMatch` exists because dot notation can match *different* array elements; use it when all conditions must hold on the *same* element.
- `$ne: true` also matches documents where the field is missing — if you mean exactly `false`, write `{ field: false }`.
- `find()` returns a cursor; the query runs only when you iterate it.
- Projection, `sort`, `limit`, and `skip` shape what comes back — and projection is a performance tool, not just cosmetics.

---

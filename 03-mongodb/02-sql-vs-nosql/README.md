# 02 — SQL vs NoSQL

> **Priority:** 🔴 High
> **Previous topic:** [01 — Introduction to MongoDB](../01-introduction/README.md)
> **Next topic:** [03 — MongoDB Architecture](../03-mongodb-architecture/README.md)

"SQL or NoSQL?" is the question every backend developer gets asked — usually as if one of them is the right answer. It is not that kind of question. SQL and NoSQL are two different answers to "where do I keep my data?", and each one is better for a different shape of data and a different pattern of access. This topic compares them honestly: the data model, the schema, joins vs embedding, scaling, and the ACID vs BASE trade-off — so you can look at a real feature and say which side fits, and why.

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain the core difference between SQL and NoSQL: tables + joins vs documents + embedding.
- Explain the difference between embedding and referencing, and choose between them.
- Use `$lookup` to join collections — and explain why needing it everywhere is a warning sign.
- Compare fixed vs flexible schemas, and name the cost of each.
- Explain ACID vs BASE honestly, including that MongoDB does support transactions.
- Compare scaling up vs scaling out, and say which side each database favours.
- Look at a feature (a bank transfer, a blog post, a product catalogue) and choose the right database with a reason.
- Explain polyglot persistence: why real systems often use both.

## Topics Covered

- The data model — normalise + join vs embed + read once
- Schema — fixed and enforced vs flexible and your code's responsibility
- Joins vs embedding — the decision rule, and `$lookup` when you need a join
- Referencing — the foreign-key equivalent, and what MongoDB does not enforce
- Scaling — up (SQL) vs out (MongoDB sharding)
- ACID vs BASE — what each guarantees, and what modern MongoDB actually supports
- Normalisation vs denormalisation — where the price is paid, read time vs write time
- The honest comparison table — model, schema, joins, transactions, scaling, best fit
- Choosing — a step-by-step decision flow, and polyglot persistence

## Links

- **Notes:** [notes.md](./notes.md) — full detailed notes, diagrams, and interview questions with answers
- **Examples:** [examples/](./examples/) — run [`sql-vs-nosql.mjs`](./examples/sql-vs-nosql.mjs), expected output in [`example.txt`](./examples/example.txt)
- **Exercises:** [exercises.md](./exercises.md) — 5 practice tasks, no solutions
- **Module README:** [03 — MongoDB](../README.md)

**How to run the examples:**

```bash
NODE_PATH=/tmp/mongo-verify/node_modules node examples/sql-vs-nosql.mjs
```

> The mongodb packages are **not** installed inside this repo — they live only in `/tmp/mongo-verify/node_modules` and are found through the `~/workspace/node_modules` symlink. In your own project you would run `npm install mongodb` and the import would just work. The example uses `mongodb-memory-server`, which starts a real MongoDB in memory and stops it when the script ends, so nothing is installed on your machine.

## Key Takeaways

- SQL stores data in tables and reassembles it with joins; MongoDB stores it as documents and reads it whole.
- **Embed** when data is always used together; **reference** when it is large, shared, or changes on its own.
- MongoDB can join (`$lookup`) and can do ACID transactions — the question is cost, not possibility.
- Flexible schema moves consistency work from the database to your code.
- SQL scales up first; MongoDB scales out by design.
- Choose by data shape and access pattern. Real systems use both — PostgreSQL for money, MongoDB for content.

---

[← Main README](../../README.md) · Previous: [01 — Introduction to MongoDB](../01-introduction/README.md) · Next: [03 — MongoDB Architecture](../03-mongodb-architecture/README.md)

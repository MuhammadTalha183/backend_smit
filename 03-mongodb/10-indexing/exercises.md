# 10 — Indexing: Exercises

> **Module:** [03 — MongoDB](../README.md) · **Notes:** [notes.md](./notes.md) · **Example:** [examples/indexing.mjs](./examples/indexing.mjs)
>
> 5 practice tasks, no solutions. Attempt first, then check the answers in `notes.md` §12.

## Basic understanding

**1.** Run `examples/indexing.mjs` and compare the output with `example.txt`. Then, in your own copy, drop the `city_1` index before the "after" query and re-run. Which index does the planner pick now, and does `totalDocsExamined` change?

## Conceptual

**2.** A collection has the compound index `{ officeId: 1, status: 1, position: 1 }`. For each of these queries, say whether the index helps fully, partially, or not at all — and why:
- `find({ officeId: 'admin' })`
- `find({ status: 'waiting' })`
- `find({ officeId: 'admin', status: 'waiting' }).sort({ position: 1 })`
- `find({ position: { $lt: 5 } })`

**3.** Explain the ESR rule by designing the right compound index for this query: `find({ userId: X, completed: false }).sort({ dueDate: 1 })` where `dueDate` is also filtered with `{ dueDate: { $gte: today } }` in a second version of the query. Which field order, and why?

## Practical coding

**4.** Build a `sessions` collection with a TTL index that expires documents after 10 seconds. Insert a session, confirm it exists, wait 70 seconds, and confirm it is gone. (The ~60-second background thread is why you wait more than 10.) Then explain in one paragraph why a TTL index is better than a cron job that deletes old sessions.

## Scenario-based

**5.** Q-less has 100,000 tokens. The dashboard runs: "waiting tokens at the admin office, in position order". Without an index, `explain()` shows COLLSCAN and `totalDocsExamined: 100000`. Design the index, then explain: (a) what `explain()` should show after, (b) what the index costs on every new token insert, and (c) one query on the same collection that this index does NOT help.

## Interview-style questions

- What is the difference between COLLSCAN and IXSCAN?
- What is the leftmost prefix rule?
- What is the ESR rule?
- How does a unique index differ from a normal index?
- What do indexes cost, and when should you not create one?

---

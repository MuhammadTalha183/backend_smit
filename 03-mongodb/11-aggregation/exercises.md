# 11 — Aggregation: Exercises

> **Module:** [03 — MongoDB](../README.md) · **Notes:** [notes.md](./notes.md) · **Example:** [examples/aggregation.mjs](./examples/aggregation.mjs)
>
> 5 practice tasks, no solutions. Attempt first, then check the answers in `notes.md` §12.

## Basic understanding

**1.** Run `examples/aggregation.mjs` and compare the output with `example.txt`. Then change pipeline 1's `$match` from `{ status: 'delivered' }` to `{ status: 'pending' }` and predict the output before running it again. How many groups are left, and why?

## Conceptual

**2.** Explain in your own words why `$group` "forgets" every field except `_id` and the accumulator fields. Write a pipeline that groups orders by `customer` and still shows each customer's name in the result — what are the two different ways to get the name back?

**3.** A pipeline has `$sort` then `$limit: 5`. Another has `$limit: 5` then `$sort`. Both run on the same data. Do they return the same 5 documents? Explain what each one actually does, and which one answers "top 5 orders by amount".

## Practical coding

**4.** Using the same 8-order / 3-customer dataset from the example (or your own), write pipelines that print:
- Total revenue from `delivered` orders only (one number — hint: group with `_id: null`).
- The number of orders per `status` (`delivered`, `pending`, `cancelled`), sorted by count descending.
- The cheapest and most expensive `delivered` order in each category (`$min` and `$max`).
- The distinct categories each customer has ordered from (hint: `$addToSet`).
- The count of `cancelled` orders using `$count`.

## Scenario-based

**5.** You are building Q-less (the semester project idea). The `tokens` collection has `{ office, status, position, createdAt }` where `status` is `waiting`, `done`, or `missed`. Write pipelines for:
- The number of `done` tokens per office today.
- The average waiting position of `waiting` tokens per office.
- The top 3 offices by total tokens issued.
- Then explain: which of these three could you answer with plain `find()` + `countDocuments`, and which one genuinely needs aggregation — and why?

## Interview-style questions

- What is an aggregation pipeline, and how do documents flow through it?
- What does `$group` do, and what happens to fields that are not in `_id` or an accumulator?
- Why should `$match` come first in a pipeline?
- What does `$lookup` return, and why is `$unwind` usually the next stage?
- What is the difference between `$lookup` and Mongoose `populate()`?
- When would you use aggregation instead of `find()`?
- What are accumulator operators? Name five.
- What is the 100 MB memory limit on blocking stages, and how do you handle it?
- What does `$unwind` do to documents whose array is missing or empty?
- How do you get the "top 10" of something in a pipeline, and why does the stage order matter?

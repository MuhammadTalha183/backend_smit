# 07 — Query Operators: Exercises

> **Module:** [03 — MongoDB](../README.md) · **Notes:** [notes.md](./notes.md) · **Example:** [examples/query-operators.mjs](./examples/query-operators.mjs)
>
> 5 practice tasks, no solutions. Attempt first, then check the answers in `notes.md` §12.

## Basic understanding

**1.** Run `examples/query-operators.mjs` and compare the output with `example.txt`. Change the `$gt: 21` query to `$gte: 21` and predict the output before running it again. Which extra name appears, and why?

## Conceptual

**2.** Explain in your own words why `{ 'items.product': 'laptop', 'items.qty': { $gte: 3 } }` can match an order that `$elemMatch` would reject. Give a concrete order document that proves it.

**3.** Why does `{ verified: { $ne: true } }` return users who never got a `verified` field at all? What query would you write if you only wanted users whose `verified` is exactly `false`?

## Practical coding

**4.** Using the same 5-user dataset from the example (or your own), write queries for all of these and print the names each one returns:
- Users aged 20–25 inclusive, sorted by age ascending.
- Users whose skills include `node` but NOT `react`.
- Users from Karachi whose name contains the letter `a` (case-insensitive).
- The 2nd page of users sorted by name, 2 users per page.
- The count of users with more than 2 skills.

## Scenario-based

**5.** You are building Q-less (the semester project idea). The `tokens` collection has `{ office, status, position, createdAt }`. Write the queries for:
- All `waiting` tokens at the `admin` office, ordered by `position` ascending.
- Tokens created today at the `fees` office that are `missed`.
- The number of `done` tokens at each office — first try it with plain queries, then explain why this one actually needs aggregation (topic 11) instead.

## Interview-style questions

- What does `find()` return, and when does the query actually run?
- What is the difference between `$in` and `$or`?
- When do you need explicit `$and`, given that `{ a: 1, b: 2 }` already means AND?
- What is the one rule of projection that beginners always break?
- How does pagination with `skip()` break at scale, and what replaces it?

---

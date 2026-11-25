# 02 — SQL vs NoSQL — Exercises

> Answers to the interview-style questions are in [notes.md](./notes.md) §12 — attempt them first, then check. There are no solutions for the practice tasks on purpose: the exercise *is* the learning.

## Basic understanding

### 1. Run the example, then change the shape
Run `sql-vs-nosql.mjs` and compare your output with `example.txt`. Then add a third post to the embedded `profiles` document only (not to `posts`). Run it again. Which half of the output changes, and why?

### 2. Spot the join
In the example output, which part came from a `$lookup` and which part came from a single `findOne`? How can you tell just by looking at the code?

## Conceptual questions

### 3. In your own words
A classmate says "MongoDB has no joins and no transactions, so it is a toy database." Write the correction in three or four sentences — what is true, what is false, and what the real trade-off is.

## Practical coding exercises

### 4. Break the reference
Write a script that inserts a post with `userId` pointing at an ObjectId that matches no user. Does MongoDB stop you? Then run a `$lookup` for that user — what comes back? Write one sentence explaining what this proves about referential integrity in MongoDB.

### 5. Embed or reference?
For each of these, write down "embed" or "reference" and one line of reasoning: (a) comments on a blog post; (b) the author of a thousand blog posts; (c) items in a single order; (d) a product listed in a thousand orders; (e) a student's marks for one semester. Then model two of them in a script with fixed ObjectIds and show a read of each.

## Scenario-based question

### 6. The wrong pick
A team builds a money-transfer feature on MongoDB and stores each account's balance inside the user document, duplicated into a `recentTransactions` array. One transfer updates the sender's document but crashes before updating the receiver's. Explain what went wrong, which database property would have prevented it, and two ways to fix the design (one in MongoDB, one by changing database).

## Interview-style questions

1. What is the core difference between SQL and NoSQL?
2. Embed or reference — what is the decision rule?
3. What does `$lookup` do, and why is needing it everywhere a warning sign?
4. What is the difference between ACID and BASE?
5. Does MongoDB support transactions? Explain the honest answer.
6. What is normalisation, and why does MongoDB often denormalise instead?
7. What is polyglot persistence, and when is it the right call?
8. Which scales out more naturally, SQL or MongoDB — and why?

---

[← Topic README](./README.md) · [Notes](./notes.md)

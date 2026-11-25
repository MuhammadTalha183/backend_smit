# 03 — MongoDB Architecture — Exercises

> Answers to the interview-style questions are in [notes.md](./notes.md) §12 — attempt them first, then check. There are no solutions for the practice tasks on purpose: the exercise *is* the learning.

## Basic understanding

### 1. Run the example, then read the trap
Run `architecture-demo.mjs` and compare your output with `example.txt`. The notes describe a trap: `buildInfo` lists available storage engines, and the first one alphabetically is `devnull`. Change the example to print `build.storageEngines[0]` instead of the serverStatus value, run it, and write down what it prints and why it is wrong.

### 2. Draw it
On paper (or in a text file), draw the three deployments from notes §5.1 — single server, replica set, sharded cluster — and label each box with one line saying what it does. If you cannot label a box, re-read that section.

## Conceptual questions

### 3. In your own words
Explain the difference between a replica set and sharding to a classmate in three sentences: what each one copies or splits, what problem it solves, and what happens when one server dies in each case.

## Practical coding exercises

### 4. BSON round-trip
Write a script that inserts a document containing a `Date`, a `Decimal128` price of `"99.95"`, an `Int64` of `"9007199254740995"`, and a `Uint8Array` of `[0x01, 0x02, 0x03]`, then reads it back and prints the type of each value (`instanceof Date`, `.toString()`, and the Binary `.buffer`). What comes back for each — the same type you put in, or something else?

### 5. Namespace hunt
Write a script that creates two databases (`shop` and `blog`) and one collection in each (`orders` and `posts`). Print each collection's `.namespace`. Then run `db.stats()` on `shop` and print only `db`, `collections`, and `objects`. Explain why you did not print `dataSize`.

## Scenario-based question

### 6. The hot shard
A team shards their `orders` collection by `createdAt` (a timestamp that always increases). After a month, one shard holds 90% of the data and all new writes go to it, while the other shards sit idle. Explain what went wrong, what a shard key is supposed to do, and name two better shard keys for an orders collection with a reason for each.

## Interview-style questions

1. What are `mongod` and `mongosh`, and how are they different?
2. What is WiredTiger, and what does it own?
3. What is BSON, and why is it not just JSON?
4. What is a replica set, and why is three the minimum number of members?
5. What is the difference between a replica set and sharding?
6. What is an oplog, and what is it for?
7. What is a shard key, and what happens if you choose a bad one?
8. What is the maximum document size, and what does it imply for embedding vs referencing?

---

[← Topic README](./README.md) · [Notes](./notes.md)

# 01 — Introduction to MongoDB — Exercises

> Answers to the interview-style questions are in [notes.md](./notes.md) §12 — attempt them first, then check. There are no solutions for the practice tasks on purpose: the exercise *is* the learning.

## Basic understanding

### 1. Run the example, then break it
Run `intro-demo.mjs` and compare your output with `example.txt`. Then remove the `await client.close()` line at the end and run it again. What happens — does the script exit? Put the line back and explain in one sentence why it matters.

### 2. List what was created
After the example runs, which database and which collection exist? How do you know, from the output alone?

## Conceptual questions

### 3. In your own words
Explain to a classmate (out loud, or in two or three written sentences) the difference between a document, a collection, and a database — using the `students` example from the notes.

## Practical coding exercises

### 4. Your own collection
Write a new script `my-first-db.mjs` (same setup: memory server, fixed ObjectIds) that creates a database called `practice`, a collection called `books`, inserts three books with `_id`, `title`, `author` and `pages`, prints all of them, prints one by title, and prints the count. The output must be identical on every run — no random IDs, no timestamps.

### 5. Lazy creation trap
Write a script that calls `db.collection('student')` (singular) instead of `'students'` and inserts one document. What happens — an error, or a new collection? Now list the collection names and explain what the result proves about lazy creation.

## Scenario-based question

### 6. The vanishing data
Your Express app stores its users in a JavaScript array. Your teacher restarts the server during a demo and every user is gone. Explain what went wrong, and what changes (in one paragraph) when the same data lives in MongoDB instead.

## Interview-style questions

1. What is MongoDB, in one sentence?
2. What is the difference between a document and a row?
3. What is BSON and why does MongoDB use it instead of plain JSON?
4. What is an ObjectId made of, and why is it unique without coordination?
5. What is the difference between `mongod`, `mongosh`, and the driver?
6. What does `find()` return, and what do you do with it?
7. When would you choose MongoDB over PostgreSQL — and when would you not?
8. What is lazy creation, and what bug does it cause for beginners?

---

[← Topic README](./README.md) · [Notes](./notes.md)

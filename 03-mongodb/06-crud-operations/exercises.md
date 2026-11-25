# 06 — CRUD Operations: Exercises

> No solutions are given on purpose — attempt every task, then check your understanding against `notes.md` §12. Back to the [lesson README](./README.md).

## Basic understanding

1. **The four operations.** Using `mongosh` or a script, create a `tasks` collection and do all four CRUD operations on it: insert two tasks, read them back, update one, delete one. After each step, print the result object (`insertedId`, `matchedCount`/`modifiedCount`, `deletedCount`) and write down what each number means.

## Conceptual questions

2. **Matched vs modified.** You run `updateOne({ _id }, { $set: { done: true } })` and get `matchedCount: 1, modifiedCount: 0`. Explain exactly what happened, and describe a situation where this result is correct behaviour rather than a bug.
3. **Replace vs update.** A teammate writes `updateOne({ _id }, { title: 'New Title' })` intending to change only the title. Explain what actually happens to the document, what the correct call is, and how you would recover the lost fields (assuming you cannot).

## Practical coding exercises

4. **The bookshop API (in-memory).** Write a script against a fresh in-memory server that: inserts 5 books; finds all books cheaper than $30, sorted by price, returning only `title` and `price`; updates the stock of one book with `$inc`; upserts a book with a fixed `_id` you choose; deletes all books with stock 0; and finally prints the remaining books. After each step, print the result counts. Compare your final list with what you predicted before running it.
5. **Pagination.** Using the same 5 books (or 12 you insert for this task), write a function `getPage(page, limit)` that returns one page with `skip` and `limit`, sorted by title. Call it for pages 1, 2, and 3 with limit 5. What happens on page 3, and what would your API return to a client that asks for page 99?

## Scenario-based questions

6. **The empty delete.** A route handler does `await books.deleteMany(req.body.filter)` where `filter` comes straight from the client. A client sends `{}`. Explain what happens, why it is catastrophic, and list three concrete defences (validation, allow-listing, and one more of your choice).

## Interview-style questions

7. What does `find()` return, and what must you do before you have documents?
8. What is the difference between `updateOne` with `$set` and `replaceOne`?
9. What is an upsert, and when would you use one?
10. `findOne` found nothing — what does it return, and what should your code do?
11. How do you page through results, and why must you sort first?
12. Is a single-document update atomic? What about an update across many documents?

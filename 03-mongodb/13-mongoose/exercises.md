# 13 — Mongoose: Exercises

> **Module:** [03 — MongoDB](../README.md) · **Notes:** [notes.md](./notes.md) · **Example:** [examples/mongoose-demo.mjs](./examples/mongoose-demo.mjs)
>
> 5 practice tasks, no solutions. Attempt first, then check the answers in `notes.md` §12.

## Basic understanding

**1.** Run `examples/mongoose-demo.mjs` and compare the output with `example.txt`. Then change the invalid user in step 2 so it is missing `name` instead of `email` (keep `age: -5`). Predict the exact `ValidationError` message before running it again, then run it and check. Which paths does the message list, and in which order?

## Conceptual

**2.** Explain in your own words why `unique: true` on `email` does **not** stop two requests from registering the same email at the same moment, even though each request checks `User.findOne({ email })` first. What two layers of defence, together, actually prevent the duplicate — and which error does the second layer produce?

**3.** A `Product` schema has `price: { type: Number, min: 0 }`. A route does `Product.updateOne({ _id }, { price: -50 })` and the negative price gets saved without any error. Why did validation not run, what option fixes it, and what would still not be checked even with that option?

## Practical coding

**4.** Extend the demo's schemas into a small library app (no solutions — write it yourself):
- A `Book` model: `title` required, `pages` with `min: 1`, `genre` enum `['fiction', 'science', 'history']`, `isbn` required + unique.
- A `Borrow` model: `book` as an `ObjectId` ref to `'Book'`, `borrower` as a required string, `returned` as a boolean defaulting to `false`.
- A `pre('save')` hook on `Book` that trims the title.
- A virtual on `Book` called `label` that returns `"<title> (<genre>)"`.
- A static method on `Borrow` called `findActive()` that returns borrows where `returned` is `false`.
- A script that creates one book and two borrows, then prints the borrows with the book populated (title + author of the borrow), and prints the book's virtual `label`.

## Scenario-based

**5.** You are building Q-less (the semester project idea). The `Token` model has `{ office, status: enum ['waiting','called','done','missed'], position: Number, student: { type: ObjectId, ref: 'User' } }`. Answer and implement:
- The office screen lists `waiting` tokens at the `admin` office, ordered by `position`, showing each student's name. Write the query — and explain why `.populate('student', 'name')` is the right call here instead of `$lookup`.
- The admin dashboard needs, for **every** office, the count of `done` tokens today. Write it — and explain why this one needs `$lookup`/aggregation thinking instead of `populate`, even though no join is involved.
- A student tries to take a second token while their first is still `waiting`. Which Mongoose feature (validator, hook, or unique index) would you reach for, and why is each of the other two the wrong tool for this rule?

## Interview-style questions

- What is Mongoose, and how is it different from the MongoDB driver?
- How does Mongoose relate to the ORM concept?
- What is the difference between a schema, a model, and a document?
- Does `unique: true` validate uniqueness? What error does a duplicate actually produce?
- When does validation run, and when does it not?
- What is the difference between `populate()` and `$lookup`?
- What is `.lean()`, and when should you use it?
- Why must hooks and methods use regular functions, not arrow functions?
- What is a virtual, and what are its two main limitations?
- What happens if you forget `await` on a Mongoose query?
- When would you choose the raw driver over Mongoose?
- Why is opening a database connection per request a bad idea?

---

# 08 — Schema Design: Exercises

> **Module:** [03 — MongoDB](../README.md) · **Notes:** [notes.md](./notes.md) · **Example:** [examples/schema-design.mjs](./examples/schema-design.mjs)
>
> 5 practice tasks, no solutions. Attempt first, then check the answers in `notes.md` §12.

## Basic understanding

**1.** Run `examples/schema-design.mjs` and compare the output with `example.txt`. Then change the invalid product's price from `-100` to `0` and predict the output before running it again. Is `0` accepted? Why?

## Conceptual

**2.** A blog post has 40,000 comments and counting. Explain, using rules 2 and 3, why embedding all of them is wrong — and what the better design is. Where do the comments live, and what does the post store instead?

**3.** An e-commerce order embeds `{ productName, price }` and references `productId`. A month later the shop raises the product's price. Explain why the old orders still show the old price, and why that is correct behaviour, not a bug.

## Practical coding

**4.** Add `$jsonSchema` validation to a new `users` collection: `name` (string, required), `email` (string, required, must match a simple email pattern), `age` (number, minimum 18, optional). Insert one valid user and three invalid ones (missing email, age 15, age as a string). Print each result and confirm the error code is 121 for all three failures.

## Scenario-based

**5.** Design the schema for Q-less (tokens, offices, users) **and** for AI Study Buddy (decks, cards, user progress). For each collection, write down: the fields, what is embedded, what is referenced, and one sentence justifying each embedding/reference decision with a rule of thumb. Then pick the one decision you are least sure about and argue the opposite side.

## Interview-style questions

- Embed or reference — how do you decide?
- What are the six rules of thumb, and which one would you quote first?
- What happens when an embedded array grows without bound?
- What is the 16 MB document limit, and what breaks when you hit it?
- What does error code 121 mean, and where does it come from?

---

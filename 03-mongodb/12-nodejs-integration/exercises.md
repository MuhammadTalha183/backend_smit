# 12 — Node.js Integration: Exercises

> **Module:** [03 — MongoDB](../README.md) · **Notes:** [notes.md](./notes.md) · **Example:** [examples/node-integration.mjs](./examples/node-integration.mjs)
>
> 5 practice tasks, no solutions. Attempt first, then check the answers in `notes.md` §12.

## Basic understanding

**1.** Run `examples/node-integration.mjs` and compare the output with `example.txt`. Then change the update step so Bilal's age becomes `21` instead of `20`, and predict the `updated user:` line before running it again. Change it back afterwards.

## Conceptual

**2.** Explain in your own words why creating a new `MongoClient` inside every Express route handler is a bad idea, even though each handler still "works". In your answer, cover: what a connection pool is, what the default pool size is, and what happens on the MongoDB server as traffic grows.

**3.** A teammate says "Mongoose replaces the driver, so we don't need to learn the driver." Write a short reply explaining the real relationship between Mongoose and the driver, and one concrete situation where knowing the driver saves you while debugging a Mongoose app.

## Practical coding

**4.** Using the same in-memory-server setup as the example (same `dbPath` pattern, same fixed `_id` style), write a script that:
- Connects once and reuses one client.
- Inserts 3 products into a `products` collection: `{ name: 'Laptop', price: 150000 }`, `{ name: 'Mouse', price: 2500 }`, `{ name: 'Keyboard', price: 8000 }`.
- Finds all products with `price` greater than `5000`, sorted by price ascending, and prints their names.
- Updates the Mouse price to `3000` and prints `matched` and `modified`.
- Deletes the Keyboard and prints the final `countDocuments`.
- Closes the client in `finally` and cleans up the data directory, exactly like the example.

## Scenario-based

**5.** You are building Q-less (the semester project idea). The API has an endpoint `GET /tokens/next?office=admin` that must return the next waiting token and mark it `called`, atomically, so two staff members can never claim the same token.
- Write the endpoint using the driver only (no Mongoose): which method do you use, and why is `findOne` followed by `updateOne` the wrong shape here?
- What should the endpoint return (and with which HTTP status) when no token is `waiting`?
- What should it return when MongoDB is unreachable at that moment, and what happens to the next request once MongoDB comes back — does your code need to reconnect?

## Interview-style questions

- How should a Node.js app manage its MongoDB connection, and why one client?
- What is a connection pool, and what is its default size?
- What is the difference between `mongodb://` and `mongodb+srv://`?
- Where should the connection string live, and why must it never be hardcoded?
- What does `find()` return, and when does the query actually run?
- When do you use `toArray()`, and when do you stream a cursor instead?
- What does `updateOne` return, and how do you know whether anything changed?
- What happens when MongoDB is unreachable, and how do you handle it at startup vs during a request?
- What is the `try/finally` close pattern, and why does it matter?
- What is the relationship between the driver and Mongoose?

---

# 04 — Installation and Setup: Exercises

> No solutions are given on purpose — attempt every task, then check your understanding against `notes.md` §12. Back to the [lesson README](./README.md).

## Basic understanding

1. **Get it running.** Install MongoDB on your machine (or start the service if it is already installed), run `mongosh`, and write down the server version from `db.version()`. Then stop `mongod`, try `mongosh` again, and write down the exact error. Start `mongod` again. What does the error tell you about the difference between installing and running?

## Conceptual questions

2. **Local vs Atlas.** A teammate says "Atlas is better, so a local install is a waste of time." Explain, in your own words, two situations where a local install is the right choice and two where Atlas is. When would you use `mongodb-memory-server` instead of either?
3. **The lazy database.** You run `use shopdb` in `mongosh`, then `show dbs`, and `shopdb` is not listed. Explain why, and name the one action that makes it appear.

## Practical coding exercises

4. **Connection check script.** Write a small script `check.mjs` that reads `MONGODB_URI` from the environment (falling back to `mongodb://localhost:27017/schooldb`), connects with `MongoClient`, runs the `ping` command, prints the server version, and closes the client. Run it twice: once with no environment variable, once with `MONGODB_URI` set to a wrong port (e.g. `mongodb://localhost:27099/schooldb`). What error do you get the second time, and what does it mean?
5. **Compass tour.** Connect Compass with your local connection string. Create a database called `playground` and a collection called `notes` from inside Compass, insert one document by clicking (not by typing a command), and then find the same document from `mongosh` with `db.notes.find()`. Write down the two ways the same document looks — Compass view vs shell output.

## Scenario-based questions

6. **The leaked secret.** A classmate pushes their project to GitHub with the Atlas connection string (real username and password) written directly in `server.js`. List three things that can go wrong, and describe exactly how you would fix the project: what to change in the code, what to change in the repository, and what to change in Atlas.

## Interview-style questions

7. What is the difference between `mongod` and `mongosh`?
8. What is the default MongoDB port, and how would you run the server on a different one?
9. What is the difference between `mongodb://` and `mongodb+srv://`?
10. Where should a connection string live, and why?
11. What does `{ ok: 1 }` from a `ping` command tell you?
12. What is MongoDB Compass, and what is it *not*?

# 05 — Databases, Collections and Documents: Exercises

> No solutions are given on purpose — attempt every task, then check your understanding against `notes.md` §12. Back to the [lesson README](./README.md).

## Basic understanding

1. **Build the three levels.** In `mongosh` (or a script), switch to a database called `bookstore`, insert one document into a collection called `books` and one into a collection called `authors`. Then run `show dbs` and `show collections`. Which of the three levels did you create by writing, and which did you create by naming?

## Conceptual questions

2. **Embed or reference?** A blog post has an author, a list of tags, and a list of comments. For each of the three, say whether you would embed it in the post document or store it in a separate collection — and give one reason for each choice. Then change your mind about one of them: what would make the opposite choice right?
3. **Null vs missing.** A student document has no `guardianPhone` field. Another has `guardianPhone: null`. Write the query `{ guardianPhone: null }` and predict which documents it matches. Then explain, in one sentence each, what the two documents *mean*.

## Practical coding exercises

4. **BSON type tour.** Write a script that inserts one document into a `types` collection containing at least one value of each of these BSON types: String, Int32, Double, Boolean, Date, Array, embedded document, ObjectId (as a field other than `_id`), and Null. Read it back with `findOne` and print it. Which value surprised you in the output, and why? (Hint: check how the Date prints.)
5. **Capped log.** Create a capped collection called `app-logs` with a small size (e.g. 4096 bytes, max 5 documents). Insert 8 short log documents, then read the collection. How many documents are there, and which ones survived? Write down the rule this proves.

## Scenario-based questions

6. **The 16 MB wall.** A social app stores each user's posts embedded inside the user document. After a year, the most active user cannot post any more. Explain what hit the limit, why embedding was the wrong choice here, and how you would redesign it (which collection, what the documents look like, how you would read a user's posts).

## Interview-style questions

7. What are the three levels of MongoDB, and how do they map to SQL?
8. What is BSON, and why does MongoDB use it instead of plain JSON?
9. What is an ObjectId made of, and why is it unique without asking the server?
10. How are databases and collections created, and why does `show dbs` hide an empty one?
11. What is a capped collection, and what is it for?
12. Why should money be stored as Decimal128 and not as a Double?

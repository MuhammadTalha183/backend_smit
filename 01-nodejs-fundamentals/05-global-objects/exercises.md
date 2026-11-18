# Exercises — 05 Global Objects

Do these **after** reading [notes.md](./notes.md) and running `node examples/global-objects.js`.

No solutions are provided on purpose — the exercise *is* the learning.
If you are stuck, re-read the matching part of [notes.md](./notes.md) and run the example again.

---

## Basic Understanding

### Exercise 1 — List Them From Memory ⭐ Start here

Write down every global object you can name, without looking at the notes.

Then open a Node.js REPL (`node` with no file) and run:

```js
Object.keys(globalThis)
```

Compare the two lists.

**Questions to answer:**
- Which globals did you remember, and which ones did you miss?
- Which names in the list surprise you — things you did not know were global?
- Why does the list not include `__dirname` or `require`? (Hint: check notes.md §3.2 — the module wrapper.)

**Done when:** you can name `console`, `process`, `Buffer`, the timers, `globalThis`, `URL`, and `TextEncoder` from memory, and explain why `__dirname` is missing from the list.

---

## Conceptual

### Exercise 2 — Prove the `var` Trap

Write a program `scope.js` that:

1. Declares a top-level `var`, a top-level `let`, and a top-level `const` (three different names).
2. Prints `globalThis` for each of the three names.
3. Then sets one value explicitly on `globalThis` and prints it back.

**Questions to answer:**
- Which of the three declarations appear on the global object, and why?
- What is the difference between the explicit `globalThis.x = ...` version and the `var` version?
- Now open a browser console (or think it through): what would a top-level `var` do there, and why is Node.js different? (Hint: check notes.md §3.2 and §3.10 — the module wrapper.)

*Hint: in a Node.js file, top-level declarations belong to the module scope, not the global object.*

---

## Practical Coding

### Exercise 3 — Bytes vs Characters

Write a program `bytes.js` that:

1. Takes three words: one English word (e.g. `hello`), one Urdu word (e.g. `سلام`), and one word with an emoji (e.g. `hi 👋`).
2. For each word, prints its character length (`word.length`) and its byte length (`Buffer.from(word, 'utf8').length`).
3. Prints each word back from its buffer with `buf.toString('utf8')` — does it round-trip exactly?

**Questions to answer:**
- When are character length and byte length equal, and when are they not?
- How many bytes is the emoji? Why is it more than one?
- Imagine you are checking "username must be under 20 characters" — should you check `length` or byte length? What breaks if you pick the wrong one?

*Hint: check notes.md §3.5 — `Buffer`. UTF-8 uses 1 byte for English letters and more for other scripts.*

### Exercise 5 — Build a Tiny Config Loader

Write a program `config.js` that:

1. Reads `PORT` and `NODE_ENV` from `process.env`, with fallbacks: port `3000`, environment `'development'`.
2. Reads a required variable `DATABASE_URL` from `process.env` — with **no** fallback.
3. If `DATABASE_URL` is missing, prints an error with `console.error` and exits with code 1 (`process.exit(1)`).
4. If it is present, prints the port, the environment, and a message like `Config OK — starting server on port 3000`.

Run it three ways and write down what happens each time:

```bash
node config.js
PORT=4000 NODE_ENV=production node config.js
DATABASE_URL=postgres://localhost/mydb PORT=4000 node config.js
```

**Questions to answer:**
- Why does the program exit with code 1 instead of just printing a warning and continuing?
- Why is `console.error` the right call for the missing-variable message, not `console.log`? (Hint: check notes.md §3.4 — `console`.)
- Where would a real server keep `DATABASE_URL` so it is never written in the code? (Hint: check notes.md §3.3 — environment variables.)

*Hint: check notes.md §3.3 and §3.4. Unset variables are `undefined` — always give a fallback, except for secrets, where missing should stop the program.*

---

## Scenario-Based

### Exercise 4 — `__dirname` vs `process.cwd()`

Write a program `whereami.js` that prints two lines:

```js
console.log('__dirname:', __dirname);
console.log('process.cwd():', process.cwd());
```

Then run it from two different folders:

```bash
# From the folder where the file lives:
node whereami.js
# From a different folder (e.g. your home folder):
node path/to/whereami.js
```

**Questions to answer:**
- Which value changes between the two runs, and which one stays the same?
- Your program needs to open a file called `data.txt` that sits next to `whereami.js`. Which of the two values do you build the path from, and what breaks if you pick the other one?
- Your program needs to open a file the *user* named on the command line. Which value do you use now?

*Hint: check notes.md §3.2. `__dirname` is where the file lives; `process.cwd()` is where you ran `node` from.*

---

## Interview-Style Questions

Try answering these out loud, in your own words, before checking the short answers in [notes.md §12](./notes.md#12-interview-questions-and-answers):

1. What is a global object in Node.js? Name five, without looking.
2. What is the difference between `global` and `globalThis`? Which one should you use, and why?
3. Is `__dirname` a global? Prove your answer, and explain where it actually comes from.
4. What is the difference between `__dirname` and `process.cwd()`? When would they be different?
5. What is `process.argv`? Which index do *your* arguments start at, and why?
6. How do you read configuration (like a port number) in Node.js, and what do you do when the variable is not set?
7. What is a `Buffer`? Why is `'سلام'.length` 4 but its byte length 8?
8. Why is a top-level `var` in a Node.js file not global, when the same `var` in a browser script is?
9. What does `setTimeout` return in Node.js, and how is that different from a browser? What is `.unref()` for?
10. What is `queueMicrotask`, and how does its ordering relate to Promises and `process.nextTick`?
11. Name three globals that exist in Node.js but not in browsers, and three that exist in browsers but not in Node.js.
12. Why should you not put your database connection on `globalThis`? What should you do instead?

---

## Checklist

- [ ] Exercise 1 — globals listed from memory, checked against `Object.keys(globalThis)`
- [ ] Exercise 2 — `var` trap proved, `let`/`const` checked, explicit global set
- [ ] Exercise 3 — bytes vs characters measured for English, Urdu, and emoji
- [ ] Exercise 4 — `__dirname` vs `process.cwd()` run from two folders, difference explained
- [ ] Exercise 5 — config loader built, exits with code 1 when `DATABASE_URL` is missing

**Next topic:** Phase 02 — Express.js (coming next)

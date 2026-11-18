# Exercises — 01 Introduction to Node.js

Do these **after** reading [notes.md](./notes.md) and running `node examples/introduction.js`.

No solutions are provided on purpose — the exercise *is* the learning.
If you are stuck, re-read the matching section of [notes.md](./notes.md) and run the example again.

---

## Basic Understanding

### Exercise 1 — Install and Verify ⭐ Start here

1. Install the **LTS version** of Node.js from https://nodejs.org/ (if you have not already).
2. Run these two commands in your terminal:
   ```bash
   node --version
   npm --version
   ```
3. Write down your two version numbers.

**Done when:** both commands print a version, with no error.

*Hint: if `node` is not found, close and reopen the terminal and try again.*

---

## Conceptual

### Exercise 4 — Browser vs Node.js

Write a program `browser-vs-node.js` that prints:

```js
typeof window
typeof document
typeof process
```

Run it with `node`, then explain each result in a comment:

- Why is `window` undefined here, but an object in a browser?
- Why is `process` an object here, but undefined in a browser?

**Done when:** you can explain all three lines in your own words.

---

## Practical Coding

### Exercise 2 — Hello, Your Name

Write a program `hello.js` that prints:

1. Your name
2. Your university (SMIU)
3. Your semester

Run it:

```bash
node hello.js
```

**Question to answer in a comment at the top of your file:**
Where did this JavaScript run — in a browser, or in Node.js? How do you know?

### Exercise 3 — REPL Practice

Start the REPL by typing `node` with no file name, then try these:

```js
2 + 3
const name = 'Talha';
`Hello, ${name}!`
```

1. Write down what you typed and what Node.js returned for each line.
2. Type `.exit` to leave the REPL.

**Question to answer:**
When would you use the REPL instead of creating a file? Give one example.

*Hint: quick tests — see the REPL section in [notes.md](./notes.md) (§7).*

---

## Scenario-Based

### Exercise 5 — Your First Server

1. Copy the 6-line server from [notes.md](./notes.md) (§7) into a file called `server.js`.
2. Run it:
   ```bash
   node server.js
   ```
3. Open **http://localhost:3000** in your browser. You should see your message.
4. Change the message in `server.js` and refresh the browser.

**Questions to answer:**
- Did the message change in the browser without restarting the server? Why / why not?
- How do you stop the server? (Try `Ctrl + C` in the terminal.)

*Hint: Node.js reads your file once, when it starts. Changing the file does not change the running program.*

---

## Interview-Style Questions

Answer these out loud, in your own words — no written answers are given here on purpose. Short answers are in [notes.md](./notes.md) (§12), but try them first without looking.

1. What is Node.js? Is it a language, a framework, or a runtime?
2. Why was Node.js created? What problem did it solve?
3. Who created Node.js, and when?
4. What is the difference between JavaScript in the browser and JavaScript in Node.js?
5. Why is there no `window` or `document` in Node.js?
6. What is npm? Why is it important?
7. What is the REPL? When would you use it?
8. Name three things you can build with Node.js.
9. What is Node.js NOT good for, and why?
10. What are V8 and libuv, in one sentence each?

---

## Checklist

- [ ] Exercise 1 — Node.js and npm versions checked
- [ ] Exercise 2 — `hello.js` runs, with your name
- [ ] Exercise 3 — REPL tried, answers written down
- [ ] Exercise 4 — browser vs Node.js explained
- [ ] Exercise 5 — first server runs at http://localhost:3000

**Next topic:** [02 — Node.js Architecture](../02-nodejs-architecture/README.md)

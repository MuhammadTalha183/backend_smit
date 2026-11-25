# Exercises — 07 CommonJS and ES Modules

Do these **after** reading [notes.md](./notes.md) and running `node examples/demo-cjs.cjs` and `node examples/demo-esm.mjs`.

No solutions are provided on purpose — the exercise *is* the learning.
If you are stuck, re-read the matching part of [notes.md](./notes.md) and run the examples again.

---

## Basic Understanding

### Exercise 1 — Which System Is This File? ⭐ Start here

For each file below, say whether Node.js treats it as CommonJS or an ES Module — and which rule decides it (extension, `"type"`, or syntax detection). No running anything yet; decide from the facts given.

| # | File | Nearest `package.json` |
|---|---|---|
| 1 | `app.js` | no `package.json` at all |
| 2 | `app.js` | `{ "type": "module" }` |
| 3 | `app.js` | `{ "type": "commonjs" }` |
| 4 | `app.mjs` | `{ "type": "commonjs" }` |
| 5 | `app.cjs` | `{ "type": "module" }` |
| 6 | `app.js` with `import fs from 'node:fs'` at the top | no `package.json` at all |
| 7 | `app.js` with only `require()` calls | `{ "type": "module" }` |

**Questions to answer:**
- Which two rows are decided by the extension alone, whatever `package.json` says?
- In row 6, which rule makes the file ESM — and why should you not rely on it?
- In row 7, what error will Node.js give, and what is the one-word fix (rename the file, or change the field)?

**Done when:** you can classify any file at a glance, and explain the decision order (extension → `"type"` → syntax detection) in one sentence.

---

## Conceptual

### Exercise 2 — Convert a Module Both Ways

Take `examples/cjs-math.cjs` and rewrite it as an ES Module (`esm-converted.mjs`) with the same three values (`add`, `subtract`, `PI`) as named exports plus a default export. Then take `examples/esm-math.mjs` and rewrite it as CommonJS (`cjs-converted.cjs`).

Run both conversions against the matching demo: require/import your converted files from a small test file and check the values match.

**Questions to answer:**
- Which lines changed, and which lines stayed exactly the same? (The maths did not change — only the sharing.)
- The ESM version has a `count` live binding. What happens to it in your CommonJS conversion — can a `require()` see later changes to `count` if it is a plain number? What if you export an object holding the count instead?
- Your ESM file uses `export default`. What did you put in the default export, and why that value and not one of the named ones?

**Done when:** both converted modules load, return the same values as the originals, and you can explain what was lost in the CJS conversion of `count`.

---

## Practical Coding

### Exercise 3 — One App, Two Systems

Build a tiny program from three files, mixing both systems on purpose:

1. `store.cjs` — CommonJS. Holds a private `items` array and exports `addItem(name)` and `listItems()`.
2. `format.mjs` — ES Module. Exports a named function `formatItems(items)` that returns one string, one item per line.
3. `app.mjs` — ES Module. Imports `formatItems` from `format.mjs` **and** imports the CommonJS `store.cjs`, adds two items, and prints the formatted list.

Then write `app.cjs` — a CommonJS version of the same program that loads `format.mjs` with `require()` first, then with dynamic `import()`, and prints which one worked on your Node.js version.

**Questions to answer:**
- In `app.mjs`, how did you import `store.cjs` — default or named import? Why is that the reliable choice?
- In `app.cjs`, what error (if any) did `require('./format.mjs')` give, and what does your Node.js version have to do with it?
- Which file would you convert first if this were a real project, and why that one?

**Done when:** both apps print the same formatted list, and you can explain every import line in them.

---

## Scenario-Based

### Exercise 4 — Fix the Broken Migration

A friend flipped `"type"` to `"module"` in their project and now nothing runs. Their `package.json` is:

```json
{ "name": "my-app", "type": "module" }
```

And their files are:

```js
// server.js
const express = require('express');
const config = require('./config.json');
console.log('Server folder:', __dirname);
```

```js
// config.json
{ "port": 3000 }
```

1. Predict every error `node server.js` will give, in order, before running it. (Create the files in a scratch folder and run it to check yourself.)
2. Fix it **two different ways**: (a) convert `server.js` to ESM properly; (b) keep the code as CommonJS and make the project accept it again.
3. For fix (a), write the exact lines that replace `require('./config.json')` and `__dirname`.

**Questions to answer:**
- Why did flipping one field break three different lines?
- In fix (b), which change did you make — and what would break again the next time someone adds an ESM file to the project?
- When is fix (b) the right call in a real project, and when is it just postponing the work?

**Done when:** both fixes run without errors, and you can explain why `"type"` changes how files are read but converts nothing.

---

## Practical Coding

### Exercise 5 — Prove Live Bindings (and Their Limit)

Create two files:

```js
// counter-esm.mjs
export let count = 0;
export function increment() { count += 1; }
```

```js
// counter-cjs.cjs
let count = 0;
function increment() { count += 1; }
module.exports = { count, increment, getCount: () => count };
```

Then write one test file for each system that imports/requires its counter, calls `increment()` twice, and prints `count` — once by reading the imported value directly, and once through a function (`getCount()` in CJS; add one to the ESM file if needed).

**Questions to answer:**
- In the ESM test, what does the imported `count` print after two increments — and why?
- In the CJS test, what does the required `count` print — and why is it different, even though the module's own `count` did change?
- Why does `getCount()` give the right answer in CJS when the plain `count` property does not? (Hint: what did `require()` actually receive — a value, or a way to ask?)
- Try `count = 99` in the ESM test file. What error do you get, and who is allowed to change an exported binding?

**Done when:** both tests run, the numbers differ exactly as predicted, and you can explain live bindings vs copies without looking at the notes.

---

## Interview-Style Questions

Try answering these out loud, in your own words, before checking the short answers in [notes.md §12](./notes.md#12-interview-questions-and-answers):

1. What is the difference between CommonJS and ES Modules?
2. How does Node.js decide whether a `.js` file is CommonJS or an ES Module?
3. What does `require is not defined` mean? What does `Cannot use import statement outside a module` mean?
4. What is the difference between a named export and a default export? When would you use each?
5. What is a live binding, and how is it different from what `require()` returns?
6. Can CommonJS load an ES Module? Can ES Modules load CommonJS? How, in each direction?
7. Why does a named import from a CommonJS module sometimes come back `undefined`?
8. How do you get `__dirname` in an ES Module?
9. What is top-level await, and where does it work?
10. What is a dual package, and what is the `"exports"` field for?
11. For a new project, CommonJS or ES Modules — and why?
12. What is the difference between `import` and dynamic `import()`? When would you use the second one?

---

## Checklist

- [ ] Exercise 1 — seven files classified, decision order explained
- [ ] Exercise 2 — module converted both ways, `count` behaviour explained
- [ ] Exercise 3 — mixed-system app built both ways, every import explained
- [ ] Exercise 4 — broken migration predicted, then fixed two ways
- [ ] Exercise 5 — live bindings proved in ESM, copies proved in CJS

**Next topic:** 08 — NPM and Package Management (coming next)

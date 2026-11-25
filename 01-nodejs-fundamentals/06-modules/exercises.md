# Exercises — 06 Modules and Module Systems

Do these **after** reading [notes.md](./notes.md) and running `node examples/modules.js`.

No solutions are provided on purpose — the exercise *is* the learning.
If you are stuck, re-read the matching part of [notes.md](./notes.md) and run the example again.

---

## Basic Understanding

### Exercise 1 — Name the Three Kinds ⭐ Start here

Without looking at the notes, write down the three kinds of module and one example of each.

Then, for each of these `require()` calls, say which kind it is and why — without running anything:

```js
require('fs');
require('./greet.js');
require('../utils/helpers.js');
require('express');
require('/home/talha/config.json');
```

**Questions to answer:**
- Which of the five is the odd one out, and what makes it different from the other four?
- What happens if you write `require('greet.js')` with no `./`? Why?
- Which kind needs `npm install` before it works, and which two never do?

**Done when:** you can classify any `require()` call at a glance, and explain the `./` rule in one sentence.

---

## Conceptual

### Exercise 2 — Prove the `exports` Trap

Create a file `trap.js` that contains only this line:

```js
exports = { add: (a, b) => a + b };
```

Then create `use-trap.js`:

```js
const trap = require('./trap.js');
console.log('trap:', trap);
console.log('typeof trap.add:', typeof trap.add);
```

Run it. Then fix `trap.js` in two different ways — once by adding a property to `exports`, once by reassigning `module.exports` — and run it again after each fix.

**Questions to answer:**
- What did the first run print, and why is `trap.add` not a function?
- After each fix, what does `require()` return, and why do both fixes work?
- Draw the two variables (`exports` and `module.exports`) as arrows pointing at objects, before and after the broken line. Which arrow moved?

*Hint: check notes.md §3.5. `require()` only ever reads `module.exports`.*

---

## Practical Coding

### Exercise 3 — Split a Tiny Shop Into Modules

Build a small shop program from three files — no single big file allowed:

1. `products.js` — exports an array of three products (each with a `name` and a `price`) and a function `findProduct(name)` that returns one product.
2. `cart.js` — holds a private `items` array, and exports `addToCart(product)` and `getTotal()`. Nothing else may touch `items` directly.
3. `app.js` — requires both modules, adds two products to the cart, and prints the total.

Then, in `app.js`, require `cart.js` a second time under a different variable name and check `cartA === cartB`. Add an item through one name and read the total through the other.

**Questions to answer:**
- Why can `app.js` not read `items` directly? What would have to change for it to be able to?
- What would break if `cart.js` exported `items` itself instead of functions? (Think: who could then change the cart, and how would you know?)
- Your friend says "just put the cart on `globalThis` so every file can see it." Why is the module better? (Hint: check notes.md §3.10 and topic 05 §3.11.)

**Done when:** the program prints the correct total, the two `require()` calls return the same object, and you can explain why.

---

## Scenario-Based

### Exercise 4 — Untangle a Circular Dependency

Create two files that require each other:

```js
// a.js
console.log('a: starting');
exports.aDone = true;
const b = require('./b.js');
exports.aLater = true;
console.log('a: finished, b says:', b);
```

```js
// b.js
const a = require('./a.js');
console.log('b: a.aDone =', a.aDone);
console.log('b: a.aLater =', a.aLater);
module.exports = { fromB: true };
```

Run `node a.js` and write down exactly what prints, in order.

**Questions to answer:**
- Why is `a.aLater` `undefined` inside `b.js`, even though `a.js` does export it?
- Why does the program not loop forever or crash?
- Now fix it properly: move the value both files need into a third file `shared.js`, have both `a.js` and `b.js` require it, and remove the circular require. Run it again — what changed?

*Hint: check notes.md §3.9 and §4.4. The cache is filled before the file runs, not after.*

---

## Practical Coding

### Exercise 5 — Build a Logger Module (and Test `require.main`)

Write a module `logger.js` that exports two functions:

1. `info(message)` — prints `[INFO] <message>` with the current time.
2. `error(message)` — prints `[ERROR] <message>` with the current time, using `console.error`.

Then write `use-logger.js` that requires `logger.js` and calls both functions.

Finally, add this block to the **bottom** of `logger.js`:

```js
if (require.main === module) {
  console.log('logger.js was run directly, not required.');
  info('This is a self-test.');
}
```

Run it both ways and write down what happens each time:

```bash
node logger.js
node use-logger.js
```

**Questions to answer:**
- Why does the self-test line print in the first run but not in the second?
- When would you use this pattern in a real project? Give one example.
- Your logger holds no state — would two files requiring it share anything? What *would* they share if the logger kept a count of messages? (Hint: check notes.md §3.6.)

**Done when:** both runs behave as you predicted, and you can explain `require.main === module` in your own words.

---

## Interview-Style Questions

Try answering these out loud, in your own words, before checking the short answers in [notes.md §12](./notes.md#12-interview-questions-and-answers):

1. What is a module in Node.js? What is a module system?
2. What is the difference between a core, a local, and a third-party module? How do you tell them apart in code?
3. How does `require()` find a file? Walk through the resolution order.
4. What does `require()` return, exactly?
5. What is the difference between `module.exports` and `exports`? What breaks if you reassign `exports`?
6. Why does `require('./counter.js')` twice return the same object? What does that mean for shared state?
7. Where do `require`, `module`, `__filename`, and `__dirname` come from? Are they globals?
8. Why is a top-level variable in one file invisible in another file?
9. What happens when module A requires module B and B requires module A?
10. Can `require()` load a JSON file? What does it return?
11. What is `require.resolve()` for, and what is `require.main`?
12. Why should shared values live in a module instead of on `globalThis`?

---

## Checklist

- [ ] Exercise 1 — three kinds of module listed from memory, five `require()` calls classified
- [ ] Exercise 2 — `exports` trap proved, fixed both ways, arrows drawn
- [ ] Exercise 3 — shop split into three modules, shared cart proved with `===`
- [ ] Exercise 4 — circular dependency run, observed, then untangled with a third module
- [ ] Exercise 5 — logger module built, `require.main` tested both ways

**Next topic:** [07 — CommonJS and ES Modules](../07-commonjs-es-modules/README.md)

# Exercises — 03 V8 Engine

Do these **after** reading [notes.md](./notes.md) and running `node --expose-gc examples/v8.js`.

No solutions are provided on purpose — the exercise *is* the learning.
If you are stuck, re-read the matching section of [notes.md](./notes.md) and run the example again.

---

## Basic Understanding

Answer these in your own words, without looking at the notes first:

1. What is V8, in one sentence? What is it written in?
2. What is the difference between V8 and Node.js?
3. What are the three main steps of the V8 pipeline, in order?
4. What does JIT mean, and why does V8 not compile everything up front?
5. What is the Garbage Collector, and what does it free?

### Exercise 1 — Draw It Yourself ⭐ Start here

Redraw Diagram 2 in [notes.md](./notes.md) (the V8 pipeline) from memory, without looking at the notes.

Label these five parts, in order:

1. Parser
2. AST
3. Ignition (interpreter → bytecode)
4. TurboFan (optimizing compiler → machine code)
5. The deoptimization arrow back from TurboFan to Ignition

**Done when:** you can draw it and explain, in one sentence each, why V8 starts with an interpreter instead of compiling everything up front.

---

## Conceptual Questions

Answer these in writing, in 2–3 sentences each:

1. Why is bytecode used instead of machine code right away? Give two reasons.
2. What is a Hidden Class, and why does property order change it?
3. What is the difference between monomorphic, polymorphic, and megamorphic inline caching?
4. What are the Young and Old Generations, and which kind of Garbage Collection runs on each?
5. What is the difference between the Stack and the Heap — what lives in each, and how is each freed?
6. What is deoptimization, and is it an error? Why or why not?

---

## Practical Coding Exercises

### Exercise 2 — Prove JIT Warm-Up

Write a program `warmup.js` that:

1. Defines a function, for example `multiply(a, b) { return a * b; }`.
2. Calls it in a loop 1,000,000 times, three times in a row.
3. Times each of the three runs with `console.time` / `console.timeEnd`.

**Questions to answer in a comment at the top of your file:**
- Is the 2nd run faster than the 1st on your machine? By how much?
- Which part of V8 made it faster, and what did it assume to do that?

*Hint: check Section 3.3 of [notes.md](./notes.md). The assumption is about the argument types.*

### Exercise 3 — Prove Hidden Classes

Write a program `hidden-class.js` that:

1. Creates two objects with the same properties in **different orders**, for example `{ x: 1, y: 2 }` and `{ y: 2, x: 1 }`.
2. Times 1,000,000 reads of `p.x + p.y` on the first object, then 1,000,000 reads on the second object.
3. Runs the test 3 times and writes down the timings.

**Questions to answer:**
- Which object is faster, and by roughly how much?
- What would happen to the speed if you added a third property to one of the objects *after* creating it?

*Hint: check Section 3.4 of [notes.md](./notes.md). Same values, different shape — that is the whole point.*

### Exercise 4 — Prove Garbage Collection

Write a program `gc.js` that:

1. Prints the heap size with `require('v8').getHeapStatistics()`.
2. Creates 500,000 small objects in an array and prints the heap size again.
3. Drops the array (`arr = null`) and prints the heap size a third time.
4. Run it twice: once normally, and once with `node --expose-gc` plus a `global.gc()` call after step 3.

**Questions to answer:**
- How much memory came back after GC, and how much did not?
- Why does the heap not shrink to exactly the starting size?
- What would stop GC from freeing the objects at all?

*Hint: check Section 3.6 of [notes.md](./notes.md). GC frees unreachable objects — so what makes an object reachable?*

### Exercise 5 — Find a Deoptimization

Write a program `deopt.js` that:

1. Defines `add(a, b) { return a + b; }`.
2. Calls it 100,000 times with numbers only, and times that phase.
3. Then calls it 10 times with strings (`add('a', 'b')`), and times a second numbers-only phase of 100,000 calls right after.

**Questions to answer:**
- Is the second numbers-only phase slower than the first one? Why?
- What did V8 assume when it optimized `add()`, and what broke that assumption?
- How would you rewrite the code so this never happens in a real API?

*Hint: check Section 3.3 of [notes.md](./notes.md). TurboFan's speed comes from assumptions — and assumptions can be wrong.*

---

## Scenario-Based Questions

Work through each scenario and write down what you would check first, and why:

1. **Slow start:** your API's first requests after a restart are noticeably slower than later ones. What is V8 doing during those first requests, and is this a problem to fix?
2. **Slower over hours:** your API gets slower over several hours until it crashes. The heap size keeps growing and never comes back down after GC. What is the most likely cause, and which V8 number would you check first?
3. **Mixed types:** a route handler sometimes receives a number `id` and sometimes a string `id`, and that handler is slow. What is V8 doing, and how would you fix the code?
4. **Database rows:** two endpoints return the same user data, but one is much slower. You find one builds row objects as `{ id, name, email }` and the other as `{ name, email, id }`. Explain the speed difference.

---

## Interview-Style Questions

Answer these out loud, in your own words, without looking at the answers first. (Short answers to check yourself are in Section 12 of [notes.md](./notes.md) — attempt first, then compare.)

1. What is V8? What is it written in, and who created it?
2. What is the difference between V8 and Node.js?
3. Trace the V8 pipeline: Parser → AST → Ignition → TurboFan. What does each step do?
4. What is JIT compilation? Why does V8 not compile everything up front?
5. What is bytecode, and why does Ignition produce it instead of machine code?
6. What is a Hidden Class? Why does property order matter?
7. What is Inline Caching? What do monomorphic, polymorphic, and megamorphic mean?
8. What is deoptimization? Give an example that causes it.
9. How does Garbage Collection work in V8? What are the Young and Old Generations?
10. What is the difference between the Stack and the Heap?
11. How would you check which V8 version your Node.js is running?
12. Your API gets slower over hours until it crashes — how would V8's heap help you find the cause?

---

## Checklist

- [ ] Exercise 1 — pipeline drawn from memory
- [ ] Exercise 2 — `warmup.js` runs, JIT warm-up explained
- [ ] Exercise 3 — hidden-class timings compared, shape rule explained
- [ ] Exercise 4 — heap before/after GC measured
- [ ] Exercise 5 — deoptimization found and explained

**Next topic:** [04 — Event Loop](../04-event-loop/README.md)

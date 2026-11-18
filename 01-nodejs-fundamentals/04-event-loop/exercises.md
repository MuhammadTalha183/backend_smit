# Exercises — 04 Event Loop

Do these **after** reading [notes.md](./notes.md) and running `node examples/event-loop.js`.

No solutions are provided on purpose — the exercise *is* the learning.
If you are stuck, re-read Sections 3.6–3.9 of notes.md and run the example again.

---

## Basic Understanding

### Exercise 1 — Draw It Yourself ⭐ Start here

Redraw Diagram 2 in notes.md (the six phases) from memory, without looking at the notes.

Label these, in order:

1. Timers
2. Pending Callbacks
3. Idle, Prepare
4. Poll
5. Check
6. Close Callbacks

Then mark on your drawing where each of these runs: `setTimeout`, `setImmediate`, an `fs.readFile` callback, and a `process.nextTick` callback (hint: `nextTick` is not a phase — where does it go?).

**Done when:** you can draw it and explain, in one sentence, why the loop visits the phases in a fixed order instead of running whatever is ready first.

---

## Conceptual

### Exercise 2 — Prove the Ordering Rule

Write a program `order.js` that:

1. At the top level, schedules `setTimeout(() => console.log('timeout'), 0)` and `setImmediate(() => console.log('immediate'))`.
2. Inside an `fs.readFile` callback, schedules the same two again.
3. Runs the whole program 5 times and writes down the order each time.

**Questions to answer:**
- Which order is stable across all 5 runs, and which one changes?
- Why does the I/O-callback version always print `immediate` first? Which phases are involved?

*Hint: check Section 3.7 of notes.md. Poll comes before Check, and Timers only comes around on the next turn.*

---

## Practical Coding

### Exercise 3 — Prove Microtask Priority

Write a program `microtask.js` that:

1. Schedules, in this order: `setTimeout(() => ..., 0)`, `setImmediate(() => ...)`, `Promise.resolve().then(() => ...)`, and `process.nextTick(() => ...)`.
2. Prints one line from each, plus one line of synchronous code at the end.
3. Before you run it, write down the order you *predict*.

**Questions to answer:**
- Was your prediction right? If not, which callback surprised you?
- What would happen if the `nextTick` callback scheduled another `nextTick` callback, 1000 times? (Do not run an infinite version — think it through, then check Section 3.6 of notes.md.)

*Hint: check Section 3.6 of notes.md. Microtasks run before the loop moves on — and `nextTick` beats Promises.*

---

## Scenario-Based

### Exercise 4 — Measure Blocking

Write a program `blocking.js` that:

1. Schedules a timer for 50ms and records the start time with `Date.now()`.
2. Immediately blocks the main thread with a busy loop — first for 200ms, then (in a second run) for 500ms, then (in a third run) for 1000ms.
3. In the timer callback, prints how long it actually waited.

**Questions to answer:**
- How late is the timer in each run? Is the delay roughly equal to the blocking time?
- Now imagine the busy loop is a slow request handler in your server. Which users wait, and for how long?

*Hint: check Section 3.9 of notes.md. A timer is a minimum, not a promise — and there is only one main thread.*

---

## Interview-Style

### Exercise 5 — Fix a Blocking Handler

Write a program `fix-blocking.js` that:

1. Defines a slow job: a loop that takes about 300ms on the main thread.
2. Version A — runs the slow job synchronously, with a 10ms timer scheduled just before it. Time how late the timer fires.
3. Version B — splits the same job into 6 chunks of ~50ms, running each chunk inside `setImmediate`, with the same 10ms timer scheduled before it starts. Time how late the timer fires now.

**Questions to answer:**
- In which version does the timer fire on time, and why?
- What did Version B give up to get that? (Hint: the total job still takes ~300ms — so what changed?)
- Where would you use this chunking trick in a real server, and where would you move the work to a worker thread instead?

*Hint: check Section 3.10 of notes.md. Short callbacks keep the loop free — the loop can run other work between your chunks.*

---

## Checklist

- [ ] Exercise 1 — six phases drawn from memory, callbacks placed
- [ ] Exercise 2 — ordering rule proved, stable vs changing order explained
- [ ] Exercise 3 — microtask order predicted and checked
- [ ] Exercise 4 — blocking delay measured at 200ms, 500ms, 1000ms
- [ ] Exercise 5 — blocking handler fixed with chunking, timer on time

**Next topic:** [05 — Global Objects](../05-global-objects/README.md)

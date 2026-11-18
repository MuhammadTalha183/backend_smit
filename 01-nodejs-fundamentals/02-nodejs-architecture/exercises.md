# Exercises — 02 Node.js Architecture

Do these **after** reading [notes.md](./notes.md) and running `node examples/architecture.js`.

No solutions are provided on purpose — the exercise *is* the learning.
If you are stuck, re-read Section 4 of [notes.md](./notes.md) and run the example again.

---

## Basic Understanding

### Exercise 1 — Draw It Yourself ⭐ Start here

Redraw Diagram 1 (the layers diagram, in Section 5 of [notes.md](./notes.md)) from memory, without looking at the notes.

Label these five parts, in order from top to bottom:

1. Your Application
2. Node.js Standard Library
3. Node.js Bindings
4. V8 Engine and libuv (side by side)
5. Operating System

**Done when:** you can draw it and explain each layer in one sentence.

---

## Conceptual

### Exercise 2 — Prove Single-Threaded

Write a program `single-thread.js` that:

1. Prints numbers `1` to `5` with `console.log`.
2. Then adds a `setTimeout(() => console.log('timer'), 0)` between two of the prints.
3. Run it and write down the exact output order.

**Question to answer in a comment at the top of your file:**
Why does the `setTimeout(..., 0)` callback run *last*, even though the delay is 0?

*Hint: the callback goes to a queue. The Call Stack must finish first.*

---

## Practical Coding

### Exercise 3 — Prove the Thread Pool Limit

1. Copy `examples/architecture.js` to `thread-pool.js` in a practice folder (outside this lesson folder, so the lesson files stay unchanged).
2. Change the hash loop from **5** hashes to **8** hashes.
3. Run it 3 times and write down the finish order each time.

**Questions to answer:**
- Which hashes finish first, and which finish last?
- Why does the 5th hash not start at the same time as the first 4?
- What happens if you run it with `UV_THREADPOOL_SIZE=2`?
  ```bash
  UV_THREADPOOL_SIZE=2 node thread-pool.js
  ```

*Hint: default pool size is 4. Check Section 3.9 of [notes.md](./notes.md).*

### Exercise 4 — Blocking vs Non-Blocking

Write a program `blocking-vs-nonblocking.js` that:

1. Reads `notes.md` in this folder with `fs.readFileSync()` and prints `Sync done` with a timestamp.
2. Reads the same file with `fs.readFile()` (callback) and prints `Async done` with a timestamp.
3. Prints `End of program` right after starting both reads.

**Questions to answer:**
- In which order do the three messages appear, and why?
- Which version blocks the main thread? How would a user feel that in a real server?

*Hint: add `console.log('End of program')` — do not wait for the reads before printing it.*

---

## Scenario-Based

### Exercise 5 — Real-World Trace

Pick **one** real app you use every day (WhatsApp, Daraz, YouTube, Instagram — your choice).

Write 5–8 lines tracing **one** user action through the architecture, for example "user sends a message" or "user opens a product page":

```text
Browser/App → Operating System → Event Loop → ...
```

For each step, name the part that handles it: **V8, libuv / Event Loop, Thread Pool, or Operating System**.

**Done when:** a beginner who reads your 5–8 lines can follow the request from the user to the server and back.

---

## Interview-Style Questions

Answer these out loud, in your own words, without looking at the answers first. (Short answers are in Section 12 of [notes.md](./notes.md) — check them only after you have tried.)

1. Is Node.js single-threaded or multi-threaded? Explain both sides.
2. What is the Thread Pool? What is its default size, and what uses it?
3. What is blocking vs non-blocking code? Give a real example.
4. What happens if you block the Event Loop?
5. Trace a request: a user asks for a file — what happens step by step inside Node.js?

---

## Checklist

- [ ] Exercise 1 — diagram drawn from memory
- [ ] Exercise 2 — `single-thread.js` runs, order explained
- [ ] Exercise 3 — 8 hashes run, Thread Pool limit explained
- [ ] Exercise 4 — blocking vs non-blocking compared
- [ ] Exercise 5 — real-world trace written
- [ ] Interview-style questions answered out loud

**Next topic:** [03 — V8 JavaScript Engine](../03-v8-javascript-engine/README.md)

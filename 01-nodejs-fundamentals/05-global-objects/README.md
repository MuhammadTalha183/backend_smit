# 05 — Global Objects

> **Priority:** 🟢 Normal
> **Previous topic:** [04 — Event Loop](../04-event-loop/README.md)
> **Next topic:** 06 — Modules and Module Systems *(coming next — folder not created yet)*

Global objects are the tools Node.js gives you for free in every file — `console`, `process`, `Buffer`, and the timers — with no `require` needed. This lesson teaches you which ones exist, which names only *look* global (`__dirname`, `__filename`, `require`), and why characters are not bytes.

## Learning Objectives

By the end of this lesson, you will be able to:

- Name the main Node.js globals and explain what each one does.
- Tell a true global apart from a module-wrapper name (`__dirname`, `__filename`, `require`).
- Use `process` for version, arguments, and configuration from `process.env`.
- Use `Buffer` correctly for bytes versus text.
- Explain why a top-level `var` in a Node.js file is not global.
- Write code that does not depend on browser globals like `window`.

## Topics Covered

- What a global object is, and `global` vs `globalThis`
- `__dirname` and `__filename` — not globals (the module wrapper)
- `process`: version, platform, `argv`, `env`, `cwd()`, `exit()`
- `console`: `log`, `error`, `table`, `time` / `timeEnd`
- `Buffer`: raw bytes vs text, UTF-8 (`سلام` is 4 characters, 8 bytes)
- Timers as globals, and `.unref()`
- `queueMicrotask` and microtask (FIFO) ordering
- Modern globals: `URL`, `TextEncoder`, `fetch`, `structuredClone`
- Node.js globals vs browser globals
- Module scope vs global scope — the `var` trap
- Adding your own globals — and why you should not

## Links

- **Notes:** [notes.md](./notes.md) — full detailed notes, diagrams, and interview questions with answers
- **Examples:** [examples/](./examples/) — run [`global-objects.js`](./examples/global-objects.js), expected output in [`example.txt`](./examples/example.txt)
- **Exercises:** [exercises.md](./exercises.md) — 5 practice tasks, no solutions

**How to run the example:**

```bash
node examples/global-objects.js
```

## Key Takeaways

- `globalThis` is the global object; `console`, `process`, `Buffer`, and the timers live on it — no `require` needed.
- `__dirname`, `__filename`, and `require` are **not** globals — they come from the module wrapper, one per file.
- A top-level `var` in a Node.js file stays in that file (module scope); it never reaches the global object.
- `__dirname` is where the *file* lives; `process.cwd()` is where you *ran* `node` from.
- Characters are not bytes — `'سلام'` is 4 characters and 8 bytes; use `Buffer` for size.
- Config comes from `process.env`, always with a fallback — except a required secret, where missing should stop the program.
- Use the globals Node.js gives you — and do not add your own.

---

[← Main README](../../README.md) · Previous: [04 — Event Loop](../04-event-loop/README.md) · Next: 06 — Modules and Module Systems (coming next)

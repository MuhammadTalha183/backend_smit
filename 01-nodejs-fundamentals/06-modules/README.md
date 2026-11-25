# 06 — Modules and Module Systems

> **Priority:** 🔴 High
> **Previous topic:** [05 — Global Objects](../05-global-objects/README.md)
> **Next topic:** [07 — CommonJS and ES Modules](../07-commonjs-es-modules/README.md)

A module is one file with one job, and a module system is the set of rules for sharing code between files. You load a module with `require()`, a module shares code with `module.exports`, and `require()` caches the result — so every file that loads the same module gets the same shared object, not a copy.

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain what a module and a module system are, and why programs are split into modules.
- Tell core, local, and third-party modules apart — and know why local files always start with `./`.
- Load a module with `require()` and explain how Node.js finds the file.
- Export one value or several values with `module.exports`, and explain why reassigning `exports` breaks.
- Explain the module wrapper and where `require`, `module`, `__filename`, and `__dirname` come from.
- Explain why `require()` returns the same cached object every time, and what that means for shared state.
- Organise a small program into modules instead of one big file.

## Topics Covered

- What a module is — one file, one job
- What a module system is — CommonJS vs ES Modules (detail in topic 07)
- Three kinds of module: core, local, third-party
- How `require()` finds a file — the resolution algorithm
- `module.exports` vs `exports` — the one trap in this topic
- Caching — `require()` runs a file once, then shares the result
- The module wrapper — where `require`, `module`, `__filename`, `__dirname` come from
- Requiring JSON files and folders
- Circular dependencies — allowed, but only half-loaded
- Module scope — why files do not leak into each other

## Links

- **Notes:** [notes.md](./notes.md) — full detailed notes, diagrams, and interview questions with answers
- **Examples:** [examples/](./examples/) — run [`modules.js`](./examples/modules.js), expected output in [`example.txt`](./examples/example.txt)
- **Exercises:** [exercises.md](./exercises.md) — 5 practice tasks, no solutions

**How to run the example:**

```bash
node examples/modules.js
```

## Key Takeaways

- A module is one file with one job; sharing between files is opt-in — nothing leaves a file except through `module.exports`.
- `require()` returns `module.exports` and nothing else. Add properties to `exports` if you like, but only ever reassign `module.exports`.
- Your own files always start with `./` or `../` — without it, Node.js looks for a core or third-party module and throws `Cannot find module`.
- `require()` caches by full path: the file runs once, and every later `require()` returns the same object — shared state is a singleton.
- `require`, `module`, `__filename`, and `__dirname` come from the module wrapper, not from the global object — and the wrapper is also why each file has its own scope.
- Prefer a module over a global for sharing: a module declares its dependencies with a visible `require()`; a global hides them.

---

[← Main README](../../README.md) · Previous: [05 — Global Objects](../05-global-objects/README.md) · Next: [07 — CommonJS and ES Modules](../07-commonjs-es-modules/README.md)

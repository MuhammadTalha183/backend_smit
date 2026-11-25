# 07 — CommonJS and ES Modules

> **Priority:** 🔴 High
> **Previous topic:** [06 — Modules and Module Systems](../06-modules/README.md)
> **Next topic:** 08 — NPM and Package Management *(coming next — folder not created yet)*

Node.js has two module systems. CommonJS (`require` / `module.exports`) is the system Node.js started with — synchronous, and still the default for `.js` files. ES Modules (`import` / `export`) is the JavaScript standard — static, asynchronous, and the same system browsers use. A file speaks only one of them, and the extension plus `package.json` decide which. This topic is the comparison: how each one works, how Node.js tells them apart, and how they load each other.

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain both module systems and why Node.js has two of them.
- Say, for any file, whether Node.js treats it as CommonJS or ES Modules — and why.
- Explain the difference between a named export and a default export, and when to use each.
- Explain live bindings and how they differ from what `require()` returns.
- Load a CommonJS module from an ES Module, and an ES Module from CommonJS.
- Rebuild `__dirname` in an ES Module from `import.meta.url`.
- Explain top-level await and why it only works in ES Modules.
- Choose the right system for a new project, and convert a file from one system to the other.

## Topics Covered

- Why two systems exist — CommonJS (2009) vs ES Modules (2015)
- How Node.js decides: `.mjs` / `.cjs` / `.js` + `package.json` `"type"` + syntax detection
- `import` vs `require` — static vs dynamic, async vs sync
- Named exports vs default exports
- Live bindings vs copies
- Strict mode and top-level await (ESM only)
- `__dirname` / `__filename` in ESM — `import.meta.url` + `fileURLToPath`
- Loading JSON in each system
- Interop: `import` of CJS, `require(esm)` (Node.js 22.12+), dynamic `import()`, `createRequire`
- The `"exports"` field and dual packages
- Circular dependencies — different failure mode in each system
- Which system to use for a new project

## Links

- **Notes:** [notes.md](./notes.md) — full detailed notes, diagrams, and interview questions with answers
- **Examples:** [examples/](./examples/) — run [`demo-cjs.cjs`](./examples/demo-cjs.cjs) and [`demo-esm.mjs`](./examples/demo-esm.mjs), expected output in [`example.txt`](./examples/example.txt)
- **Exercises:** [exercises.md](./exercises.md) — 5 practice tasks, no solutions
- **Diagram:** [CommonJS vs ES Modules — how Node.js decides](../diagrams/commonjs-vs-esm.md)

**How to run the examples:**

```bash
node examples/demo-cjs.cjs
node examples/demo-esm.mjs
```

## Key Takeaways

- A file speaks only one system: `.mjs` is always ESM, `.cjs` is always CommonJS, and `.js` follows the nearest `package.json` `"type"` field (missing means CommonJS).
- `require is not defined` and `Cannot use import statement outside a module` are both the same diagnosis — a file being read as the wrong system. Fix the file's system, not the line.
- ESM imports are static and live: read before any code runs, and they follow the exporter's later changes. `require()` is synchronous and returns a value.
- ESM is always strict mode, supports top-level await, and has no `__dirname` — rebuild it from `import.meta.url`.
- The systems interop both ways: ESM imports CJS as its default export; CJS loads ESM with `import()` (everywhere) or `require()` (Node.js 22.12+).
- New projects: ES Modules. Existing CommonJS projects: convert file by file — mixed is normal.

---

[← Main README](../../README.md) · Previous: [06 — Modules and Module Systems](../06-modules/README.md) · Next: 08 — NPM and Package Management (coming next)

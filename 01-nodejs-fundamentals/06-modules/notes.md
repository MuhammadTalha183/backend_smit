# 06 — Modules and Module Systems — Notes

> **Module:** 01 — Node.js Fundamentals
> **Topic:** 06 — Modules and Module Systems
> **Priority:** 🔴 High
> **Previous topic:** [05 — Global Objects](../05-global-objects/README.md)
> **Next topic:** [07 — CommonJS and ES Modules](../07-commonjs-es-modules/README.md)
>
> **One-line summary:** A module is one file with one job, and a module system is the set of rules for sharing code between files — `require()` loads a file, `module.exports` decides what it shares, and `require()` caches it so every file gets the same shared copy. Once you understand modules, a big program stops being one giant file and becomes small files that fit together.
>
> **How to use these notes:** read [README.md](./README.md) first for the short overview, then work through this file section by section. Run the examples in [`examples/modules.js`](./examples/modules.js) and compare your output with [`examples/example.txt`](./examples/example.txt). Then do the tasks in [`exercises.md`](./exercises.md).

---

## Table of Contents

- [1. Introduction](#1-introduction)
- [2. Definition of Important Concepts](#2-definition-of-important-concepts)
- [3. Detailed Explanations](#3-detailed-explanations)
- [4. How the Technology Works Internally](#4-how-the-technology-works-internally)
- [5. Architecture or Workflow](#5-architecture-or-workflow)
- [6. Real-World Examples](#6-real-world-examples)
- [7. Code Examples Where Applicable](#7-code-examples-where-applicable)
- [8. Step-by-Step Code Explanations](#8-step-by-step-code-explanations)
- [9. Common Misconceptions](#9-common-misconceptions)
- [10. Important Technical Terminology](#10-important-technical-terminology)
- [11. Summary](#11-summary)
- [12. Interview Questions and Answers](#12-interview-questions-and-answers)
- [13. References](#13-references)

---

## 1. Introduction

A **module** is a single file of JavaScript that does one job and shares only what it chooses to share. A **module system** is the set of rules Node.js uses to load those files and connect them — how you ask for a file, how that file answers, and what happens when two files ask for the same file.

You have already used modules without noticing. Every time you wrote `require('path')` or `require('fs')`, you loaded a module. Every time you used `console` or `process`, you used something Node.js had already loaded for you. The difference now is that you are going to *write* modules yourself — and that changes how big programs are built.

**Why modules exist:** a program that lives in one file becomes unreadable fast. Imagine a shop app with login, products, cart, payments, and emails all in one 3,000-line file. Finding one bug means reading everything; two people cannot work on it at the same time; testing one small part means running the whole thing. Modules fix this by splitting the program into small files, each with one clear job:

```js
// app.js — the whole program, in four lines of wiring:
const login = require('./login.js');
const products = require('./products.js');
const cart = require('./cart.js');
const payments = require('./payments.js');
```

Each file can be read, tested, and fixed on its own. Each file says exactly what it needs (its `require()` calls at the top) and exactly what it offers (its `module.exports` at the bottom). Nothing else leaks out.

**Simple way to remember it:**

> **A module is a room with a door. `require()` is knocking on the door. `module.exports` is what the room hands you through it.**
> You cannot see what is inside the room — only what it chooses to hand you. And if two people knock on the same door, they get the same room, not a copy of it.

This topic matters because everything after it is built on modules. Express.js is a module you require. Your database code will be a module. Your routes will be modules. If `require()` and `module.exports` are fuzzy in your head, every later topic feels harder than it is. If they are clear, the rest of the journey is mostly "require the right module, use it well."

By the end of this topic you will be able to: explain what a module and a module system are; tell core, local, and third-party modules apart; load a module with `require()` and explain how Node.js finds the file; export one value or several values with `module.exports` and explain why reassigning `exports` breaks; explain the module wrapper and where `require`, `module`, `__filename`, and `__dirname` come from; explain why `require()` returns the same cached object every time; and organise a small program into modules instead of one big file.

---

## 2. Definition of Important Concepts

| Concept | Definition |
|---|---|
| **Module** | One file of JavaScript that does one job. In Node.js, every file is a module by default. |
| **Module system** | The rules for loading modules and sharing code between files — how to ask (`require`), how to answer (`module.exports`), and how Node.js finds and caches files. |
| **CommonJS** | The module system Node.js started with and still uses by default for `.js` files: `require()` to load, `module.exports` to share. |
| **ES Modules (ESM)** | The newer, standard JavaScript module system: `import` to load, `export` to share. Node.js supports it too — the full comparison is topic 07. |
| **`require()`** | The function that loads a module and returns what it exported. `require('./greet.js')` runs `greet.js` and gives you its `module.exports`. |
| **`module.exports`** | The object (or function, or value) a module shares. Whatever you assign to it is what `require()` returns. |
| **`exports`** | A shortcut that starts out pointing at the same object as `module.exports`. Adding properties to it works; reassigning it does not. |
| **`module`** | An object describing the current module: its filename, whether it has finished loading, and its `exports`. |
| **Module wrapper** | The invisible function Node.js wraps around every CommonJS file before running it: `function (exports, require, module, __filename, __dirname) { ... }`. It is where `require`, `module`, `__filename`, and `__dirname` come from. |
| **Core module** | A module built into Node.js itself — `fs`, `path`, `http`, `events`. Loaded by name, no `./` needed, no install needed. |
| **Local module** | A module you wrote yourself, in your own project. Loaded by its relative path, starting with `./` or `../`. |
| **Third-party module** | A module someone else wrote and published on npm, installed into `node_modules`. Loaded by name, like a core module. Full detail in topic 08. |
| **Module cache** | The store (`require.cache`) where Node.js keeps every module it has already loaded, keyed by the file's full path. A second `require()` of the same file returns the cached exports without running the file again. |
| **Module scope** | The private scope of one file. A top-level variable in a file belongs to that file only — other files cannot see it unless the file exports it. |
| **Circular dependency** | When module A requires module B and module B requires module A. Node.js does not crash, but B gets A's *partially finished* exports — only what A had exported so far. |
| **`require.resolve()`** | A function that answers "which file would `require()` load for this name?" and returns the full path — without loading the file. |
| **`require.main`** | The module that was run directly from the command line (`node app.js` makes `app.js` the main module). A file can check `require.main === module` to know "was I run, or was I required?" |
| **`package.json`** | A file that describes a project or a folder-module: its name, version, and (for a folder loaded as a module) which file to load first via the `"main"` field. |

---

## 3. Detailed Explanations

### 3.1 What a module is — one file, one job

In Node.js, **a file is a module**. There is no special keyword to make a file a module, and no registration step. If you write `greet.js`, you have written a module. If you write `app.js` and it requires `greet.js`, you have used a module.

The point of splitting code into files is not tidiness for its own sake. It is three concrete things:

1. **One job per file.** `greet.js` builds greetings. `math-utils.js` does maths. When a greeting is wrong, you open one file, not the whole program.
2. **A clear boundary.** A module's top-level variables and functions are private to that file. The only way out is `module.exports`. So you can read a module's exports and know exactly what it offers — you never have to guess which of its names other files depend on.
3. **Reuse.** A module written once can be required by ten files, or ten projects. The `path` module is reused by millions of programs; your own `config.js` can be reused by every file in your project.

A useful test for whether a file is a good module: **can you describe its job in one sentence without the word "and"?** "Builds greeting strings" — good. "Handles users and sends emails and logs errors" — that is three modules hiding in one file.

### 3.2 What a module system is — the rules, not the files

A module system answers four questions, and every module system answers them differently:

1. **How do you ask for a module?** CommonJS: `require('./greet.js')`. ES Modules: `import greet from './greet.js'`.
2. **How does a module answer?** CommonJS: assign to `module.exports`. ES Modules: use `export`.
3. **How does the system find the file?** CommonJS has a resolution algorithm (see §3.4). ES Modules resolve relative paths too, but with different rules (topic 07).
4. **When does the code run?** In CommonJS, `require()` runs the module's code immediately, the first time it is loaded, and caches the result. In ES Modules, imports are loaded before the code runs. That difference is why the two systems behave differently — and why topic 07 exists.

Node.js has **two** module systems because JavaScript grew one. CommonJS came first (2009, with Node.js itself) and is still the default for `.js` files. ES Modules are the language standard (2015) and Node.js supports them as well. **This topic teaches CommonJS deeply**, because it is the default you will meet first, and because its ideas — loading, exporting, caching, scope — are the ideas you need for both systems. Topic 07 then shows exactly how ES Modules differ.

### 3.3 The three kinds of module

Every `require()` call loads one of three kinds. You can tell which kind it is from the string you pass:

| Kind | How you recognise it | Example | Where it lives |
|---|---|---|---|
| **Core** | A plain name, no `./`, no `/` | `require('path')`, `require('fs')` | Inside Node.js itself — no file, no install |
| **Local** | Starts with `./` or `../` | `require('./greet.js')`, `require('../utils/math.js')` | A file in your project |
| **Third-party** | A plain name that is not a core module | `require('express')` | `node_modules/` in your project (installed with npm — topic 08) |

```js
const path = require('path');          // core — built into Node.js
const greet = require('./greet.js');   // local — your own file
const express = require('express');    // third-party — installed from npm
```

The `./` matters. `require('greet.js')` (no `./`) does **not** mean "the file next to me" — Node.js reads it as a core or third-party module name, looks in `node_modules`, and fails with `Cannot find module 'greet.js'`. Beginners lose real time to this one missing dot. The rule is simple: **your own files always start with `./` or `../`**.

### 3.4 How `require()` finds a file — the resolution algorithm

When you write `require('something')`, Node.js does not guess. It follows a fixed order:

1. **Core module?** If the name matches a built-in module (`fs`, `path`, `http`, …), load it. Core modules always win — a file in `node_modules` called `fs` can never shadow the real `fs`.
2. **A path?** If the string starts with `./`, `../`, or `/`, treat it as a file path, relative to the file that called `require()` — not relative to where you ran `node` from. (That is why `__dirname` exists: see §3.7 and topic 05.)
3. **A folder?** If the path points to a folder, Node.js looks inside it: first for `package.json` and its `"main"` field (the file to load), and if there is no `main`, for `index.js`.
4. **An extension?** If you leave the extension off — `require('./greet')` — Node.js tries `./greet.js`, then `./greet.json`, then `./greet.node`, in that order. Writing the extension (as this course does) is clearer for a beginner; leaving it off is common in real projects.
5. **A package?** If the name is not a core module and not a path, Node.js walks up from the requiring file's folder looking for `node_modules/<name>` — checking the current folder, then its parent, then its parent, all the way to the root. That walk is how one installed package can be shared by a whole project.
6. **Nothing found?** Node.js throws `Error: Cannot find module '...'`. The error message names the string you passed and the file that asked — read both, because the fix is usually a wrong path, not a broken module.

Two consequences worth remembering. First, **resolution is relative to the requiring file**, so the same `require('./greet.js')` means different files in different folders — which is correct, because each file's neighbours are different. Second, **the cache key is the resolved full path**, so `require('./greet.js')` and `require('./greet')` load the same cached module, not two copies.

You can see the resolution without loading anything: `require.resolve('./greet.js')` returns the full path Node.js would load (see `examples/modules.js` Part 7).

### 3.5 `module.exports` vs `exports` — the one trap in this topic

When a module starts running, Node.js gives it two names for the same empty object:

```js
// What Node.js sets up before your code runs:
module.exports = {};
exports = module.exports;   // exports POINTS AT module.exports
```

`require()` returns `module.exports` — **only** `module.exports`. `exports` is just a convenient shortcut for adding properties to that object. Both of these work:

```js
// Style A — add properties to the shared object (both names work):
exports.add = add;
exports.subtract = subtract;

// Style B — replace the whole object (only module.exports works):
module.exports = { add, subtract, circleArea, PI };
```

The trap is reassigning `exports` itself:

```js
// ❌ BROKEN — this does nothing useful:
exports = { add, subtract };   // you only moved the shortcut; module.exports is still {}
```

After that line, `exports` points at a brand-new object that nobody will ever read, while `module.exports` is still the original empty object — so `require()` returns `{}` and your functions vanish. The rule is one sentence: **add properties to `exports` if you like, but only ever reassign `module.exports`**.

Style B (one assignment, one object literal) is what this course uses, because it shows the module's whole public surface in one place. Style A is common in real code too. Pick one style per file and stay consistent.

A module can export **anything** — not just an object. `greet.js` exports a single function (`module.exports = greet`), and `require('./greet.js')` returns that function directly. A module can export a string, a number, a class, or an array. What you export is the module's answer to "what do you offer?"

### 3.6 Caching — `require()` runs a file once, then shares the result

The first time a file is required, Node.js runs its code, takes its `module.exports`, and stores it in `require.cache` under the file's full path. **Every later `require()` of the same file skips the code entirely and returns the cached object** — the same object, not a copy.

`examples/modules.js` Part 4 proves it with `counter.js`:

```js
const counterA = require('./counter.js');
const counterB = require('./counter.js');
counterA === counterB;        // true — the SAME object
counterA.increment();         // 1
counterA.increment();         // 2
counterB.getCount();          // 2 — B sees A's count, because there is only one counter
```

Three consequences follow, and all three matter in real programs:

1. **Shared state is real.** A module that holds state (a counter, a database connection, a config object) is a singleton: every file that requires it shares that one state. That is often exactly what you want — one database connection for the whole app — and it is why topic 05 warned against putting a connection on `globalThis`: a module does the same job, but with a visible `require()` at the top of every file that uses it.
2. **A module's top-level code runs once.** A `console.log` at the top of a module prints once, on first load, never again — even if five files require it. If you see a log print twice, the file was loaded twice, which usually means it was required through two different paths that resolved to two different files (for example, a symlink, or the same file reached by two different spellings).
3. **You can inspect and clear the cache.** `require.cache` is an ordinary object you can read. Deleting a key from it (`delete require.cache[require.resolve('./counter.js')]`) forces the next `require()` to run the file again. That is a debugging tool, not a normal pattern — do not clear the cache in production code.

### 3.7 The module wrapper — where `require`, `module`, `__filename`, and `__dirname` come from

Topic 05 said `__dirname`, `__filename`, and `require` are not globals — they come from the module wrapper. Here is the wrapper itself. Before running your file, Node.js wraps it in a function:

```js
// Your file, as Node.js actually runs it:
(function (exports, require, module, __filename, __dirname) {
  // ← your code goes here
});
```

That is the whole secret. `require` is a function argument, not a global — which is why each file gets its own `require` that resolves paths relative to *that* file. `module` is an argument too, so `module.exports` is just a property of the object Node.js handed you. `__filename` is the file's full path; `__dirname` is its folder. And because the wrapper is a function, **your top-level variables stay inside it** — that is module scope (§3.10), and that is why a top-level `var` in a Node.js file is never global (topic 05, §3.10).

`examples/modules.js` Part 5 prints all five wrapper values so you can see them in real output, including the proof that `module.exports === exports` is `true` at the start — before any assignment breaks the link.

### 3.8 Requiring JSON files and folders

`require()` is not only for JavaScript:

- **JSON files** — `require('./config.json')` reads the file, parses it with `JSON.parse`, and returns a plain object. No code runs. This is the simplest way to load configuration, and it is how `examples/modules.js` Part 6 loads `config.json`. (One limit: the JSON must be valid — a trailing comma throws.)
- **Folders** — `require('./utils')` loads a folder as a module: Node.js reads `./utils/package.json` and loads the file named in its `"main"` field; if there is no `package.json` or no `"main"`, it loads `./utils/index.js`. Folders-as-modules are how big modules organise themselves: the folder holds many files, `index.js` requires them and re-exports the public surface.

Neither of these is magic — both are the same resolution algorithm from §3.4, applied to a different kind of target.

### 3.9 Circular dependencies — allowed, but only half-loaded

If `a.js` requires `b.js` and `b.js` requires `a.js`, Node.js does not crash and does not loop forever. It handles it like this: while `a.js` is still running, `b.js` asks for `a.js` — and gets **the unfinished `module.exports` of `a.js`, exactly as far as `a.js` had got**. Anything `a.js` exported *before* the `require('./b.js')` line is there; anything exported *after* it is not yet.

```js
// a.js
console.log('a: starting');
exports.aDone = true;          // exported BEFORE requiring b
const b = require('./b.js');   // b.js now runs, and requires a.js back
exports.aLater = true;         // exported AFTER — b.js never sees this
```

```js
// b.js
const a = require('./a.js');   // gets a's PARTIAL exports: { aDone: true }
console.log('b: a.aDone =', a.aDone);    // true
console.log('b: a.aLater =', a.aLater);  // undefined — not exported yet
```

The fix is almost always structural, not clever: move the shared code into a third module `c.js` that both `a.js` and `b.js` require. If you find yourself reasoning about which half of a module was loaded, the modules are tangled — untangle them. (On current Node.js versions you will also see a warning on stderr — `Accessing non-existent property 'aLater' of module exports inside circular dependency` — when code reads a property that is not exported yet. It is a warning, not a crash, and it is another sign the circle needs untangling.)

### 3.10 Module scope — why files do not leak into each other

Because of the wrapper (§3.7), every file has its own scope:

```js
// greet.js
const secret = 'only greet.js knows this';
module.exports = greet;   // secret is NOT exported — nobody else can read it
```

```js
// app.js
const greet = require('./greet.js');
console.log(typeof secret);   // undefined — app.js cannot see inside greet.js
```

This is the opposite of a browser `<script>` tag, where every top-level `var` lands on `window` and any script can read any other script's variables. In Node.js, **sharing is opt-in**: nothing leaves a file unless the file exports it, and nothing enters a file unless the file requires it. That is what makes a 50-file program understandable — each file's dependencies are written at its top, in plain sight.

The one exception is the global object (topic 05). Anything on `globalThis` *is* visible everywhere — which is exactly why you should not put your own values there. A module is the honest version of a global: shared, but with a paper trail.

---

## 4. How the Technology Works Internally

### 4.1 What happens when you call `require('./greet.js')`

Step by step, inside Node.js:

1. **Resolve.** Node.js turns `'./greet.js'` into a full path, using the algorithm in §3.4. If nothing matches, it throws `Cannot find module` here, before running anything.
2. **Check the cache.** It looks up the full path in `require.cache`. If the module is already there, it returns `cache[path].exports` immediately — the file does not run again.
3. **Create a `Module` object.** A new object is made with `id` (the full path), `filename`, `loaded: false`, `exports: {}`, and a `children` list. It is put into the cache *before* the file runs — that early caching is what makes circular dependencies return a partial object instead of looping forever (§3.9).
4. **Wrap.** The file's source is wrapped in the wrapper function from §3.7, with `exports`, `require`, `module`, `__filename`, and `__dirname` as its arguments. Note that this `require` is a fresh function bound to *this* module, so paths inside the file resolve relative to it.
5. **Run.** The wrapped function is called. The file's top-level code runs: functions are defined, `module.exports` is assigned, and any `require()` calls inside it load *their* modules first (recursively, depth-first).
6. **Finish.** `module.loaded` becomes `true`, and `require()` returns `module.exports` to the caller.

### 4.2 How the cache key works

The cache is keyed by the **resolved filename**, not by the string you typed. That is why `require('./greet.js')`, `require('./greet')`, and `require('./greet.js')` from two different files all share one cached module — they resolve to the same path. It is also why two files with the same name in different folders are two different modules: different paths, different cache entries.

### 4.3 How `exports` and `module.exports` stay in sync — until they don't

At load time, `exports` and `module.exports` are the same object, so `exports.add = add` and `module.exports.add = add` write to the same place. The link is just two variables pointing at one object — there is no live connection. The moment you write `module.exports = { ... }`, `module.exports` points at the new object while `exports` still points at the old one. The moment you write `exports = { ... }`, the opposite happens. Node.js only ever reads `module.exports`, so whichever name you reassign, the other one becomes irrelevant. This is a plain JavaScript reference rule, not a Node.js special case — the same thing happens with any two variables pointing at one object.

### 4.4 How a circular require returns a partial module

When `a.js` requires `b.js`, `a.js` is already in the cache with `loaded: false` and whatever `module.exports` it has assigned so far. When `b.js` then requires `a.js`, the cache check in step 2 finds that unfinished entry and returns its current `exports` — partial, but not empty, and not a crash. `b.js` finishes, returns to `a.js`, and `a.js` continues from where it stopped. The system never loops because the cache is filled *before* the file runs (step 3), not after.

### 4.5 How core modules are different

Core modules are not files on disk. They are compiled into the Node.js binary (or loaded from Node.js's internal source at startup). `require('path')` never touches your filesystem and never consults `node_modules` — the name is looked up in an internal table first. That is also why core modules load fast and why their names cannot be shadowed by a package.

### 4.6 How Node.js decides CommonJS vs ES Modules

For a `.js` file, Node.js looks at the nearest `package.json`: if it says `"type": "module"`, the file is treated as an ES Module; otherwise it is CommonJS. `.mjs` files are always ES Modules; `.cjs` files are always CommonJS, whatever `package.json` says. This decision matters because the wrapper, `require`, and `module.exports` only exist in CommonJS — an ES Module file has no `require` and no `__dirname`. The full rules, and how to mix the two systems, are topic 07. For this topic, every file is CommonJS, because this project has no `"type": "module"` anywhere.

---

## 5. Architecture or Workflow

### Diagram 1: What `require()` does, start to finish

```mermaid
flowchart TD
    A["require('./greet.js')"] --> B{Core module?}
    B -->|yes| C[Load built-in module]
    B -->|no| D[Resolve to a full path]
    D --> E{In require.cache?}
    E -->|yes| F[Return cached module.exports]
    E -->|no| G[Create Module object<br/>exports = {}]
    G --> H[Put it in the cache]
    H --> I[Wrap file in wrapper function]
    I --> J[Run the file's code]
    J --> K[loaded = true]
    K --> L[Return module.exports]
    C --> L
    F --> L
```

### Diagram 2: Three scopes in one program

```text
  app.js (module scope)              greet.js (module scope)
  ┌───────────────────────┐          ┌───────────────────────┐
  │ myPrivateName         │          │ secret                │
  │ greet ────────────────┼──────────▶ module.exports = greet│
  │ math                  │          │                       │
  └───────────────────────┘          └───────────────────────┘
        │   require() only shares what a file exports.
        │   Private names never cross the boundary.
        ▼
  globalThis (shared by EVERY file)
  ┌───────────────────────┐
  │ console, process,     │
  │ Buffer, setTimeout... │
  └───────────────────────┘
        ▲  Globals are the exception, not the rule.
           Prefer a module over a global (topic 05).
```

### Diagram 3: The three kinds of module, and where each one comes from

```text
  require('path')            →  Node.js itself (core, built in)
  require('./greet.js')      →  Your project, relative path (local)
  require('express')         →  node_modules/, installed with npm (third-party)
  require('./config.json')   →  Your project, parsed as JSON
  require('./utils')         →  A folder: package.json "main", else index.js
```

### Workflow: splitting a program into modules

1. **Find the jobs.** Read your program and list the jobs it does: greet the user, do the maths, keep a count, load config. One job, one file.
2. **Decide each file's exports.** For each job, ask "what does the rest of the program need from this file?" — that list is its `module.exports`. Everything else stays private.
3. **Decide each file's requires.** At the top of each file, list what it needs: core modules, local modules. If a file needs something, it requires it — it never reaches into another file's private variables.
4. **Wire them in one entry file.** One file (usually `app.js` or `index.js`) requires the modules and calls them in order. It is the only file that knows the whole program.
5. **Run and check the cache behaviour.** Run the entry file. If a module's top-level log prints once, the cache is working. If shared state (like the counter) behaves as one object everywhere, the wiring is right.

---

## 6. Real-World Examples

- **An Express.js app.** `express` is a third-party module. Your routes are local modules: `routes/users.js` exports a router, `app.js` requires it and mounts it with `app.use('/users', usersRouter)`. Your database connection is a local module that every route file requires — one connection, shared through the cache (§3.6).
- **A CLI tool.** The entry file parses `process.argv`, then requires a `commands/` folder: each command is a module exporting a `run()` function. Adding a command means adding one file, not editing the entry file's logic.
- **Configuration.** A `config.js` (or `config.json`) module exports the port, the database URL, and the environment. Every file that needs config requires the same module and gets the same values — and the config file is the one place where environment variables are read (topic 14 will build on this).
- **Testing.** A module with one job and explicit exports is easy to test: require it, call its functions, check the answers. A 3,000-line file with hidden globals is not. This is a large part of why professional code is split into modules.
- **npm itself.** Every package on npm is a module (or a folder of modules). When you `npm install express` in topic 08, you are downloading a folder that your code will `require()` — the same mechanism, at a larger scale.

---

## 7. Code Examples Where Applicable

The runnable demo is [`examples/modules.js`](./examples/modules.js), with its helpers [`examples/greet.js`](./examples/greet.js), [`examples/math-utils.js`](./examples/math-utils.js), [`examples/counter.js`](./examples/counter.js), and [`examples/config.json`](./examples/config.json). It is split into seven parts:

| Part | What it proves |
|---|---|
| Part 1 — a core module | `require('path')` loads a built-in module by name; no `./`, no install |
| Part 2 — a local module, one export | `require('./greet.js')` returns the function that module exported |
| Part 3 — a local module, several exports | `require('./math-utils.js')` returns an object with `add`, `subtract`, `circleArea`, `PI` |
| Part 4 — caching | Two `require()` calls return the same object (`===` is `true`); the counter is shared |
| Part 5 — the module wrapper | `__filename`, `__dirname`, `require`, `module`, `exports` exist in this file but are not globals |
| Part 6 — requiring JSON | `require('./config.json')` returns a parsed object |
| Part 7 — `require.resolve` and `require.cache` | The resolved path, the cache entries, and `require.main === module` |

The key lines, so you can read the demo before running it:

```js
const path = require('path');            // core module, by name
const greet = require('./greet.js');     // local module, by relative path
const math = require('./math-utils.js'); // several exports, one object

const counterA = require('./counter.js');
const counterB = require('./counter.js');
counterA === counterB;                   // true — one shared object

const config = require('./config.json'); // JSON loads as an object
require.resolve('./greet.js');           // the full path, without loading
```

Run it from this topic's folder:

```bash
node examples/modules.js
```

Expected output is in [`examples/example.txt`](./examples/example.txt) (Node.js v24.22.1). The only lines that change on your machine are the absolute paths in Part 5 and Part 7 — they will show *your* folders, not mine. Everything else should match exactly.

---

## 8. Step-by-Step Code Explanations

### What the files prove (in order)

1. **Part 1** proves core modules need no path and no install: `require('path')` returns an object, and `path.join` / `path.basename` work immediately.
2. **Part 2** proves a local module is loaded by relative path and returns exactly what it exported: `greet.js` assigned a function to `module.exports`, so `require()` returns a function, and calling it prints the greeting.
3. **Part 3** proves a module can export several values at once as one object, and the caller uses them as properties: `math.add(5, 3)` is `8`, `math.circleArea(2)` is `12.56636`.
4. **Part 4** proves caching: `counterA === counterB` is `true`, and increments made through `counterA` are visible through `counterB`. There is one counter, not two.
5. **Part 5** proves the wrapper: `__filename` and `__dirname` print this file's real location; `typeof require` is `function` and `typeof module` is `object`; `module.exports === exports` is `true` because this file never reassigned either one; and `globalThis.greet` is `undefined`, proving `greet` is not a global.
6. **Part 6** proves JSON loading: `config.port` is `3000` and `config.appName` is `'modules-demo'`, read from `config.json` with no parsing code of your own.
7. **Part 7** proves the cache is inspectable: `require.resolve('./greet.js')` returns the full path, that path is a key in `require.cache`, and `require.main === module` is `true` because this file was run directly (`node examples/modules.js`), not required by another file.

### Important lines explained

```js
const greet = require('./greet.js');
```

The `./` is the whole point: it says "a file next to me." Without it, Node.js would look for a core or third-party module called `greet.js` and throw `Cannot find module`.

```js
module.exports = greet;              // in greet.js
module.exports = { add, subtract, circleArea, PI };   // in math-utils.js
```

Two shapes of the same rule: export one thing by assigning it directly, or export several things by assigning an object that holds them. The caller gets exactly what was assigned — a function in the first case, an object in the second.

```js
let count = 0;                       // in counter.js — private to that file
```

`count` is a top-level variable, but because of the wrapper it belongs to `counter.js` alone. Other files can change it only through the exported `increment()` — they can never touch `count` directly. That is module scope doing its job.

```js
counterA === counterB;               // true
```

This is the line the whole topic turns on. Two `require()` calls, one object. If this were `false`, every module would be a fresh copy and shared state (one database connection, one config) would be impossible.

```js
require.main === module;             // true when run directly
```

A useful idiom for later: put `if (require.main === module) { ... }` at the bottom of a module to run demo code only when the file is executed directly, never when it is required. The demo in this topic does not need it — it *is* the entry file — but you will meet the pattern in real projects.

---

## 9. Common Misconceptions

| Misconception | The truth |
|---|---|
| "Every file can see every other file's variables." | No. Each file has its own module scope. A variable is visible to another file only if the file exports it and the other file requires it. |
| "`require('greet.js')` loads the file next to me." | No — without `./` it is treated as a core or third-party name, and Node.js throws `Cannot find module`. Local files always start with `./` or `../`. |
| "`exports = { ... }` exports an object." | No. Reassigning `exports` only moves the shortcut; `require()` returns `module.exports`, which is still the old empty object. Reassign `module.exports`, or add properties to `exports` — never reassign `exports`. |
| "Requiring a file twice runs it twice." | No. The first `require()` runs it and caches the exports; later `require()` calls return the cached object without running the code again. That is why `counterA === counterB` is `true`. |
| "`require` and `__dirname` are globals." | No. They are arguments of the module wrapper (topic 05 proved `globalThis.__dirname` is `undefined`). They exist in every CommonJS file, but they are not on the global object. |
| "A module is the same thing as a package." | No. A module is one file (or one folder loaded as a unit). A package is a published unit on npm — usually a folder of modules plus a `package.json`. Every package contains modules; not every module is a package. |
| "Circular dependencies crash Node.js." | No. Node.js returns the partially loaded module's exports as they stand. It does not crash — but the code that receives the partial object may break, which is why circular dependencies should be untangled, not relied on. |
| "ES Modules and CommonJS are interchangeable." | No. They have different syntax (`import`/`export` vs `require`/`module.exports`), different loading timing, and different rules for file extensions and `package.json`. The full comparison is topic 07 — do not mix them in one file. |
| "Splitting code into files is just tidiness." | No. It is how programs stay testable, how two people work on one program, and how code is reused. The boundary — explicit requires in, explicit exports out — is the mechanism, not the formatting. |
| "I should put shared values on `globalThis` so every file can see them." | No. A module does the same job with a visible `require()` at the top of every file that uses it. Globals hide dependencies; modules declare them (topic 05, §3.11). |

---

## 10. Important Technical Terminology

| Term | Meaning in one line |
|---|---|
| Module | One file of JavaScript with one job. |
| Module system | The rules for loading modules and sharing code between files. |
| CommonJS | Node.js's default module system: `require()` / `module.exports`. |
| ES Modules (ESM) | The standard JavaScript module system: `import` / `export`. Full comparison in topic 07. |
| `require()` | Loads a module and returns its `module.exports`. |
| `module.exports` | What a module shares; what `require()` returns. |
| `exports` | A shortcut pointing at `module.exports` at first — add properties to it, never reassign it. |
| `module` | The object describing the current module (`filename`, `loaded`, `exports`). |
| Module wrapper | The invisible function around every CommonJS file: `(exports, require, module, __filename, __dirname)`. |
| Core module | Built into Node.js (`fs`, `path`, `http`); loaded by name. |
| Local module | A file you wrote; loaded by relative path (`./`, `../`). |
| Third-party module | A published package, installed in `node_modules`; loaded by name. |
| Module cache (`require.cache`) | Where loaded modules are stored by full path, so a second `require()` returns the same object. |
| Module scope | The private scope of one file; nothing leaks out except through `module.exports`. |
| Resolution (algorithm) | The fixed order Node.js uses to turn a `require()` string into a file. |
| Circular dependency | Two modules that require each other; the second one gets the first one's partial exports. |
| `require.resolve()` | Returns the full path `require()` would load, without loading it. |
| `require.main` | The module run directly from the command line. |
| `package.json` | A project's description file; its `"main"` field says which file a folder-module loads. |
| Singleton | One shared instance — what the module cache gives you when every file requires the same stateful module. |

---

## 11. Summary

- A **module** is one file with one job; a **module system** is the set of rules for sharing code between files.
- Node.js's default system is **CommonJS**: load with `require()`, share with `module.exports`. ES Modules (`import`/`export`) exist too and are compared in topic 07.
- There are three kinds of module: **core** (built in, by name), **local** (your files, `./` or `../`), and **third-party** (installed in `node_modules`, by name).
- `require()` finds files by a fixed resolution order: core first, then paths relative to the requiring file, then folders (`package.json` `"main"`, else `index.js`), then `node_modules` walking up.
- `require()` returns `module.exports` — only `module.exports`. Add properties to `exports` if you like, but only ever reassign `module.exports`.
- The **module wrapper** gives every CommonJS file its own `require`, `module`, `__filename`, and `__dirname` — none of them are globals — and gives every file its own scope.
- `require()` **caches** modules by full path: the file runs once, and every later `require()` returns the same object. Shared state (a counter, a connection, a config) is therefore a singleton.
- `require()` can load **JSON files** (parsed to an object) and **folders** (via `"main"` or `index.js`).
- **Circular dependencies** do not crash Node.js, but the second module gets the first one's partial exports — untangle them by moving shared code into a third module.
- Module scope means sharing is **opt-in**: nothing leaves a file except through `module.exports`, nothing enters except through `require()`. Prefer a module over a global, every time.

---

## 12. Interview Questions and Answers

Practice answering these out loud, in your own words first — then check yourself against the short answers below. Never start with a memorized paragraph: start with the one-line definition, then the proof from `modules.js`.

1. **What is a module in Node.js? What is a module system?**
   *Answer:* A module is one file with one job; a module system is the set of rules for loading modules and sharing code between files — how to ask (`require`), how to answer (`module.exports`), and how files are found and cached.

2. **What is the difference between a core, a local, and a third-party module? How do you tell them apart in code?**
   *Answer:* Core modules are built into Node.js and loaded by name (`require('path')`). Local modules are your own files, loaded by relative path (`require('./greet.js')`). Third-party modules are installed packages, loaded by name (`require('express')`). The `./` is what marks a local module.

3. **How does `require()` find a file? Walk through the resolution order.**
   *Answer:* Core module first; then a path relative to the requiring file; then a folder's `package.json` `"main"` or `index.js`; then the `.js` / `.json` / `.node` extensions; then `node_modules` walking up the folders. Nothing found means `Cannot find module`.

4. **What does `require()` return, exactly?**
   *Answer:* The required module's `module.exports` — whatever that module assigned to it: a function, an object, a value. Nothing else leaves the file.

5. **What is the difference between `module.exports` and `exports`? What breaks if you reassign `exports`?**
   *Answer:* They start as the same object, but `require()` only reads `module.exports`. Reassigning `exports` moves only the shortcut, so `module.exports` stays as the original empty object and `require()` returns `{}`. Add properties to `exports`, or reassign `module.exports` — never reassign `exports`.

6. **Why does `require('./counter.js')` twice return the same object? What does that mean for shared state?**
   *Answer:* Because Node.js caches modules by full path in `require.cache`: the file runs once, and later requires return the cached exports. So a stateful module is a singleton — every file shares the same counter, connection, or config.

7. **Where do `require`, `module`, `__filename`, and `__dirname` come from? Are they globals?**
   *Answer:* From the module wrapper — the invisible function `(exports, require, module, __filename, __dirname)` around every CommonJS file. They are not globals: `globalThis.__dirname` is `undefined` (topic 05).

8. **Why is a top-level variable in one file invisible in another file?**
   *Answer:* Because of the wrapper, each file has its own module scope. A variable leaves a file only through `module.exports`, and enters another file only through `require()`.

9. **What happens when module A requires module B and B requires module A?**
   *Answer:* Node.js does not crash: B gets A's partially finished exports — only what A had exported before it required B. The fix is to move the shared code into a third module both can require.

10. **Can `require()` load a JSON file? What does it return?**
    *Answer:* Yes — `require('./config.json')` parses the file and returns a plain object. No code runs; the JSON must be valid.

11. **What is `require.resolve()` for, and what is `require.main`?**
    *Answer:* `require.resolve()` returns the full path `require()` would load, without loading the file — useful for debugging paths. `require.main` is the module run directly from the command line; `require.main === module` tells a file whether it was run or required.

12. **Why should shared values live in a module instead of on `globalThis`?**
    *Answer:* A module shares the same value, but every file that uses it declares the dependency with a visible `require()` at its top. A global hides the dependency — a file using it gives no sign of where it came from, and names can collide.

---

## 13. References

- Node.js documentation — Modules: CommonJS: https://nodejs.org/docs/latest/api/modules.html
- Node.js documentation — Modules: ECMAScript modules (for the topic 07 comparison): https://nodejs.org/docs/latest/api/esm.html
- Node.js documentation — `path`: https://nodejs.org/docs/latest/api/path.html
- Node.js documentation — Globals (`__dirname`, `__filename`, `require`): https://nodejs.org/docs/latest/api/globals.html
- Node.js documentation — `process` (`process.version`, `require.main` context): https://nodejs.org/docs/latest/api/process.html
- MDN — JavaScript Modules: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
- Previous topic in this module: [05 — Global Objects](../05-global-objects/README.md) — the global object, `__dirname` vs `process.cwd()`, and why not to use globals for sharing.
- Next topic in this module: [07 — CommonJS and ES Modules](../07-commonjs-es-modules/README.md).
- Root README of this repository: [Root README](../../README.md).

---

## Files in This Folder

```text
06-modules/
├── README.md                  # Short lesson overview — start here
├── notes.md                   # This file — full detailed notes
├── exercises.md               # 5 practice tasks (no solutions)
└── examples/
    ├── modules.js             # Runnable demo: core/local modules, exports, caching, wrapper, JSON
    ├── greet.js               # Local module: exports one function
    ├── math-utils.js          # Local module: exports several values
    ├── counter.js             # Local module: shared state, proves caching
    ├── config.json            # JSON config, loaded with require()
    └── example.txt            # Expected output of modules.js (Node v24.22.1)
```

**How to run:**

```bash
node examples/modules.js
```

# Diagram: Modules and require() — How Files Share Code

> **Module:** [01 — Node.js Fundamentals](../README.md)
> **Explained in full:** [06 — Modules and Module Systems](../06-modules/notes.md)

## The Diagram

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

```text
  app.js                          greet.js
  ┌─────────────────────┐         ┌─────────────────────┐
  │ const greet =       │         │ function greet(name)│
  │   require('./greet  ├─────────▶ module.exports =    │
  │   .js');            │  door   │   greet             │
  └─────────────────────┘         └─────────────────────┘
        require() knocks. module.exports is what comes
        through the door. Everything else stays inside.
```

## How to Read It

- **`require()` resolves first, runs second:** Node.js turns the string into a full path before it touches the file. If the path cannot be resolved, you get `Cannot find module` and nothing runs.
- **The cache is checked before the file runs:** a module already in `require.cache` is returned immediately. That is why requiring the same file twice gives you the same object — and why a module's top-level code runs only once.
- **The module goes into the cache *before* it runs:** that early caching is what stops a circular dependency from looping forever. The second module gets the first one's unfinished exports instead of a crash.
- **The wrapper is the boundary:** every file runs inside `function (exports, require, module, __filename, __dirname) { ... }`. That is where `require` and `__dirname` come from, and why a top-level variable in one file is invisible in another.

**One-line summary:** `require()` knocks on a file's door, `module.exports` is what comes through it, and the cache makes sure the second knock gets the same room — not a copy of it.

[← Module README](../README.md) · [06 — Modules and Module Systems](../06-modules/notes.md)

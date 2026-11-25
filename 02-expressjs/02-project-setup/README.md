# 02 — Project Setup

> **Priority:** 🔴 High
> **Previous topic:** [01 — Introduction](../01-introduction/README.md)
> **Next topic:** [03 — HTTP Fundamentals](../03-http-fundamentals/README.md)

An empty folder becomes a working Express project: `npm init` creates the manifest, `npm install express` brings in the framework, and a small server file starts answering requests. This topic is that setup done once, properly — the `package.json` fields that matter, a folder structure that still makes sense at fifty routes, the `app.js` vs `server.js` split, a nodemon dev workflow, and environment variables with secrets kept out of Git. Every later topic in this phase builds on this skeleton.

## Learning Objectives

By the end of this lesson, you will be able to:

- Create a Node.js project from an empty folder with `npm init` and explain every field that matters in `package.json`.
- Install Express and explain what lands in `node_modules/` and `package-lock.json` — and why only the lock file is committed.
- Explain the difference between `dependencies` and `devDependencies`, and when to use each.
- Lay out a project with `src/` (`routes/`, `controllers/`, `middleware/`, `config/`) and justify each folder.
- Explain the `app.js` vs `server.js` split and why tests need it.
- Run a dev workflow with nodemon (`npm run dev`) and a production start (`npm start`).
- Read configuration from environment variables with defaults, and keep secrets out of Git with `.env`, `.env.example`, and `.gitignore`.
- Write a minimal Express server with a JSON route and a health endpoint, and verify it answers.

## Topics Covered

- `npm init` and the `package.json` fields that matter: `name`, `version`, `main`, `scripts`, `dependencies` vs `devDependencies`
- Installing Express: what lands in `node_modules/` and `package-lock.json`
- Recommended folder structure: `src/` with `routes/`, `controllers/`, `middleware/`, `config/`
- `app.js` vs `server.js` — the split and why it exists
- nodemon dev workflow: install as a devDependency, the `npm run dev` script
- `.env` basics: dotenv, why secrets never go in Git, `.env.example`, `.gitignore`
- Your first server file, step by step
- Scripts in `package.json`: `start` / `dev`

## Links

- **Notes:** [notes.md](./notes.md) — full detailed notes, diagrams, and interview questions with answers
- **Examples:** [examples/](./examples/) — run [`server.js`](./examples/server.js) and [`config-demo.js`](./examples/config-demo.js), expected output in [`example.txt`](./examples/example.txt)
- **Exercises:** [exercises.md](./exercises.md) — 5 practice tasks, no solutions
- **Module README:** [02 — Express.js](../README.md)

**How to run the examples:**

```bash
NODE_PATH=/tmp/express-verify/node_modules node examples/server.js
NODE_PATH=/tmp/express-verify/node_modules node examples/config-demo.js
```

## Key Takeaways

- `npm init -y` creates `package.json`; `npm install express` adds the framework to `node_modules/` and locks the exact tree in `package-lock.json`. Commit the manifest and the lock file; never commit `node_modules/`.
- `dependencies` run the app; `devDependencies` (nodemon) only help you build it. The `-D` flag is the difference.
- Keep `src/` organised from day one — `routes/`, `controllers/`, `middleware/`, `config/` — and keep `app.js` (defines the app) separate from `server.js` (starts it listening), so tests can import the app without opening a port.
- Configuration comes from the environment (`process.env` with defaults), loaded from `.env` by dotenv in development. `.env` is gitignored from day one; `.env.example` is committed so the next developer knows what to fill in.
- `npm start` is the production path (plain Node); `npm run dev` is the development path (nodemon restarts on every save).
- A server that reads its port from the environment runs unchanged on your laptop and on a hosting platform — the port was never in the code.

---

[← Main README](../../README.md) · Previous: [01 — Introduction](../01-introduction/README.md) · Next: [03 — HTTP Fundamentals](../03-http-fundamentals/README.md)

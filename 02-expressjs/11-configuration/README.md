# 11 — Configuration

> **Priority:** 🟡 Medium
> **Previous topic:** [10 — REST APIs](../10-rest-apis/README.md)
> **Next topic:** Phase 03 — Database Management *(coming next — folder not created yet)*

Configuration is everything your code needs to know that changes between machines: which port to listen on, which database to talk to, which secrets to use. It lives in environment variables, never in code and never in git — one central module reads it once, validates it, and every other file imports the result. This is the last topic of Phase 02, and it is the one that makes everything before it deployable.

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain why configuration lives outside the code, in environment variables.
- Read `process.env`, convert its string values, and validate them.
- Use `.env` files in development and explain why they never reach production or git.
- Write a `.env.example` that tells a teammate exactly what the app needs.
- Build one central config module that reads, validates and freezes config.
- Apply the secret rules: never in code, never in git, never in logs.
- Set up config per environment — dev, test, prod — behind `NODE_ENV`.
- Shut a server down gracefully on SIGINT/SIGTERM.
- Set up basic logging with levels, and say what must never be logged.

## Topics Covered

- Environment variables — `process.env`, always strings, per-process
- `.env` files and dotenv — development convenience, never committed
- `.env.example` — the committed template
- Config per environment — dev / test / prod behind `NODE_ENV`
- PORT and HOST — read the port, `127.0.0.1` vs `0.0.0.0`
- The central config module — read once, validate, freeze
- Secrets — never in code, git, logs or error messages; rotate when leaked
- Graceful shutdown — SIGINT/SIGTERM, finish in-flight requests, then exit
- Basic logging setup — levels `debug` < `info` < `warn` < `error`
- What belongs in config vs what belongs in code

## Links

- **Notes:** [notes.md](./notes.md) — full detailed notes, diagrams, and interview questions with answers
- **Examples:** [examples/](./examples/) — run [`config-demo.js`](./examples/config-demo.js), see [`.env.example`](./examples/.env.example), expected output in [`example.txt`](./examples/example.txt)
- **Exercises:** [exercises.md](./exercises.md) — 5 practice tasks, no solutions
- **Module README:** [02 — Express.js](../README.md)

**How to run the examples:**

```bash
NODE_PATH=/tmp/express-verify/node_modules node examples/config-demo.js
```

Try it with overrides — same code, different config, no edits:

```bash
NODE_ENV=production JWT_SECRET=supersecretvalue PORT=8080 LOG_LEVEL=warn NODE_PATH=/tmp/express-verify/node_modules node examples/config-demo.js
```

> No `dotenv` is installed for this topic: the demo reads `process.env` directly so it runs with zero dependencies. In a real project you would add `dotenv` and a `.env` file in development — the pattern is identical.

## Key Takeaways

- Same code, different values: config lives in the environment, not in the code.
- One central module reads `process.env` once, validates it, and exports a frozen object — no other file touches `process.env`.
- `.env` is development-only and never committed; commit `.env.example` instead, and put `.env` in `.gitignore`.
- A committed secret is a compromised secret — rotate it; deleting the file doesn't remove it from git history.
- Fail fast: missing required config crashes at startup with a clear message, not on the first real request.
- Graceful shutdown and log levels are small habits that separate a demo from a deployable app — and this topic closes Phase 02.

---

[← Main README](../../README.md) · Previous: [10 — REST APIs](../10-rest-apis/README.md) · Next: Phase 03 — Database Management (coming next)

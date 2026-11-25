# 11 — Configuration — Notes

> **Module:** 02 — Express.js
> **Topic:** 11 — Configuration
> **Priority:** 🟡 Medium
> **Previous topic:** [10 — REST APIs](../10-rest-apis/README.md)
> **Next topic:** Phase 03 — Database Management *(coming next — folder not created yet)*
>
> **One-line summary:** Configuration is everything your code needs to know that changes between machines: which port to listen on, which database to talk to, which secrets to use. It lives in environment variables, never in code and never in git — one central module reads it once, validates it, and every other file imports the result.
>
> **How to use these notes:** read [README.md](./README.md) first for the short overview, then work through this file section by section. Run the example in [`examples/config-demo.js`](./examples/config-demo.js) and compare your output with [`examples/example.txt`](./examples/example.txt). Then do the tasks in [`exercises.md`](./exercises.md).

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

Your app works on your laptop. You deploy it, and it crashes — because on the server the port is different, the database lives somewhere else, and the secret key is not the one on your machine. Every beginner hits this wall, and the fix is not "edit the code on the server". The fix is configuration: the values that change between environments live *outside* the code, and the code reads them at startup.

This is the last topic of Phase 02, and it is the one that makes everything before it deployable. A REST API (topic 10) that hardcodes its port and database URL cannot run anywhere except your laptop. The same API with a config module runs on your laptop, on a teammate's machine, and on a server — same code, different values.

There is also a security story here, and it is not optional. Secrets committed to git are the single most common way beginners leak credentials: a database password or JWT secret pushed to a public GitHub repo stays in the history forever, even if you delete the file later. Bots scan GitHub for secrets within minutes of a push. This topic teaches the habit that prevents that — before you ever handle a real secret in Phase 04.

## 2. Definition of Important Concepts

- **Configuration** — values your app needs that differ between environments: port, host, database URL, log level, API keys, secrets.
- **Environment variable** — a key–value pair set in the operating system's environment of a running process, read in Node.js from `process.env`. The standard place for configuration in twelve-factor apps.
- **`.env` file** — a plain-text file of `KEY=value` lines, loaded into `process.env` in development by the `dotenv` package. A convenience for local development only — never used in production, never committed.
- **`.env.example`** — a committed template showing which variables exist, with placeholder values. Safe to commit; the real `.env` is not.
- **Secret** — a value that must stay private: database passwords, JWT secrets, API keys. Secrets are configuration, but they need extra rules: never in code, never in git, never in logs, never in error messages.
- **Environment (dev / test / prod)** — the three places your code runs. Development is your laptop (verbose logs, fake data). Test is for automated tests (separate test database). Production is real users (minimal logs, real secrets, no debug endpoints).
- **Twelve-factor app** — a methodology (by the Heroku team) for building apps that deploy cleanly. Its third factor is the rule for this topic: *store config in the environment*.
- **Central config module** — one file (`config.js`) that reads `process.env` once, applies defaults, validates, and exports a frozen object. Every other file imports it instead of touching `process.env`.
- **Graceful shutdown** — on `SIGINT` (Ctrl+C) or `SIGTERM` (deploy/restart), stop accepting new requests, finish in-flight ones, close the server and database, then exit. The opposite — `process.exit()` mid-request — drops real users' requests.
- **Logging / log levels** — structured messages about what the app is doing, filtered by severity: `debug` < `info` < `warn` < `error`. Development runs at `debug`, production at `info` or `warn`.
- **Fail fast** — if required configuration is missing or invalid, crash immediately at startup with a clear message, instead of starting half-broken and failing on the first real request.

## 3. Detailed Explanations

### 3.1 Why configuration must live outside the code

Three reasons, each one enough on its own:

1. **The same code runs in many places.** Your laptop, your partner's laptop, the test runner, the server. The port, database and secrets differ in each. If those values are in the code, you need a different copy of the code per place — and the moment you have two copies, they drift apart.
2. **Code is shared; config is not.** Code goes to git, to teammates, sometimes to the public. Config contains secrets and machine-specific values that must never be shared that way. Keeping them apart is what makes sharing code safe.
3. **Changing config shouldn't need a redeploy of logic.** Rotating a database password or turning on debug logging should be a one-line environment change and a restart — not a code edit, commit and rebuild.

The test is simple: could you give your code to a stranger, with no values in it, and could they run it by setting environment variables alone? If yes, your configuration is done right.

### 3.2 Environment variables — the standard mechanism

In Node.js, `process.env` is an object holding the process's environment variables — always strings (or `undefined` if unset). Set them when you start the process:

```bash
PORT=8080 NODE_ENV=production node server.js
```

And read them in code:

```js
const port = Number(process.env.PORT) || 3000;
```

Three facts that trip up beginners:

- **Everything is a string.** `process.env.PORT` is `"3000"`, not `3000`. You must convert it (`Number(...)`) and validate the result — `Number("abc")` is `NaN`, and `NaN || 3000` is `3000`, which silently hides the bad value. Validate explicitly instead.
- **Missing variables are `undefined`, not errors.** `process.env.DATABASE_URL` with nothing set is `undefined` — your code must decide: use a default, or fail fast with a clear message. Silent `undefined` is how apps connect to the wrong database.
- **They are per-process.** Setting an environment variable in one terminal tab doesn't affect another, and it doesn't affect already-running processes. Each start reads them fresh — which is exactly what you want for restarts.

### 3.3 The `.env` file and `dotenv` — development convenience

Typing `PORT=8080 DATABASE_URL=... JWT_SECRET=... node server.js` every time is miserable, so in development you keep a `.env` file:

```text
PORT=3000
NODE_ENV=development
DATABASE_URL=postgres://localhost:5432/devdb
JWT_SECRET=dev-only-secret
```

And load it with `dotenv` (installed in a real project — this topic's example reads `process.env` directly so it runs with zero dependencies):

```js
require('dotenv').config(); // must run before any config is read
```

Rules for `.env` files — memorise these:

- **Never commit `.env`.** Add it to `.gitignore` on day one, before the first commit that could contain it. A secret pushed to git stays in history forever; deleting the file later does not remove it from history.
- **Commit `.env.example` instead.** Same keys, placeholder values, so a new teammate knows exactly what to set.
- **`.env` is for development only.** In production, the hosting platform sets real environment variables (Vercel, Render, Railway, Docker — all have a dashboard or CLI for this). Production never reads a `.env` file.
- **Load it first.** `dotenv.config()` must run before any module reads `process.env`, or the values won't be there yet. Put it at the very top of your entry point.

### 3.4 Config per environment — dev, test, prod

The same code, three personalities:

| | Development | Test | Production |
|---|---|---|---|
| `NODE_ENV` | `development` | `test` | `production` |
| Database | local Postgres, seeded fake data | separate test database, wiped per run | real database, real data |
| Logging | `debug` — everything | `warn` — quiet, tests are noisy enough | `info` or `warn` |
| Secrets | throwaway values in `.env` | throwaway values | real secrets from the platform |
| Error detail | full stack traces to the client | full detail | generic messages only |
| Port | 3000 | random/ephemeral | assigned by the platform |

The switch is one variable: `NODE_ENV`. Your config module reads it and derives the rest (`isProduction`, `isDevelopment`). Never check `NODE_ENV === 'production'` in ten different files — check it once in the config module and export booleans.

### 3.5 The central config module — the pattern

Every file that needs a setting should import one module, not reach into `process.env` itself:

```js
// config.js — the ONLY file that touches process.env
function loadConfig(env = process.env) {
  const config = {
    env: env.NODE_ENV || 'development',
    port: Number(env.PORT) || 3000,
    databaseUrl: env.DATABASE_URL,
  };
  if (!config.databaseUrl) throw new Error('DATABASE_URL is required');
  return Object.freeze(config);
}
module.exports = loadConfig();
```

```js
// server.js — every other file just imports it
const config = require('./config');
app.listen(config.port, () => console.log(`Listening on ${config.port}`));
```

Why this pattern wins:

- **One place to validate.** Missing or malformed values fail at startup with a clear message (fail fast), not three hours later on the first real request.
- **One place to convert types.** `PORT` becomes a number once, here — not in every file that uses it.
- **One place to document.** The config module *is* the list of everything the app needs. A new teammate reads it and knows what to set.
- **Testable.** `loadConfig` takes an `env` argument, so tests can pass a fake environment and check the validation — no real environment needed.
- **Frozen.** `Object.freeze()` stops any file from accidentally changing config at runtime. Config is read at startup; it doesn't change while running.

### 3.6 Secrets — the rules that prevent disasters

1. **Never in code.** Not in a string literal, not in a comment, not in a "temporary" test file.
2. **Never in git.** `.env` in `.gitignore` from the first commit. If you ever commit a secret, rotate it immediately — assume it is compromised.
3. **Never in logs.** Log that a secret *exists* (`jwtSecret: set`), never its value. The example's `mask()` helper shows the pattern.
4. **Never in error messages or responses.** A `500` that prints the database URL tells an attacker exactly where your data lives.
5. **Different secrets per environment.** The dev secret and the production secret must be different values — a leaked dev secret then costs nothing.
6. **Rotate, don't reuse.** When a secret leaks or a teammate leaves, generate a new one and update the environment — don't keep using the old one "because it still works".

### 3.7 PORT and HOST — the two values every server needs

- **PORT** — the port your server listens on. Default `3000` in development. In production the platform usually assigns it (Render, Railway, Heroku all set `PORT` themselves) — so your code must *read* it, never hardcode it.
- **HOST** — which network interface to listen on. `127.0.0.1` (localhost) means "only this machine can reach me" — right for development. `0.0.0.0` means "every interface" — what production needs, because the platform reaches your app over its network. Listening on `127.0.0.1` in production is a classic deployment bug: the app runs, but nothing can reach it.

### 3.8 Graceful shutdown — why `Ctrl+C` deserves respect

When your process gets `SIGINT` (Ctrl+C) or `SIGTERM` (the platform stopping your app for a redeploy), the default is to die instantly — including mid-request. A request that was halfway through writing to the database gets cut off, and the client gets a dropped connection. Graceful shutdown fixes it:

1. Stop accepting new connections (`server.close()`).
2. Wait for in-flight requests to finish.
3. Close the database pool.
4. Then exit.

With a timeout as a safety net — if a request hangs, force exit after a few seconds rather than hanging forever. In development this feels like a nicety; in production, during a redeploy, it is the difference between zero dropped requests and angry users.

### 3.9 Basic logging — what, and how much

Logging is how you see what a deployed app is doing. The rules:

- **Levels exist for a reason.** `debug` is for tracing values during development. `info` is for normal events ("server started", "user registered"). `warn` is for something odd but survivable. `error` is for something that failed. Production runs at `info` or `warn` — `debug` in production drowns real problems in noise and can leak data.
- **Log events, not noise.** "Server listening on port 3000" is an event. Logging every request body is noise — and a privacy risk.
- **One line per event, with context.** `User 42 created a post` beats `created`. When something breaks at 2 a.m., context is what you search for.
- **Never log secrets, passwords, tokens, or full request bodies.** See section 3.6.
- **In a real app, use a logger library** (Pino or Winston) instead of `console.log` — they add levels, JSON output and log rotation. The example uses a tiny level-filtered `console.log` wrapper so it runs with zero dependencies; the pattern is the same.

### 3.10 What belongs in config vs what belongs in code

| Configuration (environment) | Code (git) |
|---|---|
| Port, host | Route definitions |
| Database URL, credentials | SQL queries and models |
| Secrets and API keys | Business logic |
| Log level | Log messages |
| Feature flags (sometimes) | Feature implementations |
| Third-party service URLs | How services are called |

The test from section 3.1: if a value changes between your laptop and the server, it is configuration. If it is the same everywhere, it is code.

## 4. How the Technology Works Internally

### 4.1 `process.env` — where it comes from

When your shell starts `node server.js`, the operating system hands the new process a copy of the shell's environment — a block of `KEY=value` strings. Node exposes it as `process.env`. `dotenv` doesn't change this mechanism: it reads your `.env` file and *adds* those pairs to `process.env` before your code runs. That's why it must load first, and why production (where the platform sets real variables) doesn't need it.

### 4.2 What happens on startup — the order that matters

```text
node server.js
   │  1. dotenv loads .env → process.env (development only)
   │  2. config module reads process.env, converts types, validates
   │     → missing DATABASE_URL? throw now, exit before listening
   │  3. app is built: middleware, routes, error handlers
   │  4. server listens on config.port / config.host
   │  5. log "listening on ..." — the first proof the config was right
```

If step 2 throws, the process exits *before* the server starts. That is fail fast: a broken deployment fails loudly at startup, where you see it, instead of serving errors to users.

### 4.3 What happens on shutdown — the signal path

```text
Ctrl+C / platform stop
   │  SIGINT / SIGTERM arrives
   ▼  your handler runs: server.close()
   │     — stops accepting NEW connections
   │     — waits for in-flight requests to finish
   ▼  close the database pool
   ▼  process.exit(0)
   (timeout safety net: force exit after 5s if something hangs)
```

Without a handler, the process dies the instant the signal arrives — mid-request, mid-write. With one, in-flight requests complete and the database connection closes cleanly.

### 4.4 Why freezing config matters

`Object.freeze()` makes the config object immutable — any code that tries `config.port = 9999` silently fails (or throws in strict mode). This matters because config is read in dozens of places; if one module could change it, every other module's behaviour would change unpredictably. Configuration is input, not state: it is decided at startup and never changes during the run.

## 5. Architecture or Workflow

### 5.1 The config flow in a real project

```text
.env.example ──(copy, fill in)──▶ .env ──(dotenv, dev only)──▶ process.env
                                                              │
Hosting platform ──(dashboard/CLI)──▶ environment variables ──┤
                                                              ▼
                                              config.js (read once, validate, freeze)
                                                              │
                    ┌───────────────┬───────────────┬─────────┴────────┐
                    ▼               ▼               ▼                ▼
               server.js        routes/        services/        database.js
              (port, host)   (feature flags)  (API keys)    (DATABASE_URL)
```

One source of truth, flowing one way. Nothing below the config module ever touches `process.env`.

### 5.2 The project layout this topic implies

```text
my-api/
├── .env.example          committed — the template
├── .env                  NOT committed — real values, in .gitignore
├── .gitignore            contains ".env"
├── config.js             the central config module
├── server.js             entry point: loads config, starts the server
├── app.js                builds the Express app
└── routes/
    └── posts.js
```

### 5.3 Deploying: the checklist

1. Set every variable from `.env.example` in the platform's dashboard — never upload a `.env` file.
2. `NODE_ENV=production` — this one variable flips logging, error detail and secret requirements.
3. Use the platform's `PORT` — don't hardcode one.
4. Rotate secrets when moving from dev to prod — different values per environment.
5. Check the startup log: "listening on ..." confirms the config was read correctly before any user arrives.

## 6. Real-World Examples

- **Your semester project.** The same backend runs on your laptop (local Postgres, port 3000, debug logs) and later on a server (hosted Postgres, platform port, info logs). One config module, two environments, zero code changes — this is the payoff.
- **A `.env` leak on GitHub.** A common real story: a student pushes a project with a MongoDB or Postgres password in a config file; within hours, bots find it and the database is wiped or held for ransom. The fix is boring and total: `.gitignore` the file, rotate the secret, never do it again.
- **Vercel / Render / Railway.** Every hosting platform has an "Environment Variables" settings page. You paste `DATABASE_URL` and `JWT_SECRET` there; the platform injects them as real environment variables when your app starts. No `.env` file is ever uploaded.
- **Docker.** `docker run -e PORT=8080 -e NODE_ENV=production my-api` — same image, different config, different behaviour. This is why containers and environment variables go together.
- **Twelve-factor apps.** Heroku's methodology made "config in the environment" an industry standard. When interviewers ask "where do you keep secrets?", this is the answer they expect.

## 7. Code Examples Where Applicable

The full working example is [`examples/config-demo.js`](./examples/config-demo.js), with the template in [`examples/.env.example`](./examples/.env.example). Its key pieces:

**The central config module** — read once, validate, freeze:

```js
function loadConfig(env = process.env) {
  const nodeEnv = ['development', 'test', 'production'].includes(env.NODE_ENV)
    ? env.NODE_ENV
    : 'development';
  const port = Number(env.PORT) || 3000;
  const config = {
    env: nodeEnv,
    port,
    host: env.HOST || '127.0.0.1',
    logLevel: env.LOG_LEVEL || 'info',
    databaseUrl: env.DATABASE_URL || 'postgres://localhost:5432/devdb',
    jwtSecret: env.JWT_SECRET || null,
    isProduction: nodeEnv === 'production',
  };
  if (config.isProduction && !config.jwtSecret) {
    throw new Error('JWT_SECRET is required in production');
  }
  return Object.freeze(config);
}
```

**A logger that respects the level — and never prints secrets:**

```js
function log(level, message) {
  if (LEVELS[level] >= LEVELS[config.logLevel]) {
    console.log(`[${level.toUpperCase()}] ${message}`);
  }
}
function mask(value) {
  if (!value) return '(not set)';
  return value.slice(0, 3) + '***'; // proves it exists, hides the rest
}
```

**Graceful shutdown:**

```js
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
function gracefulShutdown(signal) {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref(); // safety net
}
```

Run it with `NODE_PATH=/tmp/express-verify/node_modules node examples/config-demo.js`, and again with overrides to see config change without touching code:

```bash
NODE_ENV=production JWT_SECRET=supersecretvalue PORT=8080 LOG_LEVEL=warn NODE_PATH=/tmp/express-verify/node_modules node examples/config-demo.js
```

Compare both runs with [`examples/example.txt`](./examples/example.txt) — the default run is recorded there; the override run prints no `[INFO]` lines (level `warn` filters them) and reports `env=production`, `port=8080`.

## 8. Step-by-Step Code Explanations

**`loadConfig(env = process.env)`.** The parameter default is the real environment, but tests can pass a fake object — that one default argument is what makes the module testable. Everything inside is plain logic: pick a valid `NODE_ENV` or fall back to `development`, convert `PORT` to a number, read the rest with defaults.

**Fail fast on production secrets.** `if (config.isProduction && !config.jwtSecret) throw ...` — this is the most important line in the file. Without it, a production deploy missing its secret starts fine and fails on the first login attempt, in front of users. With it, the deploy fails at startup with a message that says exactly what's missing.

**`Object.freeze(config)`.** After this call, no module can change a value. If some code tries, it fails silently (or throws in strict mode) instead of corrupting the config for every other module. Config is startup input, not runtime state.

**The logger's level filter.** `LEVELS[level] >= LEVELS[config.logLevel]` — each level has a number, and a message prints only if its severity is at or above the configured threshold. With `LOG_LEVEL=warn`, all the `[INFO]` startup lines vanish, which is exactly what you want on a production server: less noise, and the startup lines never contain secrets anyway.

**`mask()`.** The log line `jwtSecret = sup***` proves the secret was loaded without revealing it. If you ever see `(not set)` in production logs, you know the deployment is misconfigured — without anyone's secret appearing in a log file.

**`server.close()` and the safety net.** `server.close()` stops new connections and waits for in-flight ones; the `setTimeout(..., 5000).unref()` forces exit if a request hangs. `.unref()` matters: without it, the timer itself would keep the process alive forever, defeating the shutdown.

**Port 0 in the demo.** The demo listens on port `0` (ephemeral) and calls its own `/health` and `/config` routes, then exits — the same self-test pattern as topic 10. A real server listens on `config.port`; the demo uses `0` so it never clashes with anything on your machine.

## 9. Common Misconceptions

- **"`.env` is how production gets its config."** No. `.env` is a development convenience. Production gets real environment variables from the hosting platform. Shipping a `.env` file to production is both unnecessary and a leak risk.
- **"Deleting a committed secret fixes the leak."** It doesn't. Git history keeps every version of every file. Once pushed, a secret is compromised — rotate it, then clean the history if you must.
- **"`.env.example` is pointless — I know my own variables."** Your partner doesn't, your future self doesn't, and the deployment platform doesn't. The example file is the contract for what the app needs.
- **"`process.env.PORT` is a number."** It's a string, always. `Number()` it and validate — `Number("abc")` is `NaN`, and `NaN || 3000` silently hides the mistake.
- **"Config can be changed while the app runs."** It can't — or rather, it shouldn't be. Config is read once at startup. Changing an environment variable does nothing until restart, and code that re-reads `process.env` mid-request is a bug waiting to happen.
- **"Logging the config at startup is dangerous."** Logging the *values* is dangerous. Logging that a secret *exists* (masked) and which port/env you're on is good practice — it's how you debug a misconfigured deploy.
- **"Graceful shutdown is overkill for a small app."** It's five lines, and the first time a deploy drops a user's in-flight request you'll wish you'd written them. Small apps become production apps.
- **"I can just hardcode the port — it's always 3000."** It isn't. Platforms assign the port. Hardcoding 3000 works on your laptop and fails on the first real deploy.

## 10. Important Technical Terminology

| Term | Meaning |
|---|---|
| Configuration | Values that change between environments: port, database URL, secrets |
| Environment variable | A `KEY=value` pair in a process's environment, read via `process.env` |
| `.env` file | Local `KEY=value` file loaded by `dotenv` in development only |
| `.env.example` | Committed template of required variables with placeholder values |
| Secret | A private value (password, JWT secret, API key) — never in code, git or logs |
| `NODE_ENV` | `development` / `test` / `production` — the one variable that flips behaviour |
| Twelve-factor app | Methodology whose third factor is "store config in the environment" |
| Central config module | One file that reads, validates and freezes config for the whole app |
| Fail fast | Crash at startup with a clear message instead of failing later in front of users |
| Graceful shutdown | On SIGINT/SIGTERM: stop new requests, finish in-flight ones, then exit |
| SIGINT / SIGTERM | Signals for Ctrl+C and for a platform stopping your app |
| Log level | Severity filter: `debug` < `info` < `warn` < `error` |
| `.gitignore` | File listing paths git must never track — `.env` belongs in it |
| `Object.freeze()` | Makes an object immutable — config can't be changed at runtime |

## 11. Summary

- Configuration lives outside the code, in environment variables — the same code, different values per machine.
- One central config module reads `process.env` once, converts types, validates, and exports a frozen object. No other file touches `process.env`.
- `.env` is for development only, loaded by `dotenv`, and never committed. Commit `.env.example` with placeholders, and put `.env` in `.gitignore`.
- Production gets real environment variables from the hosting platform — never a `.env` file.
- Secrets: never in code, never in git, never in logs, never in error messages — and different per environment. A leaked secret is rotated, not deleted.
- `NODE_ENV` flips dev/test/prod behaviour; `PORT` is read, not hardcoded; `HOST` `127.0.0.1` is for development, `0.0.0.0` for production.
- Fail fast: missing required config crashes at startup with a clear message.
- Graceful shutdown on SIGINT/SIGTERM: stop new requests, finish in-flight ones, close, exit — with a timeout safety net.
- Log levels filter noise; log that secrets exist, never their values.

## 12. Interview Questions and Answers

**Q1. Where should configuration live, and why not in the code?**
In environment variables, read once by a central config module. Code is shared (git, teammates, sometimes public) and runs in many places; config holds secrets and machine-specific values. Keeping them apart means the same code runs on any machine with only the environment changed.

**Q2. What is a `.env` file, and what are the rules for using it?**
A local file of `KEY=value` lines loaded into `process.env` by `dotenv` in development. Rules: never commit it (`.gitignore` it from day one), commit `.env.example` with placeholders instead, use it in development only — production gets real variables from the platform — and load it before any config is read.

**Q3. A teammate committed a database password to GitHub and then deleted the file. Is the password safe now?**
No. Git history keeps every version of the file. The password must be treated as compromised and rotated immediately; deleting the file only removes it from the latest commit.

**Q4. Why read configuration in one central module instead of `process.env` everywhere?**
One place to validate (fail fast at startup), one place to convert types (`PORT` is a string), one place to document what the app needs, and one place to test (pass a fake env object). Every other file imports the frozen result and can't get it wrong.

**Q5. What is `NODE_ENV` and what does it change?**
The variable that says which environment the app runs in: `development`, `test` or `production`. It flips logging verbosity, error detail, which database is used, and whether secrets are required. Check it once in the config module and export booleans like `isProduction`.

**Q6. What is fail fast, and why is it better than failing later?**
If required config is missing or invalid, crash immediately at startup with a clear message. The alternative — starting half-broken and failing on the first real request — means users discover the problem, and the error message rarely says what's actually missing.

**Q7. What is graceful shutdown, and which signals trigger it?**
On `SIGINT` (Ctrl+C) or `SIGTERM` (platform stopping the app): stop accepting new connections, let in-flight requests finish, close the database, then exit — with a timeout that forces exit if something hangs. Without it, the process dies mid-request and drops real users' work.

**Q8. Why must `PORT` be read from the environment instead of hardcoded?**
Hosting platforms assign the port themselves. Hardcoding 3000 works on a laptop and fails on the first real deploy, because the platform routes traffic to the port it assigned, not the one you guessed.

**Q9. What's the difference between `.env` and `.env.example`?**
`.env` holds real values and is never committed. `.env.example` holds the same keys with placeholder values and is committed — it's the contract that tells teammates and the deploy platform exactly which variables the app needs.

**Q10. How do you log configuration safely at startup?**
Log the non-sensitive values (port, env, log level) and only whether each secret is set — masked, e.g. `sup***`. Never log a secret's value, a password, a token, or a full request body.

**Q11. What is the twelve-factor app methodology's rule about config?**
Factor III: store config in the environment. Config that varies between deploys (credentials, resource handles, per-environment values) must live in environment variables, strictly separated from code.

**Q12. Your production app logs at `debug` level. What's the problem?**
Noise and risk. Debug logs drown real problems, slow the app, fill disks, and often include request bodies or values that should never be recorded. Production runs at `info` or `warn`; `debug` is for a laptop.

## 13. References

- The Twelve-Factor App — III. Config — https://12factor.net/config
- Node.js — `process.env` docs — https://nodejs.org/api/process.html#processenv
- dotenv — https://github.com/motdotla/dotenv
- Express.js — production best practices (security & performance) — https://expressjs.com/en/advanced/best-practice-performance.html
- OWASP — secrets management cheat sheet — https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html

---

## Files in This Folder

- [README.md](./README.md) — short overview and learning objectives
- [notes.md](./notes.md) — this file
- [examples/config-demo.js](./examples/config-demo.js) — runnable config demo
- [examples/.env.example](./examples/.env.example) — template of required variables
- [examples/example.txt](./examples/example.txt) — real output of the demo
- [exercises.md](./exercises.md) — 5 practice tasks, no solutions

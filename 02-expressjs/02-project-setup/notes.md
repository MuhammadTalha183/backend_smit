# 02 — Project Setup — Notes

> **Module:** Phase 02 — Express.js
> **Previous topic:** [01 — Introduction](../01-introduction/README.md)
> **Next topic:** [03 — HTTP Fundamentals](../03-http-fundamentals/README.md)
> **Versions used here:** Node.js v24.22.1 · Express 5.3.0 · npm (ships with Node.js)

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
- [Files in This Folder](#files-in-this-folder)

## 1. Introduction

Every backend project starts the same way: an empty folder becomes a Node.js
project, Express gets installed into it, and a small server file starts
answering requests. The commands are short, but the setup decisions you make
in the first ten minutes follow the project for its whole life. Where do
routes live? Where does configuration come from? What restarts the server
when you save a file? How do secrets stay out of Git?

This topic answers those questions once, properly, so every later topic in
Phase 02 can assume a project shaped the same way. By the end you will be
able to start a fresh Express project from an empty folder, explain every
line of its `package.json`, lay out a folder structure that still makes sense
at fifty routes, run it with a one-command dev workflow, and keep secrets out
of version control. Nothing here needs a database or deployment — the goal is
a clean, repeatable starting point, the same skeleton you will reuse for the
semester project and every practice API in this journey.

## 2. Definition of Important Concepts

- **npm init** — turns a folder into a Node.js project by creating `package.json`. `npm init -y` accepts all defaults.
- **package.json** — the project manifest: name, version, entry point, scripts, and dependencies. npm reads it; Node.js reads parts of it.
- **Dependency** — a package the app needs at runtime (e.g. `express`), under `"dependencies"`, installed with `npm install <name>`.
- **devDependency** — a package needed only while developing (e.g. `nodemon`), under `"devDependencies"`, installed with `npm install -D <name>`. Production installs can skip them.
- **node_modules/** — where npm downloads packages. Never written by hand, never committed to Git, recreated any time with `npm install`.
- **package-lock.json** — the exact, locked record of every installed package (including packages-of-packages), with versions and integrity hashes. Commit it; it makes `npm install` reproducible.
- **Entry point (`"main"`)** — the file Node.js loads when someone requires your package by folder name. For a server you start, `"scripts"` matter more than `"main"`.
- **Script** — a named shortcut under `"scripts"`, run with `npm run <name>` (or plain `npm start` for `start`). This is how `npm run dev` and `npm start` work.
- **Express application (`app`)** — the object returned by `express()`. You register routes and middleware on it; it is not yet a listening server.
- **Server (`server`)** — what `app.listen()` returns: a real `http.Server` holding a port open. The `app`/`server` split is why this topic keeps `app.js` and `server.js` as two files.
- **Environment variable** — a key/value setting supplied from outside the code (shell, `.env` file, or hosting platform), read as `process.env.NAME`. The standard way to pass ports, secrets, and per-environment settings in.
- **`.env` file** — `KEY=value` lines, loaded into `process.env` by the `dotenv` package in development. It holds secrets, so it must never be committed to Git.
- **`.env.example`** — a committed template with the same keys as `.env` but placeholder values (no real secrets). A new developer copies it to `.env` and fills in their own values.
- **nodemon** — a dev tool that watches your files and restarts Node.js whenever you save, removing the stop → start → test loop.
- **Ephemeral port** — a port chosen by the OS when you listen on port `0`. Useful for tests and demos, because it can never clash with another server.

## 3. Detailed Explanations

### 3.1 `npm init` — creating the project

```bash
mkdir my-api
cd my-api
npm init -y
```

`npm init` asks a few questions (name, version, description, entry point,
author, licence) and writes `package.json`. The `-y` flag accepts every
default so you can edit the file afterwards instead of answering prompts.
Defaults are fine to start with: name from the folder, version `1.0.0`,
entry point `index.js`.

### 3.2 The `package.json` fields that matter

Most fields are metadata. The ones that change how your project behaves:

- **`"name"`** — the project name. Lowercase, no spaces, URL-safe (`my-api`, not `My API`); also the name npm would publish under.
- **`"version"`** — semver (`major.minor.patch`). Start at `1.0.0`.
- **`"main"`** — the entry file loaded when this folder is `require()`d by another project. For a server you run directly this matters less than `"scripts"`, but keep it pointing at a real file (`src/server.js`) so the manifest never lies.
- **`"scripts"`** — named commands (see §3.7). The two that matter now are `"start"` (production: `node src/server.js`) and `"dev"` (development: `nodemon src/server.js`).
- **`"dependencies"`** — runtime packages. Express lives here.
- **`"devDependencies"`** — development-only packages. nodemon lives here.
- **`"type"`** — `"commonjs"` (default, `require`) or `"module"` (ES Modules, `import`). Module 01, Topic 07 covered this decision in full. This journey uses CommonJS for the Express phase, so `"type"` is left unset — the default — and the code uses `require('express')`.

A finished `package.json` for this topic:

```json
{
  "name": "my-api",
  "version": "1.0.0",
  "description": "Backend Development Journey — Express project setup",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "dependencies": {
    "express": "^5.3.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

### 3.3 Installing Express — what actually lands on disk

```bash
npm install express
```

Three things happen:

1. **npm downloads Express and its dependencies** (packages Express itself needs, such as `body-parser`, `router`, `cookie`, `debug`) into `node_modules/`. Express is small, but its dependency tree is not one file — `node_modules` will hold dozens of folders.
2. **npm adds an entry to `package.json`:** `"express": "^5.3.0"` under `"dependencies"`. The `^` (caret) means "this version or any compatible newer minor/patch version" — `5.3.0` up to (but not including) `6.0.0`.
3. **npm creates or updates `package-lock.json`**, recording the exact version of every package installed, including transitive dependencies, plus an integrity hash for each download.

Two rules follow. **Commit `package.json` and `package-lock.json`. Never
commit `node_modules/`.** The lock file is what makes a teammate's
`npm install` produce exactly the same tree you have. `node_modules` is a
build artefact — big, regenerable, and platform-specific in places. It
belongs in `.gitignore` (see §3.6). And **to recreate the project on a new
machine, `npm install` with no arguments is enough** — npm reads the lock
file and rebuilds `node_modules` exactly. You never copy the folder from
another machine. Express 5.3.0 requires Node.js 18 or newer; Node.js v24
(used in this journey) is comfortably inside that range.

### 3.4 Recommended folder structure

A flat folder works for one route. It collapses at ten. The structure used
for the rest of Phase 02:

```text
my-api/
├── node_modules/          # npm packages (gitignored, never edit)
├── src/
│   ├── config/            # configuration: env loading, constants
│   ├── routes/            # route definitions only (URL → handler)
│   ├── controllers/       # request handlers (the logic behind a route)
│   ├── middleware/        # reusable request pipeline functions
│   ├── app.js             # creates and configures the Express app
│   └── server.js          # starts the app listening on a port
├── .env                   # real secrets (gitignored, never committed)
├── .env.example           # template of required keys (committed)
├── .gitignore
└── package.json
```

- **`src/`** keeps application code in one place, separate from project metadata (`package.json`, `.env`, `.gitignore`) at the root.
- **`routes/`** owns URLs. A route file says "GET /health calls this controller" and nothing else — no business logic lives here, so finding an endpoint is a one-file job.
- **`controllers/`** owns request handling: read `req`, do the work, send `res`. Keeping handlers out of route files is what makes them testable on their own later.
- **`middleware/`** owns functions that run on the way through — logging, authentication, error handling. Shared across routes, so they get their own home instead of being copy-pasted.
- **`config/`** owns everything that changes between environments: the port, the app name, database URLs. One module reads `process.env`, applies defaults, and exports a plain object; the rest of the app imports that object and never touches `process.env` directly.

### 3.5 `app.js` vs `server.js` — the split, and why it exists

```js
// src/app.js — builds the app, does NOT listen
const express = require('express');
const app = express();
app.get('/health', (req, res) => res.json({ status: 'ok' }));
module.exports = app;
```

```js
// src/server.js — starts the app listening
const app = require('./app');
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
```

The split exists for one reason: **starting a server and defining an app
are two different jobs, and tests need only one of them.** A test file can
`require('./app')` and make requests against it without ever opening a port
(supertest, covered in a later topic, works exactly this way). If listening
lived in the same file as the routes, importing the app would also start a
server — tests would fight over ports, and two test files could not run at
once. Keep them apart from day one; it costs one extra file and saves a
refactor later.

### 3.6 Environment variables and `.env` basics

Hard-coding a port (`app.listen(3000)`) works on your laptop and breaks the
day the app runs somewhere else — a hosting platform assigns the port, a
teammate already runs something on 3000, a test needs a free one. The fix is
to read configuration from the environment:

```js
const PORT = Number(process.env.PORT) || 3000;
const APP_NAME = process.env.APP_NAME || 'my-api';
```

`process.env` is an object Node.js builds from the shell environment. In
development, the `dotenv` package fills it from a `.env` file
(`npm install dotenv`), loaded at the very top of the entry file — **before**
any code reads `process.env`:

```js
require('dotenv').config();
```

```text
# .env — real values, never committed
PORT=4000
APP_NAME=my-api
NODE_ENV=development
```

Three rules, all non-negotiable:

1. **Secrets never go in Git.** API keys, database passwords, tokens — if a value would hurt you in someone else's hands, it does not belong in a committed file. `.env` goes in `.gitignore` on the day the project is created, not the day after a secret leaks (`node_modules/` and `.env` are the first two lines). A secret committed to Git is compromised even after you delete it — history keeps it. If one ever leaks, rotate it (change the password/key), don't just delete the file.
2. **Ship a `.env.example` with the same keys and fake values.** It is the checklist a new developer (or future you) uses to build their own `.env`: `PORT=3000`, `APP_NAME=my-api`, `NODE_ENV=development`.
3. **Code never assumes a variable exists.** Every `process.env.X` read gets a default (`|| 3000`) or a loud failure at startup. A server that crashes immediately with "PORT is not set" is better than one that silently listens on the wrong port.

### 3.7 Scripts in `package.json` — `start` and `dev`

```json
"scripts": {
  "start": "node src/server.js",
  "dev": "nodemon src/server.js"
}
```

- **`npm start`** runs the production path: plain `node`, no watcher, no extra tooling. This is the command a hosting platform runs.
- **`npm run dev`** runs nodemon, the development path (see §3.8).
- **`npm run <name>`** runs any script; `start` (and `test`) are the only two you may run without the `run` keyword — `npm start` works, `npm dev` does not.

Scripts are also documentation: a new developer reads `"scripts"` and knows
exactly how to run the project, without a README paragraph or a tribal
handoff. Keep them short, and put anything complicated in a file the script
calls, not in the script string itself.

### 3.8 nodemon — the dev workflow

```bash
npm install -D nodemon
```

nodemon is a wrapper around `node`. It starts your server, watches the files
in your project, and **restarts the process automatically every time you
save a change**. Without it the loop is: edit → stop the server (Ctrl+C) →
start it again → re-test. With it: edit → save → re-test. Over a day of
development that is hundreds of restarts you never think about.

Two things to remember: it is a **devDependency** (`-D` flag) — production
servers are started once and managed by the platform, and `npm install
--production` skips devDependencies entirely. And it is a development
convenience, not a process manager: it does not keep a crashed production
server alive, does not handle clustering, and does not belong in a
deployment command. (PM2 and platform process managers cover that job in
Phase 06.) If nodemon restarts in a loop, you usually have code writing to
a watched file (a log file inside `src/`, for example) — move the output
out of the watched tree.

### 3.9 Your first server file, step by step

The complete sequence for the minimal server in `examples/server.js`, in
the order the code runs:

1. **Load Express:** `require('express')` — the installed package, resolved from `node_modules`.
2. **Read configuration:** `PORT` and `APP_NAME` from `process.env`, with defaults, before anything uses them.
3. **Create the app:** `express()` — a fresh application with no routes yet.
4. **Register routes:** `app.get('/', ...)` and `app.get('/health', ...)` — each pairs a path with a handler that sends JSON back.
5. **Listen:** `app.listen(PORT, callback)` — binds the port and starts accepting connections; the callback runs once the server is ready.
6. **Verify:** the demo calls its own routes and logs the responses, then closes the server. In a real project this step is your browser or a tool like Postman (Topic 03 covers testing routes properly).

The whole file is under 60 lines. That is the point: an Express server is
mostly configuration and routes. The framework does the HTTP work.

## 4. How the Technology Works Internally

### 4.1 What `npm install express` does, step by step

1. npm reads `package.json` and `package-lock.json` (if present) to work out the dependency tree: Express 5.3.0 plus everything it depends on.
2. It downloads each package tarball from the npm registry and verifies the integrity hash recorded in the lock file (or computed fresh on first install).
3. It extracts the tarballs into `node_modules/`, each package in its own folder, nested where version conflicts require it.
4. It writes `"express": "^5.3.0"` into `package.json` and the full resolved tree into `package-lock.json`.
5. Later, `require('express')` is resolved by Node.js walking up from the requiring file looking for `node_modules/express` — which is why the folder must sit at the project root (or an ancestor) and why the demo commands in this topic set `NODE_PATH` to point at the shared Express install used for verification.

### 4.2 What `app.listen()` does

`app.listen()` is a thin wrapper: Express creates an `http.Server` (Node.js
`http` module, Module 01 Topic 05 territory), hands it a request handler
function — the Express app itself is a function `(req, res) => ...` — and
calls `server.listen(port)`. The server then asks the OS to bind the port
(or, for port `0`, to assign any free port and report it back via
`server.address().port`), registers the socket with the event loop, and for
each connection builds the `req`/`res` objects, runs them through the
middleware and route stack, and writes the response. The return value is the
`http.Server`, which is why the example can call `server.address().port`
and `server.close()`.

### 4.3 How `dotenv` fills `process.env`

`require('dotenv').config()` reads the `.env` file in the current working
directory, parses each `KEY=value` line, and assigns the pair onto
`process.env` — **only if that key is not already set**. Real environment
variables win over the file, which is exactly the precedence you want: the
hosting platform's value beats your local file. This is also why `.config()`
must run before any module reads `process.env`: a config module loaded first
would see empty values and cache its defaults.

## 5. Architecture or Workflow

### 5.1 The setup workflow — empty folder to running server

```text
1. mkdir my-api && cd my-api
2. npm init -y                  → package.json created
3. npm install express          → node_modules/ + lock file
4. npm install -D nodemon       → dev workflow
5. Create src/routes, src/controllers, src/middleware, src/config
6. Write src/app.js             → routes registered, no listening
7. Write src/server.js          → reads config, app.listen(PORT)
8. Write .env + .env.example + .gitignore
9. Add "start" and "dev" scripts to package.json
10. npm run dev                 → server running, auto-restarts on save
```

### 5.2 The request path in the finished skeleton

```text
Client request (GET /health)
  → src/server.js — app.listen(PORT) accepts the connection
  → src/app.js — the Express app (middleware stack, then routes)
  → src/routes/health.js — "GET /health → healthController.check"
  → src/controllers/healthController.js — builds the JSON response
  → res.json({ status: 'ok' }) → back to the client
```

Configuration flows the other way: `src/config/index.js` reads
`process.env` (filled by dotenv from `.env` in development, by the platform
in production) and every other module imports the config object. Nothing
below `server.js` reads `process.env` directly — one module owns that job,
so a missing variable is found in one place.

## 6. Real-World Examples

- **A startup's first API.** One repo, `npm init -y`, Express, the `src/` split. Three developers clone it, run `npm install`, copy `.env.example` to `.env`, and all three are running the same server in five minutes. The structure is the onboarding document.
- **A production deploy.** The platform (Render, Railway, a VPS) sets `PORT` and the database URL as environment variables and runs `npm start`. The same code that ran on port 3000 on a laptop runs on the platform's assigned port with zero code changes — because the port was never in the code.
- **A leaked-secret post-mortem.** A team commits `.env` with a database password. GitHub's secret scanner flags it, the password is rotated, `.env` is added to `.gitignore`, and a `.env.example` is committed in its place. The lesson costs a rotation, not a breach — but only because the `.gitignore` rule exists from day one in every new project afterwards.

## 7. Code Examples Where Applicable

The runnable examples live in [`examples/`](./examples/). The setup
artefacts for a new project (the full `package.json` is in §3.2):

**`src/app.js`:**

```js
const express = require('express');
const app = express();
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
module.exports = app;
```

**`src/server.js`:**

```js
require('dotenv').config();
const app = require('./app');
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
```

**`src/config/index.js` — the one place that reads `process.env`:**

```js
require('dotenv').config();
module.exports = {
  appName: process.env.APP_NAME || 'my-api',
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
};
```

**`.env.example`** (copy to `.env`, fill in real values): `PORT=3000`,
`APP_NAME=my-api`, `NODE_ENV=development`. **`.gitignore`:**
`node_modules/` and `.env`.

## 8. Step-by-Step Code Explanations

### 8.1 `examples/server.js` — the first server, line by line

- `require('express')` loads Express from `node_modules` (in this topic's verification setup the shared install is reached via `NODE_PATH`; in your own project it is installed locally).
- `Number(process.env.PORT) || 0` reads the port from the environment; `Number(...)` converts `"4000"` to `4000`, and `|| 0` supplies the default — `0` means "ask the OS for any free port", so this demo can never clash with another server. (A real project defaults to `3000`; see §3.6 and `config-demo.js`.)
- `process.env.APP_NAME || 'backend-journey-app'` — the same pattern for a plain string setting: environment value wins, the default is the fallback.
- `express()` creates the app; `app.get('/', ...)` and `app.get('/health', ...)` register routes. `res.json()` sets `Content-Type: application/json` and stringifies the object.
- `app.listen(PORT, async () => {...})` starts listening and keeps the returned `http.Server`, so the demo can read the real port (`server.address().port`) and close it later.
- `await fetch(...)` — the global `fetch` (Node.js 18+) calls the server's own routes over real HTTP, proving they answer; each call logs `METHOD path -> status body`.
- `server.close(() => { ... process.exit(0); })` in the `finally` block closes the server so the process self-terminates even if a request failed. Without this, `app.listen()` keeps the event loop alive forever — correct for a real server, wrong for a runnable example.

### 8.2 `examples/config-demo.js` — configuration without a server

- The `config` object reads three variables with defaults: `APP_NAME` (string), `PORT` (number, default `3000` — the real-project default), `NODE_ENV` (string, default `'development'`).
- `console.log(config)` prints the resolved object, so you can see exactly what the app would run with — no guessing, no hidden state.
- There is no server and no `process.exit()`: a script with no open handles exits on its own when it reaches the end. Compare with `server.js`, which must close its server explicitly.
- Try it with overrides: `APP_NAME=my-api NODE_ENV=production node examples/config-demo.js` — the printed config changes, the code does not.

## 9. Common Misconceptions

- **"Committing `node_modules` makes setup faster."** It makes the repo enormous, breaks across operating systems, and is redundant — `npm install` rebuilds the folder from the lock file. Gitignore it.
- **"The lock file is noise; I can delete it."** Deleting it throws away reproducibility — two installs from the same `package.json` can resolve different transitive versions, and "works on my machine" becomes a real bug. Commit the lock file.
- **"`npm install express` and `npm install -D nodemon` are the same."** The first puts Express in `"dependencies"` (needed at runtime). `-D` puts nodemon in `"devDependencies"` (needed only while developing).
- **"`.env` is just for secrets, so a port can be hard-coded."** Ports, feature flags, and environment names are configuration too. The rule is not "secrets go in env" — it is "anything that changes between environments goes in env". A hard-coded port is the first thing that breaks on deploy.
- **"I deleted the `.env` from Git, so the secret is safe."** Git history keeps every committed version. A committed secret is a compromised secret: rotate it. Prevention (`.gitignore` from day one) is the fix.
- **"`app.js` and `server.js` are the same thing — why two files?"** One defines the app, the other starts it listening. Tests import the app without starting a server; merging the files makes that impossible.
- **"nodemon is a production tool — it keeps my server alive."** No. nodemon restarts on file changes during development. Production restarts are the platform's or a process manager's job (Phase 06).
- **"`npm run dev` and `npm start` do the same thing."** They run different commands by design: `dev` watches and restarts; `start` runs plain Node.
- **"`res.json()` and `res.send()` are interchangeable."** Close, not identical: `res.json()` always serialises to JSON and sets the JSON content type; `res.send()` guesses from the value. For an API, be explicit — use `res.json()`.

## 10. Important Technical Terminology

| Term | Meaning |
| --- | --- |
| `package.json` | The project manifest: name, version, scripts, dependencies. |
| `package-lock.json` | The exact locked tree of every installed package version + hash. |
| Dependency | A package needed at runtime (`"dependencies"`). |
| devDependency | A package needed only in development (`"devDependencies"`). |
| `node_modules/` | Where npm installs packages. Regenerable, gitignored. |
| Semver | `major.minor.patch` versioning; `^5.3.0` means ≥5.3.0 and <6.0.0. |
| Transitive dependency | A dependency of a dependency (e.g. Express needs `body-parser`). |
| Entry point / `"main"` | The file loaded when the package folder is `require()`d. |
| npm script | A named command in `"scripts"`, run with `npm run <name>`. |
| `app` (Express application) | The object from `express()`; routes and middleware live here. |
| `server` (`http.Server`) | What `app.listen()` returns; holds the port open. |
| Environment variable | A setting passed in from outside the code, read via `process.env`. |
| dotenv | Package that loads a `.env` file into `process.env` in development. |
| `.env` | Local file of real `KEY=value` settings. Never committed. |
| `.env.example` | Committed template of required keys with placeholder values. |
| `.gitignore` | Lists files Git must never track (`node_modules/`, `.env`). |
| nodemon | Dev tool that restarts Node.js on file changes. |
| Ephemeral port | A free port assigned by the OS when listening on port `0`. |
| Health endpoint | A route (usually `GET /health`) reporting the service is alive. |
| `res.json()` | Sends a JSON response with the correct content-type header. |

## 11. Summary

- `npm init -y` creates `package.json`; the fields that matter are `name`, `version`, `main`, `scripts`, `dependencies`, and `devDependencies`.
- `npm install express` downloads Express into `node_modules/`, records `"express": "^5.3.0"` in `package.json`, and locks the exact tree in `package-lock.json`. Commit the two JSON files; gitignore `node_modules/`.
- The recommended layout is `src/` with `routes/`, `controllers/`, `middleware/`, and `config/`, plus `app.js` (defines the app) and `server.js` (starts it listening) kept as separate files.
- Configuration comes from the environment: `process.env` with defaults, loaded from `.env` by dotenv in development, with `.env` gitignored and a `.env.example` committed as the template.
- `npm start` runs the server with plain Node; `npm run dev` runs nodemon, which restarts on every save. nodemon is a devDependency, never a production tool.
- A server that reads its port from the environment runs unchanged on a laptop and on a hosting platform — the port was never in the code.

## 12. Interview Questions and Answers

**Q1. What does `npm init` do, and what is `npm init -y`?**
`npm init` creates a `package.json` in the current folder after asking for metadata (name, version, entry point). `-y` accepts all defaults without prompting, so you get a valid manifest in one command and edit it afterwards.

**Q2. What is the difference between `dependencies` and `devDependencies`?**
`dependencies` are needed at runtime — Express, dotenv — and are installed in every environment. `devDependencies` are needed only while developing — nodemon, test runners — installed with `npm install -D`, and skipped by production installs (`npm install --production`).

**Q3. Why do we commit `package-lock.json` but never `node_modules/`?**
The lock file records the exact version and integrity hash of every package, so `npm install` reproduces the same tree on every machine. `node_modules` is large, partly platform-specific, and fully regenerable from the lock file — committing it adds nothing except repo bloat and cross-platform breakage.

**Q4. What does the `^` mean in `"express": "^5.3.0"`?**
A semver range: install 5.3.0 or any newer compatible version — 5.4.0, 5.9.9, but never 6.0.0, where breaking changes are allowed. The lock file still pins the exact version actually installed.

**Q5. Why split the server into `app.js` and `server.js`?**
`app.js` defines the Express application (routes, middleware); `server.js` starts it listening. The split lets tests import the app and make requests against it without opening a port. If listening lived in the same file, importing the app would start a server and tests would fight over ports.

**Q6. How does an Express app read configuration, and why not hard-code it?**
From environment variables via `process.env`, with a default for each value (`Number(process.env.PORT) || 3000`). Hard-coded values break the moment the app runs somewhere else — hosting platforms assign the port, teammates use different ports, tests need free ones. Env vars change the config without changing the code.

**Q7. What is dotenv, and what is the load-order rule?**
dotenv reads a `.env` file of `KEY=value` lines into `process.env` during development. The rule: call `require('dotenv').config()` at the very top of the entry file, before any module reads `process.env` — and real environment variables take precedence over the file, so the platform's values win.

**Q8. A `.env` file with a database password was committed to Git. What do you do?**
Rotate the secret immediately — it is compromised, because Git history keeps the committed version even after the file is deleted. Then add `.env` to `.gitignore`, commit a `.env.example` with placeholder values, and make sure every teammate pulls the fix and re-creates their local `.env`.

**Q9. What is nodemon, and why is it a devDependency?**
nodemon wraps Node.js, watches project files, and restarts the server automatically on every save, removing the manual stop/start cycle during development. It is a devDependency because production servers are started once and managed by the platform — a file watcher there is useless.

**Q10. What happens when you call `app.listen(0)`?**
Port `0` asks the OS to assign any free (ephemeral) port. The server reports the assigned port through `server.address().port`. It is used for tests and demos where the port number does not matter and must never clash.

**Q11. What does `app.listen()` return, and why does it matter?**
It returns the underlying `http.Server`. That is how you read the real port (`server.address().port`), close the server gracefully (`server.close()`), and attach handlers on the server object. The Express `app` is the request handler; the `server` is the thing holding the port open.

**Q12. What is the difference between `npm start` and `npm run dev`?**
`npm start` runs the `"start"` script — plain `node src/server.js`, the production path, no watcher. `npm run dev` runs the `"dev"` script — `nodemon src/server.js`, the development path with auto-restart on save.

## 13. References

- Express.js official documentation — https://expressjs.com/
- Express 5.x API reference — https://expressjs.com/en/5x/api.html
- Express "Getting started" guide — https://expressjs.com/en/starter/installing.html
- npm documentation: `package.json` — https://docs.npmjs.com/cli/v11/configuring-npm/package-json
- npm documentation: `package-lock.json` — https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json
- npm documentation: `npm install` — https://docs.npmjs.com/cli/v11/commands/npm-install
- dotenv (npm) — https://www.npmjs.com/package/dotenv
- nodemon — https://nodemon.io/
- Node.js `process.env` documentation — https://nodejs.org/api/process.html#processenv
- Semantic Versioning — https://semver.org/

---

## Files in This Folder

- [`README.md`](./README.md) — topic overview, objectives, and how to run the examples
- [`notes.md`](./notes.md) — this file: full detailed notes with interview Q&A
- [`examples/server.js`](./examples/server.js) — first Express server; self-tests its own routes and exits
- [`examples/config-demo.js`](./examples/config-demo.js) — reading config from `process.env` with defaults
- [`examples/example.txt`](./examples/example.txt) — real output of both example runs
- [`exercises.md`](./exercises.md) — 5 practice tasks, no solutions

# 14 — Practical Project: A Complete Tasks API

> **Module:** [03 — MongoDB](../README.md) · **Previous:** [13 — Mongoose](../13-mongoose/README.md) · **Next:** Phase 04 — Authentication and Authorization *(coming next — folder not created yet)*
>
> **Example:** [examples/tasks-api.mjs](./examples/tasks-api.mjs) · **Expected output:** [examples/example.txt](./examples/example.txt) · **Exercises:** [exercises.md](./exercises.md)

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

Thirteen topics ago, MongoDB was a word. Since then you have met documents and collections (topic 05), CRUD (topic 06), query operators (topic 07), schema design (topic 08), relationships (topic 09), indexing (topic 10), and Mongoose (topic 13) — plus, in Module 02, Express routing, middleware, validation, and error handling. Each topic was one brick. This topic is the wall: a complete, small, working tasks API that uses all of them at once.

The project is deliberately small — one file, one collection, five routes — because a capstone should prove you can put the pieces together, not drown you in files. It is a notes/tasks API: create a task, list tasks, read one task, mark it done, delete it. That is the same shape as almost every real backend you will ever build. A blog is posts with CRUD. A shop is products with CRUD. Q-less (the semester project idea) is queue tokens with CRUD. Learn this shape once, and every new project is a variation on it.

The example is fully self-contained and self-testing. It starts an in-memory MongoDB server, seeds three tasks, starts an Express 5 server on an ephemeral port, and then tests itself with nine `fetch` calls — the happy path, a validation failure, a malformed id, a missing task, and a delete — printing one line per step. Then it cleans up after itself: server closed, client closed, memory server stopped, data directory deleted. Nothing is left behind, and the output is identical on every run.

What this project deliberately does *not* have is just as instructive as what it has. There is no authentication — anyone who can reach the server can delete every task. There is no Mongoose — the raw driver is used on purpose, so you can see exactly what the driver does before the ODM hides it. And there is no persistence — the in-memory server vanishes when the process ends. Each of those gaps is a named next step: authentication is Phase 04, the Mongoose rebuild is an exercise in this topic, and a real deployment is a later phase.

## 2. Definition of Important Concepts

**Capstone project.** A small, complete project built at the end of a module to prove the separate topics work together. It is not a new concept — it is the old concepts, combined.

**Tasks API.** A web API (a server that answers HTTP requests with JSON) that manages a `tasks` collection. Each task is a document with four fields: `_id`, `title`, `done`, and `priority` (`low`, `medium`, or `high`).

**CRUD.** Create, Read, Update, Delete — the four operations every resource needs. They map onto HTTP methods: `POST` creates, `GET` reads, `PATCH` updates part of a document, `DELETE` removes.

**Route.** One URL pattern plus one HTTP method plus one handler function, for example `GET /tasks/:id`. The `:id` part is a *route parameter* — Express captures whatever is in that position and puts it in `req.params.id`.

**Validation middleware.** A middleware function that checks `req.body` *before* the route handler runs. If the body is bad, it stops the request with `400` and a per-field error message; if the body is good, it calls `next()` and the handler runs.

**Central error handler.** A single Express error-handling middleware (a function with four arguments: `err, req, res, next`) registered last, after all routes. Every error in the app — thrown or passed to `next(error)` — ends up here, so the client always gets the same JSON shape.

**ObjectId validation.** Checking that a string from the URL is a valid MongoDB ObjectId (`ObjectId.isValid()` — a 24-character hex string) *before* using it in a query. A malformed id is a client mistake, so it is a `400`; a well-formed id with no matching document is a `404`.

**Seed script.** Code that inserts known starting data into an empty collection. Here the seed is three tasks with fixed ObjectIds (`...0001`, `...0002`, `...0003`), so the output is the same on every run.

**Ephemeral port.** Passing `0` to `app.listen()` asks the operating system to pick a free port. The port number is different on every run, which is why the example never prints it — printing it would make the output non-deterministic.

**Self-test.** Code in the same file that calls its own API with `fetch` and prints the results. It is not a test framework — it is a demo that also proves the API works.

**Deterministic output.** Output that is byte-identical on every run: fixed ids, no timestamps, no port numbers, no random values. It lets you verify the example with `diff` instead of by eye.

## 3. Detailed Explanations

### 3.1 The project layout

A real project splits into files — `server.mjs`, `routes/tasks.mjs`, `middleware/validate.mjs`, `db.mjs` — but this capstone is one file with five clearly marked sections, because the goal is to see the whole flow in one place:

1. **Start the server and seed** — in-memory MongoDB, driver connection, three tasks.
2. **Helpers** — the public task shape, id parsing, validation middleware.
3. **Express app** — `express.json()` plus the five routes, then the error handler.
4. **Self-test** — listen on port `0`, nine `fetch` calls, one printed line each.
5. **Cleanup** — close the HTTP server, close the client, stop the memory server, delete the data directory.

When the project grows, each section becomes a file or a folder. Section 2 becomes `middleware/` and `utils/`; section 3 becomes `routes/`; section 1 becomes `db/` and a `seed.mjs` script. The sections do not change — only their addresses do.

### 3.2 The task document

```js
{ _id: ObjectId('000000000000000000000001'), title: 'Learn MongoDB basics', done: false, priority: 'high' }
```

Four fields, each with a reason:

- `_id` — the ObjectId primary key (topic 05). Fixed values in the seed and in the self-test's `POST`, so the output never changes.
- `title` — a non-empty string. The one required field; everything else has a default.
- `done` — a boolean, `false` by default. The whole point of a task list is flipping this flag.
- `priority` — an enum: `low`, `medium`, or `high`, defaulting to `medium`. Enums are schema design (topic 08) in miniature: a closed set of allowed values, enforced in validation.

There are deliberately no `createdAt` / `updatedAt` fields. Timestamps are useful in real apps, but they change on every run, so they would break the deterministic output. When you add timestamps in your own project, strip them from printed output or accept that the output will differ.

### 3.3 The five routes

| Method | Path | Success | What it does |
| --- | --- | --- | --- |
| `GET` | `/tasks` | `200` | Returns all tasks, sorted by `_id` |
| `GET` | `/tasks/:id` | `200` | Returns one task |
| `POST` | `/tasks` | `201` | Creates a task |
| `PATCH` | `/tasks/:id` | `200` | Updates the fields sent, returns the updated task |
| `DELETE` | `/tasks/:id` | `200` | Deletes a task, returns `{ deleted: true }` |

`GET /tasks` sorts by `{ _id: 1 }`. Because ObjectIds are roughly time-ordered, this is effectively creation order — and, more importantly, it is a *stable* order, so the printed list is the same every run. Never return an unsorted `find()` and hope the order stays put.

`POST` accepts a client-supplied `_id`. Normally the server generates ids, and if the client sends none, this route does generate one (`new ObjectId()`). But accepting one is useful: the self-test can create task `...0004` and then read, patch, and delete exactly that id. In a real API you would think twice — a client that picks ids can collide with existing ones — but for a deterministic demo it is the right call.

`PATCH`, not `PUT`: `PATCH` updates only the fields sent, while `PUT` conventionally replaces the whole document. The route builds an `updates` object from whichever of `title`, `done`, `priority` are present, and uses `$set` (topic 06) so the other fields are untouched. If the body contains none of the three, it is a `400` — a PATCH that changes nothing is a client mistake.

### 3.4 Validation middleware

Validation is a middleware factory — a function that returns a middleware function — because `POST` and `PATCH` need slightly different rules:

```js
function validateTaskBody({ partial = false } = {}) { ... }
```

- `POST` uses `validateTaskBody()`: the full body is required, so a missing `title` is an error.
- `PATCH` uses `validateTaskBody({ partial: true })`: only the fields actually sent are checked, so `{ done: true }` is fine even though it has no `title`.

The checks themselves are plain JavaScript, one per field:

- `_id`, if present, must pass `ObjectId.isValid()`.
- `title`, if present (or if the route is not partial), must be a non-empty string after trimming.
- `done`, if present, must be a boolean — the string `"true"` is not good enough.
- `priority`, if present, must be one of `low`, `medium`, `high`.

Failures are collected into an `errors` object — one message per bad field — and passed to `next(error)` as a `400`. Collecting *all* errors instead of stopping at the first means the client can fix everything in one round trip instead of playing whack-a-mole with one error at a time.

This is the same pattern as Module 02, topic 09, applied to a MongoDB resource. The database never sees invalid data, because the middleware runs first and the handler only runs on clean input.

### 3.5 The central error handler

Every route handler in the example is wrapped in `try { ... } catch (error) { next(error); }`, and every helper throws errors that carry a `status` property (`400`, `404`). All of those errors flow to one place:

```js
app.use((error, req, res, next) => {
  const status = error.status ?? 500;
  const body = { error: error.message ?? 'Internal server error.' };
  if (error.errors) body.errors = error.errors;
  res.status(status).json(body);
});
```

Three things matter here:

1. **One shape.** Success bodies are tasks; error bodies are always `{ error: '...' }`, plus an `errors` object for validation failures. A client can parse errors without guessing.
2. **No leaked internals.** A `500` never sends a stack trace. The stack goes to the server log in a real app; the client gets a generic message.
3. **It is registered last.** Express runs error middleware in registration order, and an error handler only catches errors from middleware registered *before* it. Put it after the routes, or it catches nothing.

### 3.6 ObjectId validation: 400 vs 404

The `parseId` helper is the whole story:

```js
function parseId(req) {
  if (!ObjectId.isValid(req.params.id)) {
    const error = new Error('Invalid task id: must be a 24-character hex string.');
    error.status = 400;
    throw error;
  }
  return new ObjectId(req.params.id);
}
```

Two different failures, two different statuses, and confusing them is one of the most common beginner mistakes in an API:

- `GET /tasks/not-an-id` → **400**. The request itself is malformed. `"not-an-id"` is not a 24-character hex string, so it can never match a document. The client must fix the URL.
- `GET /tasks/000000000000000000000099` → **404**. The id is perfectly well-formed, the query ran correctly, and the answer is "no such task". The request was fine; the resource is missing.

Note that `ObjectId.isValid()` is lenient about some inputs — for example, a 12-character string is technically valid. That is fine here: the point is to reject obvious garbage before it reaches the database. The database lookup is the real test of existence, and it returns `null`, which the route turns into a `404`.

### 3.7 The public task shape

The `publicTask` helper converts a stored document into the object the client sees:

```js
const publicTask = (doc) => ({
  _id: doc._id.toHexString(),
  title: doc.title,
  done: doc.done,
  priority: doc.priority,
});
```

Two jobs in four lines. First, it converts the ObjectId to its hex string — JSON cannot represent an ObjectId, and the driver's `toJSON` would do something similar, but explicit is better than relying on a hidden conversion. Second, it is a whitelist: only these four fields ever leave the server. If a later version of the document gains an internal field (an owner id, a soft-delete flag, a timestamp), it stays inside unless someone deliberately adds it to this function. The whitelist is also what keeps the output deterministic — no field can leak into the printed output by accident.

### 3.8 Seeding and cleanup

The seed runs once at startup with `insertMany` and fixed ids. Because the data directory is deleted at the end of every run, the collection is always empty when the seed runs — no "already exists" problem, and no need for `deleteMany` first. (If you keep data between runs, seeding needs an upsert or a "seed only if empty" guard.) Cleanup is the mirror image of startup, in reverse order: close the HTTP server, close the MongoDB client, stop the memory server, delete the data directory. Reverse order matters: closing the client before the server could strand in-flight requests, and deleting the data directory before stopping `mongod` would fail on some systems because the process still holds the files open.

## 4. How the Technology Works Internally

### 4.1 The in-memory server

`mongodb-memory-server` does not fake MongoDB — it downloads (once) a real `mongod` binary, starts a real `mongod` process on a random port, and hands you its connection string with `mongod.getUri()`. Every driver call in the example talks to that real server over a real TCP connection. The only differences from a production server are that the data lives in a throwaway directory and the process dies when you stop it.

Startup looks like this:

```js
const dbPath = path.join(os.homedir(), '.cache', 'mongo-mem', 'practical-project');
await fs.mkdir(dbPath, { recursive: true });
const mongod = await MongoMemoryServer.create({ instance: { dbPath } });
```

The data directory is under `~/.cache`, not `/tmp`, because `/tmp` on this machine is a small tmpfs — a database can outgrow it. `~/.cache` has real disk behind it. The directory is fixed (not a random `mkdtemp` name) because the task specifies it, and it is deleted at the end of every run, so a fixed path is safe: no stale lock file survives to collide with the next run. On a fresh machine the first `create()` downloads the binary (~120MB) and prints progress lines; later runs find it in the cache and start in seconds.

### 4.2 The driver connection

```js
const client = new MongoClient(mongod.getUri());
await client.connect();
const tasks = client.db('capstone').collection('tasks');
```

`MongoClient` holds a connection pool (topic 03). `connect()` opens the pool; `db('capstone')` selects the database (created on first write, topic 05); `collection('tasks')` selects the collection. Nothing here is new — the capstone reuses the exact three lines from the earlier topics. That is the point: the connection code you learned in topic 05 is the same code a finished project uses.

### 4.3 Express 5 and the request pipeline

A request to `PATCH /tasks/000000000000000000000004` travels through the app in registration order:

1. `express.json()` parses the JSON body into `req.body`. A body that is not valid JSON is rejected here, before any route sees it.
2. The router matches `PATCH` + `/tasks/:id` and captures `req.params.id`.
3. `validateTaskBody({ partial: true })` checks the body. If it is bad, it calls `next(error)` and the handler never runs.
4. The handler calls `parseId(req)` (400 if malformed), builds the `$set` update, and calls `findOneAndUpdate` with `{ returnDocument: 'after' }`.
5. The driver sends the update to `mongod`, which applies `$set` and returns the updated document.
6. The handler maps it through `publicTask` and sends `200` with JSON.
7. If anything threw, the central error handler (registered last) sends the error JSON instead.

`findOneAndUpdate` with `returnDocument: 'after'` is doing two jobs atomically: update and read. The alternative — `updateOne` then `findOne` — has a race: another request could change the document between the two calls. One round trip, one answer, no race.

### 4.4 Why `listen(0)` and `fetch` in the same file

`app.listen(0, '127.0.0.1')` asks the OS for any free port, so the example never collides with another server on the machine. `server.address().port` reads back the port the OS chose — the only place the port number exists, and it is never printed. The self-test then calls the API over real HTTP with the global `fetch`, exactly as a client would. That matters: testing through HTTP exercises the JSON parsing, the routing, the middleware, and the error handler — the whole stack — not just the database calls. A test that calls the handler functions directly would miss a broken route.

### 4.5 What the driver does per route

| Route | Driver call | What MongoDB does |
| --- | --- | --- |
| `GET /tasks` | `find().sort({ _id: 1 }).toArray()` | Scans the collection, sorts by `_id`, returns all documents |
| `GET /tasks/:id` | `findOne({ _id })` | Looks up one document by its primary key |
| `POST /tasks` | `insertOne(doc)` | Inserts the document; fails on a duplicate `_id` |
| `PATCH /tasks/:id` | `findOneAndUpdate({ _id }, { $set }, { returnDocument: 'after' })` | Updates and returns the document in one step |
| `DELETE /tasks/:id` | `deleteOne({ _id })` | Deletes the document; `deletedCount` tells you if it existed |

Every query filters on `_id`, which is always indexed (topic 10) — the primary key index exists by default. That is why the capstone does not need a custom index: three tasks looked up by `_id` will never be slow.

## 5. Architecture or Workflow

### 5.1 The request/response flow

```text
Client (fetch / curl / browser)
        │  HTTP request (method + path + JSON body)
        ▼
Express app
        │
        ├─► express.json()            parse the body
        │
        ├─► validateTaskBody()        400 with field errors if invalid
        │
        ├─► route handler             parseId() → 400 if malformed
        │        │
        │        ▼
        │   MongoDB driver (find / findOne / insertOne /
        │   findOneAndUpdate / deleteOne)
        │        │
        │        ▼
        │   mongod (in-memory server, data under ~/.cache)
        │        │
        │        ▼
        │   publicTask()              whitelist the four fields
        │
        └─► JSON response (200 / 201 / 400 / 404)
                │
                ▼
        central error handler (any throw → same JSON error shape)
```

The flow is a straight line with two exits: validation can stop a request before the handler, and any error anywhere jumps to the error handler. No branch skips validation, and no route talks to the database without going through `parseId` first.

### 5.2 The lifecycle of one run

```text
mkdir ~/.cache/mongo-mem/practical-project
        │
        ▼
MongoMemoryServer.create()      start real mongod (download once on a fresh machine)
        │
        ▼
MongoClient.connect()           open the connection pool
        │
        ▼
insertMany(seed)                3 tasks, fixed _ids ...0001–...0003
        │
        ▼
app.listen(0)                   ephemeral port, never printed
        │
        ▼
9 × fetch self-test             GET, POST, POST-invalid, GET, PATCH,
                                GET-bad-id, GET-missing, DELETE, GET
        │
        ▼
server.close() → client.close() → mongod.stop() → rm -rf dbPath
        │
        ▼
process exits 0, nothing left behind
```

### 5.3 The file, section by section

```text
examples/tasks-api.mjs
├── header comment + §1 server/seed   MongoMemoryServer, MongoClient, insertMany
├── §2 helpers                        publicTask, PRIORITIES, parseId, validateTaskBody
├── §3 Express app                    express.json, 5 routes, central error handler
└── §4 self-test + §5 cleanup         listen(0), 9 fetch calls, close/stop/delete
```

When this grows into a real project, §2 splits into `middleware/validate.mjs` and `utils/tasks.mjs`, §3 splits into `routes/tasks.mjs` and `app.mjs`, and §1 splits into `db.mjs` plus a standalone `seed.mjs`. The sections — not the file — are the architecture.

## 6. Real-World Examples

**A todo app (the capstone itself).** The tasks API is a real product in miniature: Todoist, Microsoft To Do, and Google Tasks all store the same four fields — a title, a done flag, and a priority — behind the same five routes. The difference between this file and a shipped todo backend is scale (auth, users, sharing, sync), not shape.

**Q-less (the semester project idea).** Queue tokens are tasks with different fields: `{ office, status, position }` instead of `{ title, done, priority }`. The routes are identical — list tokens, read one, create one, update its status, delete it — and the validation is the same pattern with different field rules. If you can build the tasks API, you can build the Q-less backend by changing the field names.

**A blog CMS.** Posts are documents (`{ title, body, published }`), and the admin panel calls the same five routes. The validation middleware checks that `title` is non-empty and `published` is a boolean — the same code as the tasks validator with different strings. An inventory service is the same again: products (`{ name, price, stock }`) with one new rule, that `price` is positive and `stock` is a non-negative integer — one more `if` in the validator, not a new architecture.

**What changes at real scale.** Three things, and only three: (1) authentication — who is calling, and are they allowed to touch this task (Phase 04); (2) ownership — tasks belong to a user, so every query gains a `userId` filter; (3) persistence and deployment — a real MongoDB Atlas cluster instead of an in-memory server, and the seed becomes a migration. The routes, the validation, and the error handler stay exactly as they are.

## 7. Code Examples Where Applicable

### 7.1 The whole example, annotated

The full file is `examples/tasks-api.mjs`. The fragments below are the load-bearing parts.

**Seeding with fixed ids:**

```js
await tasks.insertMany([
  { _id: new ObjectId('000000000000000000000001'), title: 'Learn MongoDB basics', done: false, priority: 'high' },
  { _id: new ObjectId('000000000000000000000002'), title: 'Build the tasks API', done: false, priority: 'medium' },
  { _id: new ObjectId('000000000000000000000003'), title: 'Write notes for the capstone', done: true, priority: 'low' },
]);
```

**The validation middleware factory:**

```js
function validateTaskBody({ partial = false } = {}) {
  return (req, res, next) => {
    const errors = {};
    const body = req.body ?? {};
    if (body.title !== undefined || !partial) {
      if (typeof body.title !== 'string' || body.title.trim() === '') {
        errors.title = 'Title is required and must be a non-empty string.';
      }
    }
    if (body.done !== undefined && typeof body.done !== 'boolean') {
      errors.done = 'Must be a boolean.';
    }
    if (body.priority !== undefined && !PRIORITIES.includes(body.priority)) {
      errors.priority = 'Must be one of: low, medium, high.';
    }
    if (Object.keys(errors).length > 0) {
      const error = new Error('Validation failed.');
      error.status = 400;
      error.errors = errors;
      return next(error);
    }
    next();
  };
}
```

**A route with id parsing and a 404:**

```js
app.get('/tasks/:id', async (req, res, next) => {
  try {
    const doc = await tasks.findOne({ _id: parseId(req) });
    if (!doc) {
      const error = new Error('Task not found.');
      error.status = 404;
      throw error;
    }
    res.json(publicTask(doc));
  } catch (error) {
    next(error);
  }
});
```

**The self-test step helper:**

```js
async function step(method, urlPath, body) {
  const response = await fetch(`http://127.0.0.1:${port}${urlPath}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  console.log(`${method} ${urlPath} -> ${response.status} ${JSON.stringify(data)}`);
}
```

### 7.2 Running it and reading the output

```bash
NODE_PATH=/tmp/mongo-verify/node_modules:/tmp/express-verify/node_modules node examples/tasks-api.mjs
```

Expected output (saved in `examples/example.txt`):

```text
GET /tasks -> 200 [{"_id":"000000000000000000000001","title":"Learn MongoDB basics","done":false,"priority":"high"}, ...]
POST /tasks -> 201 {"_id":"000000000000000000000004","title":"Review the capstone notes","done":false,"priority":"medium"}
POST /tasks -> 400 {"error":"Validation failed.","errors":{"title":"Title is required and must be a non-empty string."}}
GET /tasks/000000000000000000000004 -> 200 {"_id":"000000000000000000000004","title":"Review the capstone notes","done":false,"priority":"medium"}
PATCH /tasks/000000000000000000000004 -> 200 {"_id":"000000000000000000000004","title":"Review the capstone notes","done":true,"priority":"medium"}
GET /tasks/not-an-id -> 400 {"error":"Invalid task id: must be a 24-character hex string."}
GET /tasks/000000000000000000000099 -> 404 {"error":"Task not found."}
DELETE /tasks/000000000000000000000004 -> 200 {"deleted":true}
GET /tasks -> 200 [{"_id":"000000000000000000000001", ...}, ...]
```

Read the nine lines as a story: the list starts with three tasks, a fourth is created, a bad create is rejected, the fourth is read and then marked done, a garbage id and a missing id are rejected differently, the fourth is deleted, and the list is back to the original three. The final `GET` proving the list is unchanged is the most important line — it shows the delete really worked and nothing else leaked.

## 8. Step-by-Step Code Explanations

### 8.1 Section 1 — start the server and seed (lines 1–45 of the example)

1. `import { MongoMemoryServer } from 'mongodb-memory-server'` — the in-memory server. It resolves as a plain ESM import from `~/workspace/node_modules`.
2. `import { MongoClient, ObjectId } from 'mongodb'` — the native driver.
3. `createRequire` + `require('express')` — Express 5 is installed only under `/tmp/express-verify/node_modules`, and ESM `import` ignores `NODE_PATH`, so `createRequire` is used: it honours `NODE_PATH` and is the verified way to load Express here. Run the file with `NODE_PATH` set (see §7.2) or this line throws `Cannot find module 'express'`.
4. `dbPath` is `~/.cache/mongo-mem/practical-project`, created with `mkdir(..., { recursive: true })`. Off `/tmp` because `/tmp` is a small tmpfs; under `~/.cache` because that is real disk.
5. `MongoMemoryServer.create({ instance: { dbPath } })` starts a real `mongod`. First run on a fresh machine downloads the binary (~120MB) with progress lines; later runs use the cache.
6. `new MongoClient(mongod.getUri())` + `await client.connect()` opens the pool, and `client.db('capstone').collection('tasks')` selects the collection.
7. `insertMany` seeds three tasks with fixed ObjectIds. No timestamps anywhere — deterministic output depends on it.

### 8.2 Section 2 — helpers (validation, ids, public shape)

1. `publicTask(doc)` whitelists the four fields and converts `_id` to a hex string. Every route returns its result through this function, so no internal field can ever leak.
2. `PRIORITIES = ['low', 'medium', 'high']` is the enum in one place. The validator and any future code read the same list, so they cannot drift apart.
3. `parseId(req)` checks `ObjectId.isValid(req.params.id)`. Invalid → throw an error with `status = 400`. Valid → return `new ObjectId(...)`. Every `:id` route calls it first, before any database call.
4. `validateTaskBody({ partial })` returns the middleware. `partial: false` (POST) requires `title`; `partial: true` (PATCH) checks only the fields present. Errors accumulate in one `errors` object; if it is non-empty, a `400` error carrying `errors` goes to `next(error)`, otherwise `next()` lets the handler run.

### 8.3 Section 3 — the Express app

1. `app.use(express.json())` — parses JSON bodies. Without it, `req.body` is `undefined` and every `POST` fails validation.
2. `GET /tasks` — `find().sort({ _id: 1 }).toArray()`, mapped through `publicTask`. The sort makes the order stable.
3. `GET /tasks/:id` — `parseId`, then `findOne`. `null` → `404` error. Found → `200` with the public task.
4. `POST /tasks` — validation middleware first, then the handler builds the document: client `_id` if supplied (already validated), otherwise a fresh `ObjectId`; `title.trim()`; `done ?? false`; `priority ?? 'medium'`. `insertOne`, then `201` with the created task.
5. `PATCH /tasks/:id` — partial validation, then build `updates` from the fields present. Empty `updates` → `400` ("nothing to update"). `findOneAndUpdate` with `$set` and `returnDocument: 'after'`; `null` → `404`; otherwise `200` with the updated task.
6. `DELETE /tasks/:id` — `deleteOne`; `deletedCount === 0` → `404`; otherwise `200 { deleted: true }`.
7. The central error handler, registered after all routes: `status = error.status ?? 500`, body `{ error }` plus `errors` when present. Four arguments (`error, req, res, next`) is what tells Express this is an error handler — a three-argument function in the same place would be treated as ordinary middleware and never receive errors.

### 8.4 Section 4 — listen and self-test

1. `app.listen(0, '127.0.0.1')` inside a `Promise` — port `0` means "pick a free port". The promise resolves with the server so the code can read `server.address().port`.
2. `step(method, path, body)` does one `fetch`, reads the JSON, and prints `METHOD /path -> STATUS {json}` — one line, always the same format, which is what makes the output diffable.
3. The nine steps run in a fixed order that tells a story (see §7.2): list → create → bad create → read → patch → bad id → missing id → delete → list again. The order matters: step 4 only works because step 2 created `...0004`, and step 9 only proves the delete because step 1 showed the original list.

### 8.5 Section 5 — cleanup

1. `server.close()` — stop accepting HTTP requests (wrapped in a promise because it is callback-based).
2. `client.close()` — release the driver connection pool.
3. `mongod.stop()` — shut down the `mongod` process.
4. `fs.rm(dbPath, { recursive: true, force: true })` — delete the data directory, so the next run starts from an empty database and leaves nothing behind. Skip any step and the process either hangs (open server/client keeps the event loop alive) or leaves state behind (a stale data directory breaks the "fixed seed" assumption).

## 9. Common Misconceptions

**"A capstone means a big project."**
No — a capstone means a *complete* project. One file, five routes, and a self-test proves the integration. A thousand-line project that does not run proves nothing. Grow the project after it works, not before.

**"Validation should live in the route handler, next to the database call."**
It can, but then every handler repeats it, and sooner or later one handler forgets. Middleware runs before the handler, so the handler only ever sees clean input — and the same validator serves `POST` and `PATCH` with one flag flip.

**"400 and 404 are interchangeable — both mean 'something went wrong'."**
They are not. `400` means the *request* is wrong (malformed id, missing title) and the client must change what it sends. `404` means the request is fine but the *resource* is not there. A client that retries a `400` with the same body will fail forever; a client that gets a `404` knows the id is valid and the task is simply gone. Mixing them up breaks every client that handles errors properly.

**"If the id is not a valid ObjectId, MongoDB will return 404 anyway."**
It will not — it will throw. `new ObjectId('not-an-id')` throws a `BSONError` before any query runs, and without the `parseId` guard that throw becomes a `500`. A `500` for a bad id tells the client the *server* broke, which is a lie: the client sent garbage. Validate first, query second.

**"PATCH and PUT are the same thing."**
They are not. `PATCH` changes the fields you send; `PUT` replaces the whole document. Sending `{ done: true }` as a `PUT` would (by convention) delete `title` and `priority`. This API uses `PATCH` with `$set` precisely so a partial update cannot erase fields.

**"The error handler catches everything, so handlers don't need try/catch."**
In Express 5, an `async` route handler that rejects *does* forward the rejection to the error handler automatically — but the example still wraps handlers in `try/catch` and calls `next(error)` explicitly. Explicit is better here: the thrown `404` errors are created inside the handler, and routing them through `next(error)` makes the flow visible instead of relying on framework magic. Note this was *not* true in Express 4, where an unhandled rejection would crash the process — a common surprise when reading old tutorials.

**"An in-memory server means the data is fake."**
No. `mongodb-memory-server` runs a real `mongod` binary. The queries, the indexes, the ObjectIds, and the errors are all real. The only fake part is the lifetime: the data vanishes when the process ends. That is a feature for learning, not a limitation of the test.

**"I should add `createdAt` — every real app has timestamps."**
Real apps do, and you should add them in your own project. This example leaves them out on purpose: a timestamp changes on every run, so `example.txt` could never match a fresh run. When you add timestamps, strip them from printed output (see `publicTask` — that is what the whitelist is for).

**"Accepting a client-supplied `_id` is normal API design."**
It is a deliberate shortcut for determinism, not a recommendation. In production, letting clients choose ids invites collisions and enumeration (guessing ids to read other people's tasks — which is also why this API needs auth, Phase 04). Here it lets the self-test create `...0004` and address it by a known id.

## 10. Important Technical Terminology

| Term | Meaning |
| --- | --- |
| Capstone project | A small complete project at the end of a module, combining its topics |
| CRUD | Create, Read, Update, Delete — the four operations on a resource |
| Route | A method + URL pattern + handler, e.g. `GET /tasks/:id` |
| Route parameter | The `:id` part of a path; Express puts it in `req.params.id` |
| Validation middleware | Middleware that checks `req.body` and rejects bad input with `400` |
| Central error handler | One four-argument middleware, registered last, that formats all errors |
| `400 Bad Request` | The request itself is malformed (bad field, malformed id) |
| `404 Not Found` | The request is valid, but no such resource exists |
| `201 Created` | The success status for a `POST` that created a resource |
| ObjectId | MongoDB's 12-byte primary key, printed as a 24-character hex string |
| `ObjectId.isValid()` | Driver check that a string can be an ObjectId |
| Seed / seeding | Inserting known starting data into an empty collection |
| Ephemeral port | Port `0` in `listen()` — the OS picks a free port |
| `findOneAndUpdate` | Atomic update-and-read; `returnDocument: 'after'` returns the new version |
| `$set` | Update operator that changes only the named fields |
| `publicTask` | Whitelist helper: the four fields a client is allowed to see |
| Deterministic output | Output that is byte-identical on every run |
| `mongodb-memory-server` | Runs a real `mongod` binary in memory for development and tests |
| `createRequire` | Node helper that loads CommonJS modules (Express) from ESM code |
| `NODE_PATH` | Environment variable adding directories to `require()` resolution |
| Self-test | Code in the same file that calls its own API with `fetch` and prints results |

## 11. Summary

- A capstone is not a new topic — it is topics 01–13 (plus Module 02's Express patterns) assembled into one working thing: a tasks API with five routes.
- The project has five sections: start + seed, helpers, app, self-test, cleanup. When it grows, the sections become files; the sections themselves do not change.
- A task is `{ _id, title, done, priority }` — four fields, one required, one enum, no timestamps, so the output is deterministic.
- Validation is middleware, before the handler: `POST` requires the full body, `PATCH` checks only the fields sent, and all field errors are reported at once with `400`.
- Every error flows to one central error handler, so the client always gets `{ error }` (plus `errors` for validation) and a `500` never leaks a stack trace.
- ObjectIds are validated before use: malformed id → `400`, well-formed id with no document → `404`. Never confuse the two.
- The example is self-testing: nine `fetch` calls over real HTTP on an ephemeral port, one printed line each, and the final `GET /tasks` proves the delete worked and the list is back to the seed.
- Output is deterministic by design: fixed ObjectIds, no timestamps, the port is never printed — verify it with `diff`.
- What is missing is named, not hidden: authentication (Phase 04), the Mongoose version (an exercise in this topic), and real persistence (a later phase).

## 12. Interview Questions and Answers

**Q1. Walk me through how you would structure a small Express + MongoDB API.**
A: One section per concern: start the database and seed it; helpers (validation, id parsing, public shape); the Express app with its routes; a self-test; and cleanup. When it grows, each section becomes a file — `routes/`, `middleware/`, `db/` — but the sections stay the same.

**Q2. Why is validation middleware instead of code inside each route handler?**
A: So it runs before the handler and cannot be forgotten by one route. The handler then only ever sees clean input, and one validator serves both `POST` (full body) and `PATCH` (partial body) with a flag. It also keeps database code free of input-checking clutter.

**Q3. What is the difference between a 400 and a 404, and when do you return each?**
A: `400` means the request itself is wrong — a missing `title`, a `priority` of `"urgent"`, an id that is not a 24-character hex string. `404` means the request is valid but the resource does not exist — a well-formed id with no matching task. A `400` tells the client to fix what it sends; a `404` tells it the thing is gone.

**Q4. How do you validate an ObjectId from the URL, and what happens if you don't?**
A: Check `ObjectId.isValid(req.params.id)` before using it; invalid → `400`. Without the check, `new ObjectId('not-an-id')` throws a `BSONError`, which becomes a `500` — blaming the server for the client's bad input.

**Q5. Why use PATCH instead of PUT for updating a task?**
A: `PATCH` updates only the fields sent (implemented with `$set`), so `{ done: true }` leaves `title` and `priority` untouched. `PUT` conventionally replaces the whole document, so a partial `PUT` body would erase the fields it does not mention.

**Q6. What does the central error handler do, and why must it be registered last?**
A: It is a four-argument middleware (`err, req, res, next`) that turns every error into the same JSON shape — `{ error }`, plus `errors` for validation failures — and never leaks a stack trace on a `500`. It must be last because Express only sends it errors from middleware registered before it.

**Q7. Why does `GET /tasks` sort by `{ _id: 1 }`?**
A: Because an unsorted `find()` makes no ordering promise, and the printed list would be unstable. ObjectIds are roughly time-ordered, so sorting by `_id` gives creation order and a stable, deterministic output.

**Q8. What is `findOneAndUpdate` with `returnDocument: 'after'`, and why not `updateOne` + `findOne`?**
A: It updates and returns the new document in one atomic operation. `updateOne` followed by `findOne` has a race — another request could change the document between the two calls — and costs two round trips.

**Q9. Why does the example use an in-memory MongoDB server, and is the data "fake"?**
A: So it runs anywhere with no installation: `mongodb-memory-server` downloads a real `mongod` binary once and starts a real server. The queries, indexes, and errors are all real — only the lifetime is temporary, which is exactly what a self-testing example wants.

**Q10. Why does the example listen on port 0, and why is the port never printed?**
A: Port `0` asks the OS for any free port, so the example never collides with another server. The port is different on every run, so printing it would make the output non-deterministic. The code reads it from `server.address().port` and uses it for `fetch` without ever printing it.

**Q11. Why are there no `createdAt` / `updatedAt` fields in this project?**
A: Timestamps change on every run, so the saved `example.txt` could never match a fresh run. The example trades one realistic field for deterministic, diffable output. In a real project you would add them — and strip them from printed output via the `publicTask` whitelist.

**Q12. This API has no authentication. Is that a bug?**
A: It is a deliberate, named gap: anyone who can reach the server can delete every task. Authentication and authorization are Phase 04, and the capstone is the "before" picture that makes Phase 04's value obvious. Shipping this to real users without auth would be a bug; using it to learn the CRUD shape is not.

## 13. References

- MongoDB manual — CRUD operations — https://www.mongodb.com/docs/manual/crud/
- MongoDB manual — `db.collection.findOneAndUpdate()` — https://www.mongodb.com/docs/manual/reference/method/db.collection.findOneAndUpdate/
- MongoDB Node.js driver — https://www.mongodb.com/docs/drivers/node/current/
- MongoDB Node.js driver — `ObjectId` — https://www.mongodb.com/docs/drivers/node/current/fundamentals/data-formats/
- mongodb-memory-server — https://github.com/nodkz/mongodb-memory-server
- Express 5.x API — Routing — https://expressjs.com/en/5x/api.html#router
- Express 5.x guide — Error handling — https://expressjs.com/en/guide/error-handling.html
- Express 5.x guide — Writing middleware — https://expressjs.com/en/guide/writing-middleware.html
- MDN — HTTP response status codes — https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status
- Node.js — `createRequire` — https://nodejs.org/api/module.html#modulecreaterequirefilename

---

## Files in This Folder

| File | What it is |
| --- | --- |
| [README.md](./README.md) | Short overview: objectives, topics, how to run the example |
| [notes.md](./notes.md) | This file — full detailed notes with interview questions and answers |
| [examples/tasks-api.mjs](./examples/tasks-api.mjs) | The whole capstone: memory server, seed, Express app, self-test, cleanup |
| [examples/example.txt](./examples/example.txt) | Expected output of `tasks-api.mjs` — verify with `diff` after running it |
| [exercises.md](./exercises.md) | 5 practice tasks, no solutions, plus interview-style questions |

---

[← Module 03 README](../README.md) · [Previous: 13 — Mongoose](../13-mongoose/README.md) · Next: Phase 04 — Authentication and Authorization *(coming next — folder not created yet)*

// 14 — Practical Project: a complete small tasks API.
//
// Everything from topics 01-13 in one runnable file:
//   - an in-memory MongoDB server (mongodb-memory-server, topic 04)
//   - the native driver (topics 05-07, 10) talking to a `tasks` collection
//   - an Express 5 server (Module 02) with validation middleware (Module 02,
//     topic 09) and a central error handler (Module 02, topic 08)
//   - ObjectId validation: 400 on a malformed id, 404 on a missing task
//
// Run from this topic's folder:
//   NODE_PATH=/tmp/mongo-verify/node_modules:/tmp/express-verify/node_modules \
//     node examples/tasks-api.mjs
//
// Express 5 lives only under /tmp/express-verify/node_modules, and ESM
// `import` ignores NODE_PATH, so Express is loaded with createRequire,
// which honours NODE_PATH. The mongodb driver and mongodb-memory-server
// resolve as plain ESM imports from ~/workspace/node_modules.
//
// Output is deterministic on every run: fixed ObjectIds, no timestamps,
// and the ephemeral listen port is never printed. On a fresh machine the
// first run downloads the mongod binary once (~120MB) and prints progress
// lines; later runs start from the cache and are fast.
//
// The data directory is under ~/.cache (not /tmp, which is a small tmpfs)
// and is deleted at the end, so re-runs are identical and leave nothing
// behind.

import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, ObjectId } from 'mongodb';
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const express = require('express');

// ---------------------------------------------------------------------------
// 1. Start the in-memory server and seed the collection
// ---------------------------------------------------------------------------

const dbPath = path.join(os.homedir(), '.cache', 'mongo-mem', 'practical-project');
await fs.mkdir(dbPath, { recursive: true });
const mongod = await MongoMemoryServer.create({ instance: { dbPath } });

const client = new MongoClient(mongod.getUri());
await client.connect();
const tasks = client.db('capstone').collection('tasks');

// Fixed ObjectIds, so the output is identical on every run.
// No createdAt/updatedAt fields: nothing time-dependent is ever printed.
await tasks.insertMany([
  { _id: new ObjectId('000000000000000000000001'), title: 'Learn MongoDB basics', done: false, priority: 'high' },
  { _id: new ObjectId('000000000000000000000002'), title: 'Build the tasks API', done: false, priority: 'medium' },
  { _id: new ObjectId('000000000000000000000003'), title: 'Write notes for the capstone', done: true, priority: 'low' },
]);

// ---------------------------------------------------------------------------
// 2. Helpers: public shape, id parsing, validation
// ---------------------------------------------------------------------------

// Only the deterministic fields ever leave the server. The stored document
// has no other fields, but this whitelist is what makes the output stable
// even if a field is added later.
const publicTask = (doc) => ({
  _id: doc._id.toHexString(),
  title: doc.title,
  done: doc.done,
  priority: doc.priority,
});

const PRIORITIES = ['low', 'medium', 'high'];

// Turns ":id" into an ObjectId, or raises a 400 error for a malformed id.
function parseId(req) {
  if (!ObjectId.isValid(req.params.id)) {
    const error = new Error('Invalid task id: must be a 24-character hex string.');
    error.status = 400;
    throw error;
  }
  return new ObjectId(req.params.id);
}

// Validation middleware (Module 02, topic 09). For POST the whole body is
// required; for PATCH only the fields actually sent are checked
// (`partial: true`). Failures are 400 with one message per bad field.
function validateTaskBody({ partial = false } = {}) {
  return (req, res, next) => {
    const errors = {};
    const body = req.body ?? {};

    if (body._id !== undefined && !ObjectId.isValid(body._id)) {
      errors._id = 'Must be a 24-character hex string.';
    }
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

// ---------------------------------------------------------------------------
// 3. Express app: the five routes
// ---------------------------------------------------------------------------

const app = express();
app.use(express.json());

// GET /tasks — every task, in _id order.
app.get('/tasks', async (req, res, next) => {
  try {
    const docs = await tasks.find().sort({ _id: 1 }).toArray();
    res.json(docs.map(publicTask));
  } catch (error) {
    next(error);
  }
});

// GET /tasks/:id — one task; 400 on a malformed id, 404 when it is missing.
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

// POST /tasks — create a task. A client-supplied _id is accepted (it must
// be a valid ObjectId string); otherwise MongoDB generates one.
app.post('/tasks', validateTaskBody(), async (req, res, next) => {
  try {
    const doc = {
      _id: req.body._id ? new ObjectId(req.body._id) : new ObjectId(),
      title: req.body.title.trim(),
      done: req.body.done ?? false,
      priority: req.body.priority ?? 'medium',
    };
    await tasks.insertOne(doc);
    res.status(201).json(publicTask(doc));
  } catch (error) {
    next(error);
  }
});

// PATCH /tasks/:id — update only the fields sent; at least one is required.
app.patch('/tasks/:id', validateTaskBody({ partial: true }), async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.title !== undefined) updates.title = req.body.title.trim();
    if (req.body.done !== undefined) updates.done = req.body.done;
    if (req.body.priority !== undefined) updates.priority = req.body.priority;
    if (Object.keys(updates).length === 0) {
      const error = new Error('Nothing to update: send at least one of title, done, priority.');
      error.status = 400;
      throw error;
    }
    const doc = await tasks.findOneAndUpdate(
      { _id: parseId(req) },
      { $set: updates },
      { returnDocument: 'after' },
    );
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

// DELETE /tasks/:id — remove a task; 404 when it is already gone.
app.delete('/tasks/:id', async (req, res, next) => {
  try {
    const result = await tasks.deleteOne({ _id: parseId(req) });
    if (result.deletedCount === 0) {
      const error = new Error('Task not found.');
      error.status = 404;
      throw error;
    }
    res.json({ deleted: true });
  } catch (error) {
    next(error);
  }
});

// Central error handler (Module 02, topic 08): every error in the app ends
// up here, so the client always gets the same JSON shape and a 500 never
// leaks a stack trace.
app.use((error, req, res, next) => {
  const status = error.status ?? 500;
  const body = { error: error.message ?? 'Internal server error.' };
  if (error.errors) body.errors = error.errors;
  res.status(status).json(body);
});

// ---------------------------------------------------------------------------
// 4. Listen on an ephemeral port (never printed) and self-test with fetch
// ---------------------------------------------------------------------------

const server = await new Promise((resolve) => {
  const s = app.listen(0, '127.0.0.1', () => resolve(s));
});
const port = server.address().port;

async function step(method, urlPath, body) {
  const response = await fetch(`http://127.0.0.1:${port}${urlPath}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  console.log(`${method} ${urlPath} -> ${response.status} ${JSON.stringify(data)}`);
}

// 1. The seeded list
await step('GET', '/tasks');
// 2. Create a task (client-supplied _id, so the output is deterministic)
await step('POST', '/tasks', { _id: '000000000000000000000004', title: 'Review the capstone notes', done: false, priority: 'medium' });
// 3. Create with a missing title -> 400 with field errors
await step('POST', '/tasks', { done: false, priority: 'low' });
// 4. Read the task just created
await step('GET', '/tasks/000000000000000000000004');
// 5. Mark it done
await step('PATCH', '/tasks/000000000000000000000004', { done: true });
// 6. Malformed id -> 400
await step('GET', '/tasks/not-an-id');
// 7. Well-formed id, no such task -> 404
await step('GET', '/tasks/000000000000000000000099');
// 8. Delete the created task
await step('DELETE', '/tasks/000000000000000000000004');
// 9. The final list — back to the three seeded tasks
await step('GET', '/tasks');

// ---------------------------------------------------------------------------
// 5. Clean up: close everything, stop the server, remove the data directory
// ---------------------------------------------------------------------------

await new Promise((resolve) => server.close(resolve));
await client.close();
await mongod.stop();
await fs.rm(dbPath, { recursive: true, force: true });

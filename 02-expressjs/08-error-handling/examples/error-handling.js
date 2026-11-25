// 08 — Error Handling: sync vs async errors, next(err), and ONE central handler.
// Run: NODE_PATH=/tmp/express-verify/node_modules node examples/error-handling.js
// Express 5.3.0, Node.js v24.22.1
// NOTE: Express 5 forwards rejected promises from async handlers to the
// error middleware automatically. Express 4 did NOT — there you needed
// try/catch or a wrapper in every async handler.
process.env.NODE_ENV = 'production'; // stack traces are never sent in production

const express = require('express');
const app = express();
app.use(express.json());

// Custom error classes: every error we throw carries its own HTTP status.
class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
class NotFoundError extends AppError {
  constructor(what) {
    super(404, `${what} not found`);
  }
}

const users = [{ id: 1, name: 'Talha' }];

// 1. A SYNC error: a plain throw inside a sync handler.
app.get('/sync-error', (req, res) => {
  throw new Error('Something broke while handling this request');
});

// 2. An ASYNC error: a rejected promise. Express 5 catches it for us —
//    no try/catch needed here. (In Express 4 this would crash the process.)
app.get('/async-error', async (req, res) => {
  await Promise.reject(new AppError(503, 'The database is unavailable'));
});

// 3. A "not found" from our own code: throw a custom error, not a 500.
app.get('/users/:id', (req, res) => {
  const user = users.find((u) => u.id === Number(req.params.id));
  if (!user) throw new NotFoundError('User');
  res.json(user);
});

app.get('/ok', (req, res) => res.json({ message: 'All good' }));

// 4. A 404 for routes that do not exist at all (no matching route).
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.path}`));
});

// 5. CENTRAL error-handling middleware — the ONLY place errors are answered.
//    Four arguments (err, req, res, next) is what makes Express treat it
//    as an error handler. It must be registered LAST.
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const body = { error: err.message || 'Internal server error' };
  // Stack traces go to the server log, never to the client.
  if (process.env.NODE_ENV !== 'production') body.stack = err.stack;
  console.error(`[error] ${status} ${req.method} ${req.path} — ${err.message}`);
  res.status(status).json(body);
});

// Self-test: start on an ephemeral port, call our own routes, print, exit.
const server = app.listen(0, async () => {
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (label, url) => {
    const res = await fetch(base + url);
    console.log(label, res.status, JSON.stringify(await res.json()));
  };

  await call('GET /ok            ->', '/ok');
  await call('GET /sync-error   ->', '/sync-error');
  await call('GET /async-error  ->', '/async-error');
  await call('GET /users/999    ->', '/users/999');
  await call('GET /no-such-page ->', '/no-such-page');

  server.close(() => process.exit(0));
});

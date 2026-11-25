// 09 — Validation: validate params, query and body with plain JavaScript.
// Run: NODE_PATH=/tmp/express-verify/node_modules node examples/validation.js
// Express 5.3.0, Node.js v24.22.1
// No validation library is installed here on purpose: the pattern below is
// exactly what a library does for you. In a real project the standard
// options are express-validator or zod — same idea, less hand-written code.
const express = require('express');
const app = express();
app.use(express.json());

// A validation middleware: a normal middleware that checks the request
// BEFORE the controller runs. Bad data never reaches the controller.
function validateUserBody(req, res, next) {
  const errors = [];
  const { name, email, age } = req.body;

  if (typeof name !== 'string' || name.trim().length < 2) {
    errors.push({ field: 'name', message: 'name is required and must be at least 2 characters' });
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({ field: 'email', message: 'email must be a valid email address' });
  }
  if (age !== undefined && (!Number.isInteger(age) || age < 13 || age > 120)) {
    errors.push({ field: 'age', message: 'age must be a whole number between 13 and 120' });
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  // Sanitization basics: clean the data before the controller sees it.
  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  next();
}

// Validate a route param: /users/abc must fail before the controller runs.
function validateIdParam(req, res, next) {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(400).json({ errors: [{ field: 'id', message: 'id must be a number' }] });
  }
  next();
}

// Validate query strings: ?page=abc must fail with a clear message.
function validateListQuery(req, res, next) {
  const errors = [];
  const { page, limit } = req.query;
  if (page !== undefined && (!/^\d+$/.test(page) || Number(page) < 1)) {
    errors.push({ field: 'page', message: 'page must be a positive number' });
  }
  if (limit !== undefined && (!/^\d+$/.test(limit) || Number(limit) < 1 || Number(limit) > 100)) {
    errors.push({ field: 'limit', message: 'limit must be a number between 1 and 100' });
  }
  if (errors.length > 0) return res.status(400).json({ errors });
  next();
}

const users = [{ id: 1, name: 'Talha', email: 'talha@example.com' }];

app.get('/users', validateListQuery, (req, res) => res.json(users));
app.get('/users/:id', validateIdParam, (req, res) => {
  const user = users.find((u) => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});
app.post('/users', validateUserBody, (req, res) => {
  const user = { id: users.length + 1, ...req.body };
  users.push(user);
  res.status(201).json(user);
});

// Self-test: start on an ephemeral port, call our own routes, print, exit.
const server = app.listen(0, async () => {
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (label, url, options) => {
    const res = await fetch(base + url, options);
    console.log(label, res.status, JSON.stringify(await res.json()));
  };
  const json = (body) => ({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  await call('POST /users (valid)       ->', '/users', json({ name: '  Ayesha ', email: 'AYESHA@Example.COM', age: 21 }));
  await call('POST /users (no name)     ->', '/users', json({ email: 'a@example.com' }));
  await call('POST /users (bad email)   ->', '/users', json({ name: 'Ali', email: 'not-an-email' }));
  await call('POST /users (age 200)     ->', '/users', json({ name: 'Ali', email: 'ali@example.com', age: 200 }));
  await call('GET  /users/abc           ->', '/users/abc');
  await call('GET  /users?page=abc      ->', '/users?page=abc');
  await call('GET  /users?limit=500     ->', '/users?limit=500');

  server.close(() => process.exit(0));
});

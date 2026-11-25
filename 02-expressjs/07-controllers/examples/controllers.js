// 07 — Controllers: thin routes, controller functions do the work.
// Run: NODE_PATH=/tmp/express-verify/node_modules node examples/controllers.js
// Express 5.3.0, Node.js v24.22.1
const express = require('express');
const { listUsers, getUser, createUser, deleteUser } = require('./userController');

const app = express();
app.use(express.json());

// Thin routes: each route is ONE line that names a controller function.
// No business logic lives here — the route only says WHERE the request goes.
app.get('/users', listUsers);
app.get('/users/:id', getUser);
app.post('/users', createUser);
app.delete('/users/:id', deleteUser);

// Self-test: start on an ephemeral port, call our own routes, print, exit.
const server = app.listen(0, async () => {
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (label, url, options) => {
    const res = await fetch(base + url, options);
    console.log(label, res.status, JSON.stringify(await res.json()));
  };

  await call('GET    /users        ->', '/users');
  await call('POST   /users (new)  ->', '/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Ayesha', email: 'ayesha@example.com' }),
  });
  await call('GET    /users/1      ->', '/users/1');
  await call('GET    /users/999    ->', '/users/999');
  await call('DELETE /users/1      ->', '/users/1', { method: 'DELETE' });
  await call('GET    /users (after)->', '/users');

  server.close(() => process.exit(0));
});

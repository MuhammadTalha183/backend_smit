// hello-express.js — a minimal Express app (Express 5.3.0)
//
// Run from this topic folder with:
//   NODE_PATH=/tmp/express-verify/node_modules node examples/hello-express.js
//
// No `npm install` needed: Express lives only in /tmp/express-verify/node_modules,
// and NODE_PATH tells Node.js to look there. Nothing is installed into this repo.
//
// What it does:
//   1. Creates an Express app with three routes.
//   2. Listens on port 0 — the operating system picks a free (ephemeral) port.
//   3. Calls its own routes with the global fetch() and prints the responses.
//   4. Closes the server and exits — it never hangs.

const express = require('express');

const app = express();

// GET / — the home route.
app.get('/', (req, res) => {
  res.send('Hello from Express!');
});

// GET /hello/:name — a route parameter: the :name part of the URL
// becomes req.params.name. Try /hello/Talha, /hello/World, anything.
app.get('/hello/:name', (req, res) => {
  res.send(`Hello, ${req.params.name}!`);
});

// GET /json — res.json() sends a JSON response and sets the
// Content-Type: application/json header for you.
app.get('/json', (req, res) => {
  res.json({ message: 'Hello from Express!', framework: 'Express', version: 5 });
});

const server = app.listen(0, async () => {
  const port = server.address().port;
  console.log(`Server listening on port ${port}`);

  const base = `http://127.0.0.1:${port}`;

  try {
    const home = await fetch(`${base}/`);
    console.log('GET / ->', await home.text());

    const hello = await fetch(`${base}/hello/Talha`);
    console.log('GET /hello/Talha ->', await hello.text());

    const jsonRes = await fetch(`${base}/json`);
    console.log('GET /json ->', JSON.stringify(await jsonRes.json()));
  } catch (err) {
    console.error('Request failed:', err.message);
    process.exitCode = 1;
  }

  server.close(() => {
    console.log('Server closed.');
    process.exit(process.exitCode || 0);
  });
});

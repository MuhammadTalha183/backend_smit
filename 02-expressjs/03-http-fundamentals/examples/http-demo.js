// 03 — HTTP Fundamentals — http-demo.js
//
// A small Express app that demonstrates the HTTP fundamentals from
// notes.md: methods, status codes, headers, route params, query strings
// and JSON bodies. It listens on port 0 (an ephemeral port picked by the
// operating system), calls its own routes with the global fetch(), logs
// the status code and body of every response, then shuts itself down.
//
// Run it from the topic folder with:
//   NODE_PATH=/tmp/express-verify/node_modules node examples/http-demo.js

const express = require('express');

const app = express();

// Parse JSON request bodies (application/json). Without this line,
// req.body would be undefined on the POST /echo route.
app.use(express.json());

// GET / — the simplest possible route: 200 with plain text.
app.get('/', (req, res) => {
  res.status(200).send('Hello, HTTP!');
});

// POST /echo — creates nothing real, but echoes the JSON body back so
// you can see what the server received. 201 means "created".
app.post('/echo', (req, res) => {
  res.status(201).json(req.body);
});

// GET /users/:id — :id is a route parameter: part of the URL path
// itself, identifying one resource.
app.get('/users/:id', (req, res) => {
  res.status(200).json({ id: req.params.id });
});

// GET /search?q=... — q is a query string parameter: it filters or
// searches, it does not identify a resource.
app.get('/search', (req, res) => {
  res.status(200).json({ q: req.query.q ?? null });
});

// GET /not-found-demo — deliberately answers 404 with a JSON error
// body, the way a real API answers "this resource does not exist".
app.get('/not-found-demo', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// GET /headers — sets a custom response header, and echoes back a
// request header the client sent, so you can see headers in both
// directions.
app.get('/headers', (req, res) => {
  res.set('X-Custom-Header', 'http-fundamentals');
  res.status(200).json({ clientName: req.get('X-Client-Name') ?? null });
});

// Listen on port 0: the OS picks a free port, so this demo never
// clashes with anything else running on your machine.
const server = app.listen(0, async () => {
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;

  // Small helper: fetch a URL, print "METHOD path -> status body".
  async function show(label, response) {
    const body = await response.text();
    console.log(`${label} -> ${response.status} ${body}`);
  }

  try {
    // 1. GET / — 200, plain text.
    await show('GET /', await fetch(`${base}/`));

    // 2. POST /echo — 201, the JSON body comes back unchanged.
    await show(
      'POST /echo',
      await fetch(`${base}/echo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'hello', count: 3 }),
      })
    );

    // 3. GET /users/42 — 200, the route param :id is "42".
    await show('GET /users/42', await fetch(`${base}/users/42`));

    // 4. GET /search?q=express — 200, the query string value is echoed.
    await show('GET /search?q=express', await fetch(`${base}/search?q=express`));

    // 5. GET /not-found-demo — 404, JSON error body.
    await show('GET /not-found-demo', await fetch(`${base}/not-found-demo`));

    // 6. GET /headers — 200, custom response header + echoed request header.
    const headersRes = await fetch(`${base}/headers`, {
      headers: { 'X-Client-Name': 'talha' },
    });
    console.log(
      `GET /headers -> ${headersRes.status} ${await headersRes.text()} (X-Custom-Header: ${headersRes.headers.get('x-custom-header')})`
    );
  } finally {
    // Shut the server down and exit. Without this the process would
    // keep listening forever — a demo must always self-terminate.
    server.close(() => process.exit(0));
  }
});

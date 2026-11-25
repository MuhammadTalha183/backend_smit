// 05 — Request and Response Objects
// Demonstrates: req.params, req.query, req.body (express.json()),
// req.headers, res.status + res.json, res.redirect, res.locals,
// and content negotiation with res.format.
// Run with: NODE_PATH=/tmp/express-verify/node_modules node examples/request-response.js
// The server listens on port 0 (an ephemeral port chosen by the OS),
// calls its own routes with the built-in global fetch, logs the
// responses, then shuts itself down.

const express = require('express');

const app = express();

// Parse JSON request bodies. Without this, req.body is undefined.
// express.json() is built-in middleware: it reads the raw body,
// parses it as JSON, and attaches the result to req.body.
app.use(express.json());

// Small middleware that shares data with later handlers through res.locals.
// res.locals lives only for one request — it is reset for the next request.
app.use((req, res, next) => {
  res.locals.appName = 'Request & Response Demo';
  res.locals.requestTime = new Date().toISOString();
  next();
});

// 1. Route parameters — req.params
// GET /users/42  ->  { "id": "42", "name": "User 42" }
// The :id part of the path is captured into req.params.id (always a string).
app.get('/users/:id', (req, res) => {
  res.status(200).json({ id: req.params.id, name: `User ${req.params.id}` });
});

// 2. Query string — req.query
// GET /search?q=express&limit=2  ->  { "q": "express", "limit": "2", ... }
// Query values are always strings (or arrays for repeated keys).
app.get('/search', (req, res) => {
  const { q = '', limit = '10' } = req.query;
  res.json({
    q,
    limit,
    results: [`Result 1 for "${q}"`, `Result 2 for "${q}"`].slice(0, Number(limit)),
  });
});

// 3. Request body — req.body (needs express.json() above)
// POST /echo  with JSON body { "hello": "world" }
//   ->  201  { "received": { "hello": "world" } }
app.post('/echo', (req, res) => {
  res.status(201).json({ received: req.body });
});

// 4. Request headers — req.headers
// GET /headers  ->  { "userAgent": "node" }  (whatever client sent)
app.get('/headers', (req, res) => {
  res.json({ userAgent: req.headers['user-agent'] || '(none)' });
});

// 5. Redirect — res.redirect
// GET /old  ->  302 Found, Location: /new
app.get('/old', (req, res) => {
  res.redirect('/new');
});

app.get('/new', (req, res) => {
  res.send('You reached the new page');
});

// 6. res.locals — data set by the middleware above, read here
app.get('/locals', (req, res) => {
  res.json({ appName: res.locals.appName, requestTime: res.locals.requestTime });
});

// 7. Content negotiation — res.format
// The same URL returns a different representation depending on the
// Accept header the client sends.
//   Accept: application/json  ->  JSON
//   Accept: text/plain        ->  plain text
//   Anything else             ->  406 Not Acceptable
app.get('/data', (req, res) => {
  res.format({
    'application/json': () => {
      res.json({ message: 'Hello from the JSON version' });
    },
    'text/plain': () => {
      res.send('Hello from the plain-text version');
    },
    default: () => {
      res.status(406).send('Not Acceptable: this route serves JSON or plain text only');
    },
  });
});

// Start on port 0: the OS picks a free ephemeral port, so this demo
// never clashes with another server. Then exercise every route above
// with fetch, print the results, and shut down.
const server = app.listen(0, async () => {
  const { port } = server.address();
  console.log(`Server listening on port ${port}`);

  const base = `http://127.0.0.1:${port}`;

  try {
    // req.params
    let r = await fetch(`${base}/users/42`);
    console.log('GET /users/42 ->', r.status, await r.json());

    // req.query
    r = await fetch(`${base}/search?q=express&limit=2`);
    console.log('GET /search?q=express&limit=2 ->', r.status, await r.json());

    // req.body
    r = await fetch(`${base}/echo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hello: 'world' }),
    });
    console.log('POST /echo ->', r.status, await r.json());

    // req.headers
    r = await fetch(`${base}/headers`, {
      headers: { 'User-Agent': 'request-response-demo/1.0' },
    });
    console.log('GET /headers ->', r.status, await r.json());

    // res.redirect (redirect: 'manual' so fetch does NOT follow it —
    // we want to see the 302 and the Location header itself)
    r = await fetch(`${base}/old`, { redirect: 'manual' });
    console.log('GET /old ->', r.status, 'Location:', r.headers.get('location'));

    // Follow the redirect normally
    r = await fetch(`${base}/new`);
    console.log('GET /new ->', r.status, await r.text());

    // res.locals
    r = await fetch(`${base}/locals`);
    console.log('GET /locals ->', r.status, await r.json());

    // res.format — JSON
    r = await fetch(`${base}/data`, { headers: { Accept: 'application/json' } });
    console.log('GET /data (Accept: application/json) ->', r.status, await r.json());

    // res.format — plain text
    r = await fetch(`${base}/data`, { headers: { Accept: 'text/plain' } });
    console.log('GET /data (Accept: text/plain) ->', r.status, await r.text());

    // res.format — unsupported type
    r = await fetch(`${base}/data`, { headers: { Accept: 'text/html' } });
    console.log('GET /data (Accept: text/html) ->', r.status, await r.text());
  } catch (err) {
    console.error('Demo request failed:', err.message);
  } finally {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  }
});

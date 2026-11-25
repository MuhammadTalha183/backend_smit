// 06 — Middleware: functions that sit between the request and the response.
// Run: NODE_PATH=/tmp/express-verify/node_modules node examples/middleware.js
// Express 5.3.0, Node.js v24.22.1
//
// What this demo shows:
//   1. A custom logger middleware (app.use) that runs for every request.
//   2. A custom auth-style middleware that calls next() or sends 401.
//   3. Built-in middleware: express.json(), express.urlencoded(), express.static().
//   4. Middleware ORDER: a middleware registered AFTER a route never runs for it.
//   5. A 4-argument error-handling middleware at the very end (intro only;
//      full detail is Topic 08 — Error Handling).
//
// The server listens on port 0 (an ephemeral port picked by the OS), calls
// its own routes with the built-in global fetch, prints the responses, then
// shuts itself down. No fixed port, no manual testing needed.

const express = require('express');
const path = require('node:path');

const app = express();

// ---------------------------------------------------------------------------
// 1. Logger middleware — application-level, runs for EVERY request that
//    reaches it, because it is registered first with app.use().
//    A middleware is just a function (req, res, next). Calling next() hands
//    the request to the next function in the stack; forgetting next() hangs
//    the request forever.
// ---------------------------------------------------------------------------
function logger(req, res, next) {
  console.log(`[logger] ${req.method} ${req.url}`);
  next();
}

app.use(logger);

// ---------------------------------------------------------------------------
// 2. Built-in middleware.
//    express.json() parses a JSON body into req.body.
//    express.urlencoded() parses form bodies (key=value&key2=value2).
//    Both only run when the request's Content-Type matches; otherwise they
//    call next() immediately and req.body stays undefined.
// ---------------------------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------------------
// 3. express.static() — serves files from a folder, no route needed.
//    GET /hello.txt is answered from examples/public/hello.txt.
// ---------------------------------------------------------------------------
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------------
// 4. Custom auth-style middleware (route-level here: only /protected uses it).
//    It checks the x-api-key header. Right key -> next(), wrong/missing key
//    -> it ENDS the request with 401 and next() is never called, so the route
//    handler never runs.
// ---------------------------------------------------------------------------
function checkApiKey(req, res, next) {
  if (req.headers['x-api-key'] === 'secret123') {
    console.log('[auth] API key OK, calling next()');
    return next();
  }
  console.log('[auth] Missing or wrong API key, sending 401');
  res.status(401).json({ error: 'Unauthorized: valid x-api-key header required' });
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.get('/', (req, res) => {
  res.send('Hello from Express 5!');
});

// This route is registered BEFORE the "late" middleware below, so the late
// middleware will NOT run for GET /early. That is the order rule in action.
app.get('/early', (req, res) => {
  res.send('early route — the late middleware never ran for me');
});

app.get('/protected', checkApiKey, (req, res) => {
  res.json({ message: 'Welcome, authenticated user!' });
});

app.post('/echo', (req, res) => {
  // req.body exists because express.json() ran earlier in the stack.
  res.json({ youSent: req.body });
});

app.post('/form', (req, res) => {
  // req.body exists because express.urlencoded() ran earlier in the stack.
  res.json({ formData: req.body });
});

// A route that always fails, to show the error-handling middleware.
app.get('/boom', (req, res, next) => {
  next(new Error('Boom! Something went wrong.'));
});

// ---------------------------------------------------------------------------
// 5. Middleware ORDER demo: this middleware is registered AFTER /early and
//    /protected, so it only runs for routes registered after it (/late).
//    A request stops at the FIRST matching route handler that sends a
//    response — code below it never gets a chance.
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
  console.log('[late] I run only for routes registered after me');
  next();
});

app.get('/late', (req, res) => {
  res.send('late route — the late middleware ran for me');
});

// ---------------------------------------------------------------------------
// 6. Error-handling middleware — INTRO ONLY. It has FOUR arguments
//    (err, req, res, next). Express only treats a middleware as an error
//    handler when it has exactly four parameters, and it only runs when
//    next(err) was called (or a handler threw). It MUST be registered last.
//    Full detail: Topic 08 — Error Handling.
// ---------------------------------------------------------------------------
app.use((err, req, res, next) => {
  console.log(`[error] ${err.message}`);
  res.status(500).json({ error: err.message });
});

// ---------------------------------------------------------------------------
// Self-test: start on an ephemeral port, call our own routes, print the
// results, then shut down. Nothing here needs a browser or curl.
// ---------------------------------------------------------------------------
const server = app.listen(0, async () => {
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
  console.log(`[server] listening on port ${port}`);

  const show = async (label, promise) => {
    const res = await promise;
    const body = await res.text();
    console.log(`${label} -> ${res.status} ${body}`);
  };

  try {
    await show('GET  /', fetch(`${base}/`));
    await show('GET  /early', fetch(`${base}/early`));
    await show('GET  /late', fetch(`${base}/late`));
    await show('GET  /hello.txt (static)', fetch(`${base}/hello.txt`));
    await show('GET  /protected (no key)', fetch(`${base}/protected`));
    await show('GET  /protected (key)', fetch(`${base}/protected`, {
      headers: { 'x-api-key': 'secret123' },
    }));
    await show('POST /echo (JSON body)', fetch(`${base}/echo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Talha', role: 'student' }),
    }));
    await show('POST /form (urlencoded body)', fetch(`${base}/form`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'name=Talha&course=backend',
    }));
    await show('GET  /boom (error route)', fetch(`${base}/boom`));
  } finally {
    server.close(() => {
      console.log('[server] closed, exiting');
      process.exit(0);
    });
  }
});

// 04 — Routing: runnable Express 5 demo.
//
// Run with:
//   NODE_PATH=/tmp/express-verify/node_modules node examples/routing.js
//
// The server listens on port 0 (an ephemeral port chosen by the OS), calls
// its own routes with the built-in global fetch(), prints every response,
// then closes itself and exits. No fixed port, no manual curl needed.

const express = require('express');

const app = express();

// express.json() parses JSON request bodies into req.body.
// It is needed for the POST /users route below.
app.use(express.json());

// 1. A plain GET route — the home page.
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Routing demo' });
});

// 2. A route parameter — :id is part of the URL path itself.
//    GET /users/42  ->  req.params.id === '42'
app.get('/users/:id', (req, res) => {
  res.json({ userId: req.params.id });
});

// 3. A query string — everything after the ? in the URL.
//    GET /search?q=express&page=2  ->  req.query = { q: 'express', page: '2' }
app.get('/search', (req, res) => {
  res.json({ q: req.query.q ?? null, page: req.query.page ?? '1' });
});

// 4. POST with a JSON body.
app.post('/users', (req, res) => {
  res.status(201).json({ created: true, name: req.body.name });
});

// 5. app.route() — chain several methods onto ONE path.
//    Both handlers below belong to /items; the path is written once.
const items = [
  { id: 1, name: 'Pen' },
  { id: 2, name: 'Notebook' },
];

app
  .route('/items')
  .get((req, res) => {
    res.json(items);
  })
  .post((req, res) => {
    const item = { id: items.length + 1, name: req.body.name };
    items.push(item);
    res.status(201).json(item);
  });

// 6. express.Router() — a mini-app mounted at /api.
//    Routes defined on the router are relative: '/status' becomes '/api/status'.
const apiRouter = express.Router();

apiRouter.get('/status', (req, res) => {
  res.json({ status: 'ok' });
});

apiRouter.get('/users/:id/posts', (req, res) => {
  res.json({ userId: req.params.id, posts: [] });
});

app.use('/api', apiRouter);

// 7. 404 catch-all — MUST come last, after every real route.
//    app.use() with no path matches any method and any path, so if a request
//    reaches this line, no route above matched it.
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Start on an ephemeral port, exercise the routes, then shut down.
const server = app.listen(0, async () => {
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
  console.log(`Server listening on port ${port}`);

  const show = async (label, url, options) => {
    const res = await fetch(base + url, options);
    console.log(`${label} -> ${res.status} ${await res.text()}`);
  };

  await show('GET /', '/');
  await show('GET /users/42', '/users/42');
  await show('GET /search?q=express&page=2', '/search?q=express&page=2');
  await show('POST /users', '/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Talha' }),
  });
  await show('GET /items', '/items');
  await show('POST /items', '/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Pencil' }),
  });
  await show('GET /items (after POST)', '/items');
  await show('GET /api/status', '/api/status');
  await show('GET /api/users/7/posts', '/api/users/7/posts');
  await show('GET /no-such-route', '/no-such-route');

  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

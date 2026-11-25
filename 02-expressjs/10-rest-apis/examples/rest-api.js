// rest-api.js — one clean REST API for a "posts" resource.
// Puts topics 04-09 together: routing, request/response, middleware,
// controllers, error handling and validation, behind a versioned API.
// Run with: NODE_PATH=/tmp/express-verify/node_modules node examples/rest-api.js
// The server listens on port 0 (ephemeral), calls its own routes with
// fetch, prints the responses, then shuts itself down.

const express = require('express');

const app = express();
app.use(express.json());

// --- In-memory "database" (a real app would use PostgreSQL, Phase 03) ---
let posts = [
  { id: 1, userId: 1, title: 'Hello Node', body: 'My first post', createdAt: '2026-11-01' },
  { id: 2, userId: 1, title: 'Express routing', body: 'Routes are just functions', createdAt: '2026-11-03' },
  { id: 3, userId: 2, title: 'Why REST?', body: 'One contract, many clients', createdAt: '2026-11-05' },
  { id: 4, userId: 2, title: 'Status codes', body: '201 means created, not 200', createdAt: '2026-11-08' },
  { id: 5, userId: 3, title: 'Pagination', body: 'Never return the whole table', createdAt: '2026-11-10' },
];
let nextId = 6;

// --- Response envelope: every success looks the same ---
function ok(res, data, status = 200, meta) {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}
function fail(res, status, message) {
  return res.status(status).json({ success: false, error: { message } });
}

// --- Validation middleware (topic 09) ---
function validatePost(req, res, next) {
  const { title, body } = req.body || {};
  if (typeof title !== 'string' || title.trim() === '') {
    return fail(res, 400, 'title is required and must be a non-empty string');
  }
  if (typeof body !== 'string' || body.trim() === '') {
    return fail(res, 400, 'body is required and must be a non-empty string');
  }
  next();
}

// --- Controllers ---
const router = express.Router();

// GET /api/v1/posts?userId=1&page=1&limit=2&sort=title&search=rest
router.get('/', (req, res) => {
  let result = [...posts];
  if (req.query.userId) result = result.filter((p) => p.userId === Number(req.query.userId));
  if (req.query.search) {
    const q = req.query.search.toLowerCase();
    result = result.filter((p) => p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q));
  }
  if (req.query.sort === 'title') result.sort((a, b) => a.title.localeCompare(b.title));
  const total = result.length;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const start = (page - 1) * limit;
  const pageItems = result.slice(start, start + limit);
  return ok(res, pageItems, 200, { total, page, limit, pages: Math.ceil(total / limit) });
});

// GET /api/v1/posts/:id
router.get('/:id', (req, res) => {
  const post = posts.find((p) => p.id === Number(req.params.id));
  if (!post) return fail(res, 404, `Post ${req.params.id} not found`);
  return ok(res, post);
});

// POST /api/v1/posts — 201 Created + Location header
router.post('/', validatePost, (req, res) => {
  const post = { id: nextId++, userId: Number(req.body.userId) || 1, title: req.body.title.trim(), body: req.body.body.trim(), createdAt: '2026-11-25' };
  posts.push(post);
  res.location(`/api/v1/posts/${post.id}`);
  return ok(res, post, 201);
});

// PUT /api/v1/posts/:id — full replacement
router.put('/:id', validatePost, (req, res) => {
  const post = posts.find((p) => p.id === Number(req.params.id));
  if (!post) return fail(res, 404, `Post ${req.params.id} not found`);
  post.title = req.body.title.trim();
  post.body = req.body.body.trim();
  post.userId = Number(req.body.userId) || post.userId;
  return ok(res, post);
});

// PATCH /api/v1/posts/:id — partial update
router.patch('/:id', (req, res) => {
  const post = posts.find((p) => p.id === Number(req.params.id));
  if (!post) return fail(res, 404, `Post ${req.params.id} not found`);
  if (req.body.title !== undefined) post.title = String(req.body.title).trim();
  if (req.body.body !== undefined) post.body = String(req.body.body).trim();
  return ok(res, post);
});

// DELETE /api/v1/posts/:id — 204 No Content, empty body
router.delete('/:id', (req, res) => {
  const index = posts.findIndex((p) => p.id === Number(req.params.id));
  if (index === -1) return fail(res, 404, `Post ${req.params.id} not found`);
  posts.splice(index, 1);
  return res.status(204).end();
});

app.use('/api/v1/posts', router);

// 404 for everything else — still JSON, never HTML
app.use((req, res) => fail(res, 404, `Route ${req.method} ${req.path} does not exist`));

// Central error handler (topic 08): JSON parse errors land here
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return fail(res, 400, 'Request body is not valid JSON');
  return fail(res, 500, 'Internal server error');
});

// --- Self-test: call our own routes, print, shut down ---
const server = app.listen(0, async () => {
  const base = `http://127.0.0.1:${server.address().port}`;
  const show = async (label, method, path, body) => {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    console.log(`${label} -> ${res.status} ${text}`);
  };
  try {
    await show('GET    /api/v1/posts', 'GET', '/api/v1/posts');
    await show('GET    /api/v1/posts?userId=2&limit=1', 'GET', '/api/v1/posts?userId=2&limit=1');
    await show('GET    /api/v1/posts/3', 'GET', '/api/v1/posts/3');
    await show('GET    /api/v1/posts/99 (missing)', 'GET', '/api/v1/posts/99');
    await show('POST   /api/v1/posts', 'POST', '/api/v1/posts', { title: 'New post', body: 'Created by the demo' });
    await show('POST   /api/v1/posts (bad body)', 'POST', '/api/v1/posts', { title: '' });
    await show('PATCH  /api/v1/posts/2', 'PATCH', '/api/v1/posts/2', { title: 'Express routing (edited)' });
    await show('DELETE /api/v1/posts/5', 'DELETE', '/api/v1/posts/5');
    await show('GET    /api/v1/posts/5 (deleted)', 'GET', '/api/v1/posts/5');
    await show('GET    /nope (unknown route)', 'GET', '/nope');
  } finally {
    server.close(() => process.exit(0));
  }
});

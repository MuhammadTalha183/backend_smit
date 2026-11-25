// server.js — your first Express server (self-testing demo).
//
// What it does:
//   1. Reads PORT and APP_NAME from process.env, with sensible defaults.
//   2. Creates an Express app with two routes: GET / and GET /health.
//   3. Listens on port 0, which asks the operating system to pick a free
//      (ephemeral) port — so this demo never clashes with another server.
//   4. Calls its own routes with the global fetch(), logs the responses,
//      then shuts itself down. It always self-terminates.
//
// Run it (from the topic folder):
//   NODE_PATH=/tmp/express-verify/node_modules node examples/server.js

const express = require('express');

// --- Config: environment variables with defaults -------------------------
// PORT defaults to 0 (ephemeral) for this demo: the OS picks a free port.
// In a real project the default is usually 3000 (see notes.md §3.6).
const PORT = Number(process.env.PORT) || 0;
const APP_NAME = process.env.APP_NAME || 'backend-journey-app';

// --- App and routes ---------------------------------------------------------
const app = express();

app.get('/', (req, res) => {
  res.json({
    app: APP_NAME,
    message: `Welcome to ${APP_NAME}`,
    status: 'ok',
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: APP_NAME });
});

// --- Start, self-test, shut down --------------------------------------------
const server = app.listen(PORT, async () => {
  const actualPort = server.address().port;
  const baseUrl = `http://localhost:${actualPort}`;
  console.log(`${APP_NAME} listening on ${baseUrl}`);

  try {
    const home = await fetch(`${baseUrl}/`);
    console.log(`GET / -> ${home.status} ${JSON.stringify(await home.json())}`);

    const health = await fetch(`${baseUrl}/health`);
    console.log(`GET /health -> ${health.status} ${JSON.stringify(await health.json())}`);
  } catch (err) {
    console.error('Self-test request failed:', err.message);
    process.exitCode = 1;
  } finally {
    server.close(() => {
      console.log('Server closed.');
      process.exit(process.exitCode || 0);
    });
  }
});

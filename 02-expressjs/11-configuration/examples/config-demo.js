// config-demo.js — configuration done the right way.
// One central config module reads process.env, validates it once, and
// every other file imports the result instead of touching process.env.
// No dotenv is installed: in real life a .env file (see .env.example)
// is loaded by dotenv in development; here we read process.env directly
// so the pattern works with zero dependencies.
// Run with: NODE_PATH=/tmp/express-verify/node_modules node examples/config-demo.js
// Try it with overrides, e.g.:
//   NODE_ENV=production PORT=8080 LOG_LEVEL=warn NODE_PATH=/tmp/express-verify/node_modules node examples/config-demo.js

const express = require('express');

// --- Central config: read once, validate once, export frozen ---
function loadConfig(env = process.env) {
  const nodeEnv = ['development', 'test', 'production'].includes(env.NODE_ENV)
    ? env.NODE_ENV
    : 'development';
  const port = Number(env.PORT) || 3000;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be a number between 1 and 65535, got "${env.PORT}"`);
  }
  const config = {
    env: nodeEnv,
    port,
    host: env.HOST || '127.0.0.1',
    logLevel: ['debug', 'info', 'warn', 'error'].includes(env.LOG_LEVEL) ? env.LOG_LEVEL : 'info',
    databaseUrl: env.DATABASE_URL || 'postgres://localhost:5432/devdb',
    jwtSecret: env.JWT_SECRET || null, // required in production, checked below
    isProduction: nodeEnv === 'production',
    isDevelopment: nodeEnv === 'development',
  };
  if (config.isProduction && !config.jwtSecret) {
    throw new Error('JWT_SECRET is required in production');
  }
  return Object.freeze(config);
}

const config = loadConfig();

// --- Tiny logger that respects LOG_LEVEL and never prints secrets ---
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
function log(level, message) {
  if (LEVELS[level] >= LEVELS[config.logLevel]) {
    console.log(`[${level.toUpperCase()}] ${message}`);
  }
}
function mask(value) {
  // Show that a secret EXISTS without ever showing the secret itself.
  if (!value) return '(not set)';
  return value.slice(0, 3) + '***';
}

// --- The app itself: only reads config, never process.env ---
const app = express();
app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: config.env, version: '1.0.0' });
});
app.get('/config', (req, res) => {
  res.json({ env: config.env, port: config.port, host: config.host, logLevel: config.logLevel });
});

// --- Graceful shutdown: stop taking requests, finish in-flight ones ---
let shuttingDown = false;
function gracefulShutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  log('info', `Received ${signal} — shutting down gracefully...`);
  server.close(() => {
    log('info', 'Server closed. Goodbye.');
    process.exit(0);
  });
  // Safety net: never hang forever on a stuck connection.
  setTimeout(() => {
    log('warn', 'Shutdown timed out — forcing exit.');
    process.exit(1);
  }, 5000).unref();
}
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// --- Self-test: print the resolved config, call /health, shut down ---
const server = app.listen(0, config.host, async () => {
  log('info', 'Resolved configuration:');
  log('info', `  env        = ${config.env}`);
  log('info', `  port       = ${config.port} (default 3000)`);
  log('info', `  host       = ${config.host}`);
  log('info', `  logLevel   = ${config.logLevel}`);
  log('info', `  databaseUrl= ${config.databaseUrl}`);
  log('info', `  jwtSecret  = ${mask(config.jwtSecret)}`);
  log('info', `  isProduction= ${config.isProduction}`);
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const res = await fetch(`${base}/health`);
    console.log(`GET /health -> ${res.status} ${await res.text()}`);
    const cfg = await fetch(`${base}/config`);
    console.log(`GET /config -> ${cfg.status} ${await cfg.text()}`);
  } finally {
    server.close(() => process.exit(0));
  }
});

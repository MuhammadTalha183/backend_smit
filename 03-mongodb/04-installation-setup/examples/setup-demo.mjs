// 04 — Installation and Setup: verify a MongoDB connection and show the
// connection-string patterns you use in real projects.
//
// HOW TO RUN (from the topic folder):
//   NODE_PATH=/tmp/mongo-verify/node_modules node examples/setup-demo.mjs
//
// NOTE on imports: this file loads the driver with createRequire() so the
// shared verification install resolves through NODE_PATH (ESM `import`
// ignores NODE_PATH). In your own project run `npm install mongodb` and
// use plain `import { MongoClient } from 'mongodb'` instead — the rest of
// the code is identical.
//
// The demo uses mongodb-memory-server, which starts a real mongod process
// in memory — no MongoDB install needed for the demo itself. In real life
// you install MongoDB locally (mongod + mongosh), or use MongoDB Atlas.

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient } = require('mongodb');

// 1. Connection-string patterns. The URI is the only thing your code needs
//    to know about where MongoDB lives — local, Atlas, or a test server.
//    Never put a real password in code; read it from an environment variable.
const LOCAL_URI = 'mongodb://localhost:27017/schooldb';
const ATLAS_URI = 'mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/schooldb';
const URI_FROM_ENV = process.env.MONGODB_URI || LOCAL_URI;

console.log('Local connection string pattern:');
console.log(' ', LOCAL_URI);
console.log('Atlas connection string pattern:');
console.log(' ', ATLAS_URI);
console.log('URI this demo reads from the environment (MONGODB_URI):');
console.log(' ', URI_FROM_ENV);

// 2. Start a real MongoDB server in memory and connect to it.
const mongod = await MongoMemoryServer.create();
const client = new MongoClient(mongod.getUri());

await client.connect();
console.log('Connected to MongoDB.');

// 3. Ping the server — the standard "is the database alive?" check.
const ping = await client.db('admin').command({ ping: 1 });
console.log('Ping result:', JSON.stringify(ping));

// 4. Ask the server what version it is.
const buildInfo = await client.db('admin').command({ buildInfo: 1 });
console.log('Server version:', buildInfo.version);

// 5. List the databases that exist on a fresh server.
const { databases } = await client.db('admin').command({ listDatabases: 1 });
console.log('Databases on a fresh server:', databases.map((db) => db.name).join(', '));

// 6. Clean shutdown — always close the client and stop the server.
await client.close();
await mongod.stop();
console.log('Client closed, server stopped.');

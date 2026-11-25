// 05 — Databases, Collections and Documents: the three levels of MongoDB,
// BSON types, and ObjectId.
//
// HOW TO RUN (from the topic folder):
//   NODE_PATH=/tmp/mongo-verify/node_modules node examples/documents-demo.mjs
//
// NOTE on imports: this file loads the driver with createRequire() so the
// shared verification install resolves through NODE_PATH (ESM `import`
// ignores NODE_PATH). In your own project run `npm install mongodb` and
// use plain `import { MongoClient, ObjectId } from 'mongodb'` instead.

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient, ObjectId } = require('mongodb');

// Fixed ObjectIds so the output is identical on every run.
const TALHA_ID = new ObjectId('000000000000000000000001');
const AYESHA_ID = new ObjectId('000000000000000000000002');

const mongod = await MongoMemoryServer.create();
const client = new MongoClient(mongod.getUri());
await client.connect();

// 1. Database -> collection -> document.
//    A database is created the first time you write to it; a collection
//    is created the first time you insert a document into it.
const db = client.db('school');
const students = db.collection('students');
console.log('Database: school');
console.log('Collection: students');

// 2. Insert two documents. A document is a JSON-like BSON object.
//    Every BSON type appears below: string, number, boolean, array,
//    nested document, date, null, and ObjectId.
const result = await students.insertMany([
  {
    _id: TALHA_ID,
    name: 'Talha',
    age: 21,
    enrolled: true,
    courses: ['CS-301', 'CS-302'],
    address: { city: 'Karachi', area: 'Gulshan' },
    admittedOn: new Date('2026-01-15T00:00:00.000Z'),
    guardianPhone: null,
  },
  {
    _id: AYESHA_ID,
    name: 'Ayesha',
    age: 20,
    enrolled: true,
    courses: ['CS-301'],
    address: { city: 'Lahore', area: 'Model Town' },
    admittedOn: new Date('2026-01-15T00:00:00.000Z'),
    guardianPhone: null,
  },
]);
console.log('Inserted documents:', result.insertedCount);

// 3. The _id field: MongoDB adds an ObjectId automatically if you do not
//    provide one. An ObjectId is 12 bytes: timestamp + machine + process
//    + counter — unique across machines without asking the server.
console.log('Talha _id:', TALHA_ID.toHexString());
console.log('Ayesha _id:', AYESHA_ID.toHexString());
console.log('ObjectId is 24 hex characters:', TALHA_ID.toHexString().length === 24);

// 4. Read the documents back — find() returns a cursor, toArray() drains it.
const all = await students.find().toArray();
console.log('Documents in students:');
for (const doc of all) {
  console.log(' ', JSON.stringify(doc));
}

// 5. List the collections in this database, then drop one and list again.
const before = await db.listCollections().toArray();
console.log('Collections before drop:', before.map((c) => c.name).join(', '));
await db.createCollection('temp-notes');
console.log('Created collection: temp-notes');
await db.collection('temp-notes').drop();
const after = await db.listCollections().toArray();
console.log('Collections after drop:', after.map((c) => c.name).join(', '));

// 6. Count documents and show the collection size (in documents, not bytes).
console.log('Student count:', await students.countDocuments());

await client.close();
await mongod.stop();
console.log('Client closed, server stopped.');

// 06 — CRUD Operations: create, read, update, delete with the Node.js
// MongoDB driver.
//
// HOW TO RUN (from the topic folder):
//   NODE_PATH=/tmp/mongo-verify/node_modules node examples/crud-demo.mjs
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
const ID_1 = new ObjectId('000000000000000000000001');
const ID_2 = new ObjectId('000000000000000000000002');
const ID_3 = new ObjectId('000000000000000000000003');
const ID_4 = new ObjectId('000000000000000000000004');

const mongod = await MongoMemoryServer.create();
const client = new MongoClient(mongod.getUri());
await client.connect();
const books = client.db('library').collection('books');

// ---- CREATE ---------------------------------------------------------------
const one = await books.insertOne({ _id: ID_1, title: 'Clean Code', author: 'Robert Martin', price: 40, stock: 5 });
console.log('insertOne acknowledged:', one.acknowledged, '| insertedId:', one.insertedId.toHexString());

const many = await books.insertMany([
  { _id: ID_2, title: 'You Don\'t Know JS', author: 'Kyle Simpson', price: 25, stock: 0 },
  { _id: ID_3, title: 'Eloquent JavaScript', author: 'Marijn Haverbeke', price: 30, stock: 3 },
  { _id: ID_4, title: 'Design Patterns', author: 'Gamma et al.', price: 55, stock: 2 },
]);
console.log('insertMany insertedCount:', many.insertedCount);

// ---- READ -----------------------------------------------------------------
const all = await books.find().sort({ price: 1 }).toArray();
console.log('All books, cheapest first:');
for (const book of all) {
  console.log(' ', book.title, '- $' + book.price, '(stock ' + book.stock + ')');
}

const cheapest = await books.findOne({ stock: { $gt: 0 } }, { sort: { price: 1 } });
console.log('Cheapest in stock:', cheapest.title);

const inStock = await books.find({ stock: { $gt: 0 } }, { projection: { _id: 0, title: 1, stock: 1 } }).toArray();
console.log('In stock (title + stock only):', JSON.stringify(inStock));
console.log('Total books:', await books.countDocuments());
console.log('Out-of-stock books:', await books.countDocuments({ stock: 0 }));

// ---- UPDATE ---------------------------------------------------------------
const updated = await books.updateOne({ _id: ID_2 }, { $set: { stock: 4 } });
console.log('updateOne matched:', updated.matchedCount, '| modified:', updated.modifiedCount);

const updatedMany = await books.updateMany({ price: { $lt: 35 } }, { $inc: { price: 5 } });
console.log('updateMany matched:', updatedMany.matchedCount, '| modified:', updatedMany.modifiedCount);

const replaced = await books.replaceOne({ _id: ID_4 }, { title: 'Design Patterns', author: 'Gamma et al.', price: 60, stock: 2, edition: 'Revised' });
console.log('replaceOne matched:', replaced.matchedCount, '| modified:', replaced.modifiedCount);

const upserted = await books.updateOne(
  { _id: new ObjectId('000000000000000000000005') },
  { $set: { title: 'Refactoring', author: 'Martin Fowler', price: 45, stock: 1 } },
  { upsert: true },
);
console.log('upsert matched:', upserted.matchedCount, '| modified:', upserted.modifiedCount, '| upsertedId:', upserted.upsertedId.toHexString());

// ---- DELETE ---------------------------------------------------------------
const deleted = await books.deleteOne({ _id: ID_3 });
console.log('deleteOne deletedCount:', deleted.deletedCount);

const deletedMany = await books.deleteMany({ stock: 0 });
console.log('deleteMany deletedCount:', deletedMany.deletedCount);

const remaining = await books.find({}, { projection: { _id: 0, title: 1, price: 1, stock: 1 } }).sort({ title: 1 }).toArray();
console.log('Remaining books:', JSON.stringify(remaining));

await client.close();
await mongod.stop();
console.log('Client closed, server stopped.');

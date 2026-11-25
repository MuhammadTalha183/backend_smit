import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { MongoClient, ObjectId } from 'mongodb';


// Data lives under ~/.cache (plenty of disk) instead of /tmp, and is
// cleaned up at the end, so re-runs are identical and leave nothing behind.
// Unique per run (mkdtemp) so back-to-back or parallel runs never
// collide on the mongod lock file. The path is never printed,
// so output stays byte-identical.
const dbPath = await fs.mkdtemp(path.join(os.homedir(), '.cache', 'mongo-mem-schema-design-'));
const mongod = await MongoMemoryServer.create({ instance: { dbPath } });
const client = new MongoClient(mongod.getUri());
await client.connect();
const db = client.db('blog');

// 1. EMBEDDING: comments live inside the post document.
//    Good here: comments are always read WITH the post, never alone.
const posts = db.collection('posts');
await posts.insertOne({
  _id: new ObjectId('000000000000000000000001'),
  title: 'Why MongoDB?',
  author: 'Talha',
  comments: [
    { _id: new ObjectId('000000000000000000000101'), text: 'Great post!', by: 'Ayesha' },
    { _id: new ObjectId('000000000000000000000102'), text: 'Very helpful.', by: 'Bilal' },
  ],
});
const post = await posts.findOne({ _id: new ObjectId('000000000000000000000001') });
console.log('embedded post:', JSON.stringify(post));

// 2. REFERENCING: orders store only the user's ObjectId.
//    Good here: users change often and orders are read without user details.
const users = db.collection('users');
const orders = db.collection('orders');
await users.insertOne({ _id: new ObjectId('000000000000000000000002'), name: 'Ayesha', email: 'ayesha@example.com' });
await orders.insertOne({
  _id: new ObjectId('000000000000000000000003'),
  userId: new ObjectId('000000000000000000000002'),
  total: 2500,
});
const order = await orders.findOne({ _id: new ObjectId('000000000000000000000003') });
const buyer = await users.findOne({ _id: order.userId });
console.log('referenced order:', JSON.stringify({ total: order.total, buyer: buyer.name }));

// 3. SCHEMA VALIDATION: $jsonSchema rejects bad documents at the database level.
await db.createCollection('products', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'price'],
      properties: {
        name: { bsonType: 'string', description: 'name is required and must be a string' },
        price: { bsonType: 'number', minimum: 0, description: 'price must be a number >= 0' },
      },
    },
  },
});
const products = db.collection('products');
await products.insertOne({ _id: new ObjectId('000000000000000000000004'), name: 'Keyboard', price: 4500 });
console.log('valid product inserted: ok');
try {
  await products.insertOne({ _id: new ObjectId('000000000000000000000005'), name: 'Mouse', price: -100 });
  console.log('invalid product inserted: UNEXPECTED');
} catch (err) {
  console.log('invalid product rejected: code', err.code, '| price must be >= 0');
}
console.log('products count:', await products.countDocuments());

await client.close();
await mongod.stop();
await fs.rm(dbPath, { recursive: true, force: true });
console.log('DONE');

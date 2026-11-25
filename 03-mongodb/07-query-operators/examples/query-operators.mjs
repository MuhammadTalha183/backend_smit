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
const dbPath = await fs.mkdtemp(path.join(os.homedir(), '.cache', 'mongo-mem-query-operators-'));
const mongod = await MongoMemoryServer.create({ instance: { dbPath } });
const client = new MongoClient(mongod.getUri());
await client.connect();
const users = client.db('shop').collection('users');

// Fixed ObjectIds so the output is identical on every run.
await users.insertMany([
  { _id: new ObjectId('000000000000000000000001'), name: 'Talha', age: 21, city: 'Karachi', active: true, skills: ['node', 'express', 'mongodb'] },
  { _id: new ObjectId('000000000000000000000002'), name: 'Ayesha', age: 25, city: 'Lahore', active: true, skills: ['react', 'node'] },
  { _id: new ObjectId('000000000000000000000003'), name: 'Bilal', age: 19, city: 'Karachi', active: false, skills: ['python'] },
  { _id: new ObjectId('000000000000000000000004'), name: 'Sara', age: 30, city: 'Islamabad', active: true, skills: ['mongodb', 'sql'] },
  { _id: new ObjectId('000000000000000000000005'), name: 'Omar', age: 22, city: 'Karachi', skills: ['node', 'react'] },
]);

const names = (docs) => docs.map((d) => d.name);

// 1. Comparison: age greater than 21
console.log('age > 21:', names(await users.find({ age: { $gt: 21 } }).toArray()));
// 2. $in: city is Karachi or Lahore
console.log('city in [Karachi, Lahore]:', names(await users.find({ city: { $in: ['Karachi', 'Lahore'] } }).toArray()));
// 3. Logical: active AND from Karachi
console.log('active AND Karachi:', names(await users.find({ $and: [{ active: true }, { city: 'Karachi' }] }).toArray()));
// 4. Logical: age under 20 OR over 28
console.log('age < 20 OR age > 28:', names(await users.find({ $or: [{ age: { $lt: 20 } }, { age: { $gt: 28 } }] }).toArray()));
// 5. Element: field "active" does not exist
console.log('no active field:', names(await users.find({ active: { $exists: false } }).toArray()));
// 6. Array: has the skill "mongodb"
console.log('skill mongodb:', names(await users.find({ skills: 'mongodb' }).toArray()));
// 7. Array: has BOTH node and react in skills
console.log('skills node AND react:', names(await users.find({ skills: { $all: ['node', 'react'] } }).toArray()));
// 8. Array: $elemMatch on an array of subdocuments is shown with a second collection below
// 9. Evaluation: name starts with "A" (case-sensitive regex)
console.log('name starts with A:', names(await users.find({ name: { $regex: '^A' } }).toArray()));
// 10. Projection: only name and city, no _id
console.log('projection name+city:', await users.find({}, { projection: { _id: 0, name: 1, city: 1 } }).toArray());
// 11. Sort by age descending, skip 1, limit 2
console.log('sorted desc, skip 1, limit 2:', names(await users.find().sort({ age: -1 }).skip(1).limit(2).toArray()));
// 12. Count: how many active users
console.log('active count:', await users.countDocuments({ active: true }));

// $elemMatch demo on an array of subdocuments
const orders = client.db('shop').collection('orders');
await orders.insertMany([
  { _id: new ObjectId('000000000000000000000011'), items: [{ product: 'laptop', qty: 1 }, { product: 'mouse', qty: 2 }] },
  { _id: new ObjectId('000000000000000000000012'), items: [{ product: 'laptop', qty: 3 }, { product: 'keyboard', qty: 1 }] },
]);
console.log('orders with an item laptop qty >= 3:',
  (await orders.find({ items: { $elemMatch: { product: 'laptop', qty: { $gte: 3 } } } }).toArray())
    .map((o) => o._id.toHexString()));

await client.close();
await mongod.stop();
await fs.rm(dbPath, { recursive: true, force: true });
console.log('DONE');

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
const dbPath = await fs.mkdtemp(path.join(os.homedir(), '.cache', 'mongo-mem-indexing-'));
const mongod = await MongoMemoryServer.create({ instance: { dbPath } });
const client = new MongoClient(mongod.getUri());
await client.connect();
const users = client.db('shop').collection('users');

// Fixed ObjectIds so the output is identical on every run.
await users.insertMany([
  { _id: new ObjectId('000000000000000000000001'), name: 'Talha', email: 'talha@example.com', city: 'Karachi', age: 21, bio: 'Node.js developer learning MongoDB' },
  { _id: new ObjectId('000000000000000000000002'), name: 'Ayesha', email: 'ayesha@example.com', city: 'Lahore', age: 25, bio: 'React developer and designer' },
  { _id: new ObjectId('000000000000000000000003'), name: 'Bilal', email: 'bilal@example.com', city: 'Karachi', age: 19, bio: 'Python student' },
  { _id: new ObjectId('000000000000000000000004'), name: 'Sara', email: 'sara@example.com', city: 'Islamabad', age: 30, bio: 'Database administrator' },
]);

// 1. BEFORE any index: explain() shows a full collection scan (COLLSCAN).
const before = await users.find({ city: 'Karachi' }).explain('executionStats');
console.log('before index — winning plan:', before.queryPlanner.winningPlan.stage);
console.log('before index — docs examined:', before.executionStats.totalDocsExamined);

// 2. Create the indexes (names only are printed — full index documents vary).
await users.createIndex({ city: 1 }, { name: 'city_1' });
await users.createIndex({ city: 1, age: -1 }, { name: 'city_1_age_-1' });
await users.createIndex({ email: 1 }, { name: 'email_1', unique: true });
await users.createIndex({ bio: 'text' }, { name: 'bio_text' });
await users.createIndex({ createdAt: 1 }, { name: 'createdAt_1', expireAfterSeconds: 3600 });
console.log('indexes created:', (await users.listIndexes().toArray()).map((ix) => ix.name));

// 3. AFTER the index: the same query now uses IXSCAN and examines only matching docs.
const after = await users.find({ city: 'Karachi' }).explain('executionStats');
const ixStage = after.queryPlanner.winningPlan.inputStage?.stage
  ?? after.queryPlanner.winningPlan.stage;
console.log('after index — winning plan:', after.queryPlanner.winningPlan.stage, '->', ixStage);
console.log('after index — index used:', after.queryPlanner.winningPlan.inputStage?.indexName ?? 'n/a');
console.log('after index — docs examined:', after.executionStats.totalDocsExamined);

// 4. Compound index in action: city + age sorted query.
const sorted = await users.find({ city: 'Karachi' }).sort({ age: -1 }).explain('executionStats');
console.log('compound query — docs examined:', sorted.executionStats.totalDocsExamined);

// 5. Text search uses the text index.
console.log('text search "developer":',
  (await users.find({ $text: { $search: 'developer' } }).toArray()).map((u) => u.name));

// 6. Unique index in action: a duplicate email is rejected.
try {
  await users.insertOne({ _id: new ObjectId('000000000000000000000005'), name: 'Copy', email: 'talha@example.com', city: 'Karachi', age: 22 });
  console.log('duplicate email inserted: UNEXPECTED');
} catch (err) {
  console.log('duplicate email rejected: code', err.code);
}

await client.close();
await mongod.stop();
await fs.rm(dbPath, { recursive: true, force: true });
console.log('DONE');

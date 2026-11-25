import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { MongoClient, ObjectId } from 'mongodb';


// ---------------------------------------------------------------------------
// Setup: an in-memory MongoDB server, so no MongoDB installation is needed.
// The data directory lives under ~/.cache (plenty of disk) instead of /tmp,
// and is deleted at the end, so re-runs are identical and leave nothing
// behind. On a fresh machine the first run downloads the mongod binary
// once (~120MB) and prints progress lines — later runs start fast.
// ---------------------------------------------------------------------------
const dbPath = path.join(os.homedir(), '.cache', 'mongo-mem', 'nodejs-integration');
await fs.mkdir(dbPath, { recursive: true });
const mongod = await MongoMemoryServer.create({ instance: { dbPath } });

// In a real app the URI comes from the environment (a .env file), never
// hardcoded:  const uri = process.env.MONGODB_URI
// The memory server is only for practice — here it supplies the URI when
// no MONGODB_URI is set, so the same code shape works in both cases.
const uri = process.env.MONGODB_URI || mongod.getUri();

// Connect ONCE and reuse this one client for every operation. Connecting
// per request would open a new connection (and a new pool) every time.
const client = new MongoClient(uri);
let badClient;

try {
  await client.connect();
  console.log('connected: ok');

  const users = client.db('shop').collection('users');

  // Fixed ObjectIds so the output is identical on every run.
  const talha = { _id: new ObjectId('000000000000000000000001'), name: 'Talha', email: 'talha@example.com', city: 'Karachi', age: 21 };
  const ayesha = { _id: new ObjectId('000000000000000000000002'), name: 'Ayesha', email: 'ayesha@example.com', city: 'Lahore', age: 25 };
  const bilal = { _id: new ObjectId('000000000000000000000003'), name: 'Bilal', email: 'bilal@example.com', city: 'Karachi', age: 19 };

  // 1. CREATE — insertOne, one user at a time.
  const insertedTalha = await users.insertOne(talha);
  console.log('inserted:', insertedTalha.insertedId.toString());
  console.log('count after insert:', await users.countDocuments());

  const insertedAyesha = await users.insertOne(ayesha);
  console.log('inserted:', insertedAyesha.insertedId.toString());
  const insertedBilal = await users.insertOne(bilal);
  console.log('inserted:', insertedBilal.insertedId.toString());
  console.log('count after insert:', await users.countDocuments());

  // 2. READ — find() returns a cursor; sort it, then toArray() runs it.
  const allUsers = await users.find({}).sort({ name: 1 }).toArray();
  console.log('all users (sorted by name):', allUsers.map((u) => u.name));

  // 3. UPDATE — updateOne, then read the document back to prove it changed.
  const updated = await users.updateOne(
    { _id: new ObjectId('000000000000000000000003') },
    { $set: { age: 20 } },
  );
  console.log('update — matched:', updated.matchedCount, 'modified:', updated.modifiedCount);
  const bilalNow = await users.findOne({ _id: new ObjectId('000000000000000000000003') });
  console.log('updated user:', JSON.stringify(bilalNow));
  console.log('count after update:', await users.countDocuments());

  // 4. DELETE — deleteOne, then count again.
  const deleted = await users.deleteOne({ _id: new ObjectId('000000000000000000000002') });
  console.log('delete — deleted:', deleted.deletedCount);
  console.log('count after delete:', await users.countDocuments());
  const remaining = await users.find({}).sort({ name: 1 }).toArray();
  console.log('remaining users:', remaining.map((u) => u.name));

  // 5. FAILED CONNECTION, handled gracefully. Nothing listens on port
  // 27099, so server selection fails after 1000 ms. Only the short error
  // code is printed — the full message contains variable text (host,
  // port, topology details) and would break deterministic output.
  // NOTE: in driver 7.x the code is not on err.code itself (undefined);
  // it sits two causes deep: MongoServerSelectionError -> MongoNetworkError
  // -> Error { code: 'ECONNREFUSED' }. Walk the cause chain and print
  // only the first code found.
  badClient = new MongoClient('mongodb://127.0.0.1:27099', { serverSelectionTimeoutMS: 1000 });
  try {
    await badClient.connect();
    console.log('bad connection succeeded: UNEXPECTED');
  } catch (err) {
    let node = err;
    let code;
    while (node && code === undefined) {
      code = node.code;
      node = node.cause;
    }
    console.log('failed connection error code:', code);
  }
} finally {
  // Always close in finally, so a failure mid-demo never leaks a client.
  await client.close();
  if (badClient) await badClient.close().catch(() => {});
  await mongod.stop();
  await fs.rm(dbPath, { recursive: true, force: true });
}

console.log('DONE');

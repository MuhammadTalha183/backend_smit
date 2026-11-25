// 03 — MongoDB Architecture: what the server is, and what BSON can hold.
// Run: NODE_PATH=/tmp/mongo-verify/node_modules node examples/architecture-demo.mjs
// The mongodb packages are NOT installed inside this repo. They live in
// /tmp/mongo-verify/node_modules and are found through the ~/workspace/node_modules
// symlink. In your own project you would run: npm install mongodb
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, ObjectId, Decimal128, Int32, Long } from 'mongodb';

// Fixed values keep the output identical on every run.
const USER_ID = new ObjectId('000000000000000000000001');
const FIXED_DATE = new Date('2026-11-25T10:00:00.000Z');

const mongod = await MongoMemoryServer.create();
const client = new MongoClient(mongod.getUri());

try {
  await client.connect();

  // ---- 1. The server answers: ping + build info ----
  console.log('Ping:', await client.db('admin').command({ ping: 1 }));
  const build = await client.db('admin').command({ buildInfo: 1 });
  console.log('Server version:', build.version);
  // buildInfo lists ALL available engines — the ACTIVE one is in serverStatus.
  const status = await client.db('admin').command({ serverStatus: 1 });
  console.log('Storage engine:', status.storageEngine.name);

  // ---- 2. Namespaces: database.collection ----
  const db = client.db('architecture');
  const users = db.collection('users');
  await users.insertOne({ _id: USER_ID, name: 'Talha' });
  // A namespace is just "database.collection".
  console.log('Namespace:', users.namespace);

  // ---- 3. Database stats — only deterministic fields ----
  // dbStats also reports dataSize/indexSize, which vary between runs,
  // so print only the fields that never change for the same data.
  const stats = await db.stats();
  console.log('Database:', stats.db);
  console.log('Collections:', stats.collections, '| Documents:', stats.objects);

  // ---- 4. BSON types: JSON cannot hold these, BSON can ----
  const showcase = db.collection('bson-types');
  await showcase.insertOne({
    _id: new ObjectId('000000000000000000000002'),
    objectId: USER_ID,
    date: FIXED_DATE,
    decimal: Decimal128.fromString('19.99'),
    int32: new Int32(42),
    int64: Long.fromString('9007199254740993'),
    binary: new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
    nested: { city: 'Karachi', tags: ['node', 'mongo'] },
  });
  const doc = await showcase.findOne({}, { projection: { _id: 0 } });
  console.log('BSON types round-trip:');
  console.log('  date is a Date:', doc.date instanceof Date, '|', doc.date.toISOString());
  console.log('  decimal stays exact:', doc.decimal.toString());
  console.log('  int64 beyond float range:', doc.int64.toString());
  console.log('  int32:', doc.int32);
  // Binary comes back as a BSON Binary object; its bytes live in .buffer.
  console.log('  binary bytes:', Array.from(doc.binary.buffer).map((b) => b.toString(16)).join(' '));
  console.log('  nested:', JSON.stringify(doc.nested));
} finally {
  await client.close();
  await mongod.stop();
  console.log('Disconnected');
}

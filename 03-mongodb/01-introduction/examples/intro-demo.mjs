// 01 — Introduction to MongoDB: your first database, collection and documents.
// Run: NODE_PATH=/tmp/mongo-verify/node_modules node examples/intro-demo.mjs
// The mongodb packages are NOT installed inside this repo. They live in
// /tmp/mongo-verify/node_modules and are found through the ~/workspace/node_modules
// symlink. In your own project you would run: npm install mongodb
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, ObjectId } from 'mongodb';

// Fixed ObjectIds keep the output identical on every run.
const TALHA_ID = new ObjectId('000000000000000000000001');
const AYESHA_ID = new ObjectId('000000000000000000000002');

const mongod = await MongoMemoryServer.create();
const client = new MongoClient(mongod.getUri());

try {
  await client.connect();
  console.log('Connected to MongoDB');

  // A database is created automatically the first time you use it.
  const db = client.db('learn');
  // So is a collection — the first insert creates it.
  const students = db.collection('students');

  await students.insertMany([
    { _id: TALHA_ID, name: 'Talha', course: 'CS', semester: 5 },
    { _id: AYESHA_ID, name: 'Ayesha', course: 'CS', semester: 5 },
  ]);
  console.log('Inserted 2 students');

  console.log('All students:');
  console.log(await students.find().toArray());

  console.log('One student (name = Talha):');
  console.log(await students.findOne({ name: 'Talha' }));

  console.log('Count:', await students.countDocuments());
  // listCollections() also returns a random UUID per collection, so print
  // only the names — otherwise the output changes on every run.
  const names = (await db.listCollections().toArray()).map((c) => c.name);
  console.log('Collections in "learn":', names);
} finally {
  await client.close();
  await mongod.stop();
  console.log('Disconnected');
}

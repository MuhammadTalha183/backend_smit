// 02 — SQL vs NoSQL: the same data modelled two ways.
// Run: NODE_PATH=/tmp/mongo-verify/node_modules node examples/sql-vs-nosql.mjs
// The mongodb packages are NOT installed inside this repo. They live in
// /tmp/mongo-verify/node_modules and are found through the ~/workspace/node_modules
// symlink. In your own project you would run: npm install mongodb
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, ObjectId } from 'mongodb';

// Fixed ObjectIds keep the output identical on every run.
const TALHA_ID = new ObjectId('000000000000000000000001');
const POST_1 = new ObjectId('000000000000000000000011');
const POST_2 = new ObjectId('000000000000000000000012');

const mongod = await MongoMemoryServer.create();
const client = new MongoClient(mongod.getUri());

try {
  await client.connect();
  const db = client.db('compare');

  // ---- Way 1: relational-style — two collections, linked by userId ----
  // This is how SQL thinks: one table for users, one for posts, joined on a key.
  const users = db.collection('users');
  const posts = db.collection('posts');
  await users.insertOne({ _id: TALHA_ID, name: 'Talha', course: 'CS' });
  await posts.insertMany([
    { _id: POST_1, userId: TALHA_ID, title: 'Hello MongoDB' },
    { _id: POST_2, userId: TALHA_ID, title: 'SQL vs NoSQL' },
  ]);

  // The "join": $lookup pulls the matching posts into the user document.
  // console.dir with depth: null prints nested objects in full — plain
  // console.log would collapse them to "[Object]".
  console.log('Relational-style ($lookup join):');
  console.dir(
    await users
      .aggregate([
        { $match: { _id: TALHA_ID } },
        { $lookup: { from: 'posts', localField: '_id', foreignField: 'userId', as: 'posts' } },
        { $project: { _id: 0, name: 1, posts: { title: 1 } } },
      ])
      .toArray(),
    { depth: null }
  );

  // ---- Way 2: document-style — everything embedded in one document ----
  // This is how MongoDB wants to think: one read returns the whole user.
  const profiles = db.collection('profiles');
  await profiles.insertOne({
    _id: TALHA_ID,
    name: 'Talha',
    course: 'CS',
    posts: [{ title: 'Hello MongoDB' }, { title: 'SQL vs NoSQL' }],
  });

  console.log('Document-style (embedded, one read):');
  console.log(
    await profiles.findOne({ _id: TALHA_ID }, { projection: { _id: 0 } })
  );

  // ---- The same data, different shapes: flexible schema ----
  // In SQL this would need an ALTER TABLE. Here, one document just has an
  // extra field and the other does not.
  await users.insertOne({ _id: new ObjectId('000000000000000000000002'), name: 'Ayesha', course: 'CS', hostel: true });
  console.log('Flexible schema — two users, different fields, same collection:');
  console.log(await users.find({}, { projection: { _id: 0 } }).toArray());
} finally {
  await client.close();
  await mongod.stop();
  console.log('Disconnected');
}

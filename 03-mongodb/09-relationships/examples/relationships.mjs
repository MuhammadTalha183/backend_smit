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
const dbPath = await fs.mkdtemp(path.join(os.homedir(), '.cache', 'mongo-mem-relationships-'));
const mongod = await MongoMemoryServer.create({ instance: { dbPath } });
const client = new MongoClient(mongod.getUri());
await client.connect();
const db = client.db('school');

// Fixed ObjectIds so the output is identical on every run.
const TALHA = new ObjectId('000000000000000000000001');
const AYESHA = new ObjectId('000000000000000000000002');
const NODE_COURSE = new ObjectId('000000000000000000000011');
const REACT_COURSE = new ObjectId('000000000000000000000012');
const BOOK1 = new ObjectId('000000000000000000000021');
const BOOK2 = new ObjectId('000000000000000000000022');

// 1. ONE-TO-ONE (embedded): a user's profile is read WITH the user, never alone.
const users = db.collection('users');
await users.insertMany([
  { _id: TALHA, name: 'Talha', profile: { bio: 'CS student', city: 'Karachi' } },
  { _id: AYESHA, name: 'Ayesha', profile: { bio: 'CS student', city: 'Lahore' } },
]);
console.log('one-to-one (embedded profile):', JSON.stringify((await users.findOne({ _id: TALHA })).profile));

// 2. ONE-TO-MANY (referenced): one author has many books; books are also listed alone.
const authors = db.collection('authors');
const books = db.collection('books');
await authors.insertOne({ _id: TALHA, name: 'Talha' });
await books.insertMany([
  { _id: BOOK1, title: 'Node.js Guide', authorId: TALHA },
  { _id: BOOK2, title: 'Express in Practice', authorId: TALHA },
]);
const talhaBooks = await books.find({ authorId: TALHA }).toArray();
console.log('one-to-many (books by Talha):', talhaBooks.map((b) => b.title));

// 3. MANY-TO-MANY (join collection): students enrol in many courses, courses have many students.
const courses = db.collection('courses');
const enrolments = db.collection('enrolments');
await courses.insertMany([
  { _id: NODE_COURSE, title: 'Node.js' },
  { _id: REACT_COURSE, title: 'React' },
]);
await enrolments.insertMany([
  { _id: new ObjectId('000000000000000000000031'), studentId: TALHA, courseId: NODE_COURSE },
  { _id: new ObjectId('000000000000000000000032'), studentId: TALHA, courseId: REACT_COURSE },
  { _id: new ObjectId('000000000000000000000033'), studentId: AYESHA, courseId: NODE_COURSE },
]);
const talhaEnrolments = await enrolments.find({ studentId: TALHA }).toArray();
const talhaCourses = await courses
  .find({ _id: { $in: talhaEnrolments.map((e) => e.courseId) } })
  .toArray();
console.log('many-to-many (Talha courses):', talhaCourses.map((c) => c.title));

// 4. $lookup: the database does the join for you (orders + users).
const orders = db.collection('orders');
await orders.insertMany([
  { _id: new ObjectId('000000000000000000000041'), userId: TALHA, total: 2500 },
  { _id: new ObjectId('000000000000000000000042'), userId: AYESHA, total: 1800 },
]);
const joined = await orders.aggregate([
  { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'buyer' } },
  { $project: { _id: 0, total: 1, buyerName: { $arrayElemAt: ['$buyer.name', 0] } } },
  { $sort: { total: -1 } },
]).toArray();
console.log('$lookup orders with buyer name:', JSON.stringify(joined));

await client.close();
await mongod.stop();
await fs.rm(dbPath, { recursive: true, force: true });
console.log('DONE');

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ObjectId } from 'mongodb';

// Data lives under ~/.cache (plenty of disk) instead of /tmp, and is
// cleaned up at the end, so re-runs are identical and leave nothing behind.
// The path is never printed, so output stays byte-identical.
const dbPath = path.join(os.homedir(), '.cache', 'mongo-mem', 'mongoose');
await fs.mkdir(dbPath, { recursive: true });
const mongod = await MongoMemoryServer.create({ instance: { dbPath } });
await mongoose.connect(mongod.getUri());

// --- Schema: the shape + rules for a User document -----------------------
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  age: { type: Number, min: 0 },
  role: { type: String, enum: ['student', 'teacher'], default: 'student' },
});

// Middleware (hook): run before every save — normalise the name.
userSchema.pre('save', function () {
  if (this.name) this.name = this.name.toLowerCase();
});

// Virtual: a computed property, never stored in MongoDB.
userSchema.virtual('displayName').get(function () {
  return `${this.name} (${this.role})`;
});

const User = mongoose.model('User', userSchema);

// --- Schema: a Post that references a User -------------------------------
const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const Post = mongoose.model('Post', postSchema);

// Fixed ObjectIds so the output is identical on every run.
const userId = new ObjectId('000000000000000000000001');
const postId1 = new ObjectId('000000000000000000000002');
const postId2 = new ObjectId('000000000000000000000003');

// 1. Create a valid user (name is lowercased by the pre-save hook,
//    email is lowercased by the schema option, role takes its default).
const user = await User.create({
  _id: userId,
  name: 'Talha Ahmed',
  email: 'TALHA@EXAMPLE.COM',
  age: 21,
});
console.log('Created user:', user.name, user.email, user.role);

// 2. Try to create an invalid user: email missing, age below the minimum.
//    Mongoose validates before anything reaches MongoDB.
try {
  await User.create({ name: 'Bad User', age: -5 });
} catch (err) {
  console.log('ValidationError:', err.message);
}

// 3. Create two posts by that user, then read them back with the
//    author populated (the ObjectId is replaced by the User document).
await Post.create([
  { _id: postId1, title: 'Hello Mongoose', author: userId },
  { _id: postId2, title: 'Mongoose Population', author: userId },
]);
const posts = await Post.find().populate('author');
for (const post of posts) {
  console.log('Post:', post.title, 'by', post.author.name);
}

// 4. The virtual is computed on the document, not stored in the database.
console.log('Virtual displayName:', user.displayName);

await mongoose.disconnect();
await mongod.stop();
await fs.rm(dbPath, { recursive: true, force: true });
console.log('DONE');

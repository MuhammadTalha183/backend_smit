import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { MongoClient, ObjectId } from 'mongodb';

// Data lives under ~/.cache (plenty of disk) instead of /tmp, and is
// cleaned up at the end, so re-runs are identical and leave nothing behind.
// The path is never printed, so output stays byte-identical.
// NOTE: on a fresh machine the first run downloads the mongod binary
// once (~120MB) and prints progress lines — later runs start fast.
const dbPath = path.join(os.homedir(), '.cache', 'mongo-mem', 'aggregation');
await fs.mkdir(dbPath, { recursive: true });
const mongod = await MongoMemoryServer.create({ instance: { dbPath } });
const client = new MongoClient(mongod.getUri());
await client.connect();
const db = client.db('shop');
const customers = db.collection('customers');
const orders = db.collection('orders');

// Fixed ObjectIds and fixed date strings so the output is identical
// on every run.
await customers.insertMany([
  { _id: new ObjectId('000000000000000000000001'), name: 'Ali', city: 'Karachi' },
  { _id: new ObjectId('000000000000000000000002'), name: 'Ayesha', city: 'Lahore' },
  { _id: new ObjectId('000000000000000000000003'), name: 'Bilal', city: 'Islamabad' },
]);

await orders.insertMany([
  { _id: new ObjectId('000000000000000000000001'), customer: new ObjectId('000000000000000000000001'), category: 'books', amount: 1200, status: 'delivered', date: '2026-01-05T10:00:00.000Z' },
  { _id: new ObjectId('000000000000000000000002'), customer: new ObjectId('000000000000000000000001'), category: 'electronics', amount: 45000, status: 'delivered', date: '2026-01-12T10:00:00.000Z' },
  { _id: new ObjectId('000000000000000000000003'), customer: new ObjectId('000000000000000000000002'), category: 'clothing', amount: 3500, status: 'delivered', date: '2026-01-15T10:00:00.000Z' },
  { _id: new ObjectId('000000000000000000000004'), customer: new ObjectId('000000000000000000000002'), category: 'books', amount: 800, status: 'pending', date: '2026-02-02T10:00:00.000Z' },
  { _id: new ObjectId('000000000000000000000005'), customer: new ObjectId('000000000000000000000003'), category: 'electronics', amount: 22000, status: 'delivered', date: '2026-02-10T10:00:00.000Z' },
  { _id: new ObjectId('000000000000000000000006'), customer: new ObjectId('000000000000000000000003'), category: 'clothing', amount: 2800, status: 'cancelled', date: '2026-02-14T10:00:00.000Z' },
  { _id: new ObjectId('000000000000000000000007'), customer: new ObjectId('000000000000000000000001'), category: 'books', amount: 1500, status: 'delivered', date: '2026-02-20T10:00:00.000Z' },
  { _id: new ObjectId('000000000000000000000008'), customer: new ObjectId('000000000000000000000002'), category: 'electronics', amount: 18000, status: 'delivered', date: '2026-03-01T10:00:00.000Z' },
]);

const print = (title, docs) => {
  console.log(title);
  for (const doc of docs) console.log(JSON.stringify(doc));
};

// 1. Total revenue per category for delivered orders only.
//    $match filters first, $group sums, $sort orders the result.
const revenue = await orders.aggregate([
  { $match: { status: 'delivered' } },
  { $group: { _id: '$category', totalRevenue: { $sum: '$amount' }, orderCount: { $sum: 1 } } },
  { $sort: { totalRevenue: -1 } },
]).toArray();
print('1. Revenue per category (delivered orders):', revenue);

// 2. Average order value per customer. $round keeps the average tidy.
const avgValue = await orders.aggregate([
  { $group: { _id: '$customer', averageOrderValue: { $avg: '$amount' }, orderCount: { $sum: 1 } } },
  // $round is not an accumulator, so it cannot run inside $group —
  // round the already-computed average in a later $project stage.
  { $project: { _id: 1, orderCount: 1, averageOrderValue: { $round: ['$averageOrderValue', 2] } } },
  { $sort: { _id: 1 } },
]).toArray();
print('2. Average order value per customer:', avgValue);

// 3. Join orders to customers with $lookup, flatten the one-element
//    array with $unwind, and shape the output with $project.
const withNames = await orders.aggregate([
  {
    $lookup: {
      from: 'customers',
      localField: 'customer',
      foreignField: '_id',
      as: 'customerDoc',
    },
  },
  { $unwind: '$customerDoc' },
  {
    $project: {
      _id: 0,
      customerName: '$customerDoc.name',
      category: 1,
      amount: 1,
      status: 1,
    },
  },
  { $sort: { amount: -1 } },
]).toArray();
print('3. Orders with customer name ($lookup + $unwind):', withNames);

// 4. Compute a 10% discounted total with $addFields, first 3 orders only.
const discounted = await orders.aggregate([
  { $sort: { _id: 1 } },
  { $limit: 3 },
  { $addFields: { discountedTotal: { $multiply: ['$amount', 0.9] } } },
  { $project: { _id: 0, category: 1, amount: 1, discountedTotal: 1 } },
]).toArray();
print('4. First 3 orders with discounted total ($addFields):', discounted);

await client.close();
await mongod.stop();
await fs.rm(dbPath, { recursive: true, force: true });
console.log('DONE');

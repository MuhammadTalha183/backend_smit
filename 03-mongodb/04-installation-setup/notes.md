# 04 — Installation and Setup

## Table of Contents

- [1. Introduction](#1-introduction)
- [2. Definition of Important Concepts](#2-definition-of-important-concepts)
- [3. Detailed Explanations](#3-detailed-explanations)
- [4. How the Technology Works Internally](#4-how-the-technology-works-internally)
- [5. Architecture or Workflow](#5-architecture-or-workflow)
- [6. Real-World Examples](#6-real-world-examples)
- [7. Code Examples Where Applicable](#7-code-examples-where-applicable)
- [8. Step-by-Step Code Explanations](#8-step-by-step-code-explanations)
- [9. Common Misconceptions](#9-common-misconceptions)
- [10. Important Technical Terminology](#10-important-technical-terminology)
- [11. Summary](#11-summary)
- [12. Interview Questions and Answers](#12-interview-questions-and-answers)
- [13. References](#13-references)

---

## 1. Introduction

In the previous topics you learned what MongoDB is, how it differs from SQL databases, and how it is built inside. None of that matters until MongoDB is actually running somewhere your code can reach it. This topic is the practical start: getting a MongoDB server on your machine, talking to it from the shell, connecting from Node.js, and doing the same thing in the cloud with MongoDB Atlas.

Think of it like learning to drive. Topics 01–03 were the theory — what the engine is, how the gears work. This topic is getting the keys, starting the car, and checking the mirrors. You cannot learn database operations without a running database, and most beginners lose their first day to installation problems, not to database concepts. So we do installation carefully, once, and verify every step.

By the end of this topic you will be able to: install MongoDB on Windows, macOS, and Linux; start and stop the `mongod` server; use `mongosh` to run commands by hand; create a free Atlas cluster and connect to it; read and write a connection string; keep the connection string in an environment variable instead of in your code; and verify from Node.js that the connection actually works.

---

## 2. Definition of Important Concepts

| Concept | Definition |
|---|---|
| **MongoDB** | A document database: it stores data as JSON-like documents in collections, instead of rows in tables. |
| **`mongod`** | The MongoDB server process. It owns the data files, listens on a port (27017 by default), and answers queries. No `mongod` running means no database. |
| **`mongosh`** | The MongoDB Shell — a command-line tool for talking to a running `mongod`. You type JavaScript-like commands; it sends them to the server and prints results. |
| **MongoDB Compass** | The official graphical interface for MongoDB. It shows databases, collections, and documents in a window, and lets you run queries by clicking instead of typing. |
| **MongoDB Atlas** | MongoDB's managed cloud service. MongoDB runs the server for you on their machines; you get a connection string and connect over the internet. A free tier (M0) exists for learning. |
| **Connection string (URI)** | One line of text that tells a driver where the server is and how to log in, e.g. `mongodb://localhost:27017/schooldb`. |
| **`mongodb://` vs `mongodb+srv://`** | Two URI schemes. `mongodb://` lists the server address directly. `mongodb+srv://` (used by Atlas) looks the address up in DNS, so the string stays short even when the cluster has several servers. |
| **Database driver** | The library your code uses to talk to MongoDB — for Node.js it is the `mongodb` npm package. Your code never speaks the MongoDB wire protocol directly; the driver does. |
| **Environment variable** | A value set outside your code (in the shell, or in a `.env` file) that your code reads at runtime — the standard place for secrets like connection strings. |
| **Port 27017** | The default TCP port `mongod` listens on. `mongodb://localhost:27017` means "MongoDB on this machine, default port". |

---

## 3. Detailed Explanations

### 3.1 The three ways to run MongoDB

There are three ways to get a MongoDB server, and you will use all three at different times:

1. **Local install** — you install MongoDB on your own computer and run `mongod` yourself. Fastest for learning: no internet needed, no account, and you can break things freely. This is the default for this course.
2. **MongoDB Atlas (cloud)** — MongoDB runs the server for you. You create a free cluster on their website, allow your IP address, create a database user, and connect with a `mongodb+srv://` string. This is what real projects use, and what you use when your app is deployed or when teammates need the same database.
3. **In-memory server (for tests and demos)** — a package like `mongodb-memory-server` downloads a `mongod` binary once and starts a throwaway server in memory. Nothing is installed on your machine permanently, and the data disappears when the process stops. The examples in this module use this, so they run on any machine with no setup.

The rule of thumb: **local for learning, Atlas for real projects, in-memory for tests and demos.**

### 3.2 Installing MongoDB locally

**Windows.** Download the MongoDB Community Server `.msi` installer from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community). Run it, choose "Complete" setup, and tick "Install MongoDB as a Service" — that makes `mongod` start automatically with Windows. The installer also offers to install MongoDB Compass; accept it. After installing, open a terminal and run `mongosh` — if it connects, the server is running.

**macOS.** The easiest way is Homebrew:

```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

`brew services start` runs `mongod` in the background and restarts it when you log in. Check it with `mongosh`.

**Linux (Ubuntu/Debian).** MongoDB is not in the default Ubuntu repositories, so you add MongoDB's own repository, then install:

```bash
sudo apt-get install gnupg curl
curl -fsSL https://pgp.mongodb.com/server-8.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

(The exact version number in the URL changes over time — check the [official install docs](https://www.mongodb.com/docs/manual/administration/install-on-linux/) for the current one.) Verify with `mongosh` or `sudo systemctl status mongod`.

### 3.3 Starting and stopping `mongod`

`mongod` is just a program. When it runs, MongoDB exists; when it stops, it does not.

- **As a service (recommended):** Windows Service, `brew services`, or `systemctl start/stop mongod`. The server starts with your computer and runs in the background.
- **By hand:** run `mongod` in a terminal. It prints logs and keeps running until you stop it with Ctrl+C. By default it stores data in `/data/db` (macOS/Linux) or `C:\data\db` (Windows) — create that folder first, or pass `--dbpath` to choose another folder:

```bash
mongod --dbpath /path/to/my-data
```

Useful flags: `--port 27018` to listen on a different port, `--bind_ip 127.0.0.1` to accept only local connections (the safe default), `--logpath` to write logs to a file.

If `mongod` fails to start, the two usual reasons are: the data folder does not exist (or is not writable), or another `mongod` is already using port 27017.

### 3.4 `mongosh` — talking to the server by hand

`mongosh` is the MongoDB Shell. Run it with no arguments and it connects to `mongodb://localhost:27017`:

```bash
mongosh
```

Inside the shell you can try:

```javascript
db.version()                    // server version, e.g. "8.0.0"
show dbs                        // databases on this server
use schooldb                    // switch to (or create) a database
db.students.insertOne({ name: 'Talha', age: 21 })
db.students.find()              // read it back
```

`use <name>` does not create the database on disk immediately — MongoDB creates it lazily, on the first write. That is why `show dbs` does not list a database you only switched into. This is normal, and it confuses every beginner exactly once.

### 3.5 MongoDB Atlas — the cloud option

Atlas is free to start and takes about ten minutes to set up:

1. Create an account at [cloud.mongodb.com](https://cloud.mongodb.com/) and create a free **M0** cluster. Choose the region closest to you.
2. **Network Access:** add your IP address (or `0.0.0.0/0` for learning only — that allows connections from anywhere, so never use it for real data).
3. **Database Access:** create a database user with a username and password. This is *not* your Atlas login — it is the user your app logs in as.
4. Click **Connect → Drivers**, and copy the connection string. It looks like this:

```text
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/schooldb
```

Replace `<username>` and `<password>` with the database user you created. That string is a secret — it contains a password. Never commit it to git, never paste it into a chat, never put it in your code.

### 3.6 The connection string, piece by piece

```text
mongodb://localhost:27017/schooldb
│        │         │      │
│        │         │      └─ database name to use
│        │         └─ port (27017 is the default)
│         └─ host (localhost = this machine)
└─ scheme: mongodb:// for a direct address
```

With a username and password, the string grows a credentials section:

```text
mongodb://myuser:mypassword@localhost:27017/schooldb?authSource=admin
```

And the Atlas form uses the `+srv` scheme, where DNS does the address lookup:

```text
mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/schooldb
```

The query part after `?` holds options: `authSource=admin` (which database holds the user), `retryWrites=true`, `tls=true` for encrypted connections. You rarely type these by hand — Atlas gives you the finished string.

### 3.7 Keeping secrets out of your code

A connection string with a password is a secret. The rule is simple: **secrets live in environment variables, never in source code.**

In development, put them in a `.env` file at the project root:

```text
MONGODB_URI=mongodb://localhost:27017/schooldb
```

And read it in code:

```javascript
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/schooldb';
```

Then add `.env` to `.gitignore` so it is never committed. In production, set the real variable on the server or hosting platform (Vercel, Render, and others all have an environment-variables screen). The code stays the same everywhere — only the environment changes.

### 3.8 Compass — seeing your data

MongoDB Compass is the official GUI. Connect with the same connection string, and you see databases on the left, collections in the middle, and documents as readable JSON on the right. You can filter, sort, add, edit, and delete documents by clicking, and you can paste an aggregation pipeline and watch the result change live. For learning, Compass is the fastest way to *see* what your code just did — run your Node.js script, then refresh Compass and watch the documents appear.

### 3.9 Verifying the connection from Node.js

Installing the driver and connecting takes three lines:

```bash
npm install mongodb
```

```javascript
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/schooldb');
await client.connect();
await client.db('admin').command({ ping: 1 }); // { ok: 1 } means "alive"
```

The `ping` command is the standard health check: it asks the server "are you there?" and the server answers `{ ok: 1 }`. If `connect()` throws, the usual causes are: the server is not running, the host/port is wrong, or (for Atlas) your IP is not allowed or the password is wrong. The example in this topic (`examples/setup-demo.mjs`) does exactly this against a live server and prints the server version — run it and compare with `example.txt`.

---

## 4. How the Technology Works Internally

When your Node.js code calls `client.connect()`, this is what happens underneath:

1. **The driver parses the connection string.** It extracts the host(s), port, database name, username, password, and options.
2. **It opens TCP connections.** The driver keeps a *connection pool* — a small set of reusable sockets to the server (10 by default in the Node.js driver), instead of opening a new connection for every query. Opening a connection costs time; reusing one is nearly free.
3. **It authenticates.** The driver logs in with your username and password against the `authSource` database (default `admin` for Atlas users). If the credentials are wrong, the connection fails here with an authentication error.
4. **It discovers the topology.** For `mongodb+srv://`, the driver asks DNS for the real server addresses, then asks the servers which one is primary, which are secondaries, and whether this is a replica set or a single server. This is why Atlas strings stay short: the DNS record holds the whole cluster.
5. **Your commands travel as OP_MSG.** The driver encodes each command (a BSON document) into the MongoDB wire protocol and sends it over a pooled connection. The server executes it and sends a BSON reply back. Your code only ever sees JavaScript objects — the driver does all the encoding.

`mongod` itself stores data in files under its data directory (`/data/db` by default), using the WiredTiger storage engine. You never touch those files directly — only `mongod` reads and writes them, and only through the network protocol.

---

## 5. Architecture or Workflow

Setting up MongoDB, end to end:

```text
1. CHOOSE WHERE IT RUNS
   Local install (learning)  |  Atlas (real projects)  |  In-memory (tests/demos)
              │
2. START THE SERVER
   mongod as a service, or `mongod --dbpath ...` by hand
   (Atlas: nothing to start — MongoDB runs it for you)
              │
3. CHECK IT WITH THE SHELL
   mongosh → db.version() → use schooldb → insertOne → find
              │
4. GET THE CONNECTION STRING
   Local:  mongodb://localhost:27017/schooldb
   Atlas:  mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/schooldb
              │
5. STORE IT SAFELY
   .env file → MONGODB_URI=...  (and .env in .gitignore)
              │
6. CONNECT FROM NODE.JS
   npm install mongodb → new MongoClient(uri) → connect() → ping
              │
7. SEE IT IN COMPASS
   Paste the same string → browse databases, collections, documents
```

---

## 6. Real-World Examples

- **A student learning backend** installs MongoDB locally, runs `mongod`, and builds a to-do API against `mongodb://localhost:27017`. Nothing leaves their laptop.
- **A semester project team** creates one free Atlas cluster and shares the connection string through environment variables, so all three teammates and the deployed app use the same database.
- **A startup's staging environment** runs MongoDB in a Docker container with a fixed `--dbpath`, so the database can be thrown away and rebuilt with one command.
- **Automated tests** use `mongodb-memory-server`: each test file starts a fresh in-memory server, runs its tests, and stops it. No test ever touches the developer's real database, and tests can run in parallel without stepping on each other.
- **A production app** connects with `mongodb+srv://`, a username/password stored in the hosting platform's secrets, TLS on, and IP allowlisting so only the app servers can reach the database.

---

## 7. Code Examples Where Applicable

The runnable example for this topic is [`examples/setup-demo.mjs`](./examples/setup-demo.mjs). It prints the connection-string patterns, connects to a live server, pings it, prints the server version, and lists the databases on a fresh server. Its real output is in [`example.txt`](./examples/example.txt).

The core of it — connecting from Node.js — is three lines:

```javascript
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/schooldb');
await client.connect();
const result = await client.db('admin').command({ ping: 1 });
console.log(result); // { ok: 1 }
```

And the `.env` pattern for the secret:

```text
# .env — never commit this file
MONGODB_URI=mongodb://localhost:27017/schooldb
```

```javascript
// Read it in code. If the variable is missing, fall back to local MongoDB.
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/schooldb';
```

---

## 8. Step-by-Step Code Explanations

The example file, section by section:

1. **Imports (top of file).** The file uses `createRequire()` to load `mongodb` and `mongodb-memory-server`. That is only so the shared verification install resolves through `NODE_PATH` — ESM `import` ignores `NODE_PATH`. In your own project you run `npm install mongodb` and write `import { MongoClient } from 'mongodb'`. Everything else in the file is identical.
2. **Connection-string constants.** Three strings are printed: the local pattern, the Atlas pattern (with `<username>` and `<password>` as placeholders — never a real password), and the value read from `process.env.MONGODB_URI`, falling back to the local string. This is the whole secret-handling pattern in six lines.
3. **`MongoMemoryServer.create()`.** Starts a real `mongod` in memory and returns an object whose `getUri()` gives a connection string pointing at it. Your code then treats it exactly like any other MongoDB server.
4. **`new MongoClient(uri)` + `await client.connect()`.** Builds the client and opens the pooled connections. Nothing has been sent to the server yet except the handshake.
5. **`client.db('admin').command({ ping: 1 })`.** The health check. The reply `{ ok: 1 }` means the server is alive and answering.
6. **`command({ buildInfo: 1 })`.** Asks the server for its own version — printed as `Server version: 8.2.6` in the example output.
7. **`command({ listDatabases: 1 })`.** Lists the databases. A fresh server always has three system databases — `admin`, `config`, `local` — and no others until you write data.
8. **`await client.close()` + `await mongod.stop()`.** The clean shutdown. Forgetting these leaves the process hanging (open sockets and a running child process keep Node.js alive).

---

## 9. Common Misconceptions

- **"I installed MongoDB, so it is running."** Installing and running are different things. The installer puts the files on disk; `mongod` (as a service, or by hand) is what actually serves data. If `mongosh` says "connection refused", the server is not running.
- **"`use schooldb` created the database."** No — `use` only switches the shell's context. The database appears on disk (and in `show dbs`) only after the first document is written.
- **"Atlas is only for paid projects."** The M0 free tier is a real cluster with real limits (512 MB storage). It is enough for learning, semester projects, and small demos.
- **"The connection string goes in my code."** It goes in an environment variable. Code with a password in it is a leaked password the moment it reaches GitHub — and bots scan GitHub for connection strings within minutes.
- **"localhost and 127.0.0.1 are different servers."** They are the same machine. `localhost` is a name that resolves to `127.0.0.1`. If one works and the other does not, the problem is name resolution, not MongoDB.
- **"Compass is the database."** Compass is a *viewer*. It shows what `mongod` stores. Closing Compass does not stop the server, and deleting something in Compass deletes it from the real database.
- **"mongodb-memory-server is a fake database."** It is not. It downloads and runs the real `mongod` binary in memory. The only difference from a local install is where the data lives and how long it lasts.

---

## 10. Important Technical Terminology

| Term | Meaning |
|---|---|
| **`mongod`** | The MongoDB server process. |
| **`mongosh`** | The MongoDB Shell — command-line client. |
| **Compass** | The official MongoDB GUI. |
| **Atlas** | MongoDB's managed cloud hosting. |
| **Connection string / URI** | One line that tells a driver where the server is and how to log in. |
| **Driver** | The library (npm `mongodb` package) your code uses to talk to the server. |
| **Connection pool** | A set of reusable TCP connections the driver keeps open, so each query does not pay the cost of connecting. |
| **Replica set** | Several MongoDB servers holding the same data, so the database survives one server failing. Atlas free tier is a replica set of three. |
| **WiredTiger** | The storage engine `mongod` uses to write data files. |
| **`.env`** | A file holding environment variables for local development. Never committed to git. |
| **`authSource`** | The database that holds a user's credentials (usually `admin`). |
| **TLS/SSL** | Encryption for the connection between your code and the server. Atlas requires it. |

---

## 11. Summary

- MongoDB runs as a server process called `mongod` (port 27017 by default). Installing it is not the same as running it.
- `mongosh` is the shell for talking to the server by hand; Compass is the graphical way to see your data.
- Atlas is the cloud option: free M0 cluster, a `mongodb+srv://` connection string, and three setup steps — network access, database user, connect.
- A connection string has a scheme (`mongodb://` or `mongodb+srv://`), a host, a port, credentials, and a database name.
- Connection strings with passwords are secrets: they live in environment variables (`.env` locally), never in source code, never in git.
- From Node.js, connecting is `npm install mongodb`, `new MongoClient(uri)`, `connect()`, and a `ping` to prove it works. `mongodb-memory-server` gives you a throwaway real server for tests and demos.

---

## 12. Interview Questions and Answers

**1. How do you install MongoDB locally?**
Download the Community Server installer (Windows), `brew install mongodb-community` (macOS), or add MongoDB's apt repository and `apt-get install mongodb-org` (Ubuntu). Then start `mongod` as a service or by hand, and verify with `mongosh`.

**2. What is `mongod` and what is `mongosh`?**
`mongod` is the server process that owns the data and answers queries on port 27017. `mongosh` is the shell client you use to talk to it by hand. If `mongod` is not running, `mongosh` cannot connect.

**3. What is the default port of MongoDB, and can it change?**
27017. Yes — start `mongod` with `--port 27018` (and put `:27018` in the connection string).

**4. What is the difference between `mongodb://` and `mongodb+srv://`?**
`mongodb://` lists the server address directly. `mongodb+srv://` looks the address up in DNS, which is how Atlas gives you one short string for a whole cluster instead of listing every server.

**5. I ran `use mydb` but `show dbs` does not list it. Why?**
MongoDB creates databases lazily. `use` only switches context; the database is created on the first write. Insert one document and it appears.

**6. Where should the connection string live?**
In an environment variable (`MONGODB_URI`), set in a `.env` file locally and in the hosting platform's secrets in production. Never in source code and never committed to git.

**7. How do you check from Node.js that MongoDB is reachable?**
Connect with `MongoClient` and run `client.db('admin').command({ ping: 1 })`. A reply of `{ ok: 1 }` means the server is alive.

**8. What is MongoDB Atlas, and when would you use it instead of a local install?**
Atlas is MongoDB's managed cloud hosting. Use it when the app is deployed, when teammates share one database, or when you do not want to operate a server yourself. Local install is for learning and offline work.

**9. What is MongoDB Compass used for?**
It is the official GUI: browse databases, collections, and documents, run queries and aggregations visually, and inspect indexes. It is a viewer — the data still lives in `mongod`.

**10. What is `mongodb-memory-server` and why do the examples in this module use it?**
It starts a real `mongod` binary in memory for tests and demos. The examples use it so they run on any machine with no MongoDB install, and so every run starts from a clean, empty database.

**11. What happens if you forget `await client.close()`?**
The process keeps running: open sockets and the driver keep the Node.js event loop alive, so the script never exits.

**12. Why does Atlas ask you to allowlist an IP address?**
Atlas blocks all connections by default. Allowing your IP (or `0.0.0.0/0` for learning only) opens the firewall for your machine. It is the first thing to check when an Atlas connection fails with a timeout.

---

## 13. References

- MongoDB manual — install MongoDB — [https://www.mongodb.com/docs/manual/administration/install-on-linux/](https://www.mongodb.com/docs/manual/administration/install-on-linux/) and [https://www.mongodb.com/docs/manual/administration/install-community/](https://www.mongodb.com/docs/manual/administration/install-community/)
- MongoDB manual — `mongosh` — [https://www.mongodb.com/docs/mongodb-shell/](https://www.mongodb.com/docs/mongodb-shell/)
- MongoDB Atlas documentation — [https://www.mongodb.com/docs/atlas/](https://www.mongodb.com/docs/atlas/)
- MongoDB manual — connection strings — [https://www.mongodb.com/docs/manual/reference/connection-string/](https://www.mongodb.com/docs/manual/reference/connection-string/)
- MongoDB Compass — [https://www.mongodb.com/products/compass](https://www.mongodb.com/products/compass)
- Node.js MongoDB driver — [https://www.mongodb.com/docs/drivers/node/current/](https://www.mongodb.com/docs/drivers/node/current/)
- mongodb-memory-server — [https://github.com/nodkz/mongodb-memory-server](https://github.com/nodkz/mongodb-memory-server)

---

[← Main README](../../README.md) · Previous: [03 — MongoDB Architecture](../03-mongodb-architecture/README.md) · Next: [05 — Databases, Collections and Documents](../05-databases-collections-documents/README.md) · Module: [../README.md](../README.md)

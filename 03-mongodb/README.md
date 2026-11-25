# Module 03 — MongoDB

> **Repository:** Backend Development Journey — see the [Main README](../README.md).
> **Technology:** JavaScript, Node.js, MongoDB, Mongoose
> **Learning approach:** Learn → Understand → Implement → Build → Document → Share.
>
> This module is Phase 03. It replaces the original Phase 03 plan (PostgreSQL) — this journey now learns MongoDB first, because the semester project and the practical work ahead use a document database. It assumes Modules 01 and 02 — you already know Node.js inside and how to build an Express API, so here you learn where the data lives. Start with topic 01 and follow the topics in order — each topic builds on the one before it.

---

## Table of Contents

- [1. Module Overview](#1-module-overview)
- [2. Learning Objectives](#2-learning-objectives)
- [3. Prerequisites](#3-prerequisites)
- [4. Topics Covered](#4-topics-covered)
- [5. Module Roadmap](#5-module-roadmap)
- [6. Folder Structure](#6-folder-structure)
- [7. Practical Learning Activities](#7-practical-learning-activities)
- [8. Exercises and Assessments](#8-exercises-and-assessments)
- [9. Important Diagrams](#9-important-diagrams)
- [10. Learning Progress Checklist](#10-learning-progress-checklist)
- [11. Completion Requirements](#11-completion-requirements)
- [12. References and Resources](#12-references-and-resources)

---

## 1. Module Overview

MongoDB is a document database. Instead of tables and rows, it stores JSON-like documents in collections — flexible, nested, and close to the objects you already use in JavaScript. That closeness is the whole point: the shape of your data in code and the shape of your data in the database finally match.

You will learn:

- What MongoDB is, and what a document database means in practice.
- SQL vs NoSQL — an honest comparison, and how to pick the right one.
- How MongoDB works inside: `mongod`, storage, replica sets, sharding, BSON.
- How to install MongoDB, connect with a connection string, and use Atlas and Compass.
- Databases, collections, and documents — and the BSON types inside them.
- CRUD operations: the everyday read and write of every backend.
- Query operators: filtering, arrays, regex, projection, sorting, pagination.
- Schema design: embedding vs referencing, and the rules of thumb that decide it.
- Relationships in a schemaless world: one-to-one, one-to-many, many-to-many, `$lookup`.
- Indexing: making queries fast, and knowing what indexes cost.
- Aggregation: pipelines that turn raw documents into reports.
- Node.js integration: the official driver, pooling, and clean connection code.
- Mongoose: schemas, models, validation, and population — the ODM answer to the ORM idea.
- A practical project: a complete tasks API — Express + MongoDB, end to end.

This module is written for beginners learning MongoDB from scratch, for developers revising backend fundamentals, for future contributors to this repository, and for AI assistants using this repository as a learning reference.

**A topic is not complete until its concepts, practical implementation, exercises, and documentation are covered.**

---

## 2. Learning Objectives

By the end of this module, you will be able to:

- Explain what MongoDB is, why it exists, and where it fits in the stack.
- Compare SQL and NoSQL honestly and choose the right one for a given problem.
- Explain how MongoDB stores data — BSON, WiredTiger, replica sets, sharding.
- Install MongoDB, connect with `mongosh` and with a connection string, and use Atlas.
- Design collections and documents, and choose BSON types correctly.
- Perform full CRUD with the Node.js driver, and read the result counts properly.
- Write queries with operators, projection, sorting, and pagination.
- Design a schema: decide embed vs reference, and defend the choice.
- Model one-to-one, one-to-many, and many-to-many relationships, with `$lookup` where needed.
- Create and choose indexes, and read `explain()` output.
- Build aggregation pipelines for real reports.
- Integrate MongoDB into a Node.js app with pooling and clean error handling.
- Use Mongoose: schemas, models, validation, hooks, virtuals, and population.
- Build a complete API backed by MongoDB, from scratch.
- Explain each of these ideas in your own words, with a real example — not by memorising definitions.

---

## 3. Prerequisites

- **Modules 01 and 02 — Node.js Fundamentals and Express.js — completed.** MongoDB is used through Node.js and Express; this module does not re-teach either.
- **Core JavaScript fundamentals — completed.**
- **Node.js installed** — the LTS (Long-Term Support) version from [https://nodejs.org/](https://nodejs.org/). Check it with:
  ```bash
  node --version
  npm --version
  ```
- MongoDB — installed locally (see topic 04) or a free MongoDB Atlas cluster. A terminal and a code editor. No other tools are needed for this module.

---

## 4. Topics Covered

| # | Topic | Priority | Status | Folder |
|---|-------|----------|--------|--------|
| 01 | Introduction to MongoDB | ⭐ Start here | ✅ Notes, examples, exercises done | [01-introduction/](./01-introduction/) |
| 02 | SQL vs NoSQL | 🔴 High | ✅ Notes, examples, exercises done | [02-sql-vs-nosql/](./02-sql-vs-nosql/) |
| 03 | MongoDB Architecture | 🔴 High | ✅ Notes, examples, exercises done | [03-mongodb-architecture/](./03-mongodb-architecture/) |
| 04 | Installation and Setup | 🔴 High | ✅ Notes, examples, exercises done | [04-installation-setup/](./04-installation-setup/) |
| 05 | Databases, Collections and Documents | 🔴 High | ✅ Notes, examples, exercises done | [05-databases-collections-documents/](./05-databases-collections-documents/) |
| 06 | CRUD Operations | 🔴 High | ✅ Notes, examples, exercises done | [06-crud-operations/](./06-crud-operations/) |
| 07 | Query Operators | 🔴 High | ✅ Notes, examples, exercises done | [07-query-operators/](./07-query-operators/) |
| 08 | Schema Design | 🔴 High | ✅ Notes, examples, exercises done | [08-schema-design/](./08-schema-design/) |
| 09 | Relationships | 🔴 High | ✅ Notes, examples, exercises done | [09-relationships/](./09-relationships/) |
| 10 | Indexing | 🔴 High | ✅ Notes, examples, exercises done | [10-indexing/](./10-indexing/) |
| 11 | Aggregation | 🔴 High | ✅ Notes, examples, exercises done | [11-aggregation/](./11-aggregation/) |
| 12 | Node.js Integration | 🔴 High | ✅ Notes, examples, exercises done | [12-nodejs-integration/](./12-nodejs-integration/) |
| 13 | Mongoose | 🔴 High | ✅ Notes, examples, exercises done | [13-mongoose/](./13-mongoose/) |
| 14 | Practical Project | 🔴 High | ✅ Notes, examples, exercises done | [14-practical-project/](./14-practical-project/) |

"Done" in this table means the **documentation** for that topic is written and its example has been run and verified. It does **not** mean you have learned it — see [Section 10](#10-learning-progress-checklist): tick a lesson only after you have run its examples and done its exercises yourself.

---

## 5. Module Roadmap

```text
01 Introduction to MongoDB
        ↓  document database, why it exists, first document
02 SQL vs NoSQL
        ↓  tables vs documents, ACID vs BASE, when to pick each
03 MongoDB Architecture
        ↓  mongod, WiredTiger, replica sets, sharding, BSON
04 Installation and Setup
        ↓  local install, Atlas, connection strings, Compass
05 Databases, Collections and Documents
        ↓  database → collection → document, BSON types, ObjectId
06 CRUD Operations
        ↓  insert, find, update, delete, counts
07 Query Operators
        ↓  comparison, logical, array, regex, projection, pagination
08 Schema Design
        ↓  embed vs reference, six rules of thumb, validation
09 Relationships
        ↓  1:1, 1:N, M:N, $lookup, orphans
10 Indexing
        ↓  single, compound, text, unique, TTL, explain()
11 Aggregation
        ↓  pipelines, $match, $group, $lookup, reports
12 Node.js Integration
        ↓  driver, pooling, env config, clean errors
13 Mongoose
        ↓  schemas, models, validation, hooks, populate
14 Practical Project
        ↓  Express + MongoDB tasks API, end to end
        ↓
Phase 04 — Authentication and Authorization
```

The roadmap is flexible. A topic that is too large for one folder is split into parts — never compressed or skipped.

---

## 6. Folder Structure

Every topic folder follows the same structure, so any developer can follow it without confusion:

```text
03-mongodb/
│
├── README.md                  # This file — module overview
├── resources.md               # References and further reading
│
├── diagrams/
│   ├── document-model.md
│   ├── sql-vs-nosql.md
│   ├── replica-set-and-sharding.md
│   ├── embed-vs-reference.md
│   └── aggregation-pipeline.md
│
├── 01-introduction/
│   ├── README.md              # Short lesson overview — start here
│   ├── notes.md               # Full notes (13 sections)
│   ├── examples/
│   │   ├── intro-demo.mjs
│   │   └── example.txt        # Real output of intro-demo.mjs
│   └── exercises.md           # 5 exercises, no solutions
│
├── 02-sql-vs-nosql/
│   ├── README.md
│   ├── notes.md
│   ├── examples/
│   │   ├── sql-vs-nosql.mjs
│   │   └── example.txt
│   └── exercises.md
│
├── 03-mongodb-architecture/
│   ├── README.md
│   ├── notes.md
│   ├── examples/
│   │   ├── architecture-demo.mjs
│   │   └── example.txt
│   └── exercises.md
│
├── 04-installation-setup/
│   ├── README.md
│   ├── notes.md
│   ├── examples/
│   │   ├── setup-demo.mjs
│   │   └── example.txt
│   └── exercises.md
│
├── 05-databases-collections-documents/
│   ├── README.md
│   ├── notes.md
│   ├── examples/
│   │   ├── documents-demo.mjs
│   │   └── example.txt
│   └── exercises.md
│
├── 06-crud-operations/
│   ├── README.md
│   ├── notes.md
│   ├── examples/
│   │   ├── crud-demo.mjs
│   │   └── example.txt
│   └── exercises.md
│
├── 07-query-operators/
│   ├── README.md
│   ├── notes.md
│   ├── examples/
│   │   ├── query-operators.mjs
│   │   └── example.txt
│   └── exercises.md
│
├── 08-schema-design/
│   ├── README.md
│   ├── notes.md
│   ├── examples/
│   │   ├── schema-design.mjs
│   │   └── example.txt
│   └── exercises.md
│
├── 09-relationships/
│   ├── README.md
│   ├── notes.md
│   ├── examples/
│   │   ├── relationships.mjs
│   │   └── example.txt
│   └── exercises.md
│
├── 10-indexing/
│   ├── README.md
│   ├── notes.md
│   ├── examples/
│   │   ├── indexing.mjs
│   │   └── example.txt
│   └── exercises.md
│
├── 11-aggregation/
│   ├── README.md
│   ├── notes.md
│   ├── examples/
│   │   ├── aggregation.mjs
│   │   └── example.txt
│   └── exercises.md
│
├── 12-nodejs-integration/
│   ├── README.md
│   ├── notes.md
│   ├── examples/
│   │   ├── node-integration.mjs
│   │   └── example.txt
│   └── exercises.md
│
├── 13-mongoose/
│   ├── README.md
│   ├── notes.md
│   ├── examples/
│   │   ├── mongoose-demo.mjs
│   │   └── example.txt
│   └── exercises.md
│
└── 14-practical-project/
    ├── README.md
    ├── notes.md
    ├── examples/
    │   ├── tasks-api.mjs
    │   └── example.txt
    └── exercises.md
```

**Rules for the structure:**

- Create a folder only when we reach that topic. No empty placeholder folders.
- Every topic has a short `README.md` (overview + links), a full `notes.md`, runnable `examples/`, and an `exercises.md`.
- Every `notes.md` follows the same 13 sections: Introduction, Definitions, Detailed explanations, How it works internally, Architecture/workflow, Real-world examples, Code examples, Step-by-step code explanations, Common misconceptions, Terminology, Summary, Interview questions and answers, References.
- Never link to a topic folder that does not exist yet — use plain text "(coming next)" until it is created.

---

## 7. Practical Learning Activities

For every topic, follow the same method — Learn → Understand → Implement → Build → Document → Share:

1. **Read the lesson README** — what the topic is, and what you will be able to do after it.
2. **Read `notes.md` section by section** — from simple to technical. Do not skip the diagrams; they carry the mental model.
3. **Run the example** from inside the topic folder. The examples run against a real MongoDB (an in-memory server started by the example itself), so you need the packages installed once in your own project:
   ```bash
   npm install mongodb
   node examples/intro-demo.mjs
   ```
   Compare your output with `examples/example.txt`. The examples use fixed ObjectIds, so the output should match exactly — if it does not, re-read the code before moving on.
4. **Break it on purpose** — change one line, predict the output, run it. This is where understanding is built.
5. **Do the exercises** in `exercises.md` — no solutions are given on purpose.
6. **Explain it out loud** — in your own words, with one real example. If you cannot, go back to `notes.md`.

---

## 8. Exercises and Assessments

Each topic's `exercises.md` has 5 exercises, grouped as:

- **Basic understanding** — can you run it and describe what happened?
- **Conceptual questions** — can you explain *why* it works that way?
- **Practical coding exercises** — can you write it yourself?
- **Scenario-based questions** — can you apply it to a real situation?
- **Interview-style questions** — can you answer it out loud, in your own words? (Short answers are in `notes.md` §12 — attempt first, then check.)

There is no separate answer file. The exercise *is* the learning.

---

## 9. Important Diagrams

The diagrams live in [`diagrams/`](./diagrams/) — each file has a Mermaid diagram with an explanation underneath, written for beginners:

| Diagram | What it explains | File |
|---------|-----------------|------|
| Document Model | Database → collection → document, and BSON types | [document-model.md](./diagrams/document-model.md) |
| SQL vs NoSQL | Tables vs documents, and when to pick each | [sql-vs-nosql.md](./diagrams/sql-vs-nosql.md) |
| Replica Set and Sharding | How MongoDB scales and stays available | [replica-set-and-sharding.md](./diagrams/replica-set-and-sharding.md) |
| Embed vs Reference | The schema design decision, with the rules of thumb | [embed-vs-reference.md](./diagrams/embed-vs-reference.md) |
| Aggregation Pipeline | Documents flowing through pipeline stages | [aggregation-pipeline.md](./diagrams/aggregation-pipeline.md) |

The same diagrams also appear inside the relevant `notes.md` files, next to the text that explains them.

---

## 10. Learning Progress Checklist

Tick a box only after **you** have done that step — not when the notes were generated.

### 01 — Introduction to MongoDB

- [ ] Lesson explained (read `notes.md`).
- [ ] Technical notes prepared (read and understood).
- [ ] Important diagrams included (reviewed — see §9).
- [ ] Practical examples documented (ran `examples/intro-demo.mjs`).
- [ ] Exercises prepared (did all 5 in `exercises.md`).
- [ ] Interview questions included (answered out loud).
- [ ] Documentation reviewed.

### 02 — SQL vs NoSQL

- [ ] Lesson explained.
- [ ] Technical notes prepared.
- [ ] Important diagrams included.
- [ ] Practical examples documented (ran `examples/sql-vs-nosql.mjs`).
- [ ] Exercises prepared.
- [ ] Interview questions included.
- [ ] Documentation reviewed.

### 03 — MongoDB Architecture

- [ ] Lesson explained.
- [ ] Technical notes prepared.
- [ ] Important diagrams included.
- [ ] Practical examples documented (ran `examples/architecture-demo.mjs`).
- [ ] Exercises prepared.
- [ ] Interview questions included.
- [ ] Documentation reviewed.

### 04 — Installation and Setup

- [ ] Lesson explained.
- [ ] Technical notes prepared.
- [ ] Important diagrams included.
- [ ] Practical examples documented (ran `examples/setup-demo.mjs`).
- [ ] Exercises prepared.
- [ ] Interview questions included.
- [ ] Documentation reviewed.

### 05 — Databases, Collections and Documents

- [ ] Lesson explained.
- [ ] Technical notes prepared.
- [ ] Important diagrams included.
- [ ] Practical examples documented (ran `examples/documents-demo.mjs`).
- [ ] Exercises prepared.
- [ ] Interview questions included.
- [ ] Documentation reviewed.

### 06 — CRUD Operations

- [ ] Lesson explained.
- [ ] Technical notes prepared.
- [ ] Important diagrams included.
- [ ] Practical examples documented (ran `examples/crud-demo.mjs`).
- [ ] Exercises prepared.
- [ ] Interview questions included.
- [ ] Documentation reviewed.

### 07 — Query Operators

- [ ] Lesson explained.
- [ ] Technical notes prepared.
- [ ] Important diagrams included.
- [ ] Practical examples documented (ran `examples/query-operators.mjs`).
- [ ] Exercises prepared.
- [ ] Interview questions included.
- [ ] Documentation reviewed.

### 08 — Schema Design

- [ ] Lesson explained.
- [ ] Technical notes prepared.
- [ ] Important diagrams included.
- [ ] Practical examples documented (ran `examples/schema-design.mjs`).
- [ ] Exercises prepared.
- [ ] Interview questions included.
- [ ] Documentation reviewed.

### 09 — Relationships

- [ ] Lesson explained.
- [ ] Technical notes prepared.
- [ ] Important diagrams included.
- [ ] Practical examples documented (ran `examples/relationships.mjs`).
- [ ] Exercises prepared.
- [ ] Interview questions included.
- [ ] Documentation reviewed.

### 10 — Indexing

- [ ] Lesson explained.
- [ ] Technical notes prepared.
- [ ] Important diagrams included.
- [ ] Practical examples documented (ran `examples/indexing.mjs`).
- [ ] Exercises prepared.
- [ ] Interview questions included.
- [ ] Documentation reviewed.

### 11 — Aggregation

- [ ] Lesson explained.
- [ ] Technical notes prepared.
- [ ] Important diagrams included.
- [ ] Practical examples documented (ran `examples/aggregation.mjs`).
- [ ] Exercises prepared.
- [ ] Interview questions included.
- [ ] Documentation reviewed.

### 12 — Node.js Integration

- [ ] Lesson explained.
- [ ] Technical notes prepared.
- [ ] Important diagrams included.
- [ ] Practical examples documented (ran `examples/node-integration.mjs`).
- [ ] Exercises prepared.
- [ ] Interview questions included.
- [ ] Documentation reviewed.

### 13 — Mongoose

- [ ] Lesson explained.
- [ ] Technical notes prepared.
- [ ] Important diagrams included.
- [ ] Practical examples documented (ran `examples/mongoose-demo.mjs`).
- [ ] Exercises prepared.
- [ ] Interview questions included.
- [ ] Documentation reviewed.

### 14 — Practical Project

- [ ] Lesson explained.
- [ ] Technical notes prepared.
- [ ] Important diagrams included.
- [ ] Practical examples documented (ran `examples/tasks-api.mjs`).
- [ ] Exercises prepared.
- [ ] Interview questions included.
- [ ] Documentation reviewed.

---

## 11. Completion Requirements

This module is complete when **all** of these are true:

- [ ] Every topic 01–14 has a short README, full `notes.md`, verified examples, and exercises.
- [ ] Every example runs and its output matches `example.txt`.
- [ ] Every exercise in every `exercises.md` has been attempted.
- [ ] You can explain the six key ideas in your own words: documents, embed vs reference, indexing, aggregation, the driver, Mongoose.
- [ ] You can trace one write through MongoDB — driver → mongod → WiredTiger → disk — without looking at the notes.
- [ ] You can build a small API backed by MongoDB from scratch: schema, CRUD, validation, and aggregation.

A topic is not complete because its notes exist. It is complete when you understand it, can run it, and can explain it.

---

## 12. References and Resources

See [`resources.md`](./resources.md) for the full list — official MongoDB documentation, the Node.js driver, Mongoose, and Atlas.

Key references used while writing these notes:

- MongoDB documentation — [https://www.mongodb.com/docs/](https://www.mongodb.com/docs/)
- MongoDB manual — CRUD — [https://www.mongodb.com/docs/manual/crud/](https://www.mongodb.com/docs/manual/crud/)
- MongoDB aggregation — [https://www.mongodb.com/docs/manual/aggregation/](https://www.mongodb.com/docs/manual/aggregation/)
- Node.js MongoDB driver — [https://www.mongodb.com/docs/drivers/node/current/](https://www.mongodb.com/docs/drivers/node/current/)
- Mongoose documentation — [https://mongoosejs.com/docs/](https://mongoosejs.com/docs/)

---

[← Main README](../README.md) · [Previous: Module 02 — Express.js](../02-expressjs/README.md) · [Next: 01 — Introduction to MongoDB →](./01-introduction/README.md)

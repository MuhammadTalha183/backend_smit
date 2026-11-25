# 10 — REST APIs

> **Priority:** 🔴 High
> **Previous topic:** [09 — Validation](../09-validation/README.md)
> **Next topic:** [11 — Configuration](../11-configuration/README.md)

A REST API is a contract: resources with stable URLs, the right HTTP method and status code for every action, one response shape everywhere, and pagination so no request ever returns the whole table. Topics 04–09 were the pieces — routing, request/response, middleware, controllers, error handling, validation — this topic is how they fit together into one clean API that a React web app and a React Native mobile app can both use.

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain REST and the four constraints that shape daily API work.
- Name resources as nouns and pick the right HTTP method for each action.
- Use the right status code — 200, 201, 204, 400, 401, 403, 404, 500 — and say why.
- Design the six endpoints for any resource, with pagination, filtering and sorting.
- Version an API (`/api/v1/...`) so it can change without breaking old clients.
- Wrap every response in one envelope (`{ success, data }` / `{ success: false, error }`).
- Assemble routing, middleware, controllers, validation and error handling into one API.
- Explain idempotency and the N+1 problem, and when raw SQL or GraphQL beats REST.

## Topics Covered

- REST principles and the six constraints (statelessness, uniform interface, cacheability)
- Resource naming — nouns, not verbs; plural collections; one level of nesting
- HTTP methods — GET, POST, PUT, PATCH, DELETE, and what each one guarantees
- Status codes done right — the ten codes you actually need
- Designing routes for a real resource (posts: six endpoints)
- Pagination, filtering, sorting, searching — `?page&limit&userId&sort&search`
- API versioning — `/api/v1/...` and how to evolve without breaking clients
- The response envelope — one success shape, one error shape
- Putting topics 04–09 together into one clean API
- REST vs GraphQL vs gRPC vs WebSockets — when each one wins

## Links

- **Notes:** [notes.md](./notes.md) — full detailed notes, diagrams, and interview questions with answers
- **Examples:** [examples/](./examples/) — run [`rest-api.js`](./examples/rest-api.js), expected output in [`example.txt`](./examples/example.txt)
- **Exercises:** [exercises.md](./exercises.md) — 5 practice tasks, no solutions
- **Module README:** [02 — Express.js](../README.md)

**How to run the examples:**

```bash
NODE_PATH=/tmp/express-verify/node_modules node examples/rest-api.js
```

> The example server listens on an ephemeral port, calls its own routes, prints the responses and exits by itself — no manual `curl` needed.

## Key Takeaways

- Nouns for URLs, methods for actions: `GET /posts`, `POST /posts`, `DELETE /posts/5` — never `/getPosts` or `/deletePost/5`.
- The right status code matters: 201 + `Location` for creation, 204 for delete, 400 for bad input, 404 for missing, 500 only for real server bugs.
- One envelope everywhere (`{ success, data }` / `{ success: false, error }`) so both frontends handle every endpoint the same way.
- Paginate every list and cap `limit` — an unpaginated list endpoint is a bug waiting for data.
- Version from day one (`/api/v1/...`); add fields, never rename or remove them in a released version.
- Topics 04–09 are the pieces. This topic is the assembled API — and it is the backend your two frontends will share.

---

[← Main README](../../README.md) · Previous: [09 — Validation](../09-validation/README.md) · Next: [11 — Configuration](../11-configuration/README.md)

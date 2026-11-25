# 07 — Controllers — Notes

> Phase 02 — Express.js · Topic 07 · Priority: 🔴 High
> Previous: [06 — Middleware](../06-middleware/README.md) · Next: [08 — Error Handling](../08-error-handling/README.md)

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

## 1. Introduction

Every Express app starts the same way: a route and a handler function sitting together in one file.

```js
app.get('/users', (req, res) => {
  // ... twenty lines of logic ...
  res.json(users);
});
```

That is fine for a demo. It breaks down the moment the app grows, because the route file quietly becomes three different jobs at once: it defines the URLs, it holds the logic for every endpoint, and it becomes the file everyone edits — which means it becomes the file where merge conflicts and bugs live.

A controller is the standard answer. It is a plain function (or a small module of functions) that handles one endpoint. The route file keeps only the mapping — URL plus method plus which function handles it — and the controller file holds the work. Nothing about how Express works changes. The code just lives in the right place.

This topic is the first step toward a real project structure. Topics 06 (middleware) gave us reusable request processing; topic 07 gives us reusable request handling. Together they are what makes an Express app readable at 50 routes instead of only at 5.

## 2. Definition of Important Concepts

**Controller**
A function that handles one endpoint: it receives `(req, res, next)`, does the work for that request, and sends a response. In a controller file, controllers are usually grouped by resource — all the user controllers in `userController.js`, all the post controllers in `postController.js`.

**Route (route definition)**
The mapping between a URL + HTTP method and a handler: `app.get('/users', listUsers)`. After controllers exist, a route is one line. It contains no logic.

**Thin routes**
The rule that route files contain only mappings — no database calls, no validation logic, no calculations. If you can read the route file top to bottom and understand the whole API in a minute, the routes are thin enough.

**Fat controller**
The trap that comes next: moving all the logic into controllers until each controller is 200 lines long. A fat controller is the same mess as a fat route file, moved one folder over. The cure is the service layer (below).

**Service layer**
The layer that holds real business logic — talking to the database, applying rules, combining data. Controllers call services; services do not know about `req` or `res`. In a small app the controller can do simple work directly; in a real app, the controller is a thin translator between HTTP and the service layer.

**Resource**
A thing the API manages — users, posts, orders. Controllers, routes, and services are all organized by resource, so a change to users touches the user files and nothing else.

**Handler signature `(req, res, next)`**
Every controller is Express middleware with the same signature: `req` (the request), `res` (the response), `next` (pass control — or an error — onward). A controller that calls `next(err)` hands the problem to the error handler from topic 08.

## 3. Detailed Explanations

### 3.1 Routes vs controllers — where each kind of code belongs

Think of the request as a letter arriving at an office. The route is the receptionist: it reads the address on the envelope and sends the letter to the right desk. The controller is the person at the desk who does the actual work. The receptionist does not open the letter and do the work, and the desk worker does not stand at the door deciding where letters go.

Before controllers, one file was both receptionist and desk worker. After controllers, the split is:

```js
// routes/users.js — only mappings
router.get('/', listUsers);
router.get('/:id', getUser);
router.post('/', createUser);
router.delete('/:id', deleteUser);
```

```js
// controllers/userController.js — only the work
function listUsers(req, res) { /* ... */ }
function getUser(req, res) { /* ... */ }
function createUser(req, res) { /* ... */ }
function deleteUser(req, res) { /* ... */ }
```

The route file now reads like a table of contents for the API. The controller file reads like the work itself. Each file has one reason to change.

### 3.2 One controller per endpoint, one job per controller

A controller should do exactly the job of its endpoint and nothing else. `getUser` finds one user and returns it, or answers 404. It does not also list users, send emails, or check permissions — those are other jobs, belonging to other functions or to middleware.

Signs a controller is doing too much:

- It is longer than about 30–40 lines.
- It has more than one "and then" in its description ("find the user *and then* check their subscription *and then* send a welcome email").
- You cannot name it with one verb phrase (`createUser` is a job; `handleUserStuff` is a warning sign).

The fix is never to put the extra work back in the route. The fix is to split the controller or move the extra work into a service function the controller calls.

### 3.3 Thin routes — and why "fat controllers" are the next trap

"Thin routes" is only half the rule. Beginners move 200 lines out of the route file into a controller, feel proud, and now have a 200-line controller. The mess moved; it did not shrink.

The full shape of a real backend is three layers:

1. **Routes** — map URLs to controllers. No logic.
2. **Controllers** — translate HTTP into service calls. Read `req`, call a service, answer with `res`. No database code, no business rules.
3. **Services** — the business logic and the database. No `req`, no `res`, no HTTP at all. A service function can be called from a controller, a test, or a background job.

For this phase of the journey, layers 1 and 2 are enough — the example in this topic keeps a tiny in-memory array in the controller file as a stand-in for a service. From Phase 03 (databases) onward, the service layer becomes real: controllers will call service functions, and service functions will talk to PostgreSQL.

### 3.4 Controllers and the request/response cycle

A controller sits in the middle of the request/response cycle, after routing and after any middleware (authentication, validation, logging). By the time a controller runs:

- `req.params` holds the route parameters (`/users/:id` → `req.params.id`).
- `req.query` holds the query string (`/users?page=2` → `req.query.page`).
- `req.body` holds the parsed JSON body (if `express.json()` ran first).
- Anything earlier middleware attached (for example `req.user` from an auth middleware) is available.

The controller's job is to use those inputs, do the work, and end the request with exactly one response: `res.json(...)`, `res.status(201).json(...)`, or `res.sendStatus(...)`. A controller that sends two responses — for example forgetting to `return` after a 404 and then also sending the success response — produces the classic error `Cannot set headers after they are sent to the client`. The rule: every path through a controller ends in exactly one response, and `return` after every early response.

### 3.5 Async controllers and error forwarding

Most real controllers are async — they wait on a database. An async controller looks like this:

```js
async function getUser(req, res) {
  const user = await userService.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
}
```

What happens if `findById` rejects — the database is down? That depends on the Express version:

- **Express 5** (what this repo uses): a rejected promise in an async handler is forwarded to the error-handling middleware automatically. No try/catch is needed in the controller.
- **Express 4**: the rejection is *not* caught. The request hangs and the process may crash. Every async controller needed a try/catch that calls `next(err)`, or a wrapper function like `const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next)`.

You will still see the Express 4 wrapper in tutorials and older codebases, so recognize it when you see it — but in Express 5 you do not need it. What you must never do in either version is let an async error go unhandled: an unhandled rejection is a crashed server.

### 3.6 Organizing controllers by resource

The standard layout, and the one this repo uses from here on:

```
src/
  routes/
    users.js        # router: URLs -> controllers
    posts.js
  controllers/
    userController.js
    postController.js
  services/
    userService.js  # from Phase 03 onward
```

One file per resource, one function per endpoint, function names that match the endpoint: `listUsers`, `getUser`, `createUser`, `updateUser`, `deleteUser`. When a new developer joins the project, they find the user logic in exactly one predictable place.

### 3.8 Testing controllers — the payoff of the split

A controller kept separate from the route file is easy to test, and that is one of the main reasons the pattern exists. A controller is a function of `(req, res)` — so a test can call it with a fake `req` and a fake `res` and check what it answers, without starting a server at all:

```js
// A fake res that records what the controller answers
const res = { statusCode: 0, body: null,
  status(code) { this.statusCode = code; return this; },
  json(data) { this.body = data; return this; } };

getUser({ params: { id: '1' } }, res);
// res.statusCode === 200, res.body.id === 1
```

When the controller is inline in the route file, the only way to test it is to start the whole server and make HTTP requests. When it is a separate module, the logic can be tested in isolation — and the route file itself is so thin there is almost nothing in it left to test. This is also why the service layer matters for testing: a controller that calls a service can be tested with a fake service, so tests never need a real database.

### 3.9 What controllers must never do

- **Hold state between requests.** A controller module must not keep request-specific data in module-level variables that change per request. (The example's in-memory `users` array is a deliberate stand-in for a database, not a pattern to copy.)
- **Decide HTTP plumbing.** Status codes and JSON shapes, yes. CORS headers, body parsing, logging — no, that is middleware's job.
- **Talk to the database directly in a big app.** That is the service layer's job; the controller calls a service function. In a tiny app or a learning example, direct access is acceptable — and that is where the line is: acceptable while learning, a smell in production code.
- **Render views or build HTML.** In an API, controllers answer JSON. (In a server-rendered app they would render a template — same principle, one response per request.)

## 4. How the Technology Works Internally

When a request arrives, Express walks the middleware stack in registration order. Routing matches the URL and method, then calls the matched handler — which is now a controller function imported from another file.

```
Request  GET /users/1
   │
   ▼
express.json()          ← middleware: parses the body (topic 06)
   │
   ▼
Router: GET /users/:id  ← route file: matches, calls getUser
   │
   ▼
getUser(req, res)        ← controller: finds user 1, res.json(user)
   │
   ▼
Response  200 {"id":1,"name":"Talha",...}
```

There is no magic here and no special Express feature for controllers. A controller is an ordinary function with the middleware signature `(req, res, next)`, stored in a separate module and `require`d by the route file. The entire pattern is a file-organization decision — which is exactly why it matters so much: the hardest bugs in a growing backend are usually "where does this code live?" bugs, not algorithm bugs.

If a controller throws (sync) or rejects (async, Express 5), Express stops the normal stack and jumps to the first error-handling middleware — four arguments `(err, req, res, next)` — which is topic 08.

## 5. Architecture or Workflow

The workflow for adding a new endpoint, from now on:

```
1. Decide the resource and the endpoint
   e.g. POST /posts — create a post
        │
2. Write the controller first (controllers/postController.js)
   function createPost(req, res) { ... }
        │
3. Register ONE line in the route file (routes/posts.js)
   router.post('/', createPost);
        │
4. If the controller grows past ~40 lines, extract a service
   services/postService.js — database + rules
   controller calls the service, nothing else
        │
5. Test the endpoint (curl, Postman, or the self-test pattern
   in the examples: fetch your own routes, print, exit)
```

And the file layout of a growing Express app:

```
backend/
  src/
    app.js               # creates the app, mounts routers + middleware
    server.js            # listens on a port (kept separate so tests can import app)
    routes/
      users.js
      posts.js
    controllers/
      userController.js
      postController.js
    services/
      userService.js
      postService.js
    middleware/
      auth.js
      validate.js
      errorHandler.js    # topic 08
```

This layout is the shape every backend you build in this journey will follow — the semester project included.

## 6. Real-World Examples

- **A blog API.** `GET /posts` lists posts, `POST /posts` creates one. The route file is 5 lines; `postController.js` holds the five handlers; `postService.js` talks to the database. Adding comments later means adding `commentController.js` — the post files are untouched.
- **An e-commerce API.** `orderController.js` has `createOrder`, `getOrder`, `cancelOrder`. The "cancel" controller checks the order status, refunds the payment through a service, and updates the stock through another service — the route file never sees any of that.
- **A school admin panel.** `studentController.js`, `teacherController.js`, `classController.js` — one file per resource. A new developer fixing a bug in student enrolment opens one file and finds everything.
- **Your semester project (Q-less or AI Study Buddy).** The queue endpoints live in `queueController.js`, the flashcard endpoints in `flashcardController.js`. The React web app and the React Native app both call the same controllers through the same routes — one backend, two frontends.
- **A checkout flow.** `POST /checkout` is one endpoint, but the work behind it is long: validate the cart, charge the payment, create the order, reduce stock, send a confirmation. The route file holds one line; `checkoutController.js` calls four service functions in order and answers once. If any service fails, the controller forwards the error to the handler from topic 08 — the route file never sees the failure either.

## 7. Code Examples Where Applicable

The full runnable example lives in `examples/`: `controllers.js` (thin routes + self-test) and `userController.js` (the controllers). The key lines:

```js
// controllers.js — the route file: ONLY mappings
const { listUsers, getUser, createUser, deleteUser } = require('./userController');
app.get('/users', listUsers);
app.get('/users/:id', getUser);
app.post('/users', createUser);
app.delete('/users/:id', deleteUser);
```

```js
// userController.js — one function, one job, one response
function getUser(req, res) {
  const user = users.find((u) => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
}
```

```js
// An async controller (Express 5 forwards its errors automatically)
async function getUser(req, res) {
  const user = await userService.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
}
```

Run it with:

```bash
NODE_PATH=/tmp/express-verify/node_modules node examples/controllers.js
```

## 8. Step-by-Step Code Explanations

### 8.1 `controllers.js` — thin routes and the self-test

1. `require('./userController')` imports the four controller functions. The route file never defines a handler inline.
2. `app.use(express.json())` runs first so `req.body` is parsed before any controller reads it.
3. Four one-line routes map each method + URL to its controller. Reading these four lines tells you the whole users API.
4. The self-test starts the server on port `0` (an ephemeral port — the OS picks a free one), then uses global `fetch` to call each route in order: list, create, get one, get a missing one, delete, list again.
5. `server.close(() => process.exit(0))` shuts the server down so the process exits by itself — the example never hangs.

### 8.2 `userController.js` — the controller layer

1. The `users` array and `nextId` are a stand-in for a database. In Phase 03 this becomes a service that queries PostgreSQL; the controllers will not change shape.
2. `listUsers` answers with the whole array. One job.
3. `getUser` reads `req.params.id`, converts it with `Number(...)`, and searches. The `return` before the 404 response is essential — without it the function would continue and try to send a second response.
4. `createUser` reads `name` and `email` from `req.body`, answers 400 when either is missing, otherwise creates the user with a new id and answers 201 (Created — the correct status for a successful creation).
5. `deleteUser` finds the index, answers 404 when there is nothing to delete, otherwise removes it and answers with a confirmation message.
6. `module.exports` exposes the four functions as one object, so the route file can destructure exactly the ones it needs.

## 9. Common Misconceptions

- **"Controllers are an Express feature."** No. Express has no controller concept. A controller is a naming and file-organization convention — an ordinary function in a separate module. That is why the pattern works in every framework.
- **"Moving code to a controller file makes the code better."** Moving code changes where it lives, not how good it is. A 200-line handler is a 200-line handler in any file. The improvement comes from splitting it, not relocating it.
- **"Thin controllers are the goal."** Thin *routes* are the goal; controllers are allowed to be a reasonable size. The real goal is three layers — routes, controllers, services — each doing its own job.
- **"A controller should validate input."** Validation belongs in validation middleware (topic 09) that runs *before* the controller. A controller that validates, authorizes, logs, and does business logic is doing four jobs.
- **"One file per controller function."** No — one file per *resource*, with one function per endpoint inside it. Splitting further just makes the project harder to navigate.
- **"Async controllers always need try/catch."** In Express 5, no — rejected promises are forwarded automatically. In Express 4, yes. Know which version you are running; the code in this repo runs Express 5.3.0.

## 10. Important Technical Terminology

| Term | Meaning |
|---|---|
| Controller | A function that handles one endpoint: reads `req`, does the work, sends one response. |
| Route / route definition | The mapping of a method + URL to a handler function. |
| Thin routes | Route files that contain only mappings, no logic. |
| Fat controller | A controller that has grown to hold business logic, validation, and more — the next trap after fat routes. |
| Service layer | The layer holding business logic and database access; controllers call it, it knows nothing about HTTP. |
| Resource | A thing the API manages (users, posts, orders); code is organized by resource. |
| `req.params` | Route parameters from the URL pattern (`/users/:id`). |
| `req.query` | The query string, parsed into an object. |
| `req.body` | The parsed request body (needs `express.json()` first). |
| `next(err)` | Passes an error to the error-handling middleware (topic 08). |
| Separation of concerns | Each part of the code does one kind of job; the reason controllers exist. |
| Testability | How easily a piece of code can be tested alone; controllers kept separate from routes are testable with fake `req`/`res` objects. |

## 11. Summary

- A controller is a function that handles one endpoint; the route file only maps URLs to controllers.
- Routes stay thin: one line per endpoint, no logic. Controllers do the work, one function per endpoint, one job per function.
- A fat controller is the same mess as a fat route file in a new location — real business logic belongs in a service layer that knows nothing about HTTP.
- Controllers read `req.params`, `req.query`, and `req.body`, and must send exactly one response per request (remember `return` after early responses).
- In Express 5, errors from async controllers are forwarded to the error handler automatically; Express 4 needed try/catch or a wrapper.
- Organize by resource: `routes/users.js`, `controllers/userController.js`, `services/userService.js`. That layout scales to the semester project and beyond.

## 12. Interview Questions and Answers

**Q1. What is a controller in Express, and why use one?**
A controller is a function that handles one endpoint, kept in a separate module from the route definitions. Routes map URLs to controllers; controllers do the work. It keeps route files readable, groups related logic by resource, and makes handlers testable on their own.

**Q2. What is the difference between a route and a controller?**
A route is the mapping — method plus URL plus which function handles it. A controller is the function itself. The route decides *where* a request goes; the controller decides *what happens*.

**Q3. What does "thin routes, fat controllers" mean — and what is wrong with it?**
It means route files contain only mappings while controllers hold all the logic. The problem is that a fat controller is the same unmanageable mess as a fat route file, just relocated. The full answer is three layers: thin routes, focused controllers, and a service layer for business logic.

**Q4. Where should business logic live — controller or service?**
In a service. Controllers translate between HTTP and services: read the request, call a service, format the response. Services hold the rules and the database access and know nothing about `req` or `res`, so they can be reused and tested without HTTP.

**Q5. How do you organize controllers in a real Express project?**
By resource: `controllers/userController.js`, `controllers/postController.js`, with matching `routes/` and `services/` files. One function per endpoint, named after its job (`listUsers`, `getUser`, `createUser`).

**Q6. What happens when an async controller throws in Express 5 vs Express 4?**
In Express 5, a rejected promise is forwarded to the error-handling middleware automatically. In Express 4 it is not caught — the request hangs and the process can crash — so every async handler needed try/catch with `next(err)` or a wrapper function.

**Q7. What is the "Cannot set headers after they are sent" error, and how do controllers cause it?**
It happens when a controller sends two responses for one request — most commonly forgetting `return` after an early response like a 404, so execution continues and sends the success response too. Fix: `return res.status(404).json(...)` on every early exit.

**Q8. Should a controller validate input or check authentication?**
No. Validation belongs in validation middleware and authentication in auth middleware, both running before the controller. The controller should be able to trust that the request reaching it is already valid and authorized.

**Q9. How do you test a controller without starting the server?**
A controller is just a function of `(req, res)`, so a test can call it directly with a fake request object and a fake response object that records the status code and body. If the controller calls a service, the test passes in a fake service. Only the route file needs a running server to test, and it is too thin to need much testing.

## 13. References

- Express.js docs — Routing: https://expressjs.com/en/guide/routing.html
- Express.js docs — Writing middleware: https://expressjs.com/en/guide/writing-middleware.html
- Express.js docs — Error handling: https://expressjs.com/en/guide/error-handling.html
- Express 5 migration guide (async error handling change): https://expressjs.com/en/guide/migrating-5.html
- MDN — HTTP response status codes: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status

## Files in This Folder

- `README.md` — short overview, objectives, and how to run the examples
- `notes.md` — this file: full detailed notes with interview questions and answers
- `exercises.md` — 5 practice tasks, no solutions
- `examples/controllers.js` — thin routes + self-test (run this file)
- `examples/userController.js` — the controller layer
- `examples/example.txt` — real output from running the example

---

[← Module README](../README.md) · Previous: [06 — Middleware](../06-middleware/README.md) · Next: [08 — Error Handling](../08-error-handling/README.md)

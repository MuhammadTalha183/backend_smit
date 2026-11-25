# 07 — Controllers

> **Priority:** 🔴 High
> **Previous topic:** [06 — Middleware](../06-middleware/README.md)
> **Next topic:** [08 — Error Handling](../08-error-handling/README.md)

So far every route handler has lived right next to its route. That works for five routes and falls apart at fifty. A controller is the fix: move the "what happens" out of the route file into its own functions, so each route is one line that names a controller, and each controller is one small function with one job. Routes say *where* a request goes; controllers say *what happens* when it gets there.

## Learning Objectives

By the end of this lesson, you will be able to:

- Explain what a controller is and why routes should stay thin.
- Move route handlers out of the route file into a controller module.
- Write a controller function that does one job and answers with the right status code.
- Explain the thin-routes / fat-controllers trap and what the service layer is for.
- Write an async controller and explain how its errors reach the error handler.
- Organize controllers in files by resource (users, posts, orders).
- Read a route file and tell, in seconds, what the API does.

## Topics Covered

- Routes vs controllers — where each kind of code belongs
- The controller pattern: one function per endpoint
- Thin routes, and why "fat controllers" are the next trap
- The service layer — where business logic actually lives
- Controllers and the request/response cycle (req, res, next)
- Async controllers and error forwarding
- Organizing controllers by resource
- What controllers must never do (render views, talk to the database directly in a big app, hold state)

## Links

- **Notes:** [notes.md](./notes.md) — full detailed notes, diagrams, and interview questions with answers
- **Examples:** [examples/](./examples/) — run [`controllers.js`](./examples/controllers.js) with [`userController.js`](./examples/userController.js), expected output in [`example.txt`](./examples/example.txt)
- **Exercises:** [exercises.md](./exercises.md) — 5 practice tasks, no solutions
- **Module README:** [02 — Express.js](../README.md)

**How to run the examples:**

```bash
NODE_PATH=/tmp/express-verify/node_modules node examples/controllers.js
```

Express 5.3.0 is used for the examples (installed outside the repo — no `node_modules` folder is created inside it). The server listens on an ephemeral port, calls its own routes, prints the responses, and exits by itself.

## Key Takeaways

- A route maps a URL to a function; a controller *is* that function. Keep the two in separate files.
- One controller per endpoint, one job per controller. If a controller does three things, split it.
- Thin routes are the goal, but a fat controller is just the same mess moved one file over — real business logic belongs in a service layer.
- Controllers never hold state between requests and never decide the HTTP plumbing — they read `req`, do the work, and answer with `res`.
- Async controllers in Express 5 forward their errors automatically; in Express 4 they needed try/catch or a wrapper.

---

[← Module README](../README.md) · Previous: [06 — Middleware](../06-middleware/README.md) · Next: [08 — Error Handling](../08-error-handling/README.md)

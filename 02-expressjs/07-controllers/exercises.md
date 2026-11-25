# 07 — Controllers — Exercises

> 5 practice tasks. No solutions — check your answers against `notes.md` and by running your code. Interview questions are answered in `notes.md` §12.

## Task 1 — Split a fat route file (basic)

Take this single-file app and split it the controller way: `routes/posts.js` holds only the route mappings, `controllers/postController.js` holds the handlers. The app must behave exactly the same afterwards.

```js
const express = require('express');
const app = express();
app.use(express.json());
const posts = [{ id: 1, title: 'Hello' }];
app.get('/posts', (req, res) => res.json(posts));
app.post('/posts', (req, res) => {
  const post = { id: posts.length + 1, title: req.body.title };
  posts.push(post);
  res.status(201).json(post);
});
app.listen(3000);
```

## Task 2 — Add a controller with a 404 path (conceptual)

Add a `getPost` controller for `GET /posts/:id` to the app from Task 1. It must answer 200 with the post when it exists and 404 with `{ "error": "Post not found" }` when it does not. Then write down, in one sentence each, what the route does and what the controller does — if the two sentences sound the same, your split is wrong.

## Task 3 — Spot the fat controller (conceptual)

A teammate's `orderController.js` is 180 lines long: it validates the request body, checks the user's balance in the database, creates the order, sends a confirmation email, and updates the stock. List the jobs hiding inside it, and say for each job whether it belongs in a route, a controller, a service, or middleware. Then sketch the file layout you would refactor it into (file names only, no code).

## Task 4 — Async controller, Express 4 vs 5 (practical coding)

Write an async `getUser` controller that awaits a fake database call (a function returning a promise) and answers 404 when the user is missing. First write it the Express 5 way (no try/catch). Then write the Express 4 version of the same controller using a wrapper function that forwards rejections with `next(err)`. Run both against a database function that rejects, and describe what happens in each version.

## Task 5 — Design the semester project's controllers (scenario-based)

Take the semester project idea you are leaning toward (Q-less or AI Study Buddy). List its resources (for Q-less: offices, tokens; for Study Buddy: decks, cards, quizzes). For each resource, write the controller file name and the controller functions it needs, one per endpoint — for example `queueController.js`: `listOffices`, `takeToken`, `getPosition`, `callNext`, `markDone`. Keep every controller to one job. No code needed — just the file and function plan.

## Interview-Style Questions

Answer these in your own words, then check against `notes.md` §12.

1. What is a controller, and how is it different from a route?
2. What does "thin routes" mean, and why is "fat controllers" still a problem?
3. Where does business logic belong — controller or service — and why?
4. What happens when an async controller's promise rejects in Express 5? In Express 4?
5. What causes "Cannot set headers after they are sent", and how do you prevent it in a controller?
6. How would you organize controllers in a project with 10 resources?

---

[← Module README](../README.md) · Previous: [06 — Middleware](../06-middleware/README.md) · Next: [08 — Error Handling](../08-error-handling/README.md)

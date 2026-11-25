# 02 — Project Setup — Exercises

> **Topic:** [02 — Project Setup](./README.md) · **Notes:** [notes.md](./notes.md)
> **Rule:** 5 practice tasks, no solutions. If you get stuck, re-read the
> notes first — the answers to the interview questions are in notes.md §12.

## Task 1 — Start a project from an empty folder

Create a brand-new folder called `practice-api`. Inside it, run `npm init -y`,
then open `package.json` and change the `"main"` field to `src/server.js`.
Then install Express (`npm install express`) and nodemon as a devDependency
(`npm install -D nodemon`).

Check your work: `package.json` should list `express` under `"dependencies"`
and `nodemon` under `"devDependencies"`, `package-lock.json` should exist,
and `node_modules/` should exist on disk. Answer in one sentence each: why is
`package-lock.json` committed to Git, and why is `node_modules/` not?

## Task 2 — Build the skeleton

Inside your `practice-api` project, create the folder structure from notes.md
§3.4: `src/routes/`, `src/controllers/`, `src/middleware/`, `src/config/`,
plus `src/app.js` and `src/server.js`. In `app.js`, register a `GET /health`
route that returns `{ "status": "ok" }`. In `server.js`, read `PORT` from
`process.env` with a default of `3000` and start the app listening.

Then add `"start"` and `"dev"` scripts to `package.json` and start the server
with `npm run dev`. Confirm in your browser (or with `curl`) that
`http://localhost:3000/health` returns the JSON. Now edit the health response
(say, add an `"app"` field) and save — confirm nodemon restarted the server
without you touching the terminal.

## Task 3 — Move the port into the environment

Your server from Task 2 still has a hard-coded fallback port, and no `.env`
support yet. Add dotenv (`npm install dotenv`), load it at the top of
`server.js`, and create a `.env` file with `PORT=4000` and `APP_NAME=practice-api`.
Create a matching `.env.example` with placeholder values, and a `.gitignore`
containing `node_modules/` and `.env`.

Check your work: run the server with `npm run dev` and confirm it listens on
port 4000. Then run `git status` (initialise a repo first with `git init` if
there is not one) and confirm that `.env` and `node_modules/` are untracked
while `.env.example` shows up as a file to commit.

## Task 4 — Split the app from the server

Refactor your `practice-api` so that `src/app.js` only creates and exports
the Express app (routes included) and `src/server.js` only imports the app
and starts it listening. Add a `src/config/index.js` that reads `APP_NAME`,
`PORT`, and `NODE_ENV` from `process.env` with sensible defaults and exports
them as one object — then change `server.js` to use that config object
instead of reading `process.env` directly.

Check your work: the server must still start and answer `GET /health`.
Then, in a plain Node REPL (`node` with no file), run
`require('./src/app')` — it should return the app object without starting
a server or printing a "listening" line. Explain in one sentence why that
matters for testing.

## Task 5 — Break it on purpose, then fix it

Deliberately introduce each of these mistakes in your `practice-api` project,
one at a time, observe the exact error, then fix it before moving on:

1. Delete `node_modules/` and try `npm start`. What fails? Fix it with one
   command — which one, and why does it work?
2. Remove the `"start"` script from `package.json` and run `npm start`.
   What error do you get?
3. In `server.js`, change the port line to `app.listen('3000')` (a string,
   no `Number(...)`). Does the server still start? Check carefully — then
   explain why passing a string port is a bug even when it appears to work.
4. Move the `require('dotenv').config()` line to the *bottom* of
   `server.js`, below the line that reads `process.env.PORT`. Start the
   server with `PORT=4000` set only in `.env` (not in your shell). Which
   port does it listen on, and why?

Write down each error message and your one-line explanation — that note is
worth more than the fix.

---

## Interview-Style Questions

No answers here — work them out, then check yourself against notes.md §12.

1. What does `npm init` do, and what is `npm init -y`?
2. What is the difference between `dependencies` and `devDependencies`?
3. Why do we commit `package-lock.json` but never `node_modules/`?
4. What does the `^` mean in `"express": "^5.3.0"`?
5. Why split the server into `app.js` and `server.js`?
6. How does an Express app read configuration, and why not hard-code it?
7. What is dotenv, and what is the load-order rule?
8. A `.env` file with a database password was committed to Git. What do you do?
9. What is nodemon, and why is it a devDependency?
10. What happens when you call `app.listen(0)`?
11. What does `app.listen()` return, and why does it matter?
12. What is the difference between `npm start` and `npm run dev`?

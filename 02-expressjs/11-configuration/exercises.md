# Exercises — 11 Configuration

Do these **after** reading [notes.md](./notes.md) and running `NODE_PATH=/tmp/express-verify/node_modules node examples/config-demo.js`.

No solutions are provided on purpose — the exercise *is* the learning.
If you are stuck, re-read the matching part of [notes.md](./notes.md) and run the example again.

---

## Basic Understanding

### Exercise 1 — Spot the Leak ⭐ Start here

Each snippet below does something wrong with configuration or secrets. For each one, say what's wrong and how you'd fix it.

1. ```js
   const db = connect('postgres://admin:hunter2@db.example.com:5432/app');
   ```
2. ```js
   console.log('Starting with secret:', process.env.JWT_SECRET);
   ```
3. ```js
   app.listen(3000, () => console.log('Listening on 3000'));
   ```
4. ```bash
   git add .env
   git commit -m "add config"
   ```
5. ```js
   const port = process.env.PORT;
   app.listen(port + 1); // "so it doesn't clash"
   ```

**Questions to answer:**
- In snippet 1, where should the connection string live instead — and what file must never contain it?
- In snippet 5, what does `port + 1` actually compute, and why?

### Exercise 2 — Which Environment?

For each behaviour, say which environment it belongs to (development, test, or production) — and which `NODE_ENV` value and log level go with it.

1. Full stack traces sent back to the client in error responses.
2. Logs at `warn` only, because the test runner is noisy enough.
3. The database is wiped and re-seeded before every test run.
4. The JWT secret comes from the hosting platform's dashboard.
5. `debug` logging is on so you can trace a value.
6. Error responses say only "Internal server error".

---

## Conceptual

### Exercise 3 — Write the `.env.example`

Your semester project backend needs the following to run. Write a `.env.example` file for it (keys + placeholder values + short comments), and write the `.gitignore` line that protects the real file.

- The port (default 3000) and host.
- The environment name.
- The log level.
- The PostgreSQL connection URL (local dev default).
- The JWT secret (required in production).
- A made-up third-party key, e.g. for sending SMS — call it `SMS_API_KEY`.

**Questions to answer:**
- Which of these six values is a secret, and which are just settings?
- A new teammate clones the repo. What are the exact steps they take with your two files to get running?

### Exercise 4 — The Missing Secret

Your app is deployed. On the first login attempt it crashes with `JWT_SECRET is required in production`. But it worked perfectly on your laptop. Explain, step by step:

1. Why it worked locally and failed on the server.
2. Where the secret should have been set for production (and where it must *not* be set).
3. What the fail-fast check in the config module bought you here — what would have happened without it?

---

## Practical Coding

### Exercise 5 — Build a Config Module for the REST API

Take the REST API from topic 10 ([`../10-rest-apis/examples/rest-api.js`](../10-rest-apis/examples/rest-api.js)) and give it proper configuration. Copy it to a new file first — don't edit the original.

1. Create a `config.js` next to it that reads `process.env`, with: `env` (validated to development/test/production), `port` (number, default 3000, validated 1–65535), `host` (default `127.0.0.1`), `logLevel` (default `info`), and `apiVersion` (default `v1`).
2. Make the server listen on `config.port` and `config.host` instead of port 0, and log `Listening on http://<host>:<port>/api/<version>/posts` at startup — then add a `SIGINT` handler that closes the server gracefully.
3. Use `config.apiVersion` in the route mount (`/api/${config.apiVersion}/posts`) instead of the hardcoded `/api/v1/posts`.
4. Test it: run once with no variables, once with `PORT=4000`, once with `PORT=abc`, and once with `NODE_ENV=staging`. Write down what happened in each run — which ones started, which ones failed, and why.

**Then answer:**
- What did you have to change in the self-test at the bottom of the file, and why?
- Why is `config.js` the only file that touches `process.env` in your version?

---

## Interview-Style Questions

Answer these out loud, in your own words, without looking at the notes first. The answers are in [notes.md](./notes.md) (section 12) — check yourself after.

1. Where should configuration live, and why not in the code?
2. What is a `.env` file, and what are the rules for using it?
3. A teammate committed a database password to GitHub and then deleted the file. Is the password safe now?
4. Why read configuration in one central module instead of `process.env` everywhere?
5. What is `NODE_ENV` and what does it change?
6. What is fail fast, and why is it better than failing later?
7. What is graceful shutdown, and which signals trigger it?
8. Why must `PORT` be read from the environment instead of hardcoded?
9. What's the difference between `.env` and `.env.example`?
10. How do you log configuration safely at startup?

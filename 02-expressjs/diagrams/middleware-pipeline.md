# Middleware Pipeline

> Back to the [Module 02 README](../README.md) · Related topic: [06 — Middleware](../06-middleware/README.md)

Middleware is a chain of functions. Each one can read the request, change it, end the response — or pass control to the next function with `next()`.

## Mermaid Diagram

```mermaid
flowchart LR
    A[Request] --> B[Logger middleware]
    B --> C[express.json() body parser]
    C --> D[Auth middleware]
    D --> E[Route handler]
    E --> F[Response]
    D -->|Not logged in| G[401 response]
    C -->|Invalid JSON| H[Error handler]
```

## ASCII Version

```text
Request
  │
  ▼
┌──────────────────┐
│ Logger           │  logs method + URL, calls next()
└────────┬─────────┘
         ▼
┌──────────────────┐
│ express.json()   │  parses body into req.body, calls next()
└────────┬─────────┘
         ▼
┌──────────────────┐
│ Auth             │  checks token
│                  │  ok → next()   |   bad → res.status(401).json(...)
└────────┬─────────┘
         ▼
┌──────────────────┐
│ Route handler    │  does the work, sends the response
└──────────────────┘
```

## What to remember

- **Order is everything.** A JSON parser registered after your routes never runs for those routes. Auth registered after a route never protects it.
- `next()` means "I'm done, pass it on". Forgetting it hangs the request; calling it after sending a response crashes with "headers already sent".
- A middleware that sends a response ends the chain — nothing after it runs.
- There are three levels: application-level (`app.use`), router-level (`router.use`), and route-level (passed as an argument to `app.get`). Same idea, different scope.
- Error-handling middleware is a normal middleware with **four** arguments: `(err, req, res, next)`. Express only treats it as an error handler because of that fourth argument.

[← Module 02 README](../README.md)

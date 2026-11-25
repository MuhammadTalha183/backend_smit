# Error Handling Flow

> Back to the [Module 02 README](../README.md) · Related topic: [08 — Error Handling](../08-error-handling/README.md)

Where an error goes in Express — and why one central handler beats try/catch in every route.

## Mermaid Diagram

```mermaid
flowchart TD
    A[Route handler] --> B{Error?}
    B -->|No| C[Send response]
    B -->|Yes — throw / reject| D[Express 5 forwards it automatically]
    B -->|Yes — next(err)| D
    D --> E[Central error middleware, registered LAST]
    E --> F[Log the error with stack trace]
    F --> G[Send safe response: status + { error }]
    G --> H[Client gets error, never the stack trace]
```

## ASCII Version

```text
Route handler
   │
   ├─ success ──> res.json(...) ──> client
   │
   └─ error: throw, rejected promise, or next(err)
        │
        ▼
   Express skips all remaining normal middleware
        │
        ▼
   Central error handler  (err, req, res, next) — registered LAST
        │
        ├─ log it (with stack trace, server-side only)
        ├─ pick status: err.status || 500
        └─ send: { "error": { "code", "message" } }
        │
        ▼
   Client gets a clean error. Stack trace stays on the server.
```

## What to remember

- In Express 5, a thrown error or rejected promise inside an async handler is forwarded to the error handler automatically. In Express 4 you had to wrap handlers or call `next(err)` yourself.
- There are two different 404s: **unknown route** (no route matched — handled after all routes) and **missing resource** (route matched, id not found — the handler creates a 404 error itself).
- Custom error classes (`AppError` with a status code) let the central handler decide the status without a chain of if-statements.
- Never send `err.stack` to the client in production — log it, and send a safe message instead.

[← Module 02 README](../README.md)

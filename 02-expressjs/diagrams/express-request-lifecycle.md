# Express Request Lifecycle

> Back to the [Module 02 README](../README.md) · Related topic: [01 — Introduction to Express.js](../01-introduction/README.md), [03 — HTTP Fundamentals](../03-http-fundamentals/README.md)

One HTTP request, from the moment it reaches your server to the moment the response leaves.

## Mermaid Diagram

```mermaid
flowchart TD
    A[Client sends HTTP request] --> B[Node.js http server receives it]
    B --> C[Express creates req and res objects]
    C --> D[Middleware runs in order]
    D --> E{Route matches?}
    E -->|Yes| F[Controller / handler runs]
    E -->|No| G[404 handler]
    F --> H[Handler sends a response]
    G --> H
    H --> I[Response sent back to client]
    D -->|Error thrown / next(err)| J[Error-handling middleware]
    F -->|Error thrown / next(err)| J
    J --> H
```

## ASCII Version

```text
Client ── HTTP request ──> Node http server
                              │
                    Express builds req + res
                              │
                    Middleware, in order
                     (json parser, logger, auth...)
                              │
                    ┌─────────┴─────────┐
              Route matches?        No → 404 handler
                    │ Yes
              Controller runs
                    │
              res.send / res.json
                    │
              Response ──> Client

Any error anywhere ──> Error-handling middleware ──> Error response
```

## What to remember

- Express never handles the socket itself — Node's `http` module does that, then hands Express a request and a response object.
- Everything between "request arrives" and "response sent" is middleware and route handlers, in the order you registered them.
- A handler that never sends a response (and never calls `next()`) leaves the client hanging — the most common beginner bug.
- Errors skip the normal chain and jump straight to the error-handling middleware.

[← Module 02 README](../README.md)

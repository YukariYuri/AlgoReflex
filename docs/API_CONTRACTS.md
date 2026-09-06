# AlgoReflex — API Contracts & Conventions

## 1. General Principles

The AlgoReflex Application API (`apps/api`) follows modern RESTful conventions with predictable JSON structures.

- **Content-Type**: `application/json`
- **Error Response Envelope**: Unified error payload format across all endpoints.
- **Contract Schema Validation**: All request bodies and structured query parameters are parsed through Zod schemas from `@algoreflex/contracts`.

---

## 2. Standard Error Envelope

All 4xx and 5xx responses conform to this shape:

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Detailed human-readable message",
    "details": [
      {
        "field": "code",
        "issue": "Source code cannot be empty"
      }
    ]
  }
}
```

---

## 3. Milestone M0 Endpoints

### `GET /health`

Returns service operational state, uptime, and current server time.

**Response (200 OK)**:

```json
{
  "status": "ok",
  "service": "algoreflex-api",
  "uptime": 12.45,
  "timestamp": "2026-09-06T11:40:00.000Z"
}
```

### `GET /api/version`

Returns current API version, active milestone, and environment.

**Response (200 OK)**:

```json
{
  "name": "AlgoReflex API",
  "version": "0.1.0",
  "milestone": "M0",
  "status": "operational",
  "environment": "development"
}
```

---

## 4. Milestone M1+ Planned Endpoints

- `POST /api/submissions` — Queue a C++ code submission for judging.
- `GET /api/submissions/:id` — Polling / status of execution.
- `GET /api/curriculum/nodes` — Retrieve curriculum prerequisite graph.
- `GET /api/mastery` — Retrieve user multi-dimensional mastery matrix.
- `POST /api/drills/start` — Initiate a targeted learning activity or fallback drill.
- `POST /api/contests/:id/submit` — Submit solutions during a contest simulation.

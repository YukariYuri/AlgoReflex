# AlgoReflex — API Contracts & Conventions

## 1. General Principles

The AlgoReflex Application API (`apps/api`) follows modern RESTful conventions with predictable JSON structures.

- **Content-Type**: `application/json`
- **Error Response Envelope**: Unified error payload format across all endpoints.
- **Contract Schema Validation**: All request bodies and structured query parameters are parsed through Zod schemas from `@algoreflex/contracts`.

---

## 2. Public vs. Internal Judge Separation Invariant

To guarantee that hidden test cases and solutions cannot leak to web clients:

- **Public Endpoints** use strictly sanitized schemas (`PublicProblem`, `PublicSubmissionResult`).
- **Judge / Internal Services** use authoritative schemas (`JudgeProblem`, `JudgeSubmissionResult`).

### Public Submission Result Shape

Hidden test failures only disclose aggregate verdict status:

```json
{
  "status": "WRONG_ANSWER",
  "totalTestCases": 20,
  "passedTestCases": 14,
  "maxExecutionTimeMs": 84,
  "maxMemoryUsedKb": 4096,
  "testCaseResults": [
    {
      "testCaseId": "sample-1",
      "orderIndex": 0,
      "isSample": true,
      "status": "ACCEPTED",
      "timeExecutionMs": 12,
      "memoryExecutionKb": 2048,
      "actualOutput": "42\n",
      "expectedOutput": "42\n"
    },
    {
      "testCaseId": "hidden-test-15",
      "orderIndex": 15,
      "isSample": false,
      "status": "WRONG_ANSWER",
      "timeExecutionMs": 84,
      "memoryExecutionKb": 4096,
      "errorMessage": "Wrong answer on test 15"
    }
  ]
}
```

_Notice: `expectedOutput`, `actualOutput`, and raw `input` are strictly omitted for hidden test cases._

---

## 3. Standard Error Envelope

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

## 4. Milestone M0 Endpoints

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

## 5. Milestone M1+ Planned Endpoints

- `POST /api/submissions` — Queue a C++ code submission (`language`: `CPP17` | `CPP20` | `CPP23`, `toolchainProfile`: `GNU_CPP20`, etc.).
- `GET /api/submissions/:id` — Polling / status of execution (returns `PublicSubmissionResult`).
- `GET /api/curriculum/nodes` — Retrieve curriculum prerequisite graph.
- `GET /api/mastery` — Retrieve user multi-dimensional mastery matrix.
- `POST /api/drills/start` — Initiate a targeted learning activity or fallback drill.
- `POST /api/contests/:id/submit` — Submit solutions during a contest simulation.

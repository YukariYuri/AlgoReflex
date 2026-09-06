# AlgoReflex — System Architecture

## 1. Monorepo Overview

AlgoReflex is organized as a pnpm monorepo consisting of applications, isolated services, shared domain packages, and governance documentation.

```text
AlgoReflex/
│
├── apps/
│   ├── web/                    # React + TypeScript + Vite web client
│   └── api/                    # Fastify + TypeScript application API
│
├── services/
│   └── runner/                 # Isolated C++ compiler and execution judge service
│
├── packages/
│   ├── contracts/              # Shared Zod schemas, domain types, and protocols
│   ├── learning-core/          # Pure domain logic: Prerequisite DAG, mastery evaluation
│   ├── problem-schema/         # Problem, TestCase, Constraint, and Hint schemas
│   ├── config/                 # Base tsconfig and ESLint shared configurations
│   └── ui/                     # UI design tokens and shared component primitives
│
├── docs/                       # Architecture, security, and learning specifications
└── tasks/                      # Project task tracking (ACTIVE, BACKLOG, COMPLETED)
```

---

## 2. Runtime Architecture & Service Boundaries

```text
[ Browser / Web Application ] (apps/web)
              │
              ▼ HTTPS / REST / WebSockets
[ Application API Service ] (apps/api)
        │                       │
        │                       ▼
        │             [ PostgreSQL Database ] (M2+)
        ▼
[ Submission / Judge Dispatcher ]
        │
        ▼ (Strict Isolation Boundary / IPC / Internal HTTP)
[ Isolated C++ Runner ] (services/runner)
        │
        ├── g++-13 / clang++-17
        ├── Linux cgroups (CPU, RAM limits)
        ├── Seccomp filtering (Syscall restrictions)
        ├── Ephemeral rootless filesystem
        └── Network namespace: disabled (loopback only)
```

---

## 3. Component Responsibilities

### `apps/web`

- Pure client-side UI built with React 19, TypeScript, and Vite.
- Consumes `@algoreflex/contracts` for schema-validated API communication.
- Displays interactive learning paths, drill interfaces, problem workspaces, and postmortem reviews.
- Never contains authoritative grading, hidden test cases, or judge execution logic.

### `apps/api`

- Core application backend built with Fastify and TypeScript.
- Handles user authentication, curriculum progress, activity logging, and submission queuing.
- Never executes untrusted user code directly.
- Validates all request payloads using `@algoreflex/contracts` Zod schemas and enforces payload size limits.

### `services/runner`

- Specialized judge execution service responsible for compiling and executing C++ solutions against test cases.
- Operates across a **hard isolation boundary**:
  - In Milestone M0: Interface defined; execution disabled with explicit `NOT_IMPLEMENTED` stub.
  - In Milestone M1+: Executed inside disposable containers or jail sandboxes (`nsjail`, Docker rootless) with CPU, memory, process count, wall-clock timeout, and zero outbound network access.

### `packages/contracts`

- Single source of truth for shared domain schemas, submission statuses, mistake taxonomies, mastery dimensions, and contest models.
- Independent of any specific database ORM or UI framework.

### `packages/learning-core`

- Pure, deterministic domain logic.
- Implements:
  - Prerequisite DAG validation, cycle detection, and unlockable progression trees.
  - Fallback matrix lookups (preferred C++ tools to contest-safe fallbacks).
  - Multi-dimensional mastery scoring formulas.
- Free of external network or database side-effects.

### `packages/problem-schema`

- Standardized data representation for problem statements, input/output formats, constraints, sample cases, hidden test cases, hints, and reference solutions.

---

## 4. Architecture Invariants

1. **Isolation Boundary**: Untrusted C++ code must NEVER be compiled or executed inside the main API service.
2. **Zero AI Dependency for Core Engine**: Grading, compilation, tests, prerequisite calculations, and mastery scoring must function without external LLM APIs.
3. **Contracts Authority**: All IPC and client-server interactions must adhere to schemas defined in `@algoreflex/contracts`.
4. **Client Zero-Trust**: Scores, execution timings, and pass/fail states from the client are never accepted as authoritative.
5. **Database Decoupling**: Database layer must use standard PostgreSQL protocols, portable across self-hosted Postgres, Supabase, or AWS RDS without vendor lock-in.

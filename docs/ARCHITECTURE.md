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
│   ├── learning-core/          # Pure domain logic: Prerequisite DAG, fallback matrix, mastery
│   ├── problem-schema/         # Public vs. Judge Problem, TestCase, Constraint, Hint schemas
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
              ▼ HTTPS / REST / WebSockets (Public Contracts Only)
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
        ├── Phase 1: Compile Sandbox (Multi-process, fixed trusted flags)
        │     └── Produces binary artifact in /sandbox/bin
        │
        └── Phase 2: Execution Sandbox per Test Case
              ├── Single process strictly enforced (PID: 1)
              ├── Cgroups v2 (CPU quota, memory bounds)
              ├── Ephemeral filesystem: /sandbox/bin (rx), /tmp (noexec)
              └── Network namespace: completely disabled
```

---

## 3. Component Responsibilities

### `apps/web`

- Pure client-side UI built with React 19, TypeScript, and Vite.
- Consumes `@algoreflex/contracts` for schema-validated API communication.
- Uses `PublicProblem` and `PublicSubmissionResult` schemas exclusively.
- Never contains authoritative grading, hidden test cases, or judge execution logic.

### `apps/api`

- Core application backend built with Fastify and TypeScript.
- Handles user authentication, curriculum progress, activity logging, and submission queuing.
- Never executes untrusted user code directly.
- Validates all request payloads using `@algoreflex/contracts` Zod schemas and enforces payload size limits.

### `services/runner`

- Specialized judge execution service responsible for compiling and executing C++ solutions against test cases.
- Operates across a **hard isolation boundary**:
  - In Milestone M0: Interface defined with `CompileLimits`, `ExecutionLimits`, and `ToolchainProfile`; execution disabled with explicit `NOT_IMPLEMENTED` stub.
  - In Milestone M1+: Executed inside disposable containers or jail sandboxes (`nsjail`, Docker rootless) with decoupled compile/execution limits, and zero outbound network access.

### `packages/contracts`

- Single source of truth for shared domain schemas, submission statuses, mistake taxonomies, mastery dimensions, language standards (`CPP17`, `CPP20`, `CPP23`), trusted toolchains (`GNU_CPP20`, `CLANG_CPP20`), and authoritative prerequisite edges.
- Enforces public vs. internal judge separation by construction.

### `packages/learning-core`

- Pure, deterministic domain logic.
- Implements:
  - `PrerequisiteGraph`: DAG validation, cycle detection, topological sorting, and unlockable progression trees using typed `KnowledgeNodeRef` keys. Prerequisite edges are the single authoritative source of truth.
  - `FallbackMatrix`: Lookups from preferred C++ tools to contest-safe fallbacks.
  - `HeuristicMasteryEvaluator`: Provisional multi-dimensional mastery scoring formulas (to be empirically calibrated in M5).
- Free of external network or database side-effects.

### `packages/problem-schema`

- Standardized data representation for problem statements:
  - `PublicProblem`: Client-safe view strictly omitting hidden test cases and solutions.
  - `JudgeProblem`: Authoritative authoring and verification schema containing hidden test cases and reference solution code.

---

## 4. Architecture Invariants

1. **Isolation Boundary**: Untrusted C++ code must NEVER be compiled or executed inside the main API service.
2. **Confidentiality by Construction**: Hidden test inputs, authoritative expected outputs, and solution code are strictly isolated in judge schemas and never serialized to public client schemas.
3. **No Arbitrary Compiler Flags**: Execution requests use allowlisted `toolchainProfile` identifiers. The runner hardcodes trusted flags.
4. **Single Authoritative Prerequisite Graph**: Curriculum dependencies exist as directed edges in `PrerequisiteGraph`. Entity-local prerequisite fields are derived views, never duplicate sources of truth.
5. **Zero AI Dependency for Core Engine**: Grading, compilation, tests, prerequisite calculations, and mastery scoring must function without external LLM APIs.
6. **Client Zero-Trust**: Scores, execution timings, and pass/fail states from the client are never accepted as authoritative.
7. **Database Decoupling**: Database layer must use standard PostgreSQL protocols, portable across self-hosted Postgres, Supabase, or AWS RDS without vendor lock-in.

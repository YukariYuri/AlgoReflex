# AlgoReflex — Architectural Decision Records (ADRs)

## Index

- [ADR-001: Monorepo Architecture with pnpm Workspaces](#adr-001-monorepo-architecture-with-pnpm-workspaces)
- [ADR-002: Fastify for Application API](#adr-002-fastify-for-application-api)
- [ADR-003: React with Vite for Web Frontend](#adr-003-react-with-vite-for-web-frontend)
- [ADR-004: PostgreSQL as Target Database Engine](#adr-004-postgresql-as-target-database-engine)
- [ADR-005: Isolated C++ Runner Boundary](#adr-005-isolated-c-runner-boundary)
- [ADR-006: Zero AI Dependency for Core Learning Engine](#adr-006-zero-ai-dependency-for-core-learning-engine)
- [ADR-007: Shared Zod Schema Contracts](#adr-007-shared-zod-schema-contracts)
- [ADR-008: Separation of Public and Judge Contracts by Construction](#adr-008-separation-of-public-and-judge-contracts-by-construction)
- [ADR-009: Decoupled Compilation and Execution Sandbox Profiles](#adr-009-decoupled-compilation-and-execution-sandbox-profiles)
- [ADR-010: Centralized C++ Language Standards and Trusted Toolchain Profiles](#adr-010-centralized-c-language-standards-and-trusted-toolchain-profiles)
- [ADR-011: Structured Non-Leaking Diagnostic Codes for Hidden Test Cases](#adr-011-structured-non-leaking-diagnostic-codes-for-hidden-test-cases)
- [ADR-012: Authoritative Typed Prerequisite Graph Public API](#adr-012-authoritative-typed-prerequisite-graph-public-api)
- [ADR-013: Minimal Immutable Runner Rootfs and Host Mount Prohibitions](#adr-013-minimal-immutable-runner-rootfs-and-host-mount-prohibitions)

---

### ADR-001: Monorepo Architecture with pnpm Workspaces

- **Status**: Approved
- **Context**: AlgoReflex comprises multiple applications (web, api), services (runner), and shared domain libraries (contracts, learning-core, problem-schema, ui, config). Multiple AI agents and human contributors need to make cross-cutting changes safely.
- **Decision**: Adopt a monorepo structure managed by `pnpm` workspaces.
- **Consequences**:
  - Single repository clone for all agents.
  - Atomic commits and refactorings across contracts, API, and frontend.
  - Strict dependency boundaries without premature microservice repository fragmentation.

---

### ADR-002: Fastify for Application API

- **Status**: Approved
- **Context**: Need a lightweight, high-performance, TypeScript-friendly HTTP framework for the core API service.
- **Decision**: Use Fastify instead of Express or heavy nestjs frameworks.
- **Consequences**:
  - High throughput and low latency.
  - First-class TypeScript support and clean plugin architecture.
  - Built-in schema validation hooks and fast JSON serialization.

---

### ADR-003: React with Vite for Web Frontend

- **Status**: Approved
- **Context**: Need a fast, modern frontend stack with minimal boilerplate and maximum developer experience.
- **Decision**: Use React 19 + TypeScript + Vite.
- **Consequences**:
  - Instant server start and HMR during development.
  - Standard, widely-understood React component ecosystem.
  - Direct integration with monorepo TypeScript libraries.

---

### ADR-004: PostgreSQL as Target Database Engine

- **Status**: Approved
- **Context**: Domain data includes relational entities (users, courses, modules, submissions) and structured JSON payloads (mastery scores, test case results).
- **Decision**: Target standard PostgreSQL. Do not couple to proprietary database engines. Ensure compatibility with self-hosted Postgres, Supabase, Neon, and AWS RDS.
- **Consequences**:
  - ACID compliance, robust indexing, and native JSONB capabilities.
  - Zero vendor lock-in; easily run locally in Docker during development.

---

### ADR-005: Isolated C++ Runner Boundary

- **Status**: Approved
- **Context**: Users will submit arbitrary C++ code. Executing untrusted C++ inside the API host is a severe security vulnerability.
- **Decision**: Strictly isolate the compilation and execution runner from the API service. In M0, provide an interface with a safe `NOT_IMPLEMENTED` stub. In M1+, use containerized or jailed sandboxes with cgroups, seccomp, and disabled network access.
- **Consequences**:
  - API process is insulated from crashing, fork bombs, and system takeover.
  - Strict boundary allows scaling runner nodes independently.

---

### ADR-006: Zero AI Dependency for Core Learning Engine

- **Status**: Approved
- **Context**: Many modern edtech projects introduce brittle, expensive dependencies on external LLM APIs for core functions like grading or lesson routing.
- **Decision**: Ensure that the compiler, judge, test cases, mastery calculations, mistake taxonomy, and curriculum progression function completely without AI/LLM APIs.
- **Consequences**:
  - 100% deterministic, reproducible grading.
  - Zero API cost per user submission.
  - Platform works offline and in self-hosted environments.

---

### ADR-007: Shared Zod Schema Contracts

- **Status**: Approved
- **Context**: Multiple agents and tiers (web, api, runner) must share types and validations without duplicating definitions or drifting.
- **Decision**: Create `@algoreflex/contracts` using Zod to generate both runtime parsers and TypeScript compile-time types.
- **Consequences**:
  - End-to-end type safety between API and frontend.
  - Single location for domain taxonomy (statuses, mistake categories, mastery dimensions).

---

### ADR-008: Separation of Public and Judge Contracts by Construction

- **Status**: Approved
- **Context**: Leaking hidden test inputs, outputs, or reference solutions to clients destroys competition integrity and violates security invariants. Relying on developers to remember to strip fields at runtime is brittle.
- **Decision**: Split schemas into `PublicProblem` / `PublicSubmissionResult` (strictly omitting hidden fields by schema design) and `JudgeProblem` / `JudgeSubmissionResult` (server/internal only).
- **Consequences**:
  - Accidental leakage of hidden test cases or solution code is prevented at the compile-time type and schema parser boundaries.
  - Client web application can never receive hidden outputs.

---

### ADR-009: Decoupled Compilation and Execution Sandbox Profiles

- **Status**: Approved
- **Context**: C++ compilers spawn multiple sub-processes (`cc1plus`, `as`, `ld`), whereas user binaries must be strictly restricted to a single process (`PID: 1`) to block fork bombs.
- **Decision**: Model compilation and execution as two distinct sandboxes with separate resource bounds (`CompileLimits` vs `ExecutionLimits`).
- **Consequences**:
  - Compilation succeeds with multi-process headroom (PID limit: 16) and larger memory limits.
  - Execution runs under maximum containment with PID limit 1, no network, and ephemeral mounts.

---

### ADR-010: Centralized C++ Language Standards and Trusted Toolchain Profiles

- **Status**: Approved
- **Context**: Allowing arbitrary compiler/linker flags from user clients opens security injection vulnerabilities. In addition, language standards were inconsistently represented across packages.
- **Decision**: Centralize language standards (`CPP17`, `CPP20`, `CPP23`) and map trusted execution requests strictly through `toolchainProfile` identifiers (`GNU_CPP20`, `CLANG_CPP20`) with hardcoded flags. Arbitrary compiler flags are completely removed from request schemas.
- **Consequences**:
  - Immunity to compiler flag injection attacks.
  - Unified vocabulary across runner, submission contracts, and curriculum.

---

### ADR-011: Structured Non-Leaking Diagnostic Codes for Hidden Test Cases

- **Status**: Approved
- **Context**: Hidden test case public verdicts previously permitted an `errorMessage` string that could inadvertently forward raw judge/runner output, leaking hidden test inputs, expected outputs, sandbox paths, filenames, or judge implementation details.
- **Decision**: Remove `errorMessage` completely from `PublicHiddenTestCaseVerdictSchema` with `.strict()` schema enforcement. Replace it with a controlled `diagnosticCode` enum (`HIDDEN_WRONG_ANSWER`, `HIDDEN_RUNTIME_ERROR`, `HIDDEN_TIME_LIMIT`, `HIDDEN_MEMORY_LIMIT`, `HIDDEN_OUTPUT_LIMIT`, `HIDDEN_INTERNAL_ERROR`). Sample test cases retain diagnostic strings since sample data is public.
- **Consequences**:
  - Hidden test data confidentiality is enforced by construction.
  - Clients receive clean, structured diagnostic states without information leakage.

---

### ADR-012: Authoritative Typed Prerequisite Graph Public API

- **Status**: Approved
- **Context**: `PrerequisiteGraph` supported `addTypedEdge()`, but also exposed untyped `addEdge(string, string)` and `addNode(string)` in its public API, allowing downstream code to bypass type-safe `KnowledgeNodeRef` semantics.
- **Decision**: Refactor `PrerequisiteGraph` so all public mutation and query methods (`addNode`, `addEdge`, `getTopologicalOrder`, `getAvailableNext`, `getPrerequisitePath`) operate strictly on typed `KnowledgeNodeRef` objects. String-based mutation helpers are strictly private/internal.
- **Consequences**:
  - Full compile-time and runtime type safety across curriculum relationships (`CONCEPT`, `TOOL`, `PATTERN`, `LESSON`, `MODULE`).
  - Completely eliminates untyped string edge mutations across the codebase.

---

### ADR-013: Minimal Immutable Runner Rootfs and Host Mount Prohibitions

- **Status**: Approved
- **Context**: Preliminary documentation described `/rootfs` as a bind mount of host system utilities and libraries. Bind mounting host paths exposes host credentials, configuration, daemon sockets, and arbitrary host binaries to potential container escape or exfiltration attacks.
- **Decision**: Direct host bind mounts are strictly prohibited. The runner environment must use a minimal, pinned, immutable rootfs image independent of host filesystem contents. Host `/etc`, credentials, application code, Docker sockets, and host library directories are strictly forbidden from being mounted into the untrusted execution sandbox.
- **Consequences**:
  - Hermetic and reproducible sandbox environments.
  - Elimination of host credential and host configuration exfiltration attack vectors.

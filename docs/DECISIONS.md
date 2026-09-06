# AlgoReflex — Architectural Decision Records (ADRs)

## Index

- [ADR-001: Monorepo Architecture with pnpm Workspaces](#adr-001-monorepo-architecture-with-pnpm-workspaces)
- [ADR-002: Fastify for Application API](#adr-002-fastify-for-application-api)
- [ADR-003: React with Vite for Web Frontend](#adr-003-react-with-vite-for-web-frontend)
- [ADR-004: PostgreSQL as Target Database Engine](#adr-004-postgresql-as-target-database-engine)
- [ADR-005: Isolated C++ Runner Boundary](#adr-005-isolated-c-runner-boundary)
- [ADR-006: Zero AI Dependency for Core Learning Engine](#adr-006-zero-ai-dependency-for-core-learning-engine)
- [ADR-007: Shared Zod Schema Contracts](#adr-007-shared-zod-schema-contracts)

---

### ADR-001: Monorepo Architecture with pnpm Workspaces

- **Status**: Approved
- **Context**: AlgoReflex comprises multiple applications (web, api), services (runner), and shared domain libraries (contracts, learning-core, problem-schema, ui, config). Multiple AI agents and human contributors need to make cross-cutting changes safely.
- **Decision**: Adopt a monorepo structure managed by `pnpm` workspaces.
- **Consequences**:
  - Single repository clone for all agents.
  - atomic commits and refactorings across contracts, API, and frontend.
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

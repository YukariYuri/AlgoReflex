# AlgoReflex — Multi-Agent Engineering Governance

This document establishes the mandatory operational protocol for all AI coding agents (ChatGPT, Gemini Antigravity, Claude, Codex) and human engineers collaborating on the **AlgoReflex** repository.

---

## 1. Project Authority & Hierarchy

- **Project Lead & System / Learning Architect**: **ChatGPT**
  - Owns product direction, architectural authority, milestone signoff, and integration review.
- **Foundation Builder & Implementation Agent**: **Gemini Antigravity**
  - Implements foundations, core packages, scaffolding, and feature modules.
- **Implementation & Deep Review Agent**: **Claude (GitHub connected)**
  - Code reviews, edge case detection, refactoring, and algorithmic verification.
- **Escalation & Debugging Agent**: **Codex**
  - Diagnostic investigation, complex bug triage, and performance profiling.

### Technical Source of Truth

The authoritative state of the system is defined by:

1. The current `main` branch.
2. The architectural specifications in `docs/*`.
3. The approved architectural decision records in `docs/DECISIONS.md`.
4. The active milestone tracking in `tasks/ACTIVE.md`.

GitHub is the single shared source of truth between all agents.

---

## 2. Mandatory Protocol Before Modifying Code

Before generating, editing, or refactoring code, every agent **MUST**:

1. Read this file (`AGENTS.md`).
2. Read [`docs/PRODUCT.md`](docs/PRODUCT.md) to align on product vision.
3. Read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) to honor service boundaries.
4. Read the relevant subsystem documentation in `docs/` (e.g., [`docs/SECURITY.md`](docs/SECURITY.md), [`docs/CODE_RUNNER.md`](docs/CODE_RUNNER.md)).
5. Read [`tasks/ACTIVE.md`](tasks/ACTIVE.md) to understand current milestone scope.
6. Inspect the existing workspace and verify local build/test health before making edits.

---

## 3. Strict Prohibitions (What Agents Must NOT Do)

- **DO NOT** redesign architecture without an approved task and decision entry.
- **DO NOT** silently alter API contracts or domain schemas in `@algoreflex/contracts`.
- **DO NOT** replace approved technology stacks (e.g., swapping Fastify, Vite, pnpm, or Postgres) without explicit authorization.
- **DO NOT** add AI provider SDKs (OpenAI, Anthropic, Google GenAI, LangChain, etc.) to core runtime code. The core learning engine must remain 100% deterministic and AI-independent.
- **DO NOT** disable, delete, or mock out failing tests merely to make CI pass.
- **DO NOT** bypass security controls or resource limits for developer convenience.
- **DO NOT** execute untrusted C++ code inside the `apps/api` service.
- **DO NOT** push commits directly to the `main` branch. All work must be conducted on feature/milestone branches and merged through Pull Requests reviewed by the Project Lead.
- **DO NOT** commit secrets, `.env` files, or production credentials.

---

## 4. Engineering Standards (What Every Implementation Must Satisfy)

Every code change must satisfy these quality criteria:

- **Modularity & Clarity**: Code must be readable, well-factored, and free of gratuitous abstraction.
- **Contract Preservation**: Maintain backward compatibility of existing contracts unless a breaking change has been formally approved in `docs/DECISIONS.md`.
- **Strict Type Safety**: All TypeScript code must pass under `strict: true` without `any` workarounds.
- **Meaningful Tests**: Accompany every new domain feature, algorithm, or route with automated unit/integration tests in Vitest.
- **Clean Quality Checks**: Verify that `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` succeed with zero errors.
- **Contextual Documentation**: Document the _why_ behind architectural decisions, not self-evident syntax.

---

## 5. Architectural Change Protocol

If a proposed task requires changing architecture, database schemas, or service boundaries:

1. **Document the Rationale**: Clearly explain what technical problem necessitates the change.
2. **Author an ADR**: Add or update an Architectural Decision Record in [`docs/DECISIONS.md`](docs/DECISIONS.md).
3. **Assess Migration Impact**: Outline how existing data, contracts, or services will be affected.
4. **Obtain Approval**: Await formal review and approval from the Project Lead (ChatGPT) before proceeding with broad code changes.

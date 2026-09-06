# AlgoReflex — Competitive C++ Learning & Training System

> **From Problem → Pattern → Tool → Code**

AlgoReflex is a dedicated learning platform engineered to train students from introductory C++ up to national-level competitive programming (USACO Platinum, IOI, ICPC).

Instead of treating programming as syntax memorization, AlgoReflex conditions the competitor's reflex arc across all problem-solving layers: from understanding constraints to recognizing patterns, selecting optimal C++ STL tools, writing clean code, and utilizing reliable contest fallbacks when under extreme time pressure.

---

## Repository Structure

AlgoReflex is architected as a clean, modular pnpm monorepo:

```text
AlgoReflex/
├── apps/
│   ├── web/                    # React 19 + TypeScript + Vite playground client
│   └── api/                    # Fastify application API and runner gateway
├── services/
│   └── runner/                 # Rootless-Docker isolated C++ compiler/execution service
├── packages/
│   ├── contracts/              # Shared Zod schemas, domain models, and status vocabularies
│   ├── learning-core/          # Pure domain logic: Prerequisite DAG, fallback matrix, mastery
│   ├── problem-schema/         # Problem, TestCase, Constraint, and Hint schemas
│   ├── config/                 # Shared TypeScript base configs and ESLint flat rules
│   └── ui/                     # Design tokens and shared UI component primitives
├── docs/                       # Comprehensive specifications and ADRs
├── tasks/                      # Project task tracking (ACTIVE, BACKLOG, COMPLETED)
├── .github/workflows/          # Baseline CI validation pipeline
├── AGENTS.md                   # Multi-agent collaboration governance and protocol
└── README.md
```

---

## Core Philosophy

Traditional learning platforms focus on:

> _"How does this C++ feature work?"_

AlgoReflex trains:

> _"When should I use this?"_  
> _"When should I NOT use this?"_  
> _"What are the subtle contest pitfalls?"_  
> _"What is my safest fallback if I forget this syntax during a contest?"_

### Multi-Dimensional Mastery

Mastery is measured across 7 distinct dimensions rather than simple lesson completion:

- Concept Understanding
- Syntax Recall
- Tool Selection
- Implementation
- Debugging
- Adaptation / Transfer
- Recall Under Pressure

---

## Getting Started

### Prerequisites

- Node.js >= 20 (Node 26+ supported)
- pnpm >= 9 (Workspace managed via `pnpm`)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/YukariYuri/AlgoReflex.git
cd AlgoReflex

# Install all workspace dependencies
pnpm install
```

### Development & Verification Commands

```bash
# Run typechecking across all packages and apps
pnpm typecheck

# Run test suites across all packages
pnpm test

# Run ESLint across entire codebase
pnpm lint

# Build all packages and applications
pnpm build
```

### C++ Playground Runner (Linux / WSL2)

The browser playground requires its separate secure runner service. It does not
execute C++ on the API host. Use a Linux host or WSL2 distribution with a
rootless Docker daemon; ordinary Windows host execution is intentionally not
supported.

```bash
docker build -t algoreflex-cpp-runner:1.0.0 services/runner
export RUNNER_SHARED_TOKEN='use-a-long-local-random-value'
pnpm --filter @algoreflex/runner dev
# In a second shell with the same RUNNER_SHARED_TOKEN:
pnpm --filter @algoreflex/api dev
pnpm --filter @algoreflex/web dev
```

See [`docs/CODE_RUNNER.md`](docs/CODE_RUNNER.md) for threat-test setup,
resource limits, and deployment requirements. M1 implements the documented
isolation controls and threat suite; it is defense in depth, not an assertion of
absolute sandbox security.

---

## Current Status & Roadmap

- **Current Milestone**: `M1 — C++ Playground & Secure Runner`
- **Architecture Lead**: ChatGPT
- **Implementation Agent**: Gemini Antigravity
- **Next Milestone**: `M2 — Learning Core & Persistence`

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the complete 8-milestone trajectory and [`tasks/ACTIVE.md`](tasks/ACTIVE.md) for active work items.

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
│   ├── web/                    # React 19 + TypeScript + Vite web client shell
│   └── api/                    # Fastify + TypeScript application backend API
├── services/
│   └── runner/                 # Isolated C++ compiler and execution sandbox boundary
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

---

## Current Status & Roadmap

- **Current Milestone**: `M0 — Foundation Bootstrap` (In Review)
- **Architecture Lead**: ChatGPT
- **Implementation Agent**: Gemini Antigravity
- **Next Milestone**: `M1 — C++ Playground & Secure Runner Sandbox`

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the complete 8-milestone trajectory and [`tasks/ACTIVE.md`](tasks/ACTIVE.md) for active work items.

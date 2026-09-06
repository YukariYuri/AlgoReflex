# AlgoReflex — Product Roadmap

## Overview of Milestones

```text
M0: Foundation ──► M1: C++ Playground ──► M2: Learning Core ──► M3: Problem Workspace
       │
       ▼
M4: Training Engine ──► M5: Adaptive Learning ──► M6: Competitive Prog ──► M7: National-Level
```

---

### M0: Foundation (Current Milestone)

- **Status**: In Review
- **Focus**: Monorepo bootstrap, shared contracts, architecture specifications, security invariants, agent collaboration rules, baseline CI.
- **Deliverables**:
  - pnpm workspace with strict TypeScript configuration.
  - `@algoreflex/contracts` (statuses, mistakes, mastery, curriculum).
  - `@algoreflex/learning-core` (Prerequisite DAG validator, FallbackMatrix).
  - `@algoreflex/problem-schema` (Problem, TestCase, Constraint schemas).
  - Minimal Fastify API (`/health`, `/api/version`).
  - Minimal React + Vite shell.
  - Safe runner interface with `NOT_IMPLEMENTED` stub.
  - Baseline GitHub Actions CI.

---

### M1: C++ Playground & Secure Runner Sandbox

- **Focus**: Isolated runner service and browser code editor.
- **Deliverables**:
  - Containerized / nsjail C++20 execution environment with CPU/memory/time bounds.
  - Web playground with Monaco code editor.
  - Interactive compilation, error diagnostic formatting, and sample execution.

---

### M2: Learning Core & Persistence

- **Focus**: Relational persistence and curriculum management.
- **Deliverables**:
  - PostgreSQL schema and migrations.
  - User authentication and session handling.
  - Core curriculum CRUD and prerequisite graph persistence.
  - Mastery records database tracking.

---

### M3: Problem Workspace & Verification

- **Focus**: Interactive problem solving interface.
- **Deliverables**:
  - Full problem statement viewer with KaTeX math rendering.
  - Sample test runner and submission dispatcher.
  - Submission history, judge verdict badges, and diff inspector.
  - Layered hint reveal system with score penalty tracking.

---

### M4: Training Engine & Drills

- **Focus**: Reflex drill implementation.
- **Deliverables**:
  - Recall Drills: Syntax recall without autocomplete.
  - Syntax Repair Drills: Fixing subtly broken C++ STL code.
  - Tool Selection Drills: Rapid-fire scenario-to-tool matching.
  - Fallback Drills: Deliberately solving problems with backup primitives.
  - Postmortem logging interface.

---

### M5: Adaptive Learning & Spaced Review

- **Focus**: Intelligent scheduling and weakness isolation.
- **Deliverables**:
  - Multi-dimensional mastery scoring engine.
  - Spaced repetition scheduler for syntax and tool recall.
  - Distinction algorithms for concept failure vs. syntax recall failure.
  - Personalized drill recommendation queue.

---

### M6: Competitive Programming Mode

- **Focus**: Contest emulation and stress testing.
- **Deliverables**:
  - Timed virtual contest simulations.
  - Penalty time and leaderboard calculation.
  - Custom test case generator and stress testing workbench.
  - Time-loss postmortem analytics dashboard.

---

### M7: National-Level Training & Advanced Olympiad

- **Focus**: Top-tier mastery (USACO Platinum, IOI, ICPC).
- **Deliverables**:
  - Advanced curriculum: Heavy-light decomposition, Link-Cut trees, centroid decomposition, FFT, min-cost max-flow.
  - High-pressure speed drills (10-minute implementation challenges).
  - Complex multi-paradigm contest problem sets.

# AlgoReflex — Learning System

## 1. The Core Training Loop

At the center of AlgoReflex is the 8-stage training loop:

```text
Problem ──► Plan ──► Pattern ──► Tool ──► Code ──► Test ──► Reflect ──► Transfer
```

1. **Problem**: Deep comprehension of the problem statement and domain without premature coding.
2. **Plan**: Analyzing constraints (bounds on $N$, time limits) to derive required asymptotic time and space complexities.
3. **Pattern**: Identifying recurring algorithmic blueprints (e.g. prefix sums, two pointers, binary search on answer).
4. **Tool**: Selecting the optimal C++ construct, container, or STL algorithm (e.g. `std::vector`, `std::lower_bound`, `std::priority_queue`).
5. **Code**: Implementing the solution cleanly with idiomatic modern C++ (C++17/C++20/C++23).
6. **Test**: Compiling, verifying with sample cases, and stress testing boundary edge cases.
7. **Reflect**: Performing post-submission diagnosis to isolate whether any mistake was conceptual, syntactical, or time-related.
8. **Transfer**: Solving related variations or disguised problems to solidify generalizability.

---

## 2. Multi-Dimensional Mastery Model

> [!IMPORTANT]
> **Provisional M0 Evaluation Notice**:
> The initial mastery scoring heuristic in M0 (`HeuristicMasteryEvaluator`) is explicitly provisional and exists solely to validate repository architecture, shared contracts, and test pipelines.
> Production mastery calibration, Bayesian knowledge tracing, and recommendation mechanics will be calibrated during **Milestone M5 (Adaptive Learning)** and evaluated against empirical learner data before becoming authoritative.

A student does not "know" binary search simply because they solved one problem. Mastery is broken down into seven distinct, measurable dimensions:

| Dimension                 | Description                                                               | Typical Symptom If Deficient                                                       |
| ------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Concept Understanding** | Grasp of the theoretical principles, invariants, and proofs.              | Fails to recognize monotonic condition required for binary search.                 |
| **Syntax Recall**         | Rapid, accurate memory of language/STL keywords, signatures, and headers. | Cannot recall `<algorithm>` header or iterator return type of `std::lower_bound`.  |
| **Tool Selection**        | Choosing the optimal tool among valid alternatives.                       | Uses `std::set` (O(log N)) when a simple sorted array with binary search suffices. |
| **Implementation**        | Translating logic into bug-free code quickly.                             | Off-by-one errors on `high = mid - 1` vs `high = mid`.                             |
| **Debugging**             | Isolating errors methodically using invariants and minimal test cases.    | Randomly flips inequalities without tracing states.                                |
| **Adaptation / Transfer** | Recognizing the pattern in non-standard or masked formulations.           | Solves numerical binary search but fails to apply binary search on answer space.   |
| **Recall Under Pressure** | Accurate, panic-free retrieval within strict time constraints.            | Forgets iterator subtraction under contest clock countdown.                        |

The system distinguishes between:

- _"The learner does not understand binary search"_ (low Concept Understanding)
- _"The learner understands binary search but hesitates on iterator handling with `std::lower_bound`"_ (low Syntax Recall).

---

## 3. The 12 Training Modes

AlgoReflex designs targeted drill types to exercise specific layers of the reflex arc:

1. **Direct Practice**: Immediate application of a newly introduced tool or technique.
2. **Recall Drill**: The required algorithm is stated; the student must recall syntax and write it without references within a time limit.
3. **Syntax Repair**: A buggy or subtly invalid snippet is provided (e.g. invalid iterator use, missing header, 32-bit overflow); the learner must fix only the syntax flaw.
4. **Tool Selection**: Given problem scenarios, select the best C++ tool without writing the full code.
5. **Tool Swap**: Refactor an existing working solution to use an alternative tool (e.g., replace an explicit loop with `std::transform_reduce`).
6. **Same Goal, Different Tools**: Compare trade-offs between 2-3 implementations of the same problem (e.g., `std::set` vs `std::priority_queue` vs sorted vector).
7. **Fallback Drill**: Deliberately disable the preferred STL tool and require solving the problem using safer, lower-level primitives.
8. **Pattern Recognition**: Unlabelled problem statements where the student must identify the hidden pattern.
9. **Mixed Practice**: Interleaved problems from unrelated categories to prevent context-clue bias.
10. **Pressure Training**: Rapid-fire mini-drills with shrinking timers to build adrenaline resistance.
11. **Contest Simulation**: Timed virtual contests mimicking Olympiad conditions with zero hints and hidden test sets.
12. **Postmortem Analysis**: Mandatory post-contest breakdown isolating time lost across problem layers (reading, planning, tool choice, debugging).

---

## 4. The Fallback Philosophy

In competitive programming, forgetting ideal syntax can cost an entire competition if the student wastes 30 minutes in panic. AlgoReflex enforces a **Preferred vs. Fallback** mental catalog:

```text
Preferred (Idiomatic / Fast to write):
std::accumulate(v.begin(), v.end(), 0LL)

Contest Fallback (Safe / Impossible to forget):
long long sum = 0;
for (const auto& x : v) sum += x;
```

```text
Preferred:
std::lower_bound(v.begin(), v.end(), target)

Contest Fallback:
int low = 0, high = (int)v.size() - 1, ans = (int)v.size();
while (low <= high) {
  int mid = low + (high - low) / 2;
  if (v[mid] >= target) { ans = mid; high = mid - 1; }
  else { low = mid + 1; }
}
```

Every advanced tool in the curriculum must have a designated, drilled fallback strategy.

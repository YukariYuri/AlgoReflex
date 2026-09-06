# AlgoReflex — Curriculum Taxonomy & Graph Specification

## 1. Single Authoritative Prerequisite Graph Model

AlgoReflex models the curriculum as a **Directed Acyclic Graph (DAG)** of typed knowledge nodes rather than a rigid linear track.

### Single Source of Truth Invariant

Prerequisite relationships exist exclusively as **directed edges** in the authoritative prerequisite graph (`PrerequisiteSchema` / `PrerequisiteGraph`).
Individual curriculum entity schemas (e.g. `Concept`, `Tool`) **do not** maintain independent prerequisite lists. Any entity-local prerequisite views rendered in client interfaces are strictly **derived, cached, or generated** from the authoritative graph edges.

Each edge connects two typed node references (`KnowledgeNodeRef`):

```text
KnowledgeNodeRef: { type: 'CONCEPT' | 'TOOL' | 'PATTERN' | 'LESSON' | 'MODULE', id: string }

PrerequisiteEdge:
  required: KnowledgeNodeRef
  target: KnowledgeNodeRef
  minMasteryScore: number
```

This enables heterogeneous cross-type dependency modeling:

- `CONCEPT:monotonicity` ──► `TOOL:std::lower_bound`
- `TOOL:std::lower_bound` ──► `PATTERN:binary-search-on-answer`
- `PATTERN:binary-search-on-answer` ──► `LESSON:aggressive-cows`

---

## 2. High-Level Curriculum Domains

The curriculum spans from foundational C++ syntax up through international olympiad competitive programming:

```text
C++ Foundations
├── Syntax & Primitives
├── Control Flow (Conditions, Loops)
├── Functions & Scope
├── References, Pointers & Value Semantics
├── Structs, Classes & Operator Overloading
├── Modern Templates & Type Deduction
└── Memory Model & Optimization

STL Mastery
├── Sequence Containers (std::vector, std::deque, std::array, std::string)
├── Container Adaptors (std::stack, std::queue, std::priority_queue)
├── Associative Containers (std::set, std::multiset, std::map, std::multimap)
├── Unordered Associative Containers (std::unordered_map, std::unordered_set, custom hashes)
├── Pairs, Tuples & Structured Bindings
├── Iterators, Ranges & Views
├── Standard Algorithms (std::sort, std::lower_bound, std::transform, std::accumulate)
└── Lambdas & Custom Comparators

Problem-Solving Patterns
├── Simulation & Ad-Hoc
├── Frequency Counting & Hash Maps
├── Coordinate Compression
├── Prefix Sums & Difference Arrays (1D and 2D)
├── Two Pointers & Sliding Window
├── Binary Search & Binary Search on Answer Space
├── Greedy Strategies & Exchange Arguments
└── Recursion, Backtracking & Branch Pruning

Data Structures
├── Disjoint Set Union (DSU / Union-Find) with Rank & Path Compression
├── Binary Heaps & Custom Priority Queues
├── Fenwick Trees (Binary Indexed Trees)
├── Segment Trees (Point Updates, Range Queries, Lazy Propagation)
├── Sparse Tables (Static Range Minimum Queries)
└── Tries & String Indexing

Graphs & Trees
├── Graph Representations (Adjacency Lists vs Matrices)
├── Breadth-First Search (BFS) & 0-1 BFS
├── Depth-First Search (DFS) & Connected Components
├── Topological Sorting & Cycle Detection
├── Shortest Path Algorithms (Dijkstra, Bellman-Ford, Floyd-Warshall)
├── Minimum Spanning Trees (Kruskal, Prim)
├── Strongly Connected Components (Tarjan, Kosaraju)
├── Lowest Common Ancestor (LCA / Binary Lifting)
└── Network Flow Basics (Ford-Fulkerson, Edmonds-Karp, Dinic)

Dynamic Programming (DP)
├── 1D DP State Design & Transitions
├── 2D Grid DP & Matrix Paths
├── Classical Knapsack (0/1, Unbounded, Bounded)
├── Longest Increasing Subsequence (LIS) in O(N log N)
├── Interval DP
├── Tree DP (Rerooting, Subtree Aggregations)
├── Bitmask DP (Subset Transitions)
└── Digit DP

Advanced Topics & Number Theory
├── Prime Sieve (Eratosthenes, Linear Sieve)
├── Greatest Common Divisor & Extended Euclidean Algorithm
├── Modular Arithmetic & Modular Inverse (Fermat's Little Theorem)
├── Combinatorics & Binomial Coefficients
├── String Hashing & KMP
├── Computational Geometry Basics
└── Bit Manipulation & Fast Bitwise Tricks

Competitive Programming Invariants
├── Asymptotic Complexity Estimation ($N \le 10^5 \implies O(N \log N)$)
├── Fast I/O (`cin.tie(nullptr)`, `\n` vs `endl`)
├── Integer Overflow Prevention (`long long`, `__int128_t`)
├── Floating-Point Precision & Epsilon Comparisons
├── Contest Stress Testing & Custom Random Generators
└── Time Management & Postmortem Analysis
```

---

## 3. Prerequisite Graph Invariant

- Every module must declare clear incoming prerequisite node references.
- Graph validation routines in `@algoreflex/learning-core` guarantee no circular dependencies exist.
- Progress across the curriculum is measured by multi-dimensional mastery rather than raw lesson completion.

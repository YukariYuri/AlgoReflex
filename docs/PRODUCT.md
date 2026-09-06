# AlgoReflex — Product Specification

## 1. Product Identity & Core Mission

**AlgoReflex** is a Competitive C++ Learning & Training System designed to transform a learner from complete C++ novice to an advanced competitive programmer capable of competing at the national olympiad level (such as USACO Platinum, IOI, ICPC).

AlgoReflex is deliberately **not** a standard linear tutorial or general-purpose programming site.

### Core Philosophy

> **From Problem → Pattern → Tool → Code**

Traditional programming education teaches _how_ a language feature or standard template library (STL) algorithm works, but fails during high-pressure contests where the competitor struggles with:

1. Identifying _which_ tool is appropriate for a problem.
2. Knowing _when NOT_ to use a particular tool.
3. Remembering the precise syntax and iterator semantics under time pressure.
4. Having safe, instinctive **fallback strategies** when an advanced tool syntax is forgotten during a live contest.

AlgoReflex trains the competitor's reflex arc through structured drills, multi-dimensional mastery tracking, and deliberate fallback conditioning.

---

## 2. Target Learner

1. **Ambitious Beginners**: Learners starting C++ who want rigorous, deep mastery rather than surface-level tutorials.
2. **Intermediate Competitive Programmers**: Contestants stuck at Bronze/Silver/Div2 who lose valuable contest time due to syntax debugging, iterator invalidation, or incorrect tool choices.
3. **Advanced Competitors**: Competitors seeking to sharpen speed, eliminate time loss from hesitation, and master recall under extreme pressure.

---

## 3. The Mental Execution Process

AlgoReflex conditions the learner to navigate this mental process without skipping critical layers:

```text
Understand Problem
       │
       ▼
Read Constraints
       │
       ▼
Plan
       │
       ▼
Recognize Pattern
       │
       ▼
Choose Appropriate Tool
       │
       ▼
Write Pseudocode
       │
       ▼
Implement C++
       │
       ▼
Compile / Run
       │
       ▼
Test Against Edge Cases
       │
       ▼
Diagnose Failure
       │
       ▼
Fix Only the Broken Layer
       │
       ▼
Transfer Knowledge to New Problems
```

---

## 4. Why Traditional Platforms Fail

In real competitions, a common failure pattern occurs:

- The learner understands the problem requirements.
- The learner realizes an STL algorithm (e.g. `std::accumulate`, `std::nth_element`, `std::lower_bound`) or data structure could solve it.
- The learner partially misremembers the syntax, iterator signature, or header requirements.
- The learner encounters a compiler error or subtle runtime bug (e.g., 32-bit integer overflow in `std::accumulate(..., 0)` vs `0LL`).
- The learner spends 25 minutes debugging the tool syntax instead of the algorithm logic.
- Eventually, under panic, they fall back to a manual loop or give up.

AlgoReflex isolates and trains each layer of this breakdown:

- Insufficient tool vocabulary
- Insufficient depth of tool knowledge
- Weak syntax recall
- Low tool-selection confidence
- Ignorance of tool limitations and gotchas
- Lack of drilled fallback strategies
- Cognitive collapse under time pressure

---

## 5. Non-Goals

1. **Not a General Software Engineering Course**: AlgoReflex does not teach web servers, GUI frameworks, or enterprise C++ software patterns. It focuses squarely on algorithmic problem solving, modern C++ (C++20/C++23) STL mastery, and contest execution.
2. **Not a Mere Problem Archive**: AlgoReflex is not a collection of 5,000 uncurated problems. Every problem and drill is tied to concepts, patterns, tools, and fallback drills.
3. **No Mandatory AI Dependency**: The core learning engine, judge, test suites, and curriculum do not depend on external AI APIs (OpenAI, Anthropic, Gemini). The platform remains 100% operational offline or in self-hosted environments.

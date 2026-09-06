# AlgoReflex — Database Design & Schema Specification

## 1. Database Philosophy & Target Engine

AlgoReflex targets standard **PostgreSQL (v15+)**.

### Portability Invariant

The domain model and schema are intentionally decoupled from any specific proprietary cloud platform. Access is structured so that PostgreSQL can run locally (Docker / native), through Supabase, Neon, AWS RDS, or standard bare-metal PostgreSQL without changing domain queries or schemas.

---

## 2. Core Entities & Relationships (Preliminary)

```text
Users
  ├── MasteryRecords (user_id, target_id, scores_json)
  ├── Submissions (user_id, problem_id, code, status, result_json)
  ├── MistakeEvents (user_id, submission_id, category, layer)
  ├── LearningActivities (user_id, mode, target_id, duration)
  ├── ReviewItems (user_id, target_id, next_review_date)
  └── ContestAttempts (user_id, contest_id, score, postmortems_json)

Courses
  └── Modules (course_id, order)
        └── Lessons (module_id, order)
              ├── Concepts (lesson_id / relations)
              ├── Tools (lesson_id / relations)
              └── Patterns (lesson_id / relations)

Prerequisites (authoritative dependency edges)
  └── PrerequisiteEdges (id, required_type, required_id, target_type, target_id, min_mastery_score)

Problems
  ├── ProblemConstraints (time_limit, memory_limit, bounds)
  ├── TestCases (problem_id, input, output, is_sample, is_hidden)
  ├── Hints (problem_id, layer, reveal_order, text)
  ├── Solutions (problem_id, approach, code, time_complexity)
  └── ProblemVariants (problem_id, modifier, tool_impact)

Contests
  └── ContestProblems (contest_id, problem_id, points)
```

---

## 3. Entity Definitions

### `users`

- `id` (UUID, Primary Key)
- `email` (VARCHAR(255), Unique)
- `username` (VARCHAR(64), Unique)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### `submissions`

- `id` (UUID, Primary Key)
- `user_id` (UUID, FK to users)
- `problem_id` (VARCHAR(128))
- `language` (VARCHAR(32), e.g. 'cpp20')
- `code` (TEXT)
- `status` (VARCHAR(32), e.g. 'ACCEPTED', 'WRONG_ANSWER')
- `execution_time_ms` (INTEGER)
- `memory_used_kb` (INTEGER)
- `result_details` (JSONB)
- `created_at` (TIMESTAMPTZ)

### `mastery_records`

- `id` (UUID, Primary Key)
- `user_id` (UUID, FK to users)
- `target_type` (VARCHAR(32), e.g. 'CONCEPT', 'TOOL', 'PATTERN')
- `target_id` (VARCHAR(128))
- `scores` (JSONB) — keyed by MasteryDimension with score, confidence, sample count
- `overall_score` (NUMERIC(5,2))
- `updated_at` (TIMESTAMPTZ)

### `mistake_events`

- `id` (UUID, Primary Key)
- `user_id` (UUID, FK to users)
- `submission_id` (UUID, Nullable FK to submissions)
- `problem_id` (VARCHAR(128))
- `category` (VARCHAR(64), MistakeTaxonomy)
- `detected_at_layer` (VARCHAR(32))
- `notes` (TEXT)
- `time_lost_seconds` (INTEGER)
- `created_at` (TIMESTAMPTZ)

---

## 4. Migration Strategy

- Migrations will be introduced in Milestone M2 when the persistence layer is activated.
- In M0, schemas and contracts are formalized in `@algoreflex/contracts` and `@algoreflex/problem-schema`.

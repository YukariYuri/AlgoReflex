# AlgoReflex — Security Policy & Invariants

Security is a first-class architectural concern from day zero. All implementation agents and human contributors must strictly uphold these 13 invariants across all milestones.

---

## The 13 Security Invariants

1. **Strict Runner Isolation**: Never execute untrusted C++ directly inside the main application API service. Code execution must occur only within isolated runner processes/containers.
2. **Network Disablement**: Runner execution environments must have outbound network access disabled completely. Sandboxes cannot connect to the internet, local LAN, or internal metadata endpoints.
3. **Controlled Sandbox Filesystem Layout**: Runner filesystems must mount rootfs read-only. Source compilation occurs in an ephemeral tmpfs `/sandbox/source`, and binaries execute exclusively from a controlled `/sandbox/bin` directory. General-purpose `/tmp` is mounted `noexec` where practical.
4. **Non-Root Execution**: Runner processes and containers must run strictly as an unprivileged, non-root user (e.g., `nobody` or UID 10001).
5. **Decoupled Compile & Execution Resource Quotas**: Resource limits are modeled separately for compilation and execution. The compilation sandbox permits up to 16 PIDs for compiler sub-processes (`cc1plus`, `as`, `ld`), while the runtime execution sandbox strictly caps user processes at **1** (preventing fork bombs).
6. **No Arbitrary Compiler Flags**: Users and client requests are strictly forbidden from supplying arbitrary compiler or linker flags. Compilations are parameterized solely by trusted `toolchainProfile` identifiers (e.g., `GNU_CPP20`, `CLANG_CPP20`) with hardcoded, vetted flags.
7. **Hidden Test Case & Solution Confidentiality by Construction**: Hidden test inputs, authoritative expected outputs, test generators, and reference solutions are isolated within server-only judge contracts (`JudgeProblem`, `JudgeSubmissionResult`). They are excluded by construction from public client schemas (`PublicProblem`, `PublicSubmissionResult`).
8. **Request Body Size & Schema Validation**: All API endpoints must enforce strict maximum payload limits (default 1MB) and validate request payloads against strict Zod schemas before processing.
9. **Zero Committed Secrets**: Secrets, tokens, API keys, database credentials, and production certificates must NEVER be committed to Git.
10. **Environment Variable Hygiene**: All `.env*` files are ignored in `.gitignore`, with only `.env.example` committed to track variable keys without secrets.
11. **Credential-Free Logging**: Authentication headers, database passwords, session tokens, and sensitive personal data must never be logged to console, log files, or telemetry.
12. **Server-Side Authorization**: All data access, submission actions, and mastery updates must be authenticated and authorized on the server side. Never rely on client state.
13. **Zero-Trust Client Scoring**: Client-reported execution times, test results, or scores are treated as untrusted and never accepted. All authoritative grading is computed server-side by the judge.

---

## Reporting Vulnerabilities

If an agent or contributor identifies any compromise of these invariants, report it immediately to the Project Lead (ChatGPT) and file an escalation issue before proceeding with code changes.

# AlgoReflex — Secure Code Runner Specification

## 1. Threat Model & Security Boundary

Allowing arbitrary C++ code execution is inherently dangerous. Untrusted C++ programs can attempt:

- Fork bombs / process exhaustion (`while(1) fork();`).
- Memory exhaustion (allocating hundreds of gigabytes to trigger system OOM).
- Filesystem tampering, reading host sensitive files (`/etc/passwd`, `.env`), or modifying host binaries.
- Outbound network attacks (cryptomining, DDoS, port scanning, C2 communication).
- Malicious compiler exploits (exploiting compiler bugs or infinite template recursion to crash the compiler).

**Strict Invariant**: User-submitted C++ code must NEVER be compiled or executed on the host OS or inside the main API process.

---

## 2. Isolation Architecture (Milestone M1+)

The future runner service (`services/runner`) executes each submission through a multi-tier sandbox container or process jail:

```text
Host System / API
       │ (JSON Request over isolated Unix Socket or Internal IPC)
       ▼
[ Judge Worker Manager ]
       │
       ▼ Spawns isolated process jail
[ Linux nsjail / Docker Sandbox ]
       ├── Linux Namespaces (PID, Mount, Network, IPC, UTS, User)
       ├── Cgroups v2 (CPU quota, Memory limits, PIDs limits)
       ├── Seccomp Syscall Filtering (Allowlist: read, write, exit, mmap, brk)
       ├── Read-only ephemeral rootfs (tmpfs with noexec on /tmp)
       ├── Network Namespace: None (Network disabled / unshared)
       └── User: Nobody / Non-root UID 10001
```

---

## 3. Resource Bounds & Limits

Every execution must be bounded by strict hard and soft limits:

| Resource             | Default Limit     | Maximum Contest Limit | Violation Status        |
| -------------------- | ----------------- | --------------------- | ----------------------- |
| **CPU Time**         | 1,000 ms          | 5,000 ms              | `TIME_LIMIT_EXCEEDED`   |
| **Wall-Clock Time**  | 2,000 ms (2x CPU) | 10,000 ms             | `TIME_LIMIT_EXCEEDED`   |
| **Memory**           | 256 MB            | 512 MB                | `MEMORY_LIMIT_EXCEEDED` |
| **Output Size**      | 64 KB             | 10 MB                 | `OUTPUT_LIMIT_EXCEEDED` |
| **Process Count**    | 1 process         | 1 process (no fork)   | `RUNTIME_ERROR`         |
| **Source Code Size** | 64 KB             | 128 KB                | Rejected at API layer   |

---

## 4. Compiler Configuration & Allowlist

Compilation will be performed using modern GNU C++ and LLVM Clang:

- **Compilers**: `g++-13`, `clang++-17`
- **Standard**: `-std=c++20` or `-std=c++23`
- **Contest Flags**: `-O2 -Wall -Wextra -Wconversion -Wshadow`
- **Security Check**: User cannot inject arbitrary compiler flags. The flag list is strictly hardcoded on the runner host.

---

## 5. Current M0 Status

In Milestone M0:

- The runner package exports contract interfaces (`CodeRunner`, `ExecutionRequest`, `ExecutionResponse`).
- The runner implementation (`StubCodeRunner`) returns an explicit `INTERNAL_ERROR` / `NOT_IMPLEMENTED` rejection.
- Zero untrusted code execution takes place in M0. Full containerized isolation is scheduled for Milestone M1.

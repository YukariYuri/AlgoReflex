# AlgoReflex — Secure Code Runner Specification

## 1. Threat Model & Security Boundary

Allowing untrusted C++ code execution presents critical security vulnerabilities:

- Fork bombs / process table exhaustion (`while(1) fork();`).
- Memory exhaustion (triggering system-wide OOM killer).
- Filesystem tampering, reading host secrets (`/etc/passwd`, `.env`), or modifying host binaries.
- Outbound network attacks (cryptomining, DDoS, LAN port scanning).
- Malicious compiler exploits (compiler crashers or infinite template recursion).

**Strict Invariant**: User-submitted C++ code must NEVER be compiled or executed on the host OS or inside the main API process.

---

## 2. Two-Stage Isolation Pipeline (Milestone M1+)

Compilation and execution have fundamentally different resource requirements and threat profiles. The runner architecture strictly decouples them into two separate sandboxes:

```text
Submission (Source Code + ToolchainProfile)
       │
       ▼ (Phase 1: Controlled Compilation)
[ Compile Sandbox ]
       ├── Invokes trusted compiler (e.g. g++-13, clang++-17)
       ├── Fixed, hardcoded trusted flags (no arbitrary user flags)
       ├── Multi-process permitted (PID limit: 16 for cc1plus, as, ld)
       ├── Mounts: /rootfs (ro), /sandbox/source (rw tmpfs), /sandbox/bin (rw)
       └── Strict CPU, RAM, and compiler output limits
       │
       ▼ Produces Executable Artifact in /sandbox/bin
[ Security Verification Check ]
       │
       ▼ (Phase 2: Confined Execution per Test Case)
[ Execution Sandbox ]
       ├── Invokes user binary strictly from /sandbox/bin
       ├── Single process strictly enforced (PID limit: 1 — no fork)
       ├── Network namespace: completely disabled (no outbound access)
       ├── Mounts: /rootfs (ro), /sandbox/bin (ro/rx), /tmp (tmpfs with noexec)
       ├── Strict CPU, wall-clock, memory, and stdout/stderr limits
       └── Evaluated against inputs and expected outputs
```

---

## 3. Resource Bounds & Security Profiles

### Compilation Sandbox Profile

Compilers internally spawn multiple sub-processes (`cc1plus`, GNU assembler `as`, and linker `ld`). A process limit of 1 would cause compilation to immediately fail. Therefore, the compilation profile uses:

| Resource                 | Value     | Rationale                                                      |
| ------------------------ | --------- | -------------------------------------------------------------- |
| **Max Processes (PIDs)** | 16        | Permits compiler frontend, assembler, and linker sub-processes |
| **CPU Time**             | 10,000 ms | Permits compiling complex C++20 templates under `-O2`          |
| **Wall-Clock Time**      | 15,000 ms | Capped wall-clock threshold for compiler termination           |
| **Memory**               | 1,024 MB  | Accommodates compiler AST and symbol table overhead            |
| **Diagnostics Limit**    | 128 KB    | Prevents disk filling via million-line template error dumps    |
| **Max Source Size**      | 128 KB    | Rejected at API and runner boundaries                          |

### Runtime Execution Sandbox Profile

The compiled user program receives the most restrictive execution constraints:

| Resource                     | Default Limit | Maximum Contest Limit                 | Violation Verdict       |
| ---------------------------- | ------------- | ------------------------------------- | ----------------------- |
| **Max Processes (PIDs)**     | **1**         | **1** (Strictly no subprocesses)      | `RUNTIME_ERROR`         |
| **CPU Time**                 | 1,000 ms      | 5,000 ms                              | `TIME_LIMIT_EXCEEDED`   |
| **Wall-Clock Time**          | 2,000 ms      | 10,000 ms                             | `TIME_LIMIT_EXCEEDED`   |
| **Memory**                   | 256 MB        | 512 MB                                | `MEMORY_LIMIT_EXCEEDED` |
| **Output Size (stdout/err)** | 64 KB         | 10 MB                                 | `OUTPUT_LIMIT_EXCEEDED` |
| **Network Access**           | **None**      | **None** (Unshared network namespace) | Blocked at kernel level |

---

## 4. Trusted Toolchain Profiles (No Arbitrary Flags)

User requests can specify a `toolchainProfile`, but **CANNOT** provide custom compiler or linker flags. All flags are hardcoded on the runner host according to approved competitive programming profiles:

- `GNU_CPP17`: `g++-13` with `-std=c++17 -O2 -pipe -Wall -Wextra -Wconversion -Wshadow`
- `GNU_CPP20`: `g++-13` with `-std=c++20 -O2 -pipe -Wall -Wextra -Wconversion -Wshadow`
- `GNU_CPP23`: `g++-13` with `-std=c++23 -O2 -pipe -Wall -Wextra -Wconversion -Wshadow`
- `CLANG_CPP17`: `clang++-17` with `-std=c++17 -O2 -pipe -Wall -Wextra -Wconversion -Wshadow`
- `CLANG_CPP20`: `clang++-17` with `-std=c++20 -O2 -pipe -Wall -Wextra -Wconversion -Wshadow`
- `CLANG_CPP23`: `clang++-17` with `-std=c++23 -O2 -pipe -Wall -Wextra -Wconversion -Wshadow`

---

## 5. Filesystem Execution Model

The container filesystem layout enforces strict execution containment:

- `/rootfs` — Read-only bind mount of host system utilities and libraries.
- `/sandbox/source` — Ephemeral tmpfs workspace for storing and compiling user source code.
- `/sandbox/bin` — Controlled executable output directory. The binary is written here during compilation, then made executable, and run exclusively from here during execution.
- `/tmp` — Ephemeral tmpfs mounted with `noexec` where practical to prevent script execution from temporary folders.

---

## 6. Seccomp Syscall Filtering Policy Note

> **IMPORTANT**: Syscall allowlists discussed in preliminary documentation are illustrative only. Modern dynamically linked C++ runtimes (`glibc`, `libstdc++`) and compiler toolchains require numerous initialization syscalls (e.g. `clone3`, `futex`, `rt_sigaction`, `prlimit64`, `fstat`).
>
> In Milestone M1, the production seccomp filter will be experimentally derived by profiling supported toolchains with `auditd`/`strace` to achieve a minimal, battle-tested syscall allowlist without breaking standard competitive programming headers or dynamic linkers.

---

## 7. Current M0 Status

In Milestone M0:

- The runner package defines explicit `CompileLimits`, `ExecutionLimits`, and `ToolchainProfile` contracts in `@algoreflex/runner`.
- The runner implementation (`StubCodeRunner`) returns an explicit `INTERNAL_ERROR` / `NOT_IMPLEMENTED` rejection.
- Zero untrusted code execution takes place in M0. Containerized isolation is scheduled for Milestone M1.

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
       ├── Mounts: minimal immutable rootfs (ro), /sandbox/source (rw tmpfs), /sandbox/bin (rw)
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
       ├── Mounts: minimal immutable rootfs (ro), /sandbox/bin (ro/rx), /tmp (tmpfs with noexec)
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

## 5. Filesystem Execution Model: Immutable Runner Environment

The runner environment must be fully reproducible, strictly isolated, and independent of arbitrary host filesystem contents. It **must never** rely on bind mounting the host operating system's utilities or library directories directly into the sandbox.

### Controlled Sandbox Filesystem Layout

- **Minimal Immutable Runner Rootfs (`/`)**: A pinned, minimal container image rootfs containing only the essential runtime libraries (`glibc`, `libstdc++`) and toolchain binaries required for competitive C++ evaluation. Mounted strictly **read-only (`ro`)** across all sandbox phases.
- **Controlled Writable Compile Workspace (`/sandbox/source`)**: An ephemeral `tmpfs` workspace allocated exclusively during the compilation phase for staging user source code and compiler intermediate files. Size-capped at 128 KB. Never mounted into the execution sandbox.
- **Controlled Executable Artifact Directory (`/sandbox/bin`)**: Staging directory for compiled binaries. Writable during compilation; statically validated and remounted strictly **read-only and execute-only (`ro, rx`)** during the execution phase. Binaries execute exclusively from this path.
- **Ephemeral Restricted `/tmp`**: An isolated `tmpfs` mount capped at 16 MB and mounted with strict mount flags: `noexec, nosuid, nodev`. Prevents staging or executing auxiliary scripts or binaries from temporary locations.

### Absolute Prohibition of Host-Sensitive Mounts

To guarantee defense-in-depth against sandbox escape or credential exfiltration, the runner host MUST enforce that the following resources are **never** mounted or accessible within the untrusted execution sandbox:

1. **Host `/etc`**: Host password hashes (`/etc/shadow`), user databases (`/etc/passwd`), network configurations, or host service configurations must never be visible.
2. **Host Credentials & Secrets**: Cloud provider API keys, SSH keys, deployment credentials, database passwords, and `.env*` configuration files must never be mounted or accessible.
3. **Host Application Files**: AlgoReflex source code, judge daemon binaries, worker orchestrators, and internal scripts must be completely absent from the sandbox namespace.
4. **Docker Daemon Socket**: The Docker control socket (`/var/run/docker.sock`) or container runtime API endpoints must never be mapped into any sandbox container.
5. **Cloud Provider Metadata Endpoints**: Host cloud metadata credentials (e.g. AWS IMDS `169.254.169.254`, GCP metadata server) must be unreachable, enforced via disabled networking and routing policies.
6. **Arbitrary Host Library Directories**: Never directly bind-mount host `/lib`, `/usr/lib`, `/bin`, or `/sbin`. All system libraries must originate exclusively from the pinned, vetted runner rootfs image.

---

## 6. Seccomp Syscall Filtering Policy Note

> **IMPORTANT**: Syscall allowlists discussed in preliminary documentation are illustrative only. Modern dynamically linked C++ runtimes (`glibc`, `libstdc++`) and compiler toolchains require numerous initialization syscalls (e.g. `clone3`, `futex`, `rt_sigaction`, `prlimit64`, `fstat`).
>
> In Milestone M1, the production seccomp filter will be experimentally derived by profiling supported toolchains with `auditd`/`strace` to achieve a minimal, battle-tested syscall allowlist without breaking standard competitive programming headers or dynamic linkers.

---

## 7. M1 Implementation: Rootless Docker Two-Stage Runner

M1 replaces the M0 stub with `DockerSandboxRunner` in `services/runner`. The
Fastify application API calls the runner only through its authenticated internal
HTTP endpoint (`POST /internal/playground/run`). `apps/api` does not import
Docker APIs or launch user processes.

For every run, the runner:

1. Verifies it is running on Linux and that a rootless Docker daemon is available.
2. Creates a fresh tmpfs-backed Docker volume for the compiled artifact, owned
   by the sandbox UID/GID (10001) so compilation needs no privileged setup step.
3. Starts an ephemeral **compile** container from the approved runner image.
4. Streams source only to the compile container's standard input; it is written
   inside a bounded `/sandbox/source` tmpfs. The fixed, allowlisted compiler
   profile writes the artifact to the fresh volume.
5. Starts an independent ephemeral **execution** container with that volume
   mounted read-only at `/sandbox/bin`, and streams `stdin` only to its standard
   input.
6. Captures bounded stdout/stderr, sanitizes diagnostics, force-removes both
   container names, and deletes the artifact volume in `finally`.

The runner never builds a shell command from source, stdin, profile names, or
client input. It invokes the trusted Docker executable with `shell: false` and
an explicit argument array.

### Enforced Docker Isolation Controls

- Linux and rootless Docker are required; unavailable/unsupported environments
  return `RUNNER_UNAVAILABLE` and execute no code.
- No network: `--network none` for both phases.
- Non-root workload: `--user 10001:10001`.
- Immutable base: `--read-only`; the approved image contains toolchains and
  runtime libraries and is never assembled from host bind mounts.
- No host mounts: the runner uses a new tmpfs-backed Docker volume plus tmpfs mounts only;
  it never maps `/etc`, application files, credentials, home directories, or a
  Docker socket into a sandbox.
- Narrow writable areas: compile-only `/sandbox/source` tmpfs and `/tmp` tmpfs
  with `nosuid,nodev,noexec`; execution sees a read-only artifact volume.
- Privilege reduction: `--cap-drop ALL` and `no-new-privileges:true`, alongside
  Docker's default seccomp profile.
- Resource quotas: independent memory, CPU rlimit, wall timeout, output cap,
  and PID limits (16 for compilation; exactly 1 for execution).
- Container logs are disabled, preventing user output from accumulating in the
  Docker log store.

This is defense in depth, not a claim of absolute security. M1 implements the
defined isolation controls and has an explicitly classified threat-test suite;
continued hardening is required in later milestones.

### Local Linux / WSL2 Setup

The secure runner is supported only on a Linux host or a WSL2 Linux distribution
with a **rootless Docker daemon**. An arbitrary Windows process sandbox is not
equivalent and is intentionally rejected.

```bash
# From a Linux/WSL2 shell at the repository root
docker build -t algoreflex-cpp-runner:1.0.0 services/runner
export RUNNER_SHARED_TOKEN='use-a-long-local-random-value'
export RUNNER_IMAGE='algoreflex-cpp-runner:1.0.0'
pnpm --filter @algoreflex/runner dev
# In another shell with the same RUNNER_SHARED_TOKEN
pnpm --filter @algoreflex/api dev
```

Release deployment must configure `RUNNER_IMAGE` to an approved registry image
digest, rather than a mutable tag. The local development tag above exists only
to enable a reproducible developer build before publishing that digest.

### Sandbox Integration Suite

The suite at `services/runner/test/sandbox.integration.test.ts` is opt-in by
design because it needs Linux namespaces, cgroups, and rootless Docker:

```bash
RUN_SANDBOX_INTEGRATION=true \
RUNNER_IMAGE=algoreflex-cpp-runner:1.0.0 \
pnpm --filter @algoreflex/runner test
```

It covers normal compilation/stdin, compile diagnostics, runtime failure,
timeout, memory pressure, output flood, process growth, disabled networking,
and inaccessible host `/etc/passwd`. Unit tests do not prove these kernel-level
controls; they validate the deterministic command construction, status mapping,
sanitization, and teardown behavior.

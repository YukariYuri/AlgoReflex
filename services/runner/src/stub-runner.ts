import type { CodeRunner, ExecutionRequest, ExecutionResponse } from './types.js';

/**
 * Stub implementation of CodeRunner for Milestone M0.
 *
 * In accordance with AlgoReflex Security Invariants (docs/SECURITY.md),
 * untrusted C++ code must NEVER be executed inside the API process or without
 * strict OS/container isolation boundaries (cgroups, namespaces, seccomp).
 *
 * This stub rejects execution requests with a clear NOT_IMPLEMENTED status
 * until the isolated container/nsjail sandbox runner is implemented in M1.
 */
export class StubCodeRunner implements CodeRunner {
  public async execute(request: ExecutionRequest): Promise<ExecutionResponse> {
    return {
      submissionId: request.submissionId,
      status: 'INTERNAL_ERROR',
      compileOutput: 'Compilation disabled: secure sandbox isolation pending in M1.',
      testCaseResults: [],
      error:
        'NOT_IMPLEMENTED: Arbitrary C++ code execution is strictly prohibited in M0 until containerized sandbox isolation is active.',
    };
  }
}

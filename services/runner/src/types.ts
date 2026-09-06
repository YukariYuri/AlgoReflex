import type {
  SubmissionStatus,
  JudgeTestCaseResult,
  ToolchainProfile,
} from '@algoreflex/contracts';

/**
 * Resource limits enforced during the compilation phase.
 * Compiler toolchains (e.g. g++ invoking cc1plus, as, ld) require multiple processes.
 */
export interface CompileLimits {
  timeLimitMs: number; // e.g. 10000ms
  memoryLimitMb: number; // e.g. 1024MB
  outputLimitKb: number; // e.g. 128KB compiler diagnostics
  maxProcesses: number; // e.g. 16 (permits compiler sub-processes)
  maxSourceSizeKb: number; // e.g. 128KB
}

/**
 * Resource limits enforced during runtime execution of user code.
 * Strictly constrained to prevent fork bombs and resource exhaustion.
 */
export interface ExecutionLimits {
  timeLimitMs: number; // e.g. 1000ms CPU time
  wallTimeLimitMs: number; // e.g. 2000ms wall-clock time
  memoryLimitMb: number; // e.g. 256MB
  outputLimitKb: number; // e.g. 64KB stdout/stderr
  maxProcesses: number; // Strictly 1 (no subprocess spawning permitted)
}

export interface RunnerTestCase {
  id: string;
  orderIndex: number;
  input: string;
  expectedOutput: string;
  isSample: boolean;
}

/**
 * Request contract for judge code execution.
 *
 * NOTE: User-controlled arbitrary compiler flags are strictly prohibited.
 * Only trusted, allowlisted toolchainProfile identifiers may be provided.
 */
export interface ExecutionRequest {
  submissionId: string;
  sourceCode: string;
  toolchainProfile: ToolchainProfile;
  compileLimits: CompileLimits;
  executionLimits: ExecutionLimits;
  testCases: RunnerTestCase[];
}

export interface ExecutionResponse {
  submissionId: string;
  status: SubmissionStatus;
  compileOutput?: string;
  testCaseResults: JudgeTestCaseResult[];
  error?: string;
  executionTimeMs?: number;
  memoryUsedKb?: number;
}

export interface CodeRunner {
  execute(request: ExecutionRequest): Promise<ExecutionResponse>;
}

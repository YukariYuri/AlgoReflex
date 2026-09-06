import type { SubmissionStatus, TestCaseResult } from '@algoreflex/contracts';

export interface ExecutionLimits {
  timeLimitMs: number;
  memoryLimitMb: number;
  outputLimitKb: number;
  maxProcesses: number;
}

export interface RunnerTestCase {
  id: string;
  input: string;
  expectedOutput: string;
}

export interface ExecutionRequest {
  submissionId: string;
  sourceCode: string;
  compiler: 'g++-13' | 'clang++-17';
  cxxStandard: 'c++20' | 'c++23';
  compilerFlags?: string[];
  limits: ExecutionLimits;
  testCases: RunnerTestCase[];
}

export interface ExecutionResponse {
  submissionId: string;
  status: SubmissionStatus;
  compileOutput?: string;
  testCaseResults: TestCaseResult[];
  error?: string;
}

export interface CodeRunner {
  execute(request: ExecutionRequest): Promise<ExecutionResponse>;
}

import type {
  PlaygroundRunRequest,
  PlaygroundRunResult,
  ToolchainProfile,
} from '@algoreflex/contracts';

/** Resource limits enforced only by the trusted runner service. */
export interface CompileLimits {
  timeLimitMs: number;
  wallTimeLimitMs: number;
  memoryLimitMb: number;
  outputLimitKb: number;
  maxProcesses: number;
  maxSourceSizeKb: number;
}

/** Resource limits enforced only by the trusted runner service. */
export interface ExecutionLimits {
  timeLimitMs: number;
  wallTimeLimitMs: number;
  memoryLimitMb: number;
  outputLimitKb: number;
  maxProcesses: 1;
}

export interface RunnerLimits {
  compile: CompileLimits;
  execution: ExecutionLimits;
}

export const DEFAULT_RUNNER_LIMITS: RunnerLimits = {
  compile: {
    timeLimitMs: 10_000,
    wallTimeLimitMs: 15_000,
    memoryLimitMb: 1024,
    outputLimitKb: 128,
    maxProcesses: 16,
    maxSourceSizeKb: 128,
  },
  execution: {
    timeLimitMs: 1_000,
    wallTimeLimitMs: 2_000,
    memoryLimitMb: 256,
    outputLimitKb: 64,
    maxProcesses: 1,
  },
};

/** The only runner API exposed to the application API. */
export interface CodeRunner {
  run(request: PlaygroundRunRequest): Promise<PlaygroundRunResult>;
}

export interface SandboxRunnerConfig {
  dockerBinary: string;
  image: string;
  requireRootlessDocker: boolean;
  limits: RunnerLimits;
}

export const DEFAULT_SANDBOX_RUNNER_CONFIG: SandboxRunnerConfig = {
  dockerBinary: 'docker',
  // Development may use a locally built tag. Deployments must configure a
  // digest-pinned RUNNER_IMAGE from the approved release registry.
  image: process.env['RUNNER_IMAGE'] ?? 'algoreflex-cpp-runner:1.0.0',
  requireRootlessDocker: true,
  limits: DEFAULT_RUNNER_LIMITS,
};

export type TrustedToolchainProfile = ToolchainProfile;

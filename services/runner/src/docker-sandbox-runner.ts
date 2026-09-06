import { randomUUID } from 'node:crypto';
import {
  PLAYGROUND_LIMITS,
  TRUSTED_TOOLCHAIN_CONFIGS,
  type PlaygroundRunRequest,
  type PlaygroundRunResult,
} from '@algoreflex/contracts';
import { sanitizeDiagnostics } from './diagnostics.js';
import {
  executeCommand,
  type CommandExecutor,
  type CommandResult,
} from './process-command.js';
import {
  DEFAULT_SANDBOX_RUNNER_CONFIG,
  type CodeRunner,
  type RunnerLimits,
  type SandboxRunnerConfig,
} from './types.js';

const COMPILE_SCRIPT = 'cat > /sandbox/source/main.cpp\nexec "$@"';

function emptyResult(
  status: PlaygroundRunResult['status'],
  message: string
): PlaygroundRunResult {
  return {
    status,
    stdout: '',
    stderr: '',
    runtimeDiagnostics: message,
  };
}

function isSuccessful(result: CommandResult): boolean {
  return (
    !result.failedToStart &&
    !result.timedOut &&
    !result.outputLimitExceeded &&
    result.exitCode === 0
  );
}

function dockerMemory(memoryLimitMb: number): string {
  return `${memoryLimitMb}m`;
}

function cpuSeconds(timeLimitMs: number): string {
  return String(Math.max(1, Math.ceil(timeLimitMs / 1000)));
}

/**
 * Linux-only Docker implementation of the two-stage sandbox lifecycle. All
 * Docker arguments are created from trusted configuration or generated IDs;
 * source and stdin travel only through standard input.
 */
export class DockerSandboxRunner implements CodeRunner {
  private readonly command: CommandExecutor;
  private readonly config: SandboxRunnerConfig;

  public constructor(
    config: SandboxRunnerConfig = DEFAULT_SANDBOX_RUNNER_CONFIG,
    command: CommandExecutor = executeCommand
  ) {
    this.config = config;
    this.command = command;
  }

  public async run(request: PlaygroundRunRequest): Promise<PlaygroundRunResult> {
    if (process.platform !== 'linux') {
      return emptyResult(
        'RUNNER_UNAVAILABLE',
        'The secure Linux sandbox runner is unavailable on this host.'
      );
    }

    if (!(await this.isDockerAvailable())) {
      return emptyResult(
        'RUNNER_UNAVAILABLE',
        'The secure sandbox runtime is unavailable. No code was executed.'
      );
    }

    const requestId = randomUUID();
    const volume = `algoreflex-run-${requestId}`;
    const compileContainer = `algoreflex-compile-${requestId}`;
    const executionContainer = `algoreflex-execute-${requestId}`;

    const volumeResult = await this.command(
      this.config.dockerBinary,
      ['volume', 'create', volume],
      '',
      4096,
      5_000
    );
    if (!isSuccessful(volumeResult)) {
      return emptyResult(
        'RUNNER_UNAVAILABLE',
        'The secure sandbox workspace could not be created. No code was executed.'
      );
    }

    try {
      const compileResult = await this.command(
        this.config.dockerBinary,
        this.compileArgs(
          compileContainer,
          volume,
          request.toolchainProfile,
          this.config.limits
        ),
        request.sourceCode,
        this.config.limits.compile.outputLimitKb * 1024,
        this.config.limits.compile.wallTimeLimitMs
      );

      const compileDiagnostics = sanitizeDiagnostics(
        `${compileResult.stdout}${compileResult.stderr}`,
        PLAYGROUND_LIMITS.maxCompileDiagnosticsBytes
      );
      if (!isSuccessful(compileResult)) {
        if (this.isRunnerFailure(compileResult)) {
          return emptyResult(
            'RUNNER_UNAVAILABLE',
            'The secure sandbox runtime is unavailable. No code was executed.'
          );
        }
        return {
          status: 'COMPILE_ERROR',
          stdout: sanitizeDiagnostics(
            compileResult.stdout,
            PLAYGROUND_LIMITS.maxCompileDiagnosticsBytes
          ),
          stderr: sanitizeDiagnostics(
            compileResult.stderr,
            PLAYGROUND_LIMITS.maxCompileDiagnosticsBytes
          ),
          compileDiagnostics:
            compileResult.timedOut || compileResult.outputLimitExceeded
              ? 'Compilation exceeded a configured resource limit.\n'
              : compileDiagnostics,
        };
      }

      const startedAt = performance.now();
      const executionResult = await this.command(
        this.config.dockerBinary,
        this.executionArgs(executionContainer, volume, this.config.limits),
        request.stdin,
        this.config.limits.execution.outputLimitKb * 1024,
        this.config.limits.execution.wallTimeLimitMs
      );
      const executionTimeMs = Math.round(performance.now() - startedAt);
      const oomKilled = await this.wasOomKilled(executionContainer);

      if (this.isRunnerFailure(executionResult)) {
        return emptyResult(
          'RUNNER_UNAVAILABLE',
          'The secure sandbox runtime is unavailable. No code was executed.'
        );
      }

      if (executionResult.timedOut) {
        return this.executionFailure(
          'TIME_LIMIT_EXCEEDED',
          executionResult,
          executionTimeMs,
          'Execution exceeded the configured time limit.'
        );
      }
      if (executionResult.outputLimitExceeded) {
        return this.executionFailure(
          'OUTPUT_LIMIT_EXCEEDED',
          executionResult,
          executionTimeMs,
          'Execution exceeded the configured output limit.'
        );
      }
      if (oomKilled) {
        return this.executionFailure(
          'MEMORY_LIMIT_EXCEEDED',
          executionResult,
          executionTimeMs,
          'Execution exceeded the configured memory limit.'
        );
      }
      if (!isSuccessful(executionResult)) {
        return this.executionFailure(
          'RUNTIME_ERROR',
          executionResult,
          executionTimeMs,
          'The program terminated with a runtime error.'
        );
      }

      return {
        status: 'ACCEPTED',
        stdout: sanitizeDiagnostics(
          executionResult.stdout,
          PLAYGROUND_LIMITS.maxExecutionOutputBytes
        ),
        stderr: sanitizeDiagnostics(
          executionResult.stderr,
          PLAYGROUND_LIMITS.maxExecutionOutputBytes
        ),
        executionTimeMs,
        exitCode: 0,
      };
    } finally {
      await this.cleanup(compileContainer, executionContainer, volume);
    }
  }

  private async isDockerAvailable(): Promise<boolean> {
    const result = await this.command(
      this.config.dockerBinary,
      ['info', '--format', '{{json .SecurityOptions}}'],
      '',
      4096,
      5_000
    );
    return (
      isSuccessful(result) &&
      (!this.config.requireRootlessDocker ||
        result.stdout.toLowerCase().includes('rootless'))
    );
  }

  private compileArgs(
    name: string,
    volume: string,
    toolchainProfile: PlaygroundRunRequest['toolchainProfile'],
    limits: RunnerLimits
  ): string[] {
    const toolchain = TRUSTED_TOOLCHAIN_CONFIGS[toolchainProfile];
    return [
      ...this.commonSandboxArgs(name, limits.compile, volume, false),
      this.config.image,
      '/bin/sh',
      '-ceu',
      COMPILE_SCRIPT,
      'algoreflex-compile',
      toolchain.compiler,
      ...toolchain.flags,
      '/sandbox/source/main.cpp',
      '-o',
      '/sandbox/bin/program',
    ];
  }

  private executionArgs(name: string, volume: string, limits: RunnerLimits): string[] {
    return [
      ...this.commonSandboxArgs(name, limits.execution, volume, true),
      this.config.image,
      '/sandbox/bin/program',
    ];
  }

  private commonSandboxArgs(
    name: string,
    limits: RunnerLimits['compile'] | RunnerLimits['execution'],
    volume: string,
    readOnlyArtifact: boolean
  ): string[] {
    const artifactMount = `type=volume,source=${volume},target=/sandbox/bin${
      readOnlyArtifact ? ',readonly' : ''
    }`;
    const sourceMount = readOnlyArtifact
      ? []
      : [
          '--tmpfs',
          `/sandbox/source:rw,nosuid,nodev,noexec,size=${
            ('maxSourceSizeKb' in limits ? limits.maxSourceSizeKb : 0) * 1024
          },mode=1777`,
        ];
    return [
      'run',
      '--name',
      name,
      '--network',
      'none',
      '--read-only',
      '--user',
      '10001:10001',
      '--cap-drop',
      'ALL',
      '--security-opt',
      'no-new-privileges:true',
      '--pids-limit',
      String(limits.maxProcesses),
      '--memory',
      dockerMemory(limits.memoryLimitMb),
      '--memory-swap',
      dockerMemory(limits.memoryLimitMb),
      '--cpus',
      '1',
      '--ulimit',
      `cpu=${cpuSeconds(limits.timeLimitMs)}`,
      '--log-driver',
      'none',
      '--tmpfs',
      '/tmp:rw,nosuid,nodev,noexec,size=16777216,mode=1777',
      '--tmpfs',
      '/etc:ro,nosuid,nodev,noexec,size=65536,mode=0555',
      ...sourceMount,
      '--mount',
      artifactMount,
    ];
  }

  private async wasOomKilled(name: string): Promise<boolean> {
    const result = await this.command(
      this.config.dockerBinary,
      ['inspect', '--format', '{{.State.OOMKilled}}', name],
      '',
      128,
      2_000
    );
    return isSuccessful(result) && result.stdout.trim() === 'true';
  }

  private isRunnerFailure(result: CommandResult): boolean {
    if (result.failedToStart) {
      return true;
    }
    return /cannot connect to the docker daemon|error response from daemon|pull access denied|no such image/i.test(
      result.stderr
    );
  }

  private executionFailure(
    status: Exclude<
      PlaygroundRunResult['status'],
      'ACCEPTED' | 'COMPILE_ERROR' | 'RUNNER_UNAVAILABLE' | 'INTERNAL_ERROR'
    >,
    result: CommandResult,
    executionTimeMs: number,
    runtimeDiagnostics: string
  ): PlaygroundRunResult {
    return {
      status,
      stdout: sanitizeDiagnostics(
        result.stdout,
        PLAYGROUND_LIMITS.maxExecutionOutputBytes
      ),
      stderr: sanitizeDiagnostics(
        result.stderr,
        PLAYGROUND_LIMITS.maxExecutionOutputBytes
      ),
      runtimeDiagnostics,
      executionTimeMs,
      ...(result.exitCode === null ? {} : { exitCode: result.exitCode }),
    };
  }

  private async cleanup(
    compileContainer: string,
    executionContainer: string,
    volume: string
  ): Promise<void> {
    await Promise.all([
      this.command(
        this.config.dockerBinary,
        ['rm', '--force', compileContainer],
        '',
        4096,
        5_000
      ),
      this.command(
        this.config.dockerBinary,
        ['rm', '--force', executionContainer],
        '',
        4096,
        5_000
      ),
    ]);
    await this.command(
      this.config.dockerBinary,
      ['volume', 'rm', '--force', volume],
      '',
      4096,
      5_000
    );
  }
}

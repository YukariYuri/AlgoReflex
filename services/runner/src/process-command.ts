import { spawn } from 'node:child_process';

export interface CommandResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  outputLimitExceeded: boolean;
  failedToStart: boolean;
}

export type CommandExecutor = (
  command: string,
  args: readonly string[],
  input: string,
  outputLimitBytes: number,
  timeoutMs: number
) => Promise<CommandResult>;

function appendWithinLimit(
  chunks: Buffer[],
  chunk: Buffer,
  currentBytes: number,
  maxBytes: number
): Buffer {
  const allowedBytes = Math.max(0, maxBytes - currentBytes);
  const allowed = chunk.subarray(0, allowedBytes);
  chunks.push(allowed);
  return allowed;
}

/**
 * Starts a trusted process without a shell. User source and stdin are sent on
 * standard input; neither can become an executable argument or shell fragment.
 */
export const executeCommand: CommandExecutor = async (
  command,
  args,
  input,
  outputLimitBytes,
  timeoutMs
) =>
  new Promise(resolve => {
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let outputBytes = 0;
    let timedOut = false;
    let outputLimitExceeded = false;
    let settled = false;
    const watchdogRef: { current?: ReturnType<typeof setTimeout> } = {};

    const settle = (result: Omit<CommandResult, 'stdout' | 'stderr'>): void => {
      if (settled) {
        return;
      }
      settled = true;
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
      }
      resolve({
        ...result,
        stdout: Buffer.concat(stdoutChunks).toString('utf8'),
        stderr: Buffer.concat(stderrChunks).toString('utf8'),
      });
    };

    let child;
    try {
      child = spawn(command, args, {
        shell: false,
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
      });
    } catch {
      settle({
        exitCode: null,
        timedOut: false,
        outputLimitExceeded: false,
        failedToStart: true,
      });
      return;
    }

    const stop = (): void => {
      if (!child.killed) {
        child.kill('SIGKILL');
      }
    };

    watchdogRef.current = setTimeout(() => {
      timedOut = true;
      stop();
    }, timeoutMs);

    const handleOutput = (target: Buffer[], chunk: Buffer): void => {
      const accepted = appendWithinLimit(target, chunk, outputBytes, outputLimitBytes);
      outputBytes += accepted.byteLength;
      if (accepted.byteLength !== chunk.byteLength) {
        outputLimitExceeded = true;
        stop();
      }
    };

    child.stdout.on('data', (chunk: Buffer) => handleOutput(stdoutChunks, chunk));
    child.stderr.on('data', (chunk: Buffer) => handleOutput(stderrChunks, chunk));
    child.stdin.on('error', () => undefined);

    child.once('error', () => {
      settle({
        exitCode: null,
        timedOut,
        outputLimitExceeded,
        failedToStart: true,
      });
    });
    child.once('close', exitCode => {
      settle({
        exitCode,
        timedOut,
        outputLimitExceeded,
        failedToStart: false,
      });
    });

    child.stdin.end(input, 'utf8');
  });

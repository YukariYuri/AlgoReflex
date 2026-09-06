import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PlaygroundRunRequest } from '@algoreflex/contracts';
import { DockerSandboxRunner } from '../src/docker-sandbox-runner.js';
import type { CommandExecutor, CommandResult } from '../src/process-command.js';

const request: PlaygroundRunRequest = {
  sourceCode: '#include <iostream>\nint main() { std::cout << "ok\\n"; }',
  stdin: 'ignored',
  toolchainProfile: 'GNU_CPP20',
};

const success = (stdout = '', stderr = ''): CommandResult => ({
  exitCode: 0,
  stdout,
  stderr,
  timedOut: false,
  outputLimitExceeded: false,
  failedToStart: false,
});

const originalPlatform = process.platform;

afterEach(() => {
  Object.defineProperty(process, 'platform', {
    configurable: true,
    value: originalPlatform,
  });
});

describe('DockerSandboxRunner', () => {
  it('fails closed without starting a command outside Linux', async () => {
    Object.defineProperty(process, 'platform', { configurable: true, value: 'win32' });
    const command = vi.fn<CommandExecutor>();
    const runner = new DockerSandboxRunner(undefined, command);

    await expect(runner.run(request)).resolves.toMatchObject({
      status: 'RUNNER_UNAVAILABLE',
    });
    expect(command).not.toHaveBeenCalled();
  });

  it('uses only trusted Docker arguments and sends source/stdin through standard input', async () => {
    Object.defineProperty(process, 'platform', { configurable: true, value: 'linux' });
    const command = vi.fn<CommandExecutor>(async (_binary, args) => {
      if (args[0] === 'info') return success('["name=rootless"]');
      if (args[0] === 'inspect') return success('false');
      if (
        args[0] === 'run' &&
        args.at(-1) === '/sandbox/bin/program' &&
        !args.includes('-o')
      ) {
        return success('ok\n');
      }
      return success();
    });
    const runner = new DockerSandboxRunner(undefined, command);

    const result = await runner.run(request);
    expect(result).toMatchObject({ status: 'ACCEPTED', stdout: 'ok\n', exitCode: 0 });

    const compileCall = command.mock.calls.find(([, args]) =>
      args.includes('/sandbox/source/main.cpp')
    );
    const executionCall = command.mock.calls.find(
      ([, args]) => args.at(-1) === '/sandbox/bin/program' && !args.includes('-o')
    );
    expect(compileCall).toBeDefined();
    expect(executionCall).toBeDefined();
    expect(compileCall?.[1]).toEqual(
      expect.arrayContaining([
        '--network',
        'none',
        '--read-only',
        '--user',
        '10001:10001',
        '--cap-drop',
        'ALL',
        '--pids-limit',
        '16',
      ])
    );
    expect(executionCall?.[1]).toEqual(expect.arrayContaining(['--pids-limit', '1']));
    expect(executionCall?.[1].join(' ')).toContain('readonly');
    expect(compileCall?.[1].join(' ')).not.toContain(request.sourceCode);
    expect(executionCall?.[1].join(' ')).not.toContain(request.stdin);
    expect(compileCall?.[2]).toBe(request.sourceCode);
    expect(executionCall?.[2]).toBe(request.stdin);
    expect(command.mock.calls.flatMap(([, args]) => args).join(' ')).not.toContain(
      'docker.sock'
    );
  });

  it('maps an execution output flood to OUTPUT_LIMIT_EXCEEDED and tears down resources', async () => {
    Object.defineProperty(process, 'platform', { configurable: true, value: 'linux' });
    const command = vi.fn<CommandExecutor>(async (_binary, args) => {
      if (args[0] === 'info') return success('["name=rootless"]');
      if (args[0] === 'inspect') return success('false');
      if (
        args[0] === 'run' &&
        args.at(-1) === '/sandbox/bin/program' &&
        !args.includes('-o')
      ) {
        return { ...success('A'.repeat(64)), outputLimitExceeded: true, exitCode: null };
      }
      return success();
    });
    const runner = new DockerSandboxRunner(undefined, command);

    await expect(runner.run(request)).resolves.toMatchObject({
      status: 'OUTPUT_LIMIT_EXCEEDED',
    });
    expect(command.mock.calls.some(([, args]) => args[0] === 'rm')).toBe(true);
    expect(
      command.mock.calls.some(([, args]) => args[0] === 'volume' && args[1] === 'rm')
    ).toBe(true);
  });
});

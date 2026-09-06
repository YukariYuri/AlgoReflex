import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { PlaygroundRunRequest, PlaygroundRunResult } from '@algoreflex/contracts';
import { buildRunnerApp } from '../src/app.js';
import type { CodeRunner } from '../src/types.js';

class TestRunner implements CodeRunner {
  public async run(_request: PlaygroundRunRequest): Promise<PlaygroundRunResult> {
    return {
      status: 'ACCEPTED',
      stdout: 'ok\n',
      stderr: '',
      executionTimeMs: 1,
      exitCode: 0,
    };
  }
}

describe('runner internal API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildRunnerApp({ accessToken: 'runner-test-token', runner: new TestRunner() });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires a shared runner token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/internal/playground/run',
      payload: { sourceCode: 'int main() {}', stdin: '', toolchainProfile: 'GNU_CPP20' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('only accepts the strict public runner request', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/internal/playground/run',
      headers: { authorization: 'Bearer runner-test-token' },
      payload: {
        sourceCode: 'int main() {}',
        stdin: '',
        toolchainProfile: 'GNU_CPP20',
        command: '/bin/sh',
      },
    });
    expect(response.statusCode).toBe(400);
  });
});

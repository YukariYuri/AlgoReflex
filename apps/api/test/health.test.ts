import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { PlaygroundRunRequest, PlaygroundRunResult } from '@algoreflex/contracts';
import { buildApp } from '../src/app.js';
import type { RunnerGateway } from '../src/runner-client.js';

class TestRunnerGateway implements RunnerGateway {
  public requests: PlaygroundRunRequest[] = [];

  public async run(request: PlaygroundRunRequest): Promise<PlaygroundRunResult> {
    this.requests.push(request);
    return {
      status: 'ACCEPTED',
      stdout: `${request.stdin}ok`,
      stderr: '',
      executionTimeMs: 4,
      exitCode: 0,
    };
  }
}

describe('API Route Tests', () => {
  let app: FastifyInstance;
  let runner: TestRunnerGateway;

  beforeAll(async () => {
    runner = new TestRunnerGateway();
    app = buildApp({ runnerGateway: runner });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns 200 and operational status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const json = JSON.parse(response.payload);
    expect(json.status).toBe('ok');
    expect(json.service).toBe('algoreflex-api');
    expect(typeof json.uptime).toBe('number');
  });

  it('GET /api/version returns 200 and M1 version info', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/version',
    });

    expect(response.statusCode).toBe(200);
    const json = JSON.parse(response.payload);
    expect(json.name).toBe('AlgoReflex API');
    expect(json.milestone).toBe('M1');
    expect(json.version).toBe('0.1.0');
  });

  it('POST /api/playground/run validates the public contract and delegates only safe fields', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/playground/run',
      payload: {
        sourceCode: 'int main() { return 0; }',
        stdin: 'hello\n',
        toolchainProfile: 'GNU_CPP20',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toMatchObject({
      status: 'ACCEPTED',
      stdout: 'hello\nok',
    });
    expect(runner.requests).toEqual([
      {
        sourceCode: 'int main() { return 0; }',
        stdin: 'hello\n',
        toolchainProfile: 'GNU_CPP20',
      },
    ]);
  });

  it('rejects arbitrary flags before invoking the runner', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/playground/run',
      payload: {
        sourceCode: 'int main() { return 0; }',
        stdin: '',
        toolchainProfile: 'GNU_CPP20',
        compilerFlags: ['-march=native'],
      },
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.payload).error.code).toBe('BAD_REQUEST');
    expect(runner.requests).toHaveLength(1);
  });
});

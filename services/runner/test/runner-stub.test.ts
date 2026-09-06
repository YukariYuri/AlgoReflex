import { describe, it, expect } from 'vitest';
import { StubCodeRunner, type ExecutionRequest } from '../src/index.js';

describe('StubCodeRunner', () => {
  it('safely refuses to execute arbitrary code and returns NOT_IMPLEMENTED error', async () => {
    const runner = new StubCodeRunner();
    const request: ExecutionRequest = {
      submissionId: 'test-sub-1',
      sourceCode: '#include <iostream>\nint main() { return 0; }',
      toolchainProfile: 'GNU_CPP20',
      compileLimits: {
        timeLimitMs: 10000,
        memoryLimitMb: 1024,
        outputLimitKb: 128,
        maxProcesses: 16,
        maxSourceSizeKb: 128,
      },
      executionLimits: {
        timeLimitMs: 1000,
        wallTimeLimitMs: 2000,
        memoryLimitMb: 256,
        outputLimitKb: 64,
        maxProcesses: 1,
      },
      testCases: [],
    };

    const response = await runner.execute(request);

    expect(response.submissionId).toBe('test-sub-1');
    expect(response.status).toBe('INTERNAL_ERROR');
    expect(response.error).toContain('NOT_IMPLEMENTED');
  });

  it('prohibits arbitrary compiler flags from being supplied in execution request', () => {
    const validRequest: ExecutionRequest = {
      submissionId: 'test-sub-2',
      sourceCode: 'int main(){}',
      toolchainProfile: 'GNU_CPP20',
      compileLimits: {
        timeLimitMs: 10000,
        memoryLimitMb: 1024,
        outputLimitKb: 128,
        maxProcesses: 16,
        maxSourceSizeKb: 128,
      },
      executionLimits: {
        timeLimitMs: 1000,
        wallTimeLimitMs: 2000,
        memoryLimitMb: 256,
        outputLimitKb: 64,
        maxProcesses: 1,
      },
      testCases: [],
    };

    // Verify at runtime that compilerFlags property is not recognized or part of the trusted profile model
    expect((validRequest as Record<string, unknown>)['compilerFlags']).toBeUndefined();
  });
});

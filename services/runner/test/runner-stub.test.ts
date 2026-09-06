import { describe, it, expect } from 'vitest';
import { StubCodeRunner, type ExecutionRequest } from '../src/index.js';

describe('StubCodeRunner', () => {
  it('safely refuses to execute arbitrary code and returns NOT_IMPLEMENTED error', async () => {
    const runner = new StubCodeRunner();
    const request: ExecutionRequest = {
      submissionId: 'test-sub-1',
      sourceCode: '#include <iostream>\nint main() { return 0; }',
      compiler: 'g++-13',
      cxxStandard: 'c++20',
      limits: {
        timeLimitMs: 1000,
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
});

import { describe, it, expect } from 'vitest';
import { ProblemSchema, TestCaseSchema, ProblemConstraintSchema } from '../src/index.js';

describe('Problem Schema Validation', () => {
  it('validates a valid test case', () => {
    const testCase = {
      id: 'tc-1',
      orderIndex: 0,
      input: '5\n1 2 3 4 5\n',
      expectedOutput: '15\n',
      isSample: true,
      isHidden: false,
    };
    const parsed = TestCaseSchema.parse(testCase);
    expect(parsed.id).toBe('tc-1');
    expect(parsed.isSample).toBe(true);
  });

  it('validates a complete problem entity', () => {
    const problem = {
      id: 'prob-prefix-sum-1',
      slug: 'range-sum-query',
      title: 'Range Sum Query',
      difficulty: 'EASY',
      statement: 'Given an array of integers, compute sum in range [L, R].',
      inputFormat: 'N Q followed by array elements and queries.',
      outputFormat: 'Output answer for each query on a new line.',
      constraints: {
        timeLimitMs: 1000,
        memoryLimitMb: 256,
        inputBounds: {
          N: '1 <= N <= 10^5',
          Q: '1 <= Q <= 10^5',
        },
      },
      sampleCases: [
        {
          id: 'sample-1',
          orderIndex: 0,
          input: '5 1\n1 2 3 4 5\n1 3\n',
          expectedOutput: '6\n',
          isSample: true,
          isHidden: false,
        },
      ],
      targetPatternIds: ['pattern-prefix-sum'],
      targetToolIds: ['cpp-vector', 'cpp-partial-sum'],
      solutions: [
        {
          id: 'sol-prefix-sum',
          name: 'Prefix Sum Array',
          timeComplexity: 'O(N + Q)',
          spaceComplexity: 'O(N)',
          preferredToolIds: ['cpp-vector'],
          cxxCode: '// C++ solution',
          explanation: 'Precompute cumulative sums.',
        },
      ],
    };

    const parsed = ProblemSchema.parse(problem);
    expect(parsed.slug).toBe('range-sum-query');
    expect(parsed.constraints.timeLimitMs).toBe(1000);
    expect(parsed.solutions.length).toBe(1);
  });

  it('rejects problem with empty sample cases', () => {
    const invalidProblem = {
      id: 'invalid-prob',
      slug: 'invalid',
      title: 'Invalid Problem',
      difficulty: 'MEDIUM',
      statement: 'Some statement',
      inputFormat: 'Some input',
      outputFormat: 'Some output',
      constraints: ProblemConstraintSchema.parse({}),
      sampleCases: [], // Min 1 required
    };

    expect(() => ProblemSchema.parse(invalidProblem)).toThrow();
  });
});

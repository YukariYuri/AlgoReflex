import { describe, it, expect } from 'vitest';
import {
  PublicProblemSchema,
  JudgeProblemSchema,
  SampleTestCaseSchema,
  HiddenTestCaseSchema,
  ProblemConstraintSchema,
  toPublicProblem,
} from '../src/index.js';

describe('Problem Schema Validation & Confidentiality', () => {
  it('validates sample and hidden test cases with strict discriminator', () => {
    const sample = SampleTestCaseSchema.parse({
      id: 'tc-sample-1',
      orderIndex: 0,
      input: '5\n1 2 3 4 5\n',
      expectedOutput: '15\n',
      isSample: true,
      explanation: 'Sum of 1 to 5',
    });
    expect(sample.isSample).toBe(true);

    const hidden = HiddenTestCaseSchema.parse({
      id: 'tc-hidden-1',
      orderIndex: 1,
      input: '100000\n...',
      expectedOutput: '5000050000\n',
      isSample: false,
      isHidden: true,
      weight: 2,
    });
    expect(hidden.isSample).toBe(false);
    expect(hidden.isHidden).toBe(true);
  });

  it('validates a client-safe PublicProblem entity', () => {
    const publicProblem = {
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
          isSample: true as const,
        },
      ],
      targetPatternIds: ['pattern-prefix-sum'],
      targetToolIds: ['cpp-vector'],
      author: 'AlgoReflex',
    };

    const parsed = PublicProblemSchema.parse(publicProblem);
    expect(parsed.slug).toBe('range-sum-query');
    expect(parsed.constraints.timeLimitMs).toBe(1000);
  });

  it('strictly rejects PublicProblem containing hiddenTestCases or solutions', () => {
    const publicProblemWithLeaks = {
      id: 'prob-prefix-sum-leak',
      slug: 'leak-test',
      title: 'Leak Test',
      difficulty: 'MEDIUM',
      statement: 'Statement',
      inputFormat: 'Input',
      outputFormat: 'Output',
      constraints: {
        timeLimitMs: 1000,
        memoryLimitMb: 256,
      },
      sampleCases: [
        {
          id: 'sample-1',
          orderIndex: 0,
          input: '1\n',
          expectedOutput: '1\n',
          isSample: true as const,
        },
      ],
      // SENSITIVE LEAKS:
      hiddenTestCases: [
        {
          id: 'secret-tc',
          orderIndex: 1,
          input: '1000000\n',
          expectedOutput: '42\n',
          isSample: false,
          isHidden: true,
        },
      ],
      solutions: [
        {
          id: 'sol-secret',
          name: 'Author Solution',
          timeComplexity: 'O(N)',
          spaceComplexity: 'O(1)',
          cxxCode: '#include <iostream>\n...',
          explanation: 'Secret algorithm',
        },
      ],
    };

    // PublicProblemSchema.strict() MUST throw when sensitive judge-only fields are present
    expect(() => PublicProblemSchema.parse(publicProblemWithLeaks)).toThrow();
  });

  it('validates JudgeProblem and correctly transforms it to PublicProblem', () => {
    const judgeProblem = JudgeProblemSchema.parse({
      id: 'prob-authoring-1',
      slug: 'authoring-test',
      title: 'Authoring Test',
      difficulty: 'HARD',
      statement: 'Problem statement text',
      inputFormat: 'Input format text',
      outputFormat: 'Output format text',
      constraints: {
        timeLimitMs: 2000,
        memoryLimitMb: 512,
      },
      sampleCases: [
        {
          id: 'sample-1',
          orderIndex: 0,
          input: '10\n',
          expectedOutput: '20\n',
          isSample: true as const,
        },
      ],
      hiddenTestCases: [
        {
          id: 'hidden-1',
          orderIndex: 1,
          input: '1000000\n',
          expectedOutput: '2000000\n',
          isSample: false as const,
          isHidden: true as const,
        },
      ],
      solutions: [
        {
          id: 'sol-1',
          name: 'Optimal Solution',
          timeComplexity: 'O(N log N)',
          spaceComplexity: 'O(N)',
          cxxCode: 'int main(){}',
          explanation: 'Use binary search',
        },
      ],
    });

    expect(judgeProblem.hiddenTestCases.length).toBe(1);
    expect(judgeProblem.solutions.length).toBe(1);

    // Transform to client-safe public problem
    const publicVersion = toPublicProblem(judgeProblem);
    const parsed = PublicProblemSchema.parse(publicVersion);

    expect(parsed.id).toBe('prob-authoring-1');
    expect((parsed as Record<string, unknown>)['hiddenTestCases']).toBeUndefined();
    expect((parsed as Record<string, unknown>)['solutions']).toBeUndefined();
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

    expect(() => PublicProblemSchema.parse(invalidProblem)).toThrow();
  });
});

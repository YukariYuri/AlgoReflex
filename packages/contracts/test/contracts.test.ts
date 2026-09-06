import { describe, it, expect } from 'vitest';
import {
  SubmissionStatusSchema,
  MistakeCategorySchema,
  MasteryDimensionSchema,
  TrainingModeSchema,
  ToolSchema,
  CppStandardSchema,
  ToolchainProfileSchema,
  PublicHiddenTestCaseVerdictSchema,
  PublicSubmissionResultSchema,
  JudgeSubmissionResultSchema,
  toPublicSubmissionResult,
  PrerequisiteSchema,
} from '../src/index.js';

describe('Contracts Schema Validation', () => {
  it('validates submission statuses correctly', () => {
    expect(SubmissionStatusSchema.parse('ACCEPTED')).toBe('ACCEPTED');
    expect(SubmissionStatusSchema.parse('TIME_LIMIT_EXCEEDED')).toBe(
      'TIME_LIMIT_EXCEEDED'
    );
    expect(() => SubmissionStatusSchema.parse('INVALID_STATUS')).toThrow();
  });

  it('validates mistake taxonomy categories', () => {
    expect(MistakeCategorySchema.parse('SYNTAX_RECALL')).toBe('SYNTAX_RECALL');
    expect(MistakeCategorySchema.parse('OFF_BY_ONE')).toBe('OFF_BY_ONE');
    expect(() => MistakeCategorySchema.parse('UNKNOWN_ERROR')).toThrow();
  });

  it('validates mastery dimensions', () => {
    expect(MasteryDimensionSchema.parse('RECALL_UNDER_PRESSURE')).toBe(
      'RECALL_UNDER_PRESSURE'
    );
    expect(MasteryDimensionSchema.parse('TOOL_SELECTION')).toBe('TOOL_SELECTION');
  });

  it('validates training modes', () => {
    expect(TrainingModeSchema.parse('FALLBACK_DRILL')).toBe('FALLBACK_DRILL');
    expect(TrainingModeSchema.parse('SYNTAX_REPAIR')).toBe('SYNTAX_REPAIR');
  });

  it('validates centralized C++ standards and toolchain profiles', () => {
    expect(CppStandardSchema.parse('CPP17')).toBe('CPP17');
    expect(CppStandardSchema.parse('CPP20')).toBe('CPP20');
    expect(CppStandardSchema.parse('CPP23')).toBe('CPP23');
    expect(() => CppStandardSchema.parse('CPP98')).toThrow();

    expect(ToolchainProfileSchema.parse('GNU_CPP20')).toBe('GNU_CPP20');
    expect(ToolchainProfileSchema.parse('CLANG_CPP23')).toBe('CLANG_CPP23');
    expect(() => ToolchainProfileSchema.parse('CUSTOM_GCC')).toThrow();
  });

  it('validates a deep tool schema with standard CppStandard', () => {
    const validTool = {
      id: 'cpp-vector',
      name: 'std::vector',
      header: '<vector>',
      category: 'Sequence Containers',
      whatIsIt: 'A dynamic contiguous array',
      whyExists: 'Provides automatic resizing with O(1) random access',
      whenToUse: ['Sequential data with unknown size', 'Cache-friendly iteration'],
      whenNotToUse: [
        'Frequent insertions at front or middle',
        'Fixed tiny size known at compile time',
      ],
      syntax: 'std::vector<T> vec;',
      variants: [],
      parameters: [],
      returnValues: 'None for declaration',
      complexity: {
        time: 'O(1) amortized push_back, O(1) random access',
        space: 'O(N)',
      },
      commonPatterns: ['Push back in loop', 'Sorting with std::sort'],
      commonMistakes: [
        'Iterator invalidation on reallocation',
        'Index out of bounds via []',
      ],
      contestPitfalls: [
        'Reallocations causing TLE if reserve() is not used on massive N',
      ],
      worksWellWith: ['std::sort', 'std::lower_bound'],
      alternatives: ['std::deque', 'std::array'],
      fallbackToolId: 'raw-c-array',
      fallbackExplanation: 'Use fixed-size array when size bound N <= 10^6 is known',
    };

    const parsed = ToolSchema.parse(validTool);
    expect(parsed.id).toBe('cpp-vector');
    expect(parsed.complexity.time).toContain('O(1)');
  });

  it('enforces typed cross-entity prerequisite modeling', () => {
    const crossPrereq = {
      id: 'prereq-concept-to-tool-1',
      required: {
        type: 'CONCEPT',
        id: 'binary-search-theory',
      },
      target: {
        type: 'TOOL',
        id: 'std::lower_bound',
      },
      minMasteryScore: 80,
    };

    const parsed = PrerequisiteSchema.parse(crossPrereq);
    expect(parsed.required.type).toBe('CONCEPT');
    expect(parsed.target.type).toBe('TOOL');
  });

  it('strictly forbids actualOutput and expectedOutput on hidden test case public verdicts', () => {
    const validHiddenVerdict = {
      testCaseId: 'hidden-tc-4',
      orderIndex: 4,
      isSample: false,
      status: 'WRONG_ANSWER',
      timeExecutionMs: 45,
      memoryExecutionKb: 1024,
      errorMessage: 'Wrong answer on test 4',
    };

    expect(PublicHiddenTestCaseVerdictSchema.parse(validHiddenVerdict)).toBeDefined();

    // Leaking expectedOutput on hidden case MUST throw
    const leakedHiddenVerdict = {
      ...validHiddenVerdict,
      expectedOutput: '42\n', // Forbidden on public hidden verdict!
    };

    expect(() => PublicHiddenTestCaseVerdictSchema.parse(leakedHiddenVerdict)).toThrow();
  });

  it('correctly sanitizes JudgeSubmissionResult into PublicSubmissionResult without leaking hidden outputs', () => {
    const judgeResult = JudgeSubmissionResultSchema.parse({
      status: 'WRONG_ANSWER',
      totalTestCases: 2,
      passedTestCases: 1,
      maxExecutionTimeMs: 50,
      maxMemoryUsedKb: 2048,
      compileOutput: 'Compilation finished with 0 warnings.',
      testCaseResults: [
        {
          testCaseId: 'sample-1',
          orderIndex: 0,
          isSample: true,
          status: 'ACCEPTED',
          timeExecutionMs: 12,
          memoryExecutionKb: 1024,
          input: '1 2\n',
          actualOutput: '3\n',
          expectedOutput: '3\n',
        },
        {
          testCaseId: 'hidden-1',
          orderIndex: 1,
          isSample: false,
          status: 'WRONG_ANSWER',
          timeExecutionMs: 50,
          memoryExecutionKb: 2048,
          input: '1000000 2000000\n', // Hidden input!
          actualOutput: '-1294967296\n', // Hidden actual!
          expectedOutput: '3000000\n', // Hidden expected!
          errorMessage: 'Wrong answer',
        },
      ],
    });

    const publicResult = toPublicSubmissionResult(judgeResult);
    const parsedPublic = PublicSubmissionResultSchema.parse(publicResult);

    expect(parsedPublic.testCaseResults.length).toBe(2);

    // Sample case can retain output diagnostics
    const sampleCase = parsedPublic.testCaseResults[0];
    expect(sampleCase?.isSample).toBe(true);
    if (sampleCase && sampleCase.isSample) {
      expect(sampleCase.expectedOutput).toBe('3\n');
    }

    // Hidden case MUST NOT have input, actualOutput, or expectedOutput
    const hiddenCase = parsedPublic.testCaseResults[1];
    expect(hiddenCase?.isSample).toBe(false);
    expect((hiddenCase as Record<string, unknown>)['expectedOutput']).toBeUndefined();
    expect((hiddenCase as Record<string, unknown>)['actualOutput']).toBeUndefined();
    expect((hiddenCase as Record<string, unknown>)['input']).toBeUndefined();
  });
});

import { describe, it, expect } from 'vitest';
import {
  SubmissionStatusSchema,
  MistakeCategorySchema,
  MasteryDimensionSchema,
  TrainingModeSchema,
  ToolSchema,
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

  it('validates a deep tool schema', () => {
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
});

import { z } from 'zod';
import { CppStandardSchema } from './language.js';

export const SubmissionStatusSchema = z.enum([
  'QUEUED',
  'COMPILING',
  'COMPILE_ERROR',
  'RUNNING',
  'ACCEPTED',
  'WRONG_ANSWER',
  'TIME_LIMIT_EXCEEDED',
  'MEMORY_LIMIT_EXCEEDED',
  'RUNTIME_ERROR',
  'OUTPUT_LIMIT_EXCEEDED',
  'INTERNAL_ERROR',
]);

export type SubmissionStatus = z.infer<typeof SubmissionStatusSchema>;

// ============================================================================
// Public / Client-Safe Submission Result Contracts
// Enforces that hidden test case inputs and expected outputs NEVER leak to clients.
// ============================================================================

export const PublicSampleTestCaseResultSchema = z.object({
  testCaseId: z.string(),
  orderIndex: z.number().int().nonnegative(),
  isSample: z.literal(true),
  status: SubmissionStatusSchema,
  timeExecutionMs: z.number().nonnegative(),
  memoryExecutionKb: z.number().nonnegative(),
  actualOutput: z.string().optional(),
  expectedOutput: z.string().optional(),
  errorMessage: z.string().optional(),
});

export type PublicSampleTestCaseResult = z.infer<typeof PublicSampleTestCaseResultSchema>;

export const PublicHiddenTestCaseVerdictSchema = z
  .object({
    testCaseId: z.string(),
    orderIndex: z.number().int().nonnegative(),
    isSample: z.literal(false),
    status: SubmissionStatusSchema,
    timeExecutionMs: z.number().nonnegative(),
    memoryExecutionKb: z.number().nonnegative(),
    errorMessage: z.string().optional(),
  })
  .strict(); // Invariant: actualOutput and expectedOutput MUST NOT exist on hidden verdicts

export type PublicHiddenTestCaseVerdict = z.infer<
  typeof PublicHiddenTestCaseVerdictSchema
>;

export const PublicTestCaseResultSchema = z.discriminatedUnion('isSample', [
  PublicSampleTestCaseResultSchema,
  PublicHiddenTestCaseVerdictSchema,
]);

export type PublicTestCaseResult = z.infer<typeof PublicTestCaseResultSchema>;

export const PublicSubmissionResultSchema = z.object({
  status: SubmissionStatusSchema,
  totalTestCases: z.number().int().nonnegative(),
  passedTestCases: z.number().int().nonnegative(),
  maxExecutionTimeMs: z.number().nonnegative(),
  maxMemoryUsedKb: z.number().nonnegative(),
  compileOutput: z.string().optional(),
  testCaseResults: z.array(PublicTestCaseResultSchema),
});

export type PublicSubmissionResult = z.infer<typeof PublicSubmissionResultSchema>;

export const PublicSubmissionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  problemId: z.string(),
  language: CppStandardSchema,
  code: z.string().min(1),
  status: SubmissionStatusSchema,
  result: PublicSubmissionResultSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type PublicSubmission = z.infer<typeof PublicSubmissionSchema>;

// ============================================================================
// Internal / Server / Judge Submission Result Contracts
// Contains authoritative execution telemetry, diffs, and raw test case data.
// ============================================================================

export const JudgeTestCaseResultSchema = z.object({
  testCaseId: z.string(),
  orderIndex: z.number().int().nonnegative(),
  isSample: z.boolean(),
  status: SubmissionStatusSchema,
  timeExecutionMs: z.number().nonnegative(),
  memoryExecutionKb: z.number().nonnegative(),
  input: z.string().optional(),
  actualOutput: z.string().optional(),
  expectedOutput: z.string().optional(),
  errorMessage: z.string().optional(),
  exitCode: z.number().int().optional(),
});

export type JudgeTestCaseResult = z.infer<typeof JudgeTestCaseResultSchema>;

export const JudgeSubmissionResultSchema = z.object({
  status: SubmissionStatusSchema,
  totalTestCases: z.number().int().nonnegative(),
  passedTestCases: z.number().int().nonnegative(),
  maxExecutionTimeMs: z.number().nonnegative(),
  maxMemoryUsedKb: z.number().nonnegative(),
  compileOutput: z.string().optional(),
  testCaseResults: z.array(JudgeTestCaseResultSchema),
  judgeHost: z.string().optional(),
  evaluatedAt: z.string().datetime().optional(),
});

export type JudgeSubmissionResult = z.infer<typeof JudgeSubmissionResultSchema>;

// Backward compatibility alias for legacy references
export type TestCaseResult = PublicTestCaseResult;
export type SubmissionResult = PublicSubmissionResult;
export type Submission = PublicSubmission;

/**
 * Sanitizes an internal JudgeSubmissionResult into a safe PublicSubmissionResult.
 * Strips all hidden input and expectedOutput data by construction.
 */
export function toPublicSubmissionResult(
  judge: JudgeSubmissionResult
): PublicSubmissionResult {
  return {
    status: judge.status,
    totalTestCases: judge.totalTestCases,
    passedTestCases: judge.passedTestCases,
    maxExecutionTimeMs: judge.maxExecutionTimeMs,
    maxMemoryUsedKb: judge.maxMemoryUsedKb,
    compileOutput: judge.compileOutput,
    testCaseResults: judge.testCaseResults.map(tc => {
      if (tc.isSample) {
        return {
          testCaseId: tc.testCaseId,
          orderIndex: tc.orderIndex,
          isSample: true as const,
          status: tc.status,
          timeExecutionMs: tc.timeExecutionMs,
          memoryExecutionKb: tc.memoryExecutionKb,
          actualOutput: tc.actualOutput,
          expectedOutput: tc.expectedOutput,
          errorMessage: tc.errorMessage,
        };
      }
      return {
        testCaseId: tc.testCaseId,
        orderIndex: tc.orderIndex,
        isSample: false as const,
        status: tc.status,
        timeExecutionMs: tc.timeExecutionMs,
        memoryExecutionKb: tc.memoryExecutionKb,
        errorMessage: tc.errorMessage,
      };
    }),
  };
}

import { z } from 'zod';

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

export const TestCaseResultSchema = z.object({
  testCaseId: z.string(),
  status: SubmissionStatusSchema,
  timeExecutionMs: z.number().nonnegative(),
  memoryExecutionKb: z.number().nonnegative(),
  actualOutput: z.string().optional(),
  expectedOutput: z.string().optional(),
  errorMessage: z.string().optional(),
  isSample: z.boolean().default(false),
});

export type TestCaseResult = z.infer<typeof TestCaseResultSchema>;

export const SubmissionResultSchema = z.object({
  status: SubmissionStatusSchema,
  totalTestCases: z.number().int().nonnegative(),
  passedTestCases: z.number().int().nonnegative(),
  maxExecutionTimeMs: z.number().nonnegative(),
  maxMemoryUsedKb: z.number().nonnegative(),
  compileOutput: z.string().optional(),
  testCaseResults: z.array(TestCaseResultSchema),
});

export type SubmissionResult = z.infer<typeof SubmissionResultSchema>;

export const SubmissionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  problemId: z.string(),
  language: z.literal('cpp20'),
  code: z.string().min(1),
  status: SubmissionStatusSchema,
  result: SubmissionResultSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Submission = z.infer<typeof SubmissionSchema>;

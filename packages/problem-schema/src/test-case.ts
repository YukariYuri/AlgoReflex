import { z } from 'zod';

export const SampleTestCaseSchema = z.object({
  id: z.string(),
  orderIndex: z.number().int().nonnegative(),
  input: z.string(),
  expectedOutput: z.string(),
  isSample: z.literal(true),
  explanation: z.string().optional(),
});

export type SampleTestCase = z.infer<typeof SampleTestCaseSchema>;

export const HiddenTestCaseSchema = z.object({
  id: z.string(),
  orderIndex: z.number().int().nonnegative(),
  input: z.string(),
  expectedOutput: z.string(),
  isSample: z.literal(false),
  isHidden: z.literal(true).default(true),
  weight: z.number().int().positive().default(1),
});

export type HiddenTestCase = z.infer<typeof HiddenTestCaseSchema>;

export const TestCaseSchema = z.discriminatedUnion('isSample', [
  SampleTestCaseSchema,
  HiddenTestCaseSchema,
]);

export type TestCase = z.infer<typeof TestCaseSchema>;

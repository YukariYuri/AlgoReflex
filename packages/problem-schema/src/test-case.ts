import { z } from 'zod';

export const TestCaseSchema = z.object({
  id: z.string(),
  orderIndex: z.number().int().nonnegative(),
  input: z.string(),
  expectedOutput: z.string(),
  isSample: z.boolean().default(false),
  isHidden: z.boolean().default(true),
  explanation: z.string().optional(),
});

export type TestCase = z.infer<typeof TestCaseSchema>;

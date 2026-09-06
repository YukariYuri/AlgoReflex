import { z } from 'zod';

export const MistakeCategorySchema = z.enum([
  'PROBLEM_MISUNDERSTANDING',
  'CONSTRAINT_MISREAD',
  'WRONG_ALGORITHM',
  'COMPLEXITY_TOO_HIGH',
  'WRONG_TOOL_SELECTION',
  'SYNTAX_RECALL',
  'API_MISUSE',
  'OFF_BY_ONE',
  'INDEX_OUT_OF_BOUNDS',
  'INTEGER_OVERFLOW',
  'PRECISION',
  'EDGE_CASE',
  'LOGIC_ERROR',
  'RUNTIME_ERROR',
  'DEBUGGING_DELAY',
]);

export type MistakeCategory = z.infer<typeof MistakeCategorySchema>;

export const MistakeEventSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  submissionId: z.string().uuid().optional(),
  problemId: z.string(),
  category: MistakeCategorySchema,
  notes: z.string().optional(),
  detectedAtLayer: z.enum([
    'PROBLEM',
    'CONSTRAINTS',
    'PLAN',
    'PATTERN',
    'TOOL',
    'CODE',
    'TEST',
    'REFLECT',
  ]),
  timeLostSeconds: z.number().int().nonnegative().optional(),
  createdAt: z.string().datetime(),
});

export type MistakeEvent = z.infer<typeof MistakeEventSchema>;

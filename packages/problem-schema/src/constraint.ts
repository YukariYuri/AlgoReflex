import { z } from 'zod';

export const ProblemConstraintSchema = z.object({
  timeLimitMs: z.number().int().positive().default(1000),
  memoryLimitMb: z.number().int().positive().default(256),
  inputBounds: z.record(z.string(), z.string()).optional(),
  notes: z.array(z.string()).default([]),
});

export type ProblemConstraint = z.infer<typeof ProblemConstraintSchema>;

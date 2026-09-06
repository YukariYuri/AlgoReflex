import { z } from 'zod';

export const MasteryDimensionSchema = z.enum([
  'CONCEPT_UNDERSTANDING',
  'SYNTAX_RECALL',
  'TOOL_SELECTION',
  'IMPLEMENTATION',
  'DEBUGGING',
  'ADAPTATION_TRANSFER',
  'RECALL_UNDER_PRESSURE',
]);

export type MasteryDimension = z.infer<typeof MasteryDimensionSchema>;

export const MasteryScoreSchema = z.object({
  dimension: MasteryDimensionSchema,
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  sampleCount: z.number().int().nonnegative(),
  lastEvaluatedAt: z.string().datetime(),
});

export type MasteryScore = z.infer<typeof MasteryScoreSchema>;

export const MasteryRecordSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  targetType: z.enum(['CONCEPT', 'TOOL', 'PATTERN']),
  targetId: z.string(),
  scores: z.record(MasteryDimensionSchema, MasteryScoreSchema),
  overallMastery: z.number().min(0).max(100),
  updatedAt: z.string().datetime(),
});

export type MasteryRecord = z.infer<typeof MasteryRecordSchema>;

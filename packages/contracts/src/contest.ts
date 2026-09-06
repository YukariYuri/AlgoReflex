import { z } from 'zod';

export const ContestProblemSchema = z.object({
  contestId: z.string(),
  problemId: z.string(),
  orderIndex: z.number().int().nonnegative(),
  points: z.number().int().positive(),
});

export type ContestProblem = z.infer<typeof ContestProblemSchema>;

export const ContestSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  durationMinutes: z.number().int().positive(),
  problems: z.array(ContestProblemSchema),
});

export type Contest = z.infer<typeof ContestSchema>;

export const PostmortemLayerLossSchema = z.object({
  layer: z.enum([
    'READING',
    'PLANNING',
    'TOOL_SELECTION',
    'IMPLEMENTATION',
    'DEBUGGING',
    'COMPLEXITY_MISTAKE',
    'EDGE_CASE',
    'SYNTAX_RECALL',
  ]),
  timeSpentMinutes: z.number().nonnegative(),
  preventable: z.boolean(),
  notes: z.string(),
});

export type PostmortemLayerLoss = z.infer<typeof PostmortemLayerLossSchema>;

export const PostmortemSchema = z.object({
  id: z.string().uuid(),
  contestAttemptId: z.string().uuid(),
  problemId: z.string(),
  userId: z.string(),
  timeBreakdown: z.array(PostmortemLayerLossSchema),
  primaryFailureFactor: z.string(),
  actionableTakeaway: z.string(),
  createdAt: z.string().datetime(),
});

export type Postmortem = z.infer<typeof PostmortemSchema>;

export const ContestAttemptSchema = z.object({
  id: z.string().uuid(),
  contestId: z.string(),
  userId: z.string(),
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().optional(),
  totalScore: z.number().int().nonnegative().default(0),
  penaltyTimeMinutes: z.number().int().nonnegative().default(0),
  postmortems: z.array(PostmortemSchema).default([]),
});

export type ContestAttempt = z.infer<typeof ContestAttemptSchema>;

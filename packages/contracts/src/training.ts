import { z } from 'zod';

export const TrainingModeSchema = z.enum([
  'DIRECT_PRACTICE',
  'RECALL_DRILL',
  'SYNTAX_REPAIR',
  'TOOL_SELECTION',
  'TOOL_SWAP',
  'SAME_GOAL_DIFFERENT_TOOLS',
  'FALLBACK_DRILL',
  'PATTERN_RECOGNITION',
  'MIXED_PRACTICE',
  'PRESSURE_TRAINING',
  'CONTEST_SIMULATION',
  'POSTMORTEM',
]);

export type TrainingMode = z.infer<typeof TrainingModeSchema>;

export const LearningActivitySchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  mode: TrainingModeSchema,
  targetId: z.string(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  durationSeconds: z.number().int().nonnegative().optional(),
  isCompleted: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type LearningActivity = z.infer<typeof LearningActivitySchema>;

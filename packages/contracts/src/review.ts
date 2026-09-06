import { z } from 'zod';
import { TrainingModeSchema } from './training.js';

export const ReviewItemSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  targetType: z.enum(['TOOL', 'CONCEPT', 'PATTERN', 'PROBLEM']),
  targetId: z.string(),
  recommendedMode: TrainingModeSchema,
  intervalDays: z.number().int().positive(),
  repetitionCount: z.number().int().nonnegative().default(0),
  easeFactor: z.number().min(1.3).default(2.5),
  nextReviewDate: z.string().datetime(),
  lastReviewedDate: z.string().datetime().optional(),
});

export type ReviewItem = z.infer<typeof ReviewItemSchema>;

export const ReviewScheduleSchema = z.object({
  userId: z.string(),
  itemsDue: z.array(ReviewItemSchema),
  totalDueCount: z.number().int().nonnegative(),
  generatedAt: z.string().datetime(),
});

export type ReviewSchedule = z.infer<typeof ReviewScheduleSchema>;

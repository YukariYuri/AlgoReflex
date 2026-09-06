import { z } from 'zod';
import { ProblemConstraintSchema } from './constraint.js';
import { TestCaseSchema } from './test-case.js';

export const HintLayerSchema = z.enum([
  'PROBLEM_INTERPRETATION',
  'CONSTRAINT_OBSERVATION',
  'PATTERN_RECOGNITION',
  'TOOL_RECOMMENDATION',
  'PSEUDOCODE',
  'EDGE_CASE_ALERT',
]);

export type HintLayer = z.infer<typeof HintLayerSchema>;

export const HintSchema = z.object({
  id: z.string(),
  orderIndex: z.number().int().nonnegative(),
  layer: HintLayerSchema,
  content: z.string().min(1),
  penaltyScore: z.number().nonnegative().default(0),
});

export type Hint = z.infer<typeof HintSchema>;

export const SolutionApproachSchema = z.object({
  id: z.string(),
  name: z.string(),
  timeComplexity: z.string(),
  spaceComplexity: z.string(),
  preferredToolIds: z.array(z.string()).default([]),
  fallbackToolIds: z.array(z.string()).default([]),
  cxxCode: z.string(),
  explanation: z.string(),
  tradeoffs: z.string().optional(),
});

export type SolutionApproach = z.infer<typeof SolutionApproachSchema>;

export const ProblemVariantSchema = z.object({
  id: z.string(),
  variantName: z.string(),
  modification: z.string(),
  impactOnToolSelection: z.string(),
});

export type ProblemVariant = z.infer<typeof ProblemVariantSchema>;

export const ProblemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  difficulty: z.enum(['BEGINNER', 'EASY', 'MEDIUM', 'HARD', 'ADVANCED', 'NATIONAL']),
  statement: z.string().min(1),
  inputFormat: z.string().min(1),
  outputFormat: z.string().min(1),
  constraints: ProblemConstraintSchema,
  sampleCases: z.array(TestCaseSchema).min(1),
  hiddenTestCases: z.array(TestCaseSchema).default([]),
  hints: z.array(HintSchema).default([]),
  solutions: z.array(SolutionApproachSchema).default([]),
  variants: z.array(ProblemVariantSchema).default([]),
  targetPatternIds: z.array(z.string()).default([]),
  targetToolIds: z.array(z.string()).default([]),
  author: z.string().default('AlgoReflex'),
});

export type Problem = z.infer<typeof ProblemSchema>;

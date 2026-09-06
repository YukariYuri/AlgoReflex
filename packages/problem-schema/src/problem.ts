import { z } from 'zod';
import { ProblemConstraintSchema } from './constraint.js';
import { SampleTestCaseSchema, HiddenTestCaseSchema } from './test-case.js';

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

// ============================================================================
// Public / Client-Safe Problem Schema
// Strictly forbids hidden test cases and reference solutions.
// Safe for web client consumption and API responses.
// ============================================================================

export const PublicProblemSchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    difficulty: z.enum(['BEGINNER', 'EASY', 'MEDIUM', 'HARD', 'ADVANCED', 'NATIONAL']),
    statement: z.string().min(1),
    inputFormat: z.string().min(1),
    outputFormat: z.string().min(1),
    constraints: ProblemConstraintSchema,
    sampleCases: z.array(SampleTestCaseSchema).min(1),
    hints: z.array(HintSchema).default([]),
    variants: z.array(ProblemVariantSchema).default([]),
    targetPatternIds: z.array(z.string()).default([]),
    targetToolIds: z.array(z.string()).default([]),
    author: z.string().default('AlgoReflex'),
  })
  .strict(); // Rejects any extraneous fields (e.g. hiddenTestCases, solutions)

export type PublicProblem = z.infer<typeof PublicProblemSchema>;

// ============================================================================
// Internal / Server / Judge Problem Schema
// Authoring and judge verification model containing hidden test cases and solutions.
// ============================================================================

export const JudgeProblemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  difficulty: z.enum(['BEGINNER', 'EASY', 'MEDIUM', 'HARD', 'ADVANCED', 'NATIONAL']),
  statement: z.string().min(1),
  inputFormat: z.string().min(1),
  outputFormat: z.string().min(1),
  constraints: ProblemConstraintSchema,
  sampleCases: z.array(SampleTestCaseSchema).min(1),
  hiddenTestCases: z.array(HiddenTestCaseSchema).default([]),
  hints: z.array(HintSchema).default([]),
  solutions: z.array(SolutionApproachSchema).default([]),
  variants: z.array(ProblemVariantSchema).default([]),
  targetPatternIds: z.array(z.string()).default([]),
  targetToolIds: z.array(z.string()).default([]),
  author: z.string().default('AlgoReflex'),
});

export type JudgeProblem = z.infer<typeof JudgeProblemSchema>;
export type ProblemAuthoring = JudgeProblem;

// Default "Problem" alias points to client-safe PublicProblem
export type Problem = PublicProblem;
export const ProblemSchema = PublicProblemSchema;

/**
 * Strips hidden tests and reference solutions from a JudgeProblem,
 * producing an authenticated, client-safe PublicProblem.
 */
export function toPublicProblem(judgeProblem: JudgeProblem): PublicProblem {
  return PublicProblemSchema.parse({
    id: judgeProblem.id,
    slug: judgeProblem.slug,
    title: judgeProblem.title,
    difficulty: judgeProblem.difficulty,
    statement: judgeProblem.statement,
    inputFormat: judgeProblem.inputFormat,
    outputFormat: judgeProblem.outputFormat,
    constraints: judgeProblem.constraints,
    sampleCases: judgeProblem.sampleCases,
    hints: judgeProblem.hints,
    variants: judgeProblem.variants,
    targetPatternIds: judgeProblem.targetPatternIds,
    targetToolIds: judgeProblem.targetToolIds,
    author: judgeProblem.author,
  });
}

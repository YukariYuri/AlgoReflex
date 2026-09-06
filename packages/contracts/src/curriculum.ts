import { z } from 'zod';
import { CppStandardSchema } from './language.js';

// ============================================================================
// Prerequisite Relationship Modeling
// Authoritative single source of truth for curriculum dependencies.
// ============================================================================

export const KnowledgeNodeTypeSchema = z.enum([
  'CONCEPT',
  'TOOL',
  'PATTERN',
  'LESSON',
  'MODULE',
]);

export type KnowledgeNodeType = z.infer<typeof KnowledgeNodeTypeSchema>;

export const KnowledgeNodeRefSchema = z.object({
  type: KnowledgeNodeTypeSchema,
  id: z.string(),
});

export type KnowledgeNodeRef = z.infer<typeof KnowledgeNodeRefSchema>;

/**
 * Authoritative prerequisite relationship.
 * Supports cross-type relationships (e.g. CONCEPT -> TOOL, TOOL -> PATTERN, LESSON -> PATTERN).
 * Entity-local prerequisite views are strictly derived from these edges.
 */
export const PrerequisiteSchema = z.object({
  id: z.string(),
  required: KnowledgeNodeRefSchema,
  target: KnowledgeNodeRefSchema,
  minMasteryScore: z.number().min(0).max(100).default(70),
});

export type Prerequisite = z.infer<typeof PrerequisiteSchema>;

export const ToolVariantSchema = z.object({
  id: z.string(),
  name: z.string(),
  signature: z.string(),
  standard: CppStandardSchema,
  description: z.string(),
  timeComplexity: z.string(),
  spaceComplexity: z.string(),
  useCase: z.string(),
});

export type ToolVariant = z.infer<typeof ToolVariantSchema>;

export const ToolSchema = z.object({
  id: z.string(),
  name: z.string(),
  header: z.string(),
  category: z.string(),
  whatIsIt: z.string(),
  whyExists: z.string(),
  whenToUse: z.array(z.string()),
  whenNotToUse: z.array(z.string()),
  syntax: z.string(),
  variants: z.array(ToolVariantSchema).default([]),
  parameters: z.array(z.string()).default([]),
  returnValues: z.string(),
  iteratorBehavior: z.string().optional(),
  referenceCopyBehavior: z.string().optional(),
  complexity: z.object({
    time: z.string(),
    space: z.string(),
  }),
  commonPatterns: z.array(z.string()),
  commonMistakes: z.array(z.string()),
  contestPitfalls: z.array(z.string()),
  worksWellWith: z.array(z.string()),
  alternatives: z.array(z.string()),
  fallbackToolId: z.string().optional(),
  fallbackExplanation: z.string().optional(),
});

export type Tool = z.infer<typeof ToolSchema>;

export const ConceptSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  area: z.string(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'NATIONAL']),
  relatedToolIds: z.array(z.string()).default([]),
  // NOTE: Prerequisites are NOT maintained here. The PrerequisiteGraph edges
  // in @algoreflex/learning-core are the single authoritative source of truth.
});

export type Concept = z.infer<typeof ConceptSchema>;

export const PatternSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  description: z.string(),
  recognitionClues: z.array(z.string()),
  recommendedToolIds: z.array(z.string()),
  templateCode: z.string().optional(),
});

export type Pattern = z.infer<typeof PatternSchema>;

export const LessonSchema = z.object({
  id: z.string(),
  moduleId: z.string(),
  title: z.string(),
  order: z.number().int().nonnegative(),
  conceptIds: z.array(z.string()).default([]),
  toolIds: z.array(z.string()).default([]),
  patternIds: z.array(z.string()).default([]),
});

export type Lesson = z.infer<typeof LessonSchema>;

export const ModuleSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  title: z.string(),
  order: z.number().int().nonnegative(),
  description: z.string(),
});

export type Module = z.infer<typeof ModuleSchema>;

export const CourseSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  targetLevel: z.string(),
});

export type Course = z.infer<typeof CourseSchema>;

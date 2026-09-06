import { z } from 'zod';

export const PrerequisiteSchema = z.object({
  id: z.string(),
  requiredEntityId: z.string(),
  targetEntityId: z.string(),
  entityType: z.enum(['CONCEPT', 'TOOL', 'PATTERN', 'LESSON']),
  minMasteryScore: z.number().min(0).max(100).default(70),
});

export type Prerequisite = z.infer<typeof PrerequisiteSchema>;

export const ToolVariantSchema = z.object({
  id: z.string(),
  name: z.string(),
  signature: z.string(),
  standard: z.enum(['C++11', 'C++14', 'C++17', 'C++20', 'C++23']),
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
  prerequisites: z.array(z.string()).default([]),
  relatedToolIds: z.array(z.string()).default([]),
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

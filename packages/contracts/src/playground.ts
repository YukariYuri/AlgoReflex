import { z } from 'zod';
import { ToolchainProfileSchema } from './language.js';

/** Trusted server-side limits for the public playground API. */
export const PLAYGROUND_LIMITS = {
  maxRequestBodyBytes: 256 * 1024,
  maxSourceCodeBytes: 128 * 1024,
  maxStdinBytes: 64 * 1024,
  maxCompileDiagnosticsBytes: 128 * 1024,
  maxExecutionOutputBytes: 64 * 1024,
} as const;

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

const SourceCodeSchema = z
  .string()
  .min(1, 'Source code cannot be empty.')
  .superRefine((value, context) => {
    if (utf8ByteLength(value) > PLAYGROUND_LIMITS.maxSourceCodeBytes) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Source code must be at most ${PLAYGROUND_LIMITS.maxSourceCodeBytes} UTF-8 bytes.`,
      });
    }
  });

const StdinSchema = z.string().superRefine((value, context) => {
  if (utf8ByteLength(value) > PLAYGROUND_LIMITS.maxStdinBytes) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Standard input must be at most ${PLAYGROUND_LIMITS.maxStdinBytes} UTF-8 bytes.`,
    });
  }
});

/**
 * Public playground request. Deliberately strict: clients cannot configure
 * compiler flags, commands, container images, or resource limits.
 */
export const PlaygroundRunRequestSchema = z
  .object({
    sourceCode: SourceCodeSchema,
    toolchainProfile: ToolchainProfileSchema,
    stdin: StdinSchema,
  })
  .strict();

export type PlaygroundRunRequest = z.infer<typeof PlaygroundRunRequestSchema>;

export const PlaygroundRunStatusSchema = z.enum([
  'ACCEPTED',
  'COMPILE_ERROR',
  'RUNTIME_ERROR',
  'TIME_LIMIT_EXCEEDED',
  'MEMORY_LIMIT_EXCEEDED',
  'OUTPUT_LIMIT_EXCEEDED',
  'RUNNER_UNAVAILABLE',
  'INTERNAL_ERROR',
]);

export type PlaygroundRunStatus = z.infer<typeof PlaygroundRunStatusSchema>;

/**
 * Client-safe result for an ad-hoc playground run. It intentionally contains
 * no container identifiers, host paths, commands, mounts, or runner errors.
 */
export const PlaygroundRunResultSchema = z
  .object({
    status: PlaygroundRunStatusSchema,
    stdout: z.string(),
    stderr: z.string(),
    compileDiagnostics: z.string().optional(),
    runtimeDiagnostics: z.string().optional(),
    executionTimeMs: z.number().nonnegative().optional(),
    memoryUsedKb: z.number().nonnegative().optional(),
    exitCode: z.number().int().optional(),
  })
  .strict();

export type PlaygroundRunResult = z.infer<typeof PlaygroundRunResultSchema>;

export const PlaygroundErrorCodeSchema = z.enum([
  'BAD_REQUEST',
  'RATE_LIMITED',
  'RUNNER_UNAVAILABLE',
  'INTERNAL_ERROR',
]);

export type PlaygroundErrorCode = z.infer<typeof PlaygroundErrorCodeSchema>;

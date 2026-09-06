import type { FastifyPluginAsync } from 'fastify';
import { PlaygroundRunRequestSchema } from '@algoreflex/contracts';
import { FixedWindowRateLimiter } from '../rate-limiter.js';
import { RunnerUnavailableError, type RunnerGateway } from '../runner-client.js';

export interface PlaygroundRouteOptions {
  runnerGateway: RunnerGateway;
  rateLimiter?: FixedWindowRateLimiter;
}

export function playgroundRoutes({
  runnerGateway,
  rateLimiter = new FixedWindowRateLimiter({ maxRequests: 20, windowMs: 60_000 }),
}: PlaygroundRouteOptions): FastifyPluginAsync {
  return async fastify => {
    fastify.post('/api/playground/run', async (request, reply) => {
      if (!rateLimiter.tryConsume(request.ip)) {
        return reply.status(429).send({
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many playground runs. Please wait before trying again.',
          },
        });
      }

      const parsed = PlaygroundRunRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'The playground run request is invalid.',
            details: parsed.error.issues.map(issue => ({
              field: issue.path.join('.') || 'request',
              issue: issue.message,
            })),
          },
        });
      }

      try {
        return reply.send(await runnerGateway.run(parsed.data));
      } catch (error) {
        if (error instanceof RunnerUnavailableError) {
          return reply.status(503).send({
            success: false,
            error: {
              code: 'RUNNER_UNAVAILABLE',
              message: 'The secure code runner is currently unavailable.',
            },
          });
        }
        return reply.status(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'The playground run could not be completed.',
          },
        });
      }
    });
  };
}

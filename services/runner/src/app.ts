import fastify, { type FastifyInstance } from 'fastify';
import {
  PLAYGROUND_LIMITS,
  PlaygroundRunRequestSchema,
  PlaygroundRunResultSchema,
} from '@algoreflex/contracts';
import { DockerSandboxRunner } from './docker-sandbox-runner.js';
import type { CodeRunner } from './types.js';

export interface RunnerAppOptions {
  accessToken?: string;
  runner?: CodeRunner;
}

export function buildRunnerApp(options: RunnerAppOptions = {}): FastifyInstance {
  const app = fastify({
    logger: process.env['NODE_ENV'] === 'test' ? false : true,
    bodyLimit: PLAYGROUND_LIMITS.maxRequestBodyBytes,
  });
  const runner = options.runner ?? new DockerSandboxRunner();
  const accessToken = options.accessToken ?? process.env['RUNNER_SHARED_TOKEN'];

  app.post('/internal/playground/run', async (request, reply) => {
    if (!accessToken || request.headers.authorization !== `Bearer ${accessToken}`) {
      return reply.status(401).send({
        success: false,
        error: { code: 'RUNNER_UNAVAILABLE', message: 'Runner authentication failed.' },
      });
    }

    const parsed = PlaygroundRunRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Invalid playground run request.' },
      });
    }

    const result = await runner.run(parsed.data);
    return reply.send(PlaygroundRunResultSchema.parse(result));
  });

  app.setErrorHandler((_error, _request, reply) =>
    reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'The runner could not process the request.',
      },
    })
  );

  return app;
}

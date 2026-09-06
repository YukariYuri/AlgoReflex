import fastify, { type FastifyInstance, type FastifyError } from 'fastify';
import cors from '@fastify/cors';
import { healthRoutes } from './routes/health.js';
import { versionRoutes } from './routes/version.js';

export function buildApp(): FastifyInstance {
  const app = fastify({
    logger: process.env['NODE_ENV'] === 'test' ? false : true,
    bodyLimit: 1048576, // 1MB payload limit as per security invariants
  });

  app.register(cors, {
    origin: process.env['CORS_ORIGIN'] || true,
  });

  app.register(healthRoutes);
  app.register(versionRoutes);

  // Centralized error handler envelope
  app.setErrorHandler((error: FastifyError, _request, reply) => {
    app.log.error(error);
    const statusCode = error.statusCode || 500;
    return reply.status(statusCode).send({
      success: false,
      error: {
        code: error.code || 'INTERNAL_SERVER_ERROR',
        message:
          statusCode === 500 ? 'An unexpected internal error occurred' : error.message,
      },
    });
  });

  return app;
}

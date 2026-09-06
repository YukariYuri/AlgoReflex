import type { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async fastify => {
  fastify.get('/health', async (_request, reply) => {
    return reply.status(200).send({
      status: 'ok',
      service: 'algoreflex-api',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });
};

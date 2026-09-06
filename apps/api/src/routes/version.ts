import type { FastifyPluginAsync } from 'fastify';

export const versionRoutes: FastifyPluginAsync = async fastify => {
  fastify.get('/api/version', async (_request, reply) => {
    return reply.status(200).send({
      name: 'AlgoReflex API',
      version: '0.1.0',
      milestone: 'M0',
      status: 'operational',
      environment: process.env['NODE_ENV'] || 'development',
    });
  });
};

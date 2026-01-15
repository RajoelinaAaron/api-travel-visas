import { FastifyPluginAsync } from 'fastify';
import rateLimit from '@fastify/rate-limit';

export const rateLimitPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });
};


import { FastifyPluginAsync } from 'fastify';
import cors from '@fastify/cors';

export const corsPlugin: FastifyPluginAsync = async (fastify) => {
  const origins = process.env.CORS_ORIGINS?.split(',') || ['*'];
  await fastify.register(cors, {
    origin: origins,
    credentials: true,
  });
};


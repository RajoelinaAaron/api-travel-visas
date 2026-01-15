import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';

export const adminAuthPlugin: FastifyPluginAsync = async (fastify) => {
  const adminApiKey = process.env.ADMIN_API_KEY;
  if (!adminApiKey) {
    throw new Error('ADMIN_API_KEY environment variable is required');
  }

  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const apiKey = request.headers['x-api-key'];
    if (!apiKey || apiKey !== adminApiKey) {
      return reply.code(401).send({ error: 'Unauthorized: Missing or invalid API key' });
    }
  });
};


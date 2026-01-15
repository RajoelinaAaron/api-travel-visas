import { FastifyPluginAsync } from 'fastify';
import { getNationalities } from '../db/queries';
import { nationalitiesQuerySchema } from '../schemas';

export const nationalitiesRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /v1/nationalities
  fastify.get<{ Querystring: unknown }>(
    '/',
    {
      schema: {
        tags: ['nationalities'],
        querystring: {
          type: 'object',
          properties: {
            search: { type: 'string' },
            limit: { type: 'string' },
            offset: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name_fr: { type: 'string' },
                iso2: { type: 'string', nullable: true },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const query = nationalitiesQuerySchema.parse(request.query);
      const nationalities = await getNationalities(fastify.db, query);
      return reply.send(nationalities);
    }
  );
};


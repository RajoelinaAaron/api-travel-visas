import { FastifyPluginAsync } from 'fastify';
import { getCountries, getCountryByIso2, getOfficialPortal } from '../db/queries';
import { countriesQuerySchema } from '../schemas';

export const countriesRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /v1/countries
  fastify.get<{ Querystring: unknown }>(
    '/',
    {
      schema: {
        tags: ['countries'],
        querystring: {
          type: 'object',
          properties: {
            search: { type: 'string' },
            continent: { type: 'string' },
            popular: { type: 'string', enum: ['0', '1'] },
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
                continent: { type: 'string', nullable: true },
                popular_destination: { type: 'boolean' },
                image_url: { type: 'string', nullable: true },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const query = countriesQuerySchema.parse(request.query);
      const countries = await getCountries(fastify.db, query);
      return reply.send(countries);
    }
  );

  // GET /v1/countries/:iso2
  fastify.get<{ Params: { iso2: string } }>(
    '/:iso2',
    {
      schema: {
        tags: ['countries'],
        params: {
          type: 'object',
          properties: {
            iso2: { type: 'string' },
          },
          required: ['iso2'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name_fr: { type: 'string' },
              iso2: { type: 'string', nullable: true },
              continent: { type: 'string', nullable: true },
              popular_destination: { type: 'boolean' },
              image_url: { type: 'string', nullable: true },
              official_portal: { type: 'string', nullable: true },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { iso2 } = request.params;
      const country = await getCountryByIso2(fastify.db, iso2.toUpperCase());
      if (!country) {
        return reply.code(404).send({ error: 'Country not found' });
      }
      const officialPortal = await getOfficialPortal(fastify.db, country.id);
      return reply.send({
        ...country,
        official_portal: officialPortal?.url || null,
      });
    }
  );
};


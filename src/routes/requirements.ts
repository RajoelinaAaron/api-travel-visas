import { FastifyPluginAsync } from 'fastify';
import { aggregateRequirements } from '../services/requirements';
import { requirementsQuerySchema } from '../schemas';
import {
  getEntryProfileById,
  getEntryDocuments,
  getTravelRequirements,
  getHealthRequirements,
  getCountryGuide,
} from '../db/queries';
import { SourceItem } from '../types';

export const requirementsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /v1/requirements
  fastify.get<{ Querystring: unknown }>(
    '/requirements',
    {
      schema: {
        tags: ['requirements'],
        querystring: {
          type: 'object',
          properties: {
            nationality: { type: 'string' },
            destination: { type: 'string' },
            purpose: { type: 'string', default: 'tourism' },
            lang: { type: 'string', default: 'fr' },
          },
          required: ['nationality', 'destination'],
        },
        response: {
          200: {
            // On autorise toutes les propriétés pour refléter exactement
            // la structure agrégée renvoyée par le service.
            type: 'object',
            additionalProperties: true,
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
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
      try {
        const query = requirementsQuerySchema.parse(request.query);
        const result = await aggregateRequirements(
          fastify,
          query.nationality,
          query.destination,
          query.purpose,
          query.lang
        );
        return reply.send(result);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('not found')) {
            return reply.code(404).send({ error: error.message });
          }
          return reply.code(400).send({ error: error.message });
        }
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // GET /v1/entry-profiles/:id
  fastify.get<{ Params: { id: string } }>(
    '/entry-profiles/:id',
    {
      schema: {
        tags: ['requirements'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
      },
    },
    async (request, reply) => {
      const profileId = parseInt(request.params.id, 10);
      if (isNaN(profileId)) {
        return reply.code(400).send({ error: 'Invalid profile ID' });
      }

      const profile = await getEntryProfileById(fastify.db, profileId);
      if (!profile) {
        return reply.code(404).send({ error: 'Entry profile not found' });
      }

      const [documents, travelReq, healthReq] = await Promise.all([
        getEntryDocuments(fastify.db, profileId),
        getTravelRequirements(fastify.db, profileId),
        getHealthRequirements(fastify.db, profileId),
      ]);

      let sources: SourceItem[] = [];
      if (profile.llm_sources_json) {
        try {
          sources = JSON.parse(profile.llm_sources_json) as SourceItem[];
        } catch {
          sources = [];
        }
      }

      return reply.send({
        profile,
        documents,
        travel_requirements: travelReq,
        health_requirements: healthReq,
        sources,
      });
    }
  );

  // GET /v1/entry-profiles/:id/documents
  fastify.get<{ Params: { id: string } }>(
    '/entry-profiles/:id/documents',
    {
      schema: {
        tags: ['requirements'],
      },
    },
    async (request, reply) => {
      const profileId = parseInt(request.params.id, 10);
      if (isNaN(profileId)) {
        return reply.code(400).send({ error: 'Invalid profile ID' });
      }
      const documents = await getEntryDocuments(fastify.db, profileId);
      return reply.send(documents);
    }
  );

  // GET /v1/entry-profiles/:id/travel-requirements
  fastify.get<{ Params: { id: string } }>(
    '/entry-profiles/:id/travel-requirements',
    {
      schema: {
        tags: ['requirements'],
      },
    },
    async (request, reply) => {
      const profileId = parseInt(request.params.id, 10);
      if (isNaN(profileId)) {
        return reply.code(400).send({ error: 'Invalid profile ID' });
      }
      const travelReq = await getTravelRequirements(fastify.db, profileId);
      if (!travelReq) {
        return reply.code(404).send({ error: 'Travel requirements not found' });
      }
      return reply.send(travelReq);
    }
  );

  // GET /v1/entry-profiles/:id/health
  fastify.get<{ Params: { id: string } }>(
    '/entry-profiles/:id/health',
    {
      schema: {
        tags: ['requirements'],
      },
    },
    async (request, reply) => {
      const profileId = parseInt(request.params.id, 10);
      if (isNaN(profileId)) {
        return reply.code(400).send({ error: 'Invalid profile ID' });
      }
      const healthReq = await getHealthRequirements(fastify.db, profileId);
      if (!healthReq) {
        return reply.code(404).send({ error: 'Health requirements not found' });
      }
      return reply.send(healthReq);
    }
  );

  // GET /v1/countries/:iso2/guide
  fastify.get<{ Params: { iso2: string }; Querystring: { lang?: string } }>(
    '/countries/:iso2/guide',
    {
      schema: {
        tags: ['requirements'],
        querystring: {
          type: 'object',
          properties: {
            lang: { type: 'string', default: 'fr' },
          },
        },
      },
    },
    async (request, reply) => {
      const { iso2 } = request.params;
      const lang = request.query.lang || 'fr';
      const { getCountryByIso2 } = await import('../db/queries');
      const country = await getCountryByIso2(fastify.db, iso2.toUpperCase());
      if (!country) {
        return reply.code(404).send({ error: 'Country not found' });
      }
      const guide = await getCountryGuide(fastify.db, country.id, lang);
      if (!guide) {
        return reply.code(404).send({ error: 'Guide not found' });
      }
      return reply.send(guide);
    }
  );
};


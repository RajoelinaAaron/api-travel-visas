import { FastifyPluginAsync } from 'fastify';
import {
  upsertNationality,
  upsertCountry,
  upsertOfficialPortal,
  upsertEntryProfile,
  replaceEntryDocuments,
  upsertTravelRequirements,
  upsertHealthRequirements,
  upsertCountryGuide,
  getCountryByIso2,
  getEntryProfileById,
} from '../db/queries';
import {
  createNationalitySchema,
  createCountrySchema,
  officialPortalSchema,
  entryProfileSchema,
  documentsBodySchema,
  travelRequirementsSchema,
  healthRequirementsSchema,
  countryGuideSchema,
} from '../schemas';

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /v1/admin/nationalities
  fastify.post<{ Body: unknown }>(
    '/nationalities',
    {
      schema: {
        tags: ['admin'],
        body: {
          type: 'object',
          properties: {
            name_fr: { type: 'string' },
            iso2: { type: 'string', nullable: true },
          },
          required: ['name_fr'],
        },
      },
    },
    async (request, reply) => {
      const data = createNationalitySchema.parse(request.body);
      const id = await upsertNationality(fastify.db, data);
      return reply.code(201).send({ id, ...data });
    }
  );

  // POST /v1/admin/countries
  fastify.post<{ Body: unknown }>(
    '/countries',
    {
      schema: {
        tags: ['admin'],
        body: {
          type: 'object',
          properties: {
            name_fr: { type: 'string' },
            iso2: { type: 'string', nullable: true },
            continent: { type: 'string', nullable: true },
            popular_destination: { type: 'boolean' },
            image_url: { type: 'string', nullable: true },
            processed_visas_count: { type: 'number', nullable: true },
          },
          required: ['name_fr'],
        },
      },
    },
    async (request, reply) => {
      const data = createCountrySchema.parse(request.body);
      const id = await upsertCountry(fastify.db, data);
      return reply.code(201).send({ id, ...data });
    }
  );

  // POST /v1/admin/countries/:iso2/official-portal
  fastify.post<{ Params: { iso2: string }; Body: unknown }>(
    '/countries/:iso2/official-portal',
    {
      schema: {
        tags: ['admin'],
        params: {
          type: 'object',
          properties: {
            iso2: { type: 'string' },
          },
          required: ['iso2'],
        },
        body: {
          type: 'object',
          properties: {
            url: { type: 'string' },
          },
          required: ['url'],
        },
      },
    },
    async (request, reply) => {
      const { iso2 } = request.params;
      const body = officialPortalSchema.parse(request.body);
      const country = await getCountryByIso2(fastify.db, iso2.toUpperCase());
      if (!country) {
        return reply.code(404).send({ error: 'Country not found' });
      }
      const id = await upsertOfficialPortal(fastify.db, country.id, body.url);
      return reply.code(201).send({ id, country_id: country.id, url: body.url });
    }
  );

  // PUT /v1/admin/entry-profiles
  fastify.put<{ Body: unknown }>(
    '/entry-profiles',
    {
      schema: {
        tags: ['admin'],
        body: {
          type: 'object',
          properties: {
            nationality_id: { type: 'number' },
            destination_country_id: { type: 'number' },
            purpose: { type: 'string' },
            last_checked: { type: 'string', nullable: true },
            source_confidence: { type: 'number', nullable: true },
            needs_manual_review: { type: 'boolean' },
            llm_model: { type: 'string', nullable: true },
            llm_prompt_version: { type: 'string', nullable: true },
            llm_sources_json: { type: 'string', nullable: true },
            llm_raw_json: { type: 'string', nullable: true },
          },
          required: ['nationality_id', 'destination_country_id', 'purpose'],
        },
      },
    },
    async (request, reply) => {
      const data = entryProfileSchema.parse(request.body);
      const id = await upsertEntryProfile(fastify.db, data);
      return reply.send({ id, ...data });
    }
  );

  // PUT /v1/admin/entry-profiles/:id/documents
  fastify.put<{ Params: { id: string }; Body: unknown }>(
    '/entry-profiles/:id/documents',
    {
      schema: {
        tags: ['admin'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            documents: {
              type: 'array',
              items: { type: 'object' },
            },
          },
          required: ['documents'],
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

      const body = documentsBodySchema.parse(request.body);
      const connection = await fastify.db.getConnection();
      try {
        await replaceEntryDocuments(connection, profileId, body.documents);
        return reply.send({ success: true, profile_id: profileId, documents_count: body.documents.length });
      } finally {
        connection.release();
      }
    }
  );

  // PUT /v1/admin/entry-profiles/:id/travel-requirements
  fastify.put<{ Params: { id: string }; Body: unknown }>(
    '/entry-profiles/:id/travel-requirements',
    {
      schema: {
        tags: ['admin'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            travel_authorization_required: { type: 'boolean' },
            travel_authorization_name: { type: 'string', nullable: true },
            travel_authorization_url: { type: 'string', nullable: true },
            arrival_form_required: { type: 'boolean' },
            arrival_form_name: { type: 'string', nullable: true },
            arrival_form_url: { type: 'string', nullable: true },
            other_requirements_json: { type: 'string', nullable: true },
          },
          required: ['travel_authorization_required', 'arrival_form_required'],
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

      const data = travelRequirementsSchema.parse(request.body);
      const id = await upsertTravelRequirements(fastify.db, profileId, data);
      return reply.send({ id, profile_id: profileId, ...data });
    }
  );

  // PUT /v1/admin/entry-profiles/:id/health
  fastify.put<{ Params: { id: string }; Body: unknown }>(
    '/entry-profiles/:id/health',
    {
      schema: {
        tags: ['admin'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            vaccines_required_json: { type: 'string', nullable: true },
            vaccines_recommended_json: { type: 'string', nullable: true },
            notes: { type: 'string', nullable: true },
          },
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

      const data = healthRequirementsSchema.parse(request.body);
      const id = await upsertHealthRequirements(fastify.db, profileId, data);
      return reply.send({ id, profile_id: profileId, ...data });
    }
  );

  // PUT /v1/admin/countries/:iso2/guide
  fastify.put<{ Params: { iso2: string }; Body: unknown }>(
    '/countries/:iso2/guide',
    {
      schema: {
        tags: ['admin'],
        params: {
          type: 'object',
          properties: {
            iso2: { type: 'string' },
          },
          required: ['iso2'],
        },
        body: {
          type: 'object',
          properties: {
            lang: { type: 'string' },
            guide_text: { type: 'string', nullable: true },
          },
        },
      },
    },
    async (request, reply) => {
      const { iso2 } = request.params;
      const body = countryGuideSchema.parse(request.body);
      const country = await getCountryByIso2(fastify.db, iso2.toUpperCase());
      if (!country) {
        return reply.code(404).send({ error: 'Country not found' });
      }
      const id = await upsertCountryGuide(fastify.db, country.id, body.lang, body.guide_text || null);
      return reply.send({ id, country_id: country.id, lang: body.lang, guide_text: body.guide_text });
    }
  );
};


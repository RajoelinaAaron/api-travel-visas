import { FastifyPluginAsync } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

export const swaggerPlugin: FastifyPluginAsync = async (fastify) => {
  const publicBaseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Visa API',
        description: 'API pour les informations de visa/eVisa/ETA et autorisations de voyage',
        version: '1.0.0',
      },
      servers: [
        {
          url: publicBaseUrl,
          description: process.env.PUBLIC_BASE_URL ? 'Public server' : 'Development server',
        },
      ],
      tags: [
        { name: 'countries', description: 'Pays' },
        { name: 'nationalities', description: 'Nationalités' },
        { name: 'requirements', description: 'Exigences de voyage' },
        { name: 'admin', description: 'Administration (protégé par API key)' },
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });
};


import Fastify from 'fastify';
import { config } from 'dotenv';
import { createPool, closePool } from './db/pool';
import { corsPlugin } from './plugins/cors';
import { swaggerPlugin } from './plugins/swagger';
import { helmetPlugin } from './plugins/helmet';
import { rateLimitPlugin } from './plugins/rateLimit';
import { countriesRoutes } from './routes/countries';
import { nationalitiesRoutes } from './routes/nationalities';
import { requirementsRoutes } from './routes/requirements';
import { adminRoutes } from './routes/admin';
import { adminAuthPlugin } from './plugins/adminAuth';

config();

const PORT = parseInt(process.env.PORT || '3000', 10);

async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        process.env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  });

  // Register plugins
  await fastify.register(helmetPlugin);
  await fastify.register(corsPlugin);
  await fastify.register(rateLimitPlugin);
  await fastify.register(swaggerPlugin);

  // Initialize database pool
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'visa_db',
  };

  const pool = createPool(dbConfig);
  fastify.decorate('db', pool);

  // Health check
  fastify.get('/health', async () => {
    try {
      await pool.execute('SELECT 1');
      return { status: 'ok', database: 'connected' };
    } catch (error) {
      return { status: 'error', database: 'disconnected' };
    }
  });

  // Register routes
  await fastify.register(countriesRoutes, { prefix: '/v1/countries' });
  await fastify.register(nationalitiesRoutes, { prefix: '/v1/nationalities' });
  await fastify.register(requirementsRoutes, { prefix: '/v1' });
  
  // Register admin routes with auth
  await fastify.register(adminAuthPlugin, { prefix: '/v1/admin' });
  await fastify.register(adminRoutes, { prefix: '/v1/admin' });

  return fastify;
}

async function start() {
  try {
    const server = await buildServer();
    await server.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
    console.log(`📚 Swagger docs available at http://localhost:${PORT}/docs`);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

start();


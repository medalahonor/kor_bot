import Fastify from 'fastify';
import cors from '@fastify/cors';
import prismaPlugin from './plugins/prisma.js';
import { campaignRoutes } from './routes/campaigns.js';
import { locationRoutes } from './routes/locations.js';
import { progressRoutes } from './routes/progress.js';
import { sseRoutes } from './routes/sse.js';
import { remainingRoutes } from './routes/remaining.js';
import { ksRoutes } from './routes/ks.js';
import { ekRoutes } from './routes/ek.js';
import { adminOptionRoutes } from './routes/admin/options.js';
import { adminVerseRoutes } from './routes/admin/verses.js';
import { healthRoutes } from './routes/health.js';
import type { FastifyError } from 'fastify';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  });

  await app.register(cors, { origin: true });
  await app.register(prismaPlugin);

  // Routes
  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(campaignRoutes, { prefix: '/api' });
  await app.register(locationRoutes, { prefix: '/api' });
  await app.register(progressRoutes, { prefix: '/api' });
  await app.register(sseRoutes, { prefix: '/api' });
  await app.register(remainingRoutes, { prefix: '/api' });
  await app.register(ksRoutes, { prefix: '/api' });
  await app.register(ekRoutes, { prefix: '/api' });
  await app.register(adminOptionRoutes, { prefix: '/api/admin' });
  await app.register(adminVerseRoutes, { prefix: '/api/admin' });

  // Global error handler
  app.setErrorHandler((error: FastifyError | (Error & { code?: string }), _request, reply) => {
    // Prisma errors
    if ('code' in error && typeof error.code === 'string') {
      if (error.code === 'P2025') {
        return reply.status(404).send({ error: 'Not found' });
      }
      if (error.code === 'P2002') {
        return reply.status(409).send({ error: 'Already exists' });
      }
    }

    // Zod validation
    if (error.name === 'ZodError') {
      return reply.status(400).send({ error: 'Validation error', details: error });
    }

    app.log.error(error);
    const statusCode = 'statusCode' in error ? (error as FastifyError).statusCode : undefined;
    return reply.status(statusCode || 500).send({
      error: statusCode === 401 ? error.message : 'Internal server error',
    });
  });

  return app;
}

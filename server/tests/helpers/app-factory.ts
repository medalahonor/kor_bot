import Fastify from 'fastify';
import cors from '@fastify/cors';
import type { FastifyError } from 'fastify';
import { campaignRoutes } from '../../src/routes/campaigns.js';
import { locationRoutes } from '../../src/routes/locations.js';
import { progressRoutes } from '../../src/routes/progress.js';
import { remainingRoutes } from '../../src/routes/remaining.js';
import { ksRoutes } from '../../src/routes/ks.js';
import { ekRoutes } from '../../src/routes/ek.js';
import { adminOptionRoutes } from '../../src/routes/admin/options.js';
import { adminVerseRoutes } from '../../src/routes/admin/verses.js';
import { createMockPrisma } from './mock-prisma.js';

/**
 * Build a Fastify app with mocked Prisma for integration tests.
 * No real DB needed.
 *
 * @param optionStatuses - Record<optionId, status> e.g. {108: 'visited', 110: 'closed'}
 */
export async function buildTestApp(optionStatuses: Record<number, string> = {}) {
  const app = Fastify({ logger: false });

  await app.register(cors);

  // Decorate with mock prisma
  const mockPrisma = createMockPrisma(optionStatuses);
  app.decorate('prisma', mockPrisma as any);

  // Error handler must be set before routes
  app.setErrorHandler((error: FastifyError | (Error & { code?: string }), _request, reply) => {
    if ('code' in error && typeof error.code === 'string') {
      if (error.code === 'P2025') {
        return reply.status(404).send({ error: 'Not found' });
      }
      if (error.code === 'P2002') {
        return reply.status(409).send({ error: 'Already exists' });
      }
    }
    if (error.name === 'ZodError') {
      return reply.status(400).send({ error: 'Validation error', details: error });
    }
    const statusCode = 'statusCode' in error ? (error as FastifyError).statusCode : undefined;
    return reply.status(statusCode || 500).send({
      error: statusCode === 401 ? error.message : 'Internal server error',
    });
  });

  await app.register(campaignRoutes, { prefix: '/api' });
  await app.register(locationRoutes, { prefix: '/api' });
  await app.register(progressRoutes, { prefix: '/api' });
  await app.register(remainingRoutes, { prefix: '/api' });
  await app.register(ksRoutes, { prefix: '/api' });
  await app.register(ekRoutes, { prefix: '/api' });
  await app.register(adminOptionRoutes, { prefix: '/api' });
  await app.register(adminVerseRoutes, { prefix: '/api' });

  return app;
}

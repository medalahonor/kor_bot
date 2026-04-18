import Fastify from 'fastify';
import cors from '@fastify/cors';
import type { FastifyError, RouteOptions } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  hasZodFastifySchemaValidationErrors,
  ResponseSerializationError,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { healthRoutes } from '../../src/routes/health.js';
import { campaignRoutes } from '../../src/routes/campaigns.js';
import { locationRoutes } from '../../src/routes/locations.js';
import { progressRoutes } from '../../src/routes/progress.js';
import { sseRoutes } from '../../src/routes/sse.js';
import { remainingRoutes } from '../../src/routes/remaining.js';
import { ksRoutes } from '../../src/routes/ks.js';
import { ekRoutes } from '../../src/routes/ek.js';
import { adminOptionRoutes } from '../../src/routes/admin/options.js';
import { adminVerseRoutes } from '../../src/routes/admin/verses.js';
import { createMockPrisma } from './mock-prisma.js';

export type CollectedRoute = Pick<RouteOptions, 'method' | 'url' | 'schema'>;

export async function buildTestApp(optionStatuses: Record<number, string> = {}) {
  const app = Fastify({ logger: false }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  const collected: CollectedRoute[] = [];
  app.addHook('onRoute', (r) => {
    collected.push({ method: r.method, url: r.url, schema: r.schema });
  });
  app.decorate('collectedRoutes', collected);

  await app.register(cors);

  const mockPrisma = createMockPrisma(optionStatuses);
  app.decorate('prisma', mockPrisma as never);

  app.setErrorHandler((error: FastifyError | (Error & { code?: string }), _request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.status(400).send({ error: 'Validation error', details: error.validation });
    }
    if (error instanceof ResponseSerializationError) {
      return reply.status(500).send({ error: 'Internal server error' });
    }
    if ('code' in error && typeof error.code === 'string') {
      if (error.code === 'P2025') {
        return reply.status(404).send({ error: 'Not found' });
      }
      if (error.code === 'P2002') {
        return reply.status(409).send({ error: 'Already exists' });
      }
    }
    const statusCode = 'statusCode' in error ? (error as FastifyError).statusCode : undefined;
    return reply.status(statusCode || 500).send({
      error: statusCode === 401 ? error.message : 'Internal server error',
    });
  });

  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(campaignRoutes, { prefix: '/api' });
  await app.register(locationRoutes, { prefix: '/api' });
  await app.register(progressRoutes, { prefix: '/api' });
  await app.register(sseRoutes, { prefix: '/api' });
  await app.register(remainingRoutes, { prefix: '/api' });
  await app.register(ksRoutes, { prefix: '/api' });
  await app.register(ekRoutes, { prefix: '/api' });
  await app.register(adminOptionRoutes, { prefix: '/api' });
  await app.register(adminVerseRoutes, { prefix: '/api' });

  return app;
}

declare module 'fastify' {
  interface FastifyInstance {
    collectedRoutes: CollectedRoute[];
  }
}

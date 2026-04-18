import Fastify from 'fastify';
import cors from '@fastify/cors';
import type { RouteOptions } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { setupErrorHandler } from '../../src/lib/setupErrorHandler.js';
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

  setupErrorHandler(app);

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

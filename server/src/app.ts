import Fastify from 'fastify';
import cors from '@fastify/cors';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import prismaPlugin from './plugins/prisma.js';
import { setupErrorHandler } from './lib/setupErrorHandler.js';
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
import type { RouteOptions } from 'fastify';

export type RegisteredRoute = Pick<RouteOptions, 'method' | 'url' | 'schema'>;

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  const registeredRoutes: RegisteredRoute[] = [];
  if (process.env.NODE_ENV === 'test') {
    app.addHook('onRoute', (r) => {
      registeredRoutes.push({ method: r.method, url: r.url, schema: r.schema });
    });
  }
  app.decorate('registeredRoutes', registeredRoutes);

  await app.register(cors, { origin: true });
  await app.register(prismaPlugin);

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

  setupErrorHandler(app);

  return app;
}

declare module 'fastify' {
  interface FastifyInstance {
    registeredRoutes: RegisteredRoute[];
  }
}

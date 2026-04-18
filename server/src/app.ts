import Fastify from 'fastify';
import cors from '@fastify/cors';
import {
  serializerCompiler,
  validatorCompiler,
  hasZodFastifySchemaValidationErrors,
  ResponseSerializationError,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
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
import type { FastifyError, RouteOptions } from 'fastify';

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

  app.setErrorHandler((error: FastifyError | (Error & { code?: string }), _request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.status(400).send({
        error: 'Validation error',
        details: error.validation,
      });
    }

    if (error instanceof ResponseSerializationError) {
      app.log.error({ err: error, cause: error.cause }, 'response schema violation');
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

    app.log.error(error);
    const statusCode = 'statusCode' in error ? (error as FastifyError).statusCode : undefined;
    return reply.status(statusCode || 500).send({
      error: statusCode === 401 ? error.message : 'Internal server error',
    });
  });

  return app;
}

declare module 'fastify' {
  interface FastifyInstance {
    registeredRoutes: RegisteredRoute[];
  }
}

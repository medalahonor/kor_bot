import type { FastifyInstance } from 'fastify';
import { HealthContract } from '@tg/shared';
import { route } from '../lib/registerRoute.js';

export async function healthRoutes(app: FastifyInstance) {
  route(
    app,
    { method: 'GET', url: '/health', schema: HealthContract },
    async () => ({ status: 'ok' as const }),
  );
}

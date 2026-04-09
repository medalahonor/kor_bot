import type { FastifyInstance } from 'fastify';
import { sseBroker } from '../sse/broker.js';

export async function sseRoutes(app: FastifyInstance) {
  app.get('/sse/progress', async (_request, reply) => {
    reply.hijack();
    sseBroker.subscribe(reply);
  });
}

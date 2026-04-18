import type { FastifyInstance } from 'fastify';
import { sseBroker } from '../sse/broker.js';

// SSE endpoint hijacks the response, so a Zod response schema is not applicable.
// The contract test whitelists this URL.
export async function sseRoutes(app: FastifyInstance) {
  app.get('/sse/progress', async (_request, reply) => {
    reply.hijack();
    sseBroker.subscribe(reply);
  });
}

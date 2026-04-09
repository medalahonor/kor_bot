import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { setOptionStatus, batchSetStatus } from '../services/progress.js';
import { requireAuth } from '../auth/hooks.js';

const statusEnum = z.enum(['available', 'visited', 'requirements_not_met', 'closed']);

const setStatusSchema = z.object({
  optionId: z.number().int().positive(),
  status: statusEnum,
});

const batchSetStatusSchema = z.object({
  optionIds: z.array(z.number().int().positive()).min(1).max(50),
  status: statusEnum,
});

export async function progressRoutes(app: FastifyInstance) {
  app.put(
    '/progress',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const body = setStatusSchema.parse(request.body);
      const telegramId = BigInt(request.telegramUser.id);

      await setOptionStatus(app.prisma, body.optionId, body.status, telegramId);
      return reply.send({ ok: true });
    },
  );

  app.put(
    '/progress/batch',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const body = batchSetStatusSchema.parse(request.body);
      const telegramId = BigInt(request.telegramUser.id);

      await batchSetStatus(app.prisma, body.optionIds, body.status, telegramId);
      return reply.send({ ok: true, count: body.optionIds.length });
    },
  );
}

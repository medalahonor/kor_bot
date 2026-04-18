import type { FastifyInstance } from 'fastify';
import {
  PutProgressContract,
  PutProgressBatchContract,
  type PutProgressBody,
  type PutProgressBatchBody,
} from '@tg/shared';
import { route } from '../lib/registerRoute.js';
import { setOptionStatus, batchSetStatus } from '../services/progress.js';
import { requireAuth } from '../auth/hooks.js';

export async function progressRoutes(app: FastifyInstance) {
  route(
    app,
    {
      method: 'PUT',
      url: '/progress',
      schema: PutProgressContract,
      preHandler: [requireAuth],
    },
    async (request) => {
      const body = request.body as PutProgressBody;
      const telegramId = BigInt(request.telegramUser.id);

      await setOptionStatus(app.prisma, body.optionId, body.status, telegramId);
      return { ok: true as const };
    },
  );

  route(
    app,
    {
      method: 'PUT',
      url: '/progress/batch',
      schema: PutProgressBatchContract,
      preHandler: [requireAuth],
    },
    async (request) => {
      const body = request.body as PutProgressBatchBody;
      const telegramId = BigInt(request.telegramUser.id);

      await batchSetStatus(app.prisma, body.optionIds, body.status, telegramId);
      return { ok: true as const, count: body.optionIds.length };
    },
  );
}

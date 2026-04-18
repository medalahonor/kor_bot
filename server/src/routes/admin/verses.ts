import type { FastifyInstance } from 'fastify';
import {
  UpdateVerseContract,
  CreateVerseContract,
  DeleteVerseContract,
  type UpdateVerseBody,
  type CreateVerseBody,
} from '@tg/shared';
import { route } from '../../lib/registerRoute.js';
import { requireAdmin } from '../../auth/hooks.js';

export async function adminVerseRoutes(app: FastifyInstance) {
  route(
    app,
    {
      method: 'PUT',
      url: '/verses/:id',
      schema: UpdateVerseContract,
      preHandler: [requireAdmin],
    },
    async (request) => {
      const { id } = request.params as { id: number };
      const body = request.body as UpdateVerseBody;

      return app.prisma.verses.update({
        where: { id },
        data: { display_number: body.displayNumber },
      });
    },
  );

  route(
    app,
    {
      method: 'POST',
      url: '/locations/:locationId/verses',
      schema: CreateVerseContract,
      preHandler: [requireAdmin],
    },
    async (request, reply) => {
      const { locationId } = request.params as { locationId: number };
      const body = request.body as CreateVerseBody;

      const verse = await app.prisma.verses.create({
        data: {
          location_id: locationId,
          display_number: body.displayNumber,
        },
      });

      return reply.status(201).send(verse);
    },
  );

  route(
    app,
    {
      method: 'DELETE',
      url: '/verses/:id',
      schema: DeleteVerseContract,
      preHandler: [requireAdmin],
    },
    async (request) => {
      const { id } = request.params as { id: number };
      await app.prisma.verses.delete({ where: { id } });
      return { ok: true as const };
    },
  );
}

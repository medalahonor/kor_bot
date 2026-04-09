import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAdmin } from '../../auth/hooks.js';

const updateVerseSchema = z.object({
  displayNumber: z.number().int().min(0),
});

const createVerseSchema = z.object({
  displayNumber: z.number().int().min(0),
});

export async function adminVerseRoutes(app: FastifyInstance) {
  app.put<{ Params: { id: string } }>(
    '/verses/:id',
    { preHandler: [requireAdmin] },
    async (request) => {
      const id = parseInt(request.params.id, 10);
      const body = updateVerseSchema.parse(request.body);

      const verse = await app.prisma.verses.update({
        where: { id },
        data: { display_number: body.displayNumber },
      });

      return verse;
    },
  );

  app.post<{ Params: { locationId: string } }>(
    '/locations/:locationId/verses',
    { preHandler: [requireAdmin] },
    async (request, reply) => {
      const locationId = parseInt(request.params.locationId, 10);
      const body = createVerseSchema.parse(request.body);

      const verse = await app.prisma.verses.create({
        data: {
          location_id: locationId,
          display_number: body.displayNumber,
        },
      });

      return reply.status(201).send(verse);
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/verses/:id',
    { preHandler: [requireAdmin] },
    async (request) => {
      const id = parseInt(request.params.id, 10);

      await app.prisma.verses.delete({ where: { id } });
      return { ok: true };
    },
  );
}

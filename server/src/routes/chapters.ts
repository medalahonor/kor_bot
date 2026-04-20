import type { FastifyInstance } from 'fastify';
import {
  GetChaptersContract,
  CreateChapterContract,
  UpdateChapterContract,
  DeleteChapterContract,
  UpdateChapterLocationsContract,
  type CreateChapterBody,
  type UpdateChapterBody,
  type UpdateChapterLocationsBody,
} from '@tg/shared';
import { route } from '../lib/registerRoute.js';

export async function chapterRoutes(app: FastifyInstance) {
  route(
    app,
    { method: 'GET', url: '/campaigns/:id/chapters', schema: GetChaptersContract },
    async (request) => {
      const { id: campaignId } = request.params as { id: number };

      const chapters = await app.prisma.chapters.findMany({
        where: { campaign_id: campaignId },
        orderBy: [{ menu_order: 'asc' }, { id: 'asc' }],
        include: {
          chapter_locations: {
            orderBy: [{ sort_order: 'asc' }, { location_dn: 'asc' }],
          },
        },
      });

      if (chapters.length === 0) return [];

      const allDns = new Set<number>();
      for (const ch of chapters) {
        for (const cl of ch.chapter_locations) allDns.add(cl.location_dn);
      }

      const locations = await app.prisma.locations.findMany({
        where: {
          campaign_id: campaignId,
          display_number: { in: Array.from(allDns) },
        },
        select: {
          display_number: true,
          name: true,
          _count: { select: { verses: true } },
        },
      });
      const locByDn = new Map(
        locations.map((l) => [
          l.display_number,
          { name: l.name, verseCount: l._count.verses },
        ]),
      );

      return chapters.map((ch) => ({
        id: ch.id,
        code: ch.code,
        title: ch.title,
        menuOrder: ch.menu_order,
        locations: ch.chapter_locations
          .filter((cl) => locByDn.has(cl.location_dn))
          .map((cl) => {
            const meta = locByDn.get(cl.location_dn)!;
            return {
              dn: cl.location_dn,
              name: meta.name,
              verseCount: meta.verseCount,
            };
          }),
      }));
    },
  );

  route(
    app,
    { method: 'POST', url: '/campaigns/:id/chapters', schema: CreateChapterContract },
    async (request, reply) => {
      const { id: campaignId } = request.params as { id: number };
      const body = request.body as CreateChapterBody;

      const campaign = await app.prisma.campaigns.findUnique({
        where: { id: campaignId },
        select: { id: true },
      });
      if (!campaign) return reply.status(404).send({ error: 'Campaign not found' });

      const created = await app.prisma.chapters.create({
        data: {
          campaign_id: campaignId,
          code: body.code,
          title: body.title,
          menu_order: body.menuOrder,
        },
      });

      return reply.status(201).send({
        id: created.id,
        code: created.code,
        title: created.title,
        menuOrder: created.menu_order,
      });
    },
  );

  route(
    app,
    { method: 'PATCH', url: '/chapters/:chapterId', schema: UpdateChapterContract },
    async (request, reply) => {
      const { chapterId } = request.params as { chapterId: number };
      const body = request.body as UpdateChapterBody;

      const existing = await app.prisma.chapters.findUnique({
        where: { id: chapterId },
        select: { id: true },
      });
      if (!existing) return reply.status(404).send({ error: 'Chapter not found' });

      await app.prisma.chapters.update({
        where: { id: chapterId },
        data: {
          code: body.code,
          title: body.title,
          menu_order: body.menuOrder,
        },
      });

      return { ok: true as const };
    },
  );

  route(
    app,
    { method: 'DELETE', url: '/chapters/:chapterId', schema: DeleteChapterContract },
    async (request, reply) => {
      const { chapterId } = request.params as { chapterId: number };

      const existing = await app.prisma.chapters.findUnique({
        where: { id: chapterId },
        select: {
          id: true,
          _count: { select: { chapter_locations: true } },
        },
      });
      if (!existing) return reply.status(404).send({ error: 'Chapter not found' });
      if (existing._count.chapter_locations > 0) {
        return reply.status(400).send({ error: 'Chapter is not empty' });
      }

      await app.prisma.chapters.delete({ where: { id: chapterId } });
      return { ok: true as const };
    },
  );

  route(
    app,
    {
      method: 'PATCH',
      url: '/chapters/:chapterId/locations',
      schema: UpdateChapterLocationsContract,
    },
    async (request, reply) => {
      const { chapterId } = request.params as { chapterId: number };
      const body = request.body as UpdateChapterLocationsBody;

      const chapter = await app.prisma.chapters.findUnique({
        where: { id: chapterId },
        select: { id: true, campaign_id: true },
      });
      if (!chapter) return reply.status(404).send({ error: 'Chapter not found' });

      const adds = body.addLocations ?? [];
      const removes = body.removeLocations ?? [];

      if (adds.length > 0) {
        const valid = await app.prisma.locations.findMany({
          where: {
            campaign_id: chapter.campaign_id,
            display_number: { in: adds },
          },
          select: { display_number: true },
        });
        const validSet = new Set(valid.map((v) => v.display_number));
        const unknown = adds.filter((dn) => !validSet.has(dn));
        if (unknown.length > 0) {
          return reply
            .status(400)
            .send({ error: `Unknown location dn: ${unknown.join(', ')}` });
        }
      }

      await app.prisma.$transaction(async (tx) => {
        if (adds.length > 0) {
          const existing = await tx.chapter_locations.findMany({
            where: { chapter_id: chapterId, location_dn: { in: adds } },
            select: { location_dn: true },
          });
          const existingSet = new Set(existing.map((e) => e.location_dn));
          const maxSort = await tx.chapter_locations.aggregate({
            where: { chapter_id: chapterId },
            _max: { sort_order: true },
          });
          let nextSort = (maxSort._max.sort_order ?? -1) + 1;
          const toCreate = adds
            .filter((dn) => !existingSet.has(dn))
            .map((dn) => ({
              chapter_id: chapterId,
              location_dn: dn,
              sort_order: nextSort++,
            }));
          if (toCreate.length > 0) {
            await tx.chapter_locations.createMany({ data: toCreate });
          }
        }

        if (removes.length > 0) {
          await tx.chapter_locations.deleteMany({
            where: { chapter_id: chapterId, location_dn: { in: removes } },
          });
        }
      });

      return { ok: true as const };
    },
  );
}

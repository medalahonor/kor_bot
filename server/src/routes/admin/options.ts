import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAdmin } from '../../auth/hooks.js';

const updateOptionSchema = z.object({
  text: z.string().optional(),
  type: z.enum(['choice', 'condition']).optional(),
  targetType: z.enum(['verse', 'cross_location', 'end']).nullable().optional(),
  targetVerseDn: z.number().int().nullable().optional(),
  targetLocationDn: z.number().int().nullable().optional(),
  requirement: z.string().nullable().optional(),
  result: z.string().nullable().optional(),
  hidden: z
    .enum(['red_filter', 'blue_filter', 'both_filters', 'filter'])
    .nullable()
    .optional(),
  once: z.boolean().optional(),
  conditionGroup: z.string().nullable().optional(),
  conditionalTargets: z.any().nullable().optional(),
  children: z.any().nullable().optional(),
});

const createOptionSchema = z.object({
  type: z.enum(['choice', 'condition']),
  text: z.string().default(''),
  targetType: z.enum(['verse', 'cross_location', 'end']).nullable().default(null),
  targetVerseDn: z.number().int().nullable().default(null),
  targetLocationDn: z.number().int().nullable().default(null),
  requirement: z.string().nullable().default(null),
  result: z.string().nullable().default(null),
  hidden: z
    .enum(['red_filter', 'blue_filter', 'both_filters', 'filter'])
    .nullable()
    .default(null),
  once: z.boolean().default(false),
  conditionGroup: z.string().nullable().default(null),
  conditionalTargets: z.any().nullable().default(null),
  children: z.any().nullable().default(null),
});

export async function adminOptionRoutes(app: FastifyInstance) {
  app.put<{ Params: { id: string } }>(
    '/options/:id',
    { preHandler: [requireAdmin] },
    async (request) => {
      const id = parseInt(request.params.id, 10);
      const body = updateOptionSchema.parse(request.body);

      const data: Record<string, unknown> = {};
      if (body.text !== undefined) data.text = body.text;
      if (body.type !== undefined) data.type = body.type;
      if (body.targetType !== undefined) data.target_type = body.targetType;
      if (body.targetVerseDn !== undefined) data.target_verse_dn = body.targetVerseDn;
      if (body.targetLocationDn !== undefined) data.target_location_dn = body.targetLocationDn;
      if (body.requirement !== undefined) data.requirement = body.requirement;
      if (body.result !== undefined) data.result = body.result;
      if (body.hidden !== undefined) data.hidden = body.hidden;
      if (body.once !== undefined) data.once = body.once;
      if (body.conditionGroup !== undefined) data.condition_group = body.conditionGroup;
      if (body.conditionalTargets !== undefined) data.conditional_targets = body.conditionalTargets;
      if (body.children !== undefined) data.children = body.children;

      const option = await app.prisma.options.update({
        where: { id },
        data,
      });

      return option;
    },
  );

  app.post<{ Params: { verseId: string } }>(
    '/verses/:verseId/options',
    { preHandler: [requireAdmin] },
    async (request, reply) => {
      const verseId = parseInt(request.params.verseId, 10);
      const body = createOptionSchema.parse(request.body);

      // Auto-calculate position
      const maxPos = await app.prisma.options.aggregate({
        where: { verse_id: verseId },
        _max: { position: true },
      });
      const position = (maxPos._max.position ?? -1) + 1;

      const option = await app.prisma.options.create({
        data: {
          verse_id: verseId,
          position,
          type: body.type,
          text: body.text,
          target_type: body.targetType,
          target_verse_dn: body.targetVerseDn,
          target_location_dn: body.targetLocationDn,
          requirement: body.requirement,
          result: body.result,
          hidden: body.hidden,
          once: body.once,
          condition_group: body.conditionGroup,
          conditional_targets: body.conditionalTargets ?? undefined,
          children: body.children ?? undefined,
        },
      });

      return reply.status(201).send(option);
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/options/:id',
    { preHandler: [requireAdmin] },
    async (request) => {
      const id = parseInt(request.params.id, 10);

      await app.prisma.options.delete({ where: { id } });
      return { ok: true };
    },
  );
}

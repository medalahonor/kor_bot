import type { FastifyInstance } from 'fastify';
import {
  UpdateOptionContract,
  CreateOptionContract,
  DeleteOptionContract,
  type UpdateOptionBody,
  type CreateOptionBody,
} from '@tg/shared';
import { route } from '../../lib/registerRoute.js';
import { requireAdmin } from '../../auth/hooks.js';

export async function adminOptionRoutes(app: FastifyInstance) {
  route(
    app,
    {
      method: 'PUT',
      url: '/options/:id',
      schema: UpdateOptionContract,
      preHandler: [requireAdmin],
    },
    async (request) => {
      const { id } = request.params as { id: number };
      const body = request.body as UpdateOptionBody;

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

      return app.prisma.options.update({ where: { id }, data });
    },
  );

  route(
    app,
    {
      method: 'POST',
      url: '/verses/:verseId/options',
      schema: CreateOptionContract,
      preHandler: [requireAdmin],
    },
    async (request, reply) => {
      const { verseId } = request.params as { verseId: number };
      const body = request.body as CreateOptionBody;

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
          conditional_targets: (body.conditionalTargets ?? undefined) as never,
          children: (body.children ?? undefined) as never,
        },
      });

      return reply.status(201).send(option);
    },
  );

  route(
    app,
    {
      method: 'DELETE',
      url: '/options/:id',
      schema: DeleteOptionContract,
      preHandler: [requireAdmin],
    },
    async (request) => {
      const { id } = request.params as { id: number };
      await app.prisma.options.delete({ where: { id } });
      return { ok: true as const };
    },
  );
}

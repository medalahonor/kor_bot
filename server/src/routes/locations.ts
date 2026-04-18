import type { FastifyInstance } from 'fastify';
import {
  GetLocationVersesContract,
  GetLocationProgressContract,
  GetVerseNumbersContract,
  type OptionStatus,
} from '@tg/shared';
import { route } from '../lib/registerRoute.js';

export async function locationRoutes(app: FastifyInstance) {
  route(
    app,
    {
      method: 'GET',
      url: '/locations/:dn/verses',
      schema: GetLocationVersesContract,
    },
    async (request, reply) => {
      const { dn } = request.params as { dn: number };
      const { campaign: campaignId } = request.query as { campaign: number };

      const location = await app.prisma.locations.findUnique({
        where: {
          campaign_id_display_number: {
            campaign_id: campaignId,
            display_number: dn,
          },
        },
        include: {
          verses: {
            include: {
              options: { orderBy: { position: 'asc' } },
            },
            orderBy: { display_number: 'asc' },
          },
        },
      });

      if (!location) {
        return reply.status(404).send({ error: 'Location not found' });
      }

      return {
        id: location.id,
        displayNumber: location.display_number,
        name: location.name,
        verses: location.verses
          .filter((v) => !(v.display_number === 0 && v.options.length === 0))
          .map((v) => ({
            id: v.id,
            displayNumber: v.display_number,
            options: v.options.map((o) => ({
              id: o.id,
              position: o.position,
              type: o.type as 'choice' | 'condition',
              text: o.text,
              targetType: o.target_type as 'verse' | 'cross_location' | 'end' | null,
              targetVerseDn: o.target_verse_dn,
              targetLocationDn: o.target_location_dn,
              requirement: o.requirement,
              result: o.result,
              hidden: o.hidden,
              once: o.once,
              conditionGroup: o.condition_group,
              conditionalTargets: o.conditional_targets,
              children: o.children,
            })),
          })),
      };
    },
  );

  route(
    app,
    {
      method: 'GET',
      url: '/locations/:dn/progress',
      schema: GetLocationProgressContract,
    },
    async (request, reply) => {
      const { dn } = request.params as { dn: number };
      const { campaign: campaignId } = request.query as { campaign: number };

      const location = await app.prisma.locations.findUnique({
        where: {
          campaign_id_display_number: {
            campaign_id: campaignId,
            display_number: dn,
          },
        },
        include: {
          verses: {
            include: {
              options: {
                include: { progress: true },
                where: { progress: { isNot: null } },
              },
            },
          },
        },
      });

      if (!location) {
        return reply.status(404).send({ error: 'Location not found' });
      }

      const optionStatuses: Record<string, OptionStatus> = {};
      for (const verse of location.verses) {
        for (const option of verse.options) {
          if (option.progress) {
            optionStatuses[String(option.id)] = option.progress.status as OptionStatus;
          }
        }
      }

      return { locationDn: dn, optionStatuses };
    },
  );

  route(
    app,
    {
      method: 'GET',
      url: '/locations/:dn/verse-numbers',
      schema: GetVerseNumbersContract,
    },
    async (request, reply) => {
      const { dn } = request.params as { dn: number };
      const { campaign: campaignId } = request.query as { campaign: number };

      const location = await app.prisma.locations.findUnique({
        where: {
          campaign_id_display_number: {
            campaign_id: campaignId,
            display_number: dn,
          },
        },
        include: {
          verses: {
            select: { display_number: true },
            orderBy: { display_number: 'asc' },
          },
        },
      });

      if (!location) {
        return reply.status(404).send({ error: 'Location not found' });
      }

      return { verses: location.verses.map((v) => v.display_number) };
    },
  );
}

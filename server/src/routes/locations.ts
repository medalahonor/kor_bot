import type { FastifyInstance } from 'fastify';

export async function locationRoutes(app: FastifyInstance) {
  // Get all verses + options for a location
  app.get<{ Params: { dn: string }; Querystring: { campaign?: string } }>(
    '/locations/:dn/verses',
    async (request, reply) => {
      const dn = parseInt(request.params.dn, 10);
      const campaignId = parseInt(request.query.campaign || '1', 10);

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
                orderBy: { position: 'asc' },
              },
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
            type: o.type,
            text: o.text,
            targetType: o.target_type,
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

  // Get progress for a location (set of visited option IDs)
  app.get<{ Params: { dn: string }; Querystring: { campaign?: string } }>(
    '/locations/:dn/progress',
    async (request, reply) => {
      const dn = parseInt(request.params.dn, 10);
      const campaignId = parseInt(request.query.campaign || '1', 10);

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

      const optionStatuses: Record<number, string> = {};
      for (const verse of location.verses) {
        for (const option of verse.options) {
          if (option.progress) {
            optionStatuses[option.id] = option.progress.status;
          }
        }
      }

      return { locationDn: dn, optionStatuses };
    },
  );

  // Get verse display numbers for a location (lightweight, for autocomplete)
  app.get<{ Params: { dn: string }; Querystring: { campaign?: string } }>(
    '/locations/:dn/verse-numbers',
    async (request, reply) => {
      const dn = parseInt(request.params.dn, 10);
      const campaignId = parseInt(request.query.campaign || '1', 10);

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

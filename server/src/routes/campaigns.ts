import type { FastifyInstance } from 'fastify';
import {
  GetCampaignsContract,
  GetCampaignLocationsContract,
  GetBatchProgressContract,
} from '@tg/shared';
import { route } from '../lib/registerRoute.js';
import { buildGraphWithDeps, nodeKey } from '../services/graph.js';
import type { LocationData } from '../services/graph.js';
import { countPaths } from '../services/paths.js';

export async function campaignRoutes(app: FastifyInstance) {
  route(
    app,
    { method: 'GET', url: '/campaigns', schema: GetCampaignsContract },
    async () =>
      app.prisma.campaigns.findMany({
        select: { id: true, source_id: true, name: true },
      }),
  );

  route(
    app,
    {
      method: 'GET',
      url: '/campaigns/:id/locations/progress',
      schema: GetBatchProgressContract,
    },
    async (request) => {
      const { id: campaignId } = request.params as { id: number };

      const locations = await app.prisma.locations.findMany({
        where: { campaign_id: campaignId },
        include: {
          verses: {
            include: {
              options: {
                include: { progress: true },
                orderBy: { position: 'asc' },
              },
            },
            orderBy: { display_number: 'asc' },
          },
        },
        orderBy: { display_number: 'asc' },
      });

      const allData = new Map<number, LocationData>(
        locations.map((l) => [l.display_number, l]),
      );

      return locations.map((loc) => {
        const { graph, completedOptionIds } = buildGraphWithDeps(loc.display_number, allData);
        const pathCount = countPaths(graph, completedOptionIds, nodeKey(loc.display_number, 0));
        return {
          displayNumber: loc.display_number,
          ...pathCount,
        };
      });
    },
  );

  route(
    app,
    {
      method: 'GET',
      url: '/campaigns/:id/locations',
      schema: GetCampaignLocationsContract,
    },
    async (request, reply) => {
      const { id: campaignId } = request.params as { id: number };

      const locations = await app.prisma.locations.findMany({
        where: { campaign_id: campaignId },
        select: {
          id: true,
          display_number: true,
          name: true,
          _count: { select: { verses: true } },
        },
        orderBy: { display_number: 'asc' },
      });

      if (locations.length === 0) {
        return reply.status(404).send({ error: 'Campaign not found' });
      }

      return locations.map((l) => ({
        id: l.id,
        displayNumber: l.display_number,
        name: l.name,
        verseCount: l._count.verses,
      }));
    },
  );
}

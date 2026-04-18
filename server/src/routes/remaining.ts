import type { FastifyInstance } from 'fastify';
import { GetRemainingContract } from '@tg/shared';
import { route } from '../lib/registerRoute.js';
import { buildGraphWithDeps, nodeKey } from '../services/graph.js';
import type { LocationData } from '../services/graph.js';
import { findRemaining } from '../services/remaining.js';
import { countPaths } from '../services/paths.js';

export async function remainingRoutes(app: FastifyInstance) {
  route(
    app,
    {
      method: 'GET',
      url: '/locations/:dn/remaining',
      schema: GetRemainingContract,
    },
    async (request) => {
      const { dn } = request.params as { dn: number };
      const { campaign: campaignId, startVerse } = request.query as {
        campaign: number;
        startVerse: number;
      };

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
      });

      const allData = new Map<number, LocationData>(
        locations.map((l) => [l.display_number, l]),
      );

      const { graph, completedOptionIds } = buildGraphWithDeps(dn, allData);

      const start = nodeKey(dn, startVerse);
      const remaining = findRemaining(graph, completedOptionIds, start);
      const pathCount = countPaths(graph, completedOptionIds, start);

      return {
        locationDn: dn,
        ...pathCount,
        remaining,
      };
    },
  );
}

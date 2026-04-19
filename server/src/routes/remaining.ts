import type { FastifyInstance } from 'fastify';
import { GetRemainingContract } from '@tg/shared';
import { route } from '../lib/registerRoute.js';
import {
  buildGraphFollowingCrossLocationDeps,
  nodeKey,
  LOCATIONS_WITH_PROGRESS_INCLUDE,
} from '../services/graph.js';
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
        include: LOCATIONS_WITH_PROGRESS_INCLUDE,
      });

      const allData = new Map<number, LocationData>(
        locations.map((l) => [l.display_number, l]),
      );

      const { graph, completedOptionIds } = buildGraphFollowingCrossLocationDeps(dn, allData);

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

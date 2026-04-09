import type { FastifyInstance } from 'fastify';
import { buildGraphWithDeps, nodeKey } from '../services/graph.js';
import type { LocationData } from '../services/graph.js';
import { findRemaining } from '../services/remaining.js';
import { countPaths } from '../services/paths.js';

export async function remainingRoutes(app: FastifyInstance) {
  app.get<{ Params: { dn: string }; Querystring: { campaign?: string; startVerse?: string } }>(
    '/locations/:dn/remaining',
    async (request) => {
      const dn = parseInt(request.params.dn, 10);
      const campaignId = parseInt(request.query.campaign || '1', 10);

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

      const startVerse = parseInt(request.query.startVerse || '0', 10);
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

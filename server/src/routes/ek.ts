import type { FastifyInstance } from 'fastify';
import { GetEkVersesContract, EK_LOCATION_DN_LIST } from '@tg/shared';
import { route } from '../lib/registerRoute.js';
import { buildGraphWithDeps, nodeKey } from '../services/graph.js';
import type { LocationData } from '../services/graph.js';
import { countPaths } from '../services/paths.js';

export async function ekRoutes(app: FastifyInstance) {
  route(
    app,
    {
      method: 'GET',
      url: '/campaigns/:id/ek/verses',
      schema: GetEkVersesContract,
    },
    async (request) => {
      const { id: campaignId } = request.params as { id: number };

      const locations = await app.prisma.locations.findMany({
        where: {
          campaign_id: campaignId,
          display_number: { in: [...EK_LOCATION_DN_LIST] },
        },
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

      if (locations.length === 0) {
        return { locations: [] };
      }

      const allData = new Map<number, LocationData>(
        locations.map((l) => [l.display_number, l]),
      );

      return {
        locations: locations.map((loc) => {
          const { graph, completedOptionIds } = buildGraphWithDeps(loc.display_number, allData);

          type VerseEntry = {
            verseDn: number;
            totalPaths: number;
            completedPaths: number;
            totalCyclic: number;
            completedCyclic: number;
          };

          const verses: VerseEntry[] = [];
          let locTotalPaths = 0;
          let locCompletedPaths = 0;
          let locTotalCyclic = 0;
          let locCompletedCyclic = 0;

          for (const verse of loc.verses) {
            if (verse.display_number === 0 && verse.options.length === 0) continue;

            const start = nodeKey(loc.display_number, verse.display_number);
            const pathCount = countPaths(graph, completedOptionIds, start);

            verses.push({
              verseDn: verse.display_number,
              ...pathCount,
            });

            locTotalPaths += pathCount.totalPaths;
            locCompletedPaths += pathCount.completedPaths;
            locTotalCyclic += pathCount.totalCyclic;
            locCompletedCyclic += pathCount.completedCyclic;
          }

          return {
            locationDn: loc.display_number,
            name: loc.name,
            totalPaths: locTotalPaths,
            completedPaths: locCompletedPaths,
            totalCyclic: locTotalCyclic,
            completedCyclic: locCompletedCyclic,
            verses,
          };
        }),
      };
    },
  );
}

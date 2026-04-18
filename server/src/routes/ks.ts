import type { FastifyInstance } from 'fastify';
import { GetKsVersesContract, KS_LOCATION_DN_LIST } from '@tg/shared';
import { route } from '../lib/registerRoute.js';
import { buildGraphWithDeps, nodeKey } from '../services/graph.js';
import type { LocationData } from '../services/graph.js';
import { countPaths } from '../services/paths.js';

export async function ksRoutes(app: FastifyInstance) {
  route(
    app,
    {
      method: 'GET',
      url: '/campaigns/:id/ks/verses',
      schema: GetKsVersesContract,
    },
    async (request) => {
      const { id: campaignId } = request.params as { id: number };
      const { page, limit, search, onlyNew } = request.query as {
        page: number;
        limit: number;
        search?: string;
        onlyNew: boolean;
      };

      const locations = await app.prisma.locations.findMany({
        where: {
          campaign_id: campaignId,
          display_number: { in: [...KS_LOCATION_DN_LIST] },
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
        return { verses: [], total: 0, page, limit };
      }

      const allData = new Map<number, LocationData>(
        locations.map((l) => [l.display_number, l]),
      );
      const combinedGraph: Map<string, unknown> = new Map();
      const combinedCompleted = new Set<number>();
      for (const locDn of KS_LOCATION_DN_LIST) {
        if (!allData.has(locDn)) continue;
        const { graph: g, completedOptionIds: c } = buildGraphWithDeps(locDn, allData);
        for (const [key, node] of g) combinedGraph.set(key, node);
        for (const id of c) combinedCompleted.add(id);
      }
      const graph = combinedGraph as Parameters<typeof countPaths>[0];
      const completedOptionIds = combinedCompleted;

      type VerseEntry = {
        verseDn: number;
        locationDn: number;
        totalPaths: number;
        completedPaths: number;
        totalCyclic: number;
        completedCyclic: number;
      };

      const allVerses: VerseEntry[] = [];

      for (const loc of locations) {
        for (const verse of loc.verses) {
          if (verse.display_number === 0 && verse.options.length === 0) continue;

          const start = nodeKey(loc.display_number, verse.display_number);
          const pathCount = countPaths(graph, completedOptionIds, start);
          allVerses.push({
            verseDn: verse.display_number,
            locationDn: loc.display_number,
            ...pathCount,
          });
        }
      }

      let filtered = allVerses;

      const searchTrimmed = (search ?? '').trim();
      if (searchTrimmed) {
        filtered = filtered.filter((v) => String(v.verseDn).startsWith(searchTrimmed));
      }

      if (onlyNew) {
        filtered = filtered.filter(
          (v) => v.totalPaths === 0 || v.completedPaths < v.totalPaths,
        );
      }

      const total = filtered.length;
      const offset = (page - 1) * limit;
      const verses = filtered.slice(offset, offset + limit);

      return { verses, total, page, limit };
    },
  );
}

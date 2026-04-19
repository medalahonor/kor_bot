import type { FastifyInstance } from 'fastify';
import { GetKsVersesContract, KS_LOCATION_DN_LIST } from '@tg/shared';
import { route } from '../lib/registerRoute.js';
import {
  buildCombinedGraphForLocations,
  nodeKey,
  isEmptyVerseZero,
  LOCATIONS_WITH_PROGRESS_INCLUDE,
} from '../services/graph.js';
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
        include: LOCATIONS_WITH_PROGRESS_INCLUDE,
        orderBy: { display_number: 'asc' },
      });

      if (locations.length === 0) {
        return { verses: [], total: 0, page, limit };
      }

      const allData = new Map<number, LocationData>(
        locations.map((l) => [l.display_number, l]),
      );
      const { graph, completedOptionIds } = buildCombinedGraphForLocations(
        KS_LOCATION_DN_LIST,
        allData,
      );

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
          if (isEmptyVerseZero(verse)) continue;

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

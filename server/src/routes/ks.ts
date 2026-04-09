import type { FastifyInstance } from 'fastify';
import { buildGraphWithDeps, nodeKey } from '../services/graph.js';
import type { LocationData } from '../services/graph.js';
import { countPaths } from '../services/paths.js';

const KS_LOCATION_DNS = [999, 1001];

export async function ksRoutes(app: FastifyInstance) {
  app.get<{
    Params: { id: string };
    Querystring: { page?: string; limit?: string; search?: string; onlyNew?: string };
  }>(
    '/campaigns/:id/ks/verses',
    async (request) => {
      const campaignId = parseInt(request.params.id, 10);
      const page = Math.max(1, parseInt(request.query.page || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(request.query.limit || '50', 10)));
      const search = (request.query.search || '').trim();
      const onlyNew = request.query.onlyNew === 'true';

      const locations = await app.prisma.locations.findMany({
        where: {
          campaign_id: campaignId,
          display_number: { in: KS_LOCATION_DNS },
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

      // Build combined graph for all KS locations
      const allData = new Map<number, LocationData>(
        locations.map((l) => [l.display_number, l]),
      );
      // Build graph starting from each KS location to ensure all are included
      const combinedGraph: Map<string, any> = new Map();
      const combinedCompleted = new Set<number>();
      for (const locDn of KS_LOCATION_DNS) {
        if (!allData.has(locDn)) continue;
        const { graph: g, completedOptionIds: c } = buildGraphWithDeps(locDn, allData);
        for (const [key, node] of g) combinedGraph.set(key, node);
        for (const id of c) combinedCompleted.add(id);
      }
      const graph = combinedGraph;
      const completedOptionIds = combinedCompleted;

      // Collect all verses with per-verse path counts
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
          // Skip empty verse 0
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

      // Apply filters
      let filtered = allVerses;

      if (search) {
        filtered = filtered.filter((v) =>
          String(v.verseDn).startsWith(search),
        );
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

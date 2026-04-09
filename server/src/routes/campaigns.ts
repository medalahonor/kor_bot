import type { FastifyInstance } from 'fastify';
import { buildGraphWithDeps, nodeKey } from '../services/graph.js';
import type { LocationData } from '../services/graph.js';
import { countPaths } from '../services/paths.js';

export async function campaignRoutes(app: FastifyInstance) {
  app.get('/campaigns', async () => {
    const campaigns = await app.prisma.campaigns.findMany({
      select: { id: true, source_id: true, name: true },
    });
    return campaigns;
  });

  app.get<{ Params: { id: string } }>(
    '/campaigns/:id/locations/progress',
    async (request) => {
      const campaignId = parseInt(request.params.id, 10);

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

  app.get<{ Params: { id: string } }>(
    '/campaigns/:id/locations',
    async (request, reply) => {
      const campaignId = parseInt(request.params.id, 10);

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

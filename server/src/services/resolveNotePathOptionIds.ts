import type { PrismaClient } from '@prisma/client';
import type { NotePath } from '@tg/shared';
import { isNotePathBackfilled } from '@tg/shared';
import {
  LOCATIONS_WITH_PROGRESS_INCLUDE,
  buildCombinedGraphForLocations,
  nodeKey,
  type LocationData,
} from './graph.js';
import type { Graph } from '../types/index.js';

export function resolveNotePathOptionIdsFromGraph(graph: Graph, path: NotePath): NotePath | null {
  if (isNotePathBackfilled(path)) return path;

  const resolved: NotePath = [];

  for (let i = 0; i < path.length - 1; i++) {
    const step = path[i];
    const next = path[i + 1];
    const fromKey = nodeKey(step.locationDn, step.verseDn);
    const toKey = nodeKey(next.locationDn, next.verseDn);
    const node = graph.get(fromKey);

    if (!node) return null;

    const candidates = node.options.filter((edge) => edge.targetKey === toKey);
    if (candidates.length === 0) return null;

    const chosen = candidates.reduce((min, edge) =>
      edge.position < min.position ? edge : min,
    );

    resolved.push({
      locationDn: step.locationDn,
      verseDn: step.verseDn,
      optionId: chosen.optionId,
    });
  }

  const last = path[path.length - 1];
  resolved.push({ locationDn: last.locationDn, verseDn: last.verseDn });

  return resolved;
}

export async function resolveNotePathOptionIds(
  prisma: PrismaClient,
  campaignId: number,
  path: NotePath,
): Promise<NotePath | null> {
  const locationDns = Array.from(new Set(path.map((s) => s.locationDn)));
  const locations = await prisma.locations.findMany({
    where: { campaign_id: campaignId, display_number: { in: locationDns } },
    include: LOCATIONS_WITH_PROGRESS_INCLUDE,
  });

  const allLocationsData = new Map<number, LocationData>();
  for (const loc of locations) {
    allLocationsData.set(loc.display_number, loc);
  }

  const { graph } = buildCombinedGraphForLocations(locationDns, allLocationsData);
  return resolveNotePathOptionIdsFromGraph(graph, path);
}

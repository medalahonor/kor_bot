import type { PrismaClient } from '@prisma/client';
import type {
  NodeKey,
  Graph,
  GraphNode,
  GraphEdge,
  ConditionalTarget,
  ChildOption,
} from '../types/index.js';

interface ProgressData {
  status: string;
}

interface OptionData {
  id: number;
  position: number;
  type: string;
  text: string;
  target_type: string | null;
  target_verse_dn: number | null;
  target_location_dn: number | null;
  requirement: string | null;
  result: string | null;
  hidden: string | null;
  once: boolean;
  condition_group: string | null;
  conditional_targets: unknown;
  children: unknown;
  progress: ProgressData | null;
}

interface VerseData {
  display_number: number;
  options: OptionData[];
}

export interface LocationData {
  verses: VerseData[];
}

interface RawConditionalTarget {
  condition: string;
  verse?: number;
  location?: number;
  result?: string;
  target?: string;
}

interface RawChildOption {
  type: string;
  text: string;
  target: { verse: number; location?: number } | 'end' | null;
  requirement?: string;
  result?: string;
  children?: RawChildOption[];
}

export function nodeKey(locationDn: number, verseDn: number): NodeKey {
  return `${locationDn}:${verseDn}`;
}

function convertConditionalTargets(
  raw: unknown,
  locationDn: number,
  referencedLocations: Set<number>,
): ConditionalTarget[] | null {
  if (!Array.isArray(raw)) return null;

  return (raw as RawConditionalTarget[]).map((ct) => {
    if (ct.target === 'end') {
      return { condition: ct.condition, targetType: 'end' as const, result: ct.result };
    }
    if (ct.verse !== undefined) {
      const targetLocDn = ct.location ?? locationDn;
      if (targetLocDn !== locationDn) {
        referencedLocations.add(targetLocDn);
      }
      return {
        condition: ct.condition,
        targetType: 'node' as const,
        targetKey: nodeKey(targetLocDn, ct.verse),
        result: ct.result,
      };
    }
    return { condition: ct.condition, targetType: 'end' as const };
  });
}

function convertChildren(
  raw: unknown,
  locationDn: number,
  referencedLocations: Set<number>,
): ChildOption[] | null {
  if (!Array.isArray(raw)) return null;

  return (raw as RawChildOption[]).map((child) => {
    let targetType: ChildOption['targetType'] = null;
    let targetKey: NodeKey | undefined;

    if (child.target === 'end') {
      targetType = 'end';
    } else if (child.target && typeof child.target === 'object') {
      targetType = 'node';
      const targetLocDn = child.target.location ?? locationDn;
      if (targetLocDn !== locationDn) {
        referencedLocations.add(targetLocDn);
      }
      targetKey = nodeKey(targetLocDn, child.target.verse);
    }

    return {
      type: child.type,
      text: child.text,
      targetType,
      targetKey,
      requirement: child.requirement,
      result: child.result,
      children: child.children
        ? convertChildren(child.children, locationDn, referencedLocations) ?? undefined
        : undefined,
    };
  });
}

export interface BuildResult {
  graph: Graph;
  completedOptionIds: Set<number>;
  referencedLocations: Set<number>;
}

export function buildGraphFromData(
  locationDn: number,
  locationData: LocationData,
): BuildResult {
  const graph: Graph = new Map();
  const completedOptionIds = new Set<number>();
  const referencedLocations = new Set<number>();

  for (const verse of locationData.verses) {
    const edges: GraphEdge[] = verse.options.map((opt) => {
      if (opt.progress) {
        const status = opt.progress.status;
        if (status === 'visited' || status === 'closed') {
          completedOptionIds.add(opt.id);
        }
      }

      let targetType: GraphEdge['targetType'] = null;
      let targetKey: NodeKey | null = null;

      if (opt.target_type === 'end') {
        targetType = 'end';
      } else if (opt.target_type === 'verse' && opt.target_verse_dn !== null) {
        targetType = 'node';
        targetKey = nodeKey(locationDn, opt.target_verse_dn);
      } else if (opt.target_type === 'cross_location' && opt.target_verse_dn !== null && opt.target_location_dn !== null) {
        targetType = 'node';
        targetKey = nodeKey(opt.target_location_dn, opt.target_verse_dn);
        referencedLocations.add(opt.target_location_dn);
      }

      return {
        optionId: opt.id,
        position: opt.position,
        type: opt.type as 'choice' | 'condition',
        text: opt.text,
        targetType,
        targetKey,
        requirement: opt.requirement,
        result: opt.result,
        hidden: opt.hidden,
        once: opt.once,
        conditionGroup: opt.condition_group,
        conditionalTargets: convertConditionalTargets(opt.conditional_targets, locationDn, referencedLocations),
        children: convertChildren(opt.children, locationDn, referencedLocations),
      };
    });

    const key = nodeKey(locationDn, verse.display_number);
    const node: GraphNode = { key, options: edges };
    graph.set(key, node);
  }

  return { graph, completedOptionIds, referencedLocations };
}

// By design: cross-location переходы обходятся рекурсивно,
// аналогично verse-переходам. Граф строится транзитивно
// по cross-location ссылкам.
export function buildGraphWithDeps(
  rootLocationDn: number,
  allLocationsData: Map<number, LocationData>,
): { graph: Graph; completedOptionIds: Set<number> } {
  const combinedGraph: Graph = new Map();
  const combinedCompleted = new Set<number>();
  const processedLocations = new Set<number>();
  const toProcess = [rootLocationDn];

  while (toProcess.length > 0) {
    const locDn = toProcess.pop()!;
    if (processedLocations.has(locDn)) continue;
    processedLocations.add(locDn);

    const locData = allLocationsData.get(locDn);
    if (!locData) continue;

    const { graph, completedOptionIds, referencedLocations } = buildGraphFromData(locDn, locData);

    for (const [key, node] of graph) {
      combinedGraph.set(key, node);
    }
    for (const id of completedOptionIds) {
      combinedCompleted.add(id);
    }
    for (const refLoc of referencedLocations) {
      if (!processedLocations.has(refLoc)) {
        toProcess.push(refLoc);
      }
    }
  }

  return { graph: combinedGraph, completedOptionIds: combinedCompleted };
}

export async function buildGraph(
  prisma: PrismaClient,
  campaignId: number,
  locationDn: number,
): Promise<{ graph: Graph; completedOptionIds: Set<number> }> {
  const location = await prisma.locations.findUnique({
    where: {
      campaign_id_display_number: {
        campaign_id: campaignId,
        display_number: locationDn,
      },
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
  });

  if (!location) {
    throw Object.assign(new Error('Location not found'), { code: 'P2025' });
  }

  const { graph, completedOptionIds } = buildGraphFromData(locationDn, location);
  return { graph, completedOptionIds };
}

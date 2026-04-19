import { describe, it, expect } from 'vitest';
import { buildGraphFollowingCrossLocationDeps, nodeKey } from '../../src/services/graph.js';
import type { LocationData } from '../../src/services/graph.js';

function option(id: number, text: string, overrides: Record<string, unknown> = {}) {
  return {
    id, position: 0, type: 'choice', text,
    target_type: null as string | null,
    target_verse_dn: null as number | null,
    target_location_dn: null as number | null,
    requirement: null, result: null, hidden: null, once: false,
    condition_group: null, conditional_targets: null, children: null,
    progress: null,
    ...overrides,
  };
}

function locData(verses: Array<{ dn: number; options: ReturnType<typeof option>[] }>): LocationData {
  return {
    verses: verses.map((v) => ({
      display_number: v.dn,
      options: v.options,
    })),
  };
}

describe('buildGraphFollowingCrossLocationDeps', () => {
  it('single location without cross-location refs', () => {
    const allData = new Map<number, LocationData>([
      [100, locData([
        { dn: 0, options: [option(1, 'Go', { target_type: 'verse', target_verse_dn: 1 })] },
        { dn: 1, options: [option(2, 'End', { target_type: 'end' })] },
      ])],
    ]);

    const { graph, completedOptionIds } = buildGraphFollowingCrossLocationDeps(100, allData);

    expect(graph.size).toBe(2);
    expect(graph.has(nodeKey(100, 0))).toBe(true);
    expect(graph.has(nodeKey(100, 1))).toBe(true);
    expect(completedOptionIds.size).toBe(0);
  });

  it('loads cross-location dependency transitively', () => {
    const allData = new Map<number, LocationData>([
      [100, locData([
        { dn: 0, options: [option(1, 'Cross', { target_type: 'cross_location', target_verse_dn: 5, target_location_dn: 999 })] },
      ])],
      [999, locData([
        { dn: 5, options: [option(2, 'End', { target_type: 'end' })] },
      ])],
    ]);

    const { graph } = buildGraphFollowingCrossLocationDeps(100, allData);

    expect(graph.size).toBe(2);
    expect(graph.has(nodeKey(100, 0))).toBe(true);
    expect(graph.has(nodeKey(999, 5))).toBe(true);

    // Edge should point to the target node key
    const edge = graph.get(nodeKey(100, 0))!.options[0];
    expect(edge.targetType).toBe('node');
    expect(edge.targetKey).toBe(nodeKey(999, 5));
  });

  it('chain: A → B → C loads all transitively', () => {
    const allData = new Map<number, LocationData>([
      [100, locData([
        { dn: 0, options: [option(1, 'To B', { target_type: 'cross_location', target_verse_dn: 0, target_location_dn: 200 })] },
      ])],
      [200, locData([
        { dn: 0, options: [option(2, 'To C', { target_type: 'cross_location', target_verse_dn: 0, target_location_dn: 300 })] },
      ])],
      [300, locData([
        { dn: 0, options: [option(3, 'End', { target_type: 'end' })] },
      ])],
    ]);

    const { graph } = buildGraphFollowingCrossLocationDeps(100, allData);

    expect(graph.size).toBe(3);
    expect(graph.has(nodeKey(100, 0))).toBe(true);
    expect(graph.has(nodeKey(200, 0))).toBe(true);
    expect(graph.has(nodeKey(300, 0))).toBe(true);
  });

  it('cycle: A → B → A does not loop', () => {
    const allData = new Map<number, LocationData>([
      [100, locData([
        { dn: 0, options: [option(1, 'To B', { target_type: 'cross_location', target_verse_dn: 0, target_location_dn: 200 })] },
      ])],
      [200, locData([
        { dn: 0, options: [option(2, 'Back to A', { target_type: 'cross_location', target_verse_dn: 0, target_location_dn: 100 })] },
      ])],
    ]);

    const { graph } = buildGraphFollowingCrossLocationDeps(100, allData);

    expect(graph.size).toBe(2);
    expect(graph.has(nodeKey(100, 0))).toBe(true);
    expect(graph.has(nodeKey(200, 0))).toBe(true);
  });

  it('missing target location does not crash', () => {
    const allData = new Map<number, LocationData>([
      [100, locData([
        { dn: 0, options: [option(1, 'To missing', { target_type: 'cross_location', target_verse_dn: 5, target_location_dn: 999 })] },
      ])],
    ]);

    const { graph } = buildGraphFollowingCrossLocationDeps(100, allData);

    expect(graph.size).toBe(1);
    // Edge still has the targetKey, but no node for it in graph
    const edge = graph.get(nodeKey(100, 0))!.options[0];
    expect(edge.targetKey).toBe(nodeKey(999, 5));
    expect(graph.has(nodeKey(999, 5))).toBe(false);
  });

  it('merges completedOptionIds from all locations', () => {
    const allData = new Map<number, LocationData>([
      [100, locData([
        {
          dn: 0,
          options: [
            option(1, 'Cross', {
              target_type: 'cross_location', target_verse_dn: 5, target_location_dn: 999,
              progress: { status: 'visited' },
            }),
          ],
        },
      ])],
      [999, locData([
        {
          dn: 5,
          options: [
            option(2, 'End', {
              target_type: 'end',
              progress: { status: 'visited' },
            }),
          ],
        },
      ])],
    ]);

    const { completedOptionIds } = buildGraphFollowingCrossLocationDeps(100, allData);

    expect(completedOptionIds.has(1)).toBe(true);
    expect(completedOptionIds.has(2)).toBe(true);
  });

  it('conditionalTargets cross-location ref loads dependency', () => {
    const allData = new Map<number, LocationData>([
      [100, locData([
        {
          dn: 0,
          options: [option(1, 'Cond', {
            conditional_targets: [
              { condition: 'if A', verse: 10, location: 999 },
            ],
          })],
        },
      ])],
      [999, locData([
        { dn: 10, options: [option(2, 'End', { target_type: 'end' })] },
      ])],
    ]);

    const { graph } = buildGraphFollowingCrossLocationDeps(100, allData);

    expect(graph.has(nodeKey(999, 10))).toBe(true);
  });

  it('children cross-location ref loads dependency', () => {
    const allData = new Map<number, LocationData>([
      [100, locData([
        {
          dn: 0,
          options: [option(1, 'Parent', {
            target_type: 'end',
            children: [
              { type: 'choice', text: 'Cross child', target: { verse: 7, location: 999 } },
            ],
          })],
        },
      ])],
      [999, locData([
        { dn: 7, options: [option(2, 'End', { target_type: 'end' })] },
      ])],
    ]);

    const { graph } = buildGraphFollowingCrossLocationDeps(100, allData);

    expect(graph.has(nodeKey(999, 7))).toBe(true);
  });
});

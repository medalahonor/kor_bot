import { describe, it, expect } from 'vitest';
import { buildLocationGraph, nodeKey } from '../../src/services/graph.js';

const LOC = 42;

function makeLocationData(optionStatuses: Record<number, string> = {}) {
  return {
    verses: [
      {
        display_number: 0,
        options: [
          {
            id: 1, position: 0, type: 'choice', text: 'Go',
            target_type: 'verse', target_verse_dn: 1, target_location_dn: null,
            requirement: null, result: null, hidden: null, once: false,
            condition_group: null, conditional_targets: null, children: null,
            progress: optionStatuses[1] ? { status: optionStatuses[1] } : null,
          },
          {
            id: 2, position: 1, type: 'choice', text: 'Stay',
            target_type: 'end', target_verse_dn: null, target_location_dn: null,
            requirement: null, result: null, hidden: null, once: false,
            condition_group: null, conditional_targets: null, children: null,
            progress: optionStatuses[2] ? { status: optionStatuses[2] } : null,
          },
        ],
      },
      {
        display_number: 1,
        options: [
          {
            id: 3, position: 0, type: 'choice', text: 'End',
            target_type: 'end', target_verse_dn: null, target_location_dn: null,
            requirement: null, result: null, hidden: null, once: false,
            condition_group: null, conditional_targets: null, children: null,
            progress: optionStatuses[3] ? { status: optionStatuses[3] } : null,
          },
        ],
      },
    ],
  };
}

describe('buildLocationGraph', () => {
  it('returns empty completedOptionIds when no progress', () => {
    const { completedOptionIds } = buildLocationGraph(LOC, makeLocationData());
    expect(completedOptionIds.size).toBe(0);
  });

  it('visited options are in completedOptionIds', () => {
    const { completedOptionIds } = buildLocationGraph(LOC, makeLocationData({ 1: 'visited' }));
    expect(completedOptionIds.has(1)).toBe(true);
  });

  it('closed options are in completedOptionIds', () => {
    const { completedOptionIds } = buildLocationGraph(LOC, makeLocationData({ 1: 'closed' }));
    expect(completedOptionIds.has(1)).toBe(true);
  });

  it('requirements_not_met options are NOT in completedOptionIds', () => {
    const { completedOptionIds } = buildLocationGraph(LOC, makeLocationData({ 1: 'requirements_not_met' }));
    expect(completedOptionIds.has(1)).toBe(false);
  });

  it('mixed statuses: visited and closed in completed, requirements_not_met not', () => {
    const { completedOptionIds } = buildLocationGraph(
      LOC, makeLocationData({ 1: 'visited', 2: 'closed', 3: 'requirements_not_met' }),
    );
    expect(completedOptionIds.has(1)).toBe(true);
    expect(completedOptionIds.has(2)).toBe(true);
    expect(completedOptionIds.has(3)).toBe(false);
  });

  it('builds correct graph structure with NodeKey keys', () => {
    const { graph } = buildLocationGraph(LOC, makeLocationData({ 1: 'visited' }));
    expect(graph.size).toBe(2);
    expect(graph.get(nodeKey(LOC, 0))!.options).toHaveLength(2);
    expect(graph.get(nodeKey(LOC, 1))!.options).toHaveLength(1);
  });

  it('converts verse target to node with correct key', () => {
    const { graph } = buildLocationGraph(LOC, makeLocationData());
    const goEdge = graph.get(nodeKey(LOC, 0))!.options[0];
    expect(goEdge.targetType).toBe('node');
    expect(goEdge.targetKey).toBe(nodeKey(LOC, 1));
  });

  it('converts end target correctly', () => {
    const { graph } = buildLocationGraph(LOC, makeLocationData());
    const stayEdge = graph.get(nodeKey(LOC, 0))!.options[1];
    expect(stayEdge.targetType).toBe('end');
    expect(stayEdge.targetKey).toBeNull();
  });

  it('converts cross_location target to node with target location key', () => {
    const data = {
      verses: [{
        display_number: 0,
        options: [{
          id: 1, position: 0, type: 'choice', text: 'Cross',
          target_type: 'cross_location', target_verse_dn: 219, target_location_dn: 999,
          requirement: null, result: null, hidden: null, once: false,
          condition_group: null, conditional_targets: null, children: null,
          progress: null,
        }],
      }],
    };
    const { graph, referencedLocations } = buildLocationGraph(LOC, data);
    const crossEdge = graph.get(nodeKey(LOC, 0))!.options[0];
    expect(crossEdge.targetType).toBe('node');
    expect(crossEdge.targetKey).toBe(nodeKey(999, 219));
    expect(referencedLocations.has(999)).toBe(true);
  });

  it('converts conditional_targets with location to node key', () => {
    const data = {
      verses: [{
        display_number: 0,
        options: [{
          id: 1, position: 0, type: 'choice', text: 'Cond',
          target_type: null, target_verse_dn: null, target_location_dn: null,
          requirement: null, result: null, hidden: null, once: false,
          condition_group: null,
          conditional_targets: [
            { condition: 'if A', verse: 5 },
            { condition: 'if B', verse: 10, location: 999 },
            { condition: 'if C', target: 'end' },
          ],
          children: null,
          progress: null,
        }],
      }],
    };
    const { graph, referencedLocations } = buildLocationGraph(LOC, data);
    const edge = graph.get(nodeKey(LOC, 0))!.options[0];
    expect(edge.conditionalTargets).toHaveLength(3);
    expect(edge.conditionalTargets![0]).toEqual({ condition: 'if A', targetType: 'node', targetKey: nodeKey(LOC, 5) });
    expect(edge.conditionalTargets![1]).toEqual({ condition: 'if B', targetType: 'node', targetKey: nodeKey(999, 10) });
    expect(edge.conditionalTargets![2]).toEqual({ condition: 'if C', targetType: 'end' });
    expect(referencedLocations.has(999)).toBe(true);
  });

  it('converts children with location to node key', () => {
    const data = {
      verses: [{
        display_number: 0,
        options: [{
          id: 1, position: 0, type: 'choice', text: 'Parent',
          target_type: 'end', target_verse_dn: null, target_location_dn: null,
          requirement: null, result: null, hidden: null, once: false,
          condition_group: null, conditional_targets: null,
          children: [
            { type: 'choice', text: 'Local', target: { verse: 3 } },
            { type: 'choice', text: 'Cross', target: { verse: 7, location: 999 } },
            { type: 'choice', text: 'End', target: 'end' },
          ],
          progress: null,
        }],
      }],
    };
    const { graph, referencedLocations } = buildLocationGraph(LOC, data);
    const edge = graph.get(nodeKey(LOC, 0))!.options[0];
    expect(edge.children).toHaveLength(3);
    expect(edge.children![0].targetType).toBe('node');
    expect(edge.children![0].targetKey).toBe(nodeKey(LOC, 3));
    expect(edge.children![1].targetType).toBe('node');
    expect(edge.children![1].targetKey).toBe(nodeKey(999, 7));
    expect(edge.children![2].targetType).toBe('end');
    expect(referencedLocations.has(999)).toBe(true);
  });
});

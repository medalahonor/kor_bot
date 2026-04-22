import { describe, it, expect } from 'vitest';
import { resolveNotePathOptionIdsFromGraph } from '../../src/services/resolveNotePathOptionIds.js';
import { nodeKey } from '../../src/services/graph.js';
import type { Graph, GraphEdge, GraphNode, NodeKey } from '../../src/types/index.js';

function edge(overrides: Partial<GraphEdge> & { optionId: number }): GraphEdge {
  return {
    position: 0,
    type: 'choice',
    text: '',
    targetType: 'node',
    targetKey: null,
    requirement: null,
    result: null,
    hidden: null,
    once: false,
    conditionGroup: null,
    conditionalTargets: null,
    children: null,
    ...overrides,
  };
}

function buildGraph(nodes: Array<{ key: NodeKey; options: GraphEdge[] }>): Graph {
  const g: Graph = new Map();
  for (const n of nodes) g.set(n.key, n);
  return g;
}

describe('resolveNotePathOptionIdsFromGraph', () => {
  it('returns path as-is for single-step path', () => {
    const result = resolveNotePathOptionIdsFromGraph(new Map(), [
      { locationDn: 5, verseDn: 0 },
    ]);
    expect(result).toEqual([{ locationDn: 5, verseDn: 0 }]);
  });

  it('returns path as-is when already backfilled', () => {
    const result = resolveNotePathOptionIdsFromGraph(new Map(), [
      { locationDn: 5, verseDn: 0, optionId: 10 },
      { locationDn: 5, verseDn: 3 },
    ]);
    expect(result).toEqual([
      { locationDn: 5, verseDn: 0, optionId: 10 },
      { locationDn: 5, verseDn: 3 },
    ]);
  });

  it('resolves optionId for unambiguous same-location pair', () => {
    const graph = buildGraph([
      {
        key: nodeKey(5, 0),
        options: [
          edge({ optionId: 100, position: 0, targetKey: nodeKey(5, 3) }),
          edge({ optionId: 101, position: 1, targetKey: nodeKey(5, 4) }),
        ],
      },
    ]);
    const result = resolveNotePathOptionIdsFromGraph(graph, [
      { locationDn: 5, verseDn: 0 },
      { locationDn: 5, verseDn: 3 },
    ]);
    expect(result).toEqual([
      { locationDn: 5, verseDn: 0, optionId: 100 },
      { locationDn: 5, verseDn: 3 },
    ]);
  });

  it('picks min position option on ambiguous pair', () => {
    const graph = buildGraph([
      {
        key: nodeKey(5, 0),
        options: [
          edge({ optionId: 200, position: 5, targetKey: nodeKey(5, 7) }),
          edge({ optionId: 201, position: 2, targetKey: nodeKey(5, 7) }),
          edge({ optionId: 202, position: 8, targetKey: nodeKey(5, 7) }),
        ],
      },
    ]);
    const result = resolveNotePathOptionIdsFromGraph(graph, [
      { locationDn: 5, verseDn: 0 },
      { locationDn: 5, verseDn: 7 },
    ]);
    expect(result?.[0].optionId).toBe(201);
  });

  it('resolves cross-location step', () => {
    const graph = buildGraph([
      {
        key: nodeKey(5, 2),
        options: [
          edge({ optionId: 300, position: 0, targetKey: nodeKey(8, 0) }),
        ],
      },
      {
        key: nodeKey(8, 0),
        options: [],
      },
    ]);
    const result = resolveNotePathOptionIdsFromGraph(graph, [
      { locationDn: 5, verseDn: 2 },
      { locationDn: 8, verseDn: 0 },
    ]);
    expect(result?.[0].optionId).toBe(300);
  });

  it('returns null when from-node missing in graph', () => {
    const graph = buildGraph([]);
    const result = resolveNotePathOptionIdsFromGraph(graph, [
      { locationDn: 5, verseDn: 0 },
      { locationDn: 5, verseDn: 3 },
    ]);
    expect(result).toBeNull();
  });

  it('returns null when no option matches target pair', () => {
    const graph = buildGraph([
      {
        key: nodeKey(5, 0),
        options: [
          edge({ optionId: 400, position: 0, targetKey: nodeKey(5, 99) }),
        ],
      },
    ]);
    const result = resolveNotePathOptionIdsFromGraph(graph, [
      { locationDn: 5, verseDn: 0 },
      { locationDn: 5, verseDn: 3 },
    ]);
    expect(result).toBeNull();
  });

  it('resolves multi-step path traversing both same-location and cross-location', () => {
    const graph = buildGraph([
      {
        key: nodeKey(5, 0),
        options: [edge({ optionId: 500, position: 0, targetKey: nodeKey(5, 2) })],
      },
      {
        key: nodeKey(5, 2),
        options: [edge({ optionId: 501, position: 0, targetKey: nodeKey(8, 0) })],
      },
      {
        key: nodeKey(8, 0),
        options: [],
      },
    ]);
    const result = resolveNotePathOptionIdsFromGraph(graph, [
      { locationDn: 5, verseDn: 0 },
      { locationDn: 5, verseDn: 2 },
      { locationDn: 8, verseDn: 0 },
    ]);
    expect(result).toEqual([
      { locationDn: 5, verseDn: 0, optionId: 500 },
      { locationDn: 5, verseDn: 2, optionId: 501 },
      { locationDn: 8, verseDn: 0 },
    ]);
  });
});

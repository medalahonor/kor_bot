import { describe, it, expect } from 'vitest';
import { findDescendantOptionIds } from '../../src/services/graph-utils.js';
import {
  linearGraph,
  branchingGraph,
  cycleGraph,
  shopLocationGraph,
  conditionalTargetsGraph,
  childrenGraph,
  diamondGraph,
  crossLocationGraph,
} from '../helpers/fixtures.js';
import type { Graph } from '../../src/types/index.js';

describe('findDescendantOptionIds', () => {
  describe('linear graph (#0 →opt1→ #1 →opt2→ #2 →opt3→ end)', () => {
    const graph = linearGraph();

    it('start from opt1 returns all downstream options', () => {
      expect(findDescendantOptionIds(graph, 1)).toEqual(new Set([2, 3]));
    });

    it('start from opt2 returns only opt3', () => {
      expect(findDescendantOptionIds(graph, 2)).toEqual(new Set([3]));
    });

    it('start from terminal opt3 (end target) returns empty set', () => {
      expect(findDescendantOptionIds(graph, 3)).toEqual(new Set());
    });
  });

  describe('branching graph', () => {
    const graph = branchingGraph();

    it('start from branch A entry (opt1) returns only branch A descendants', () => {
      expect(findDescendantOptionIds(graph, 1)).toEqual(new Set([3]));
    });

    it('start from branch B entry (opt2) returns all branch B descendants', () => {
      expect(findDescendantOptionIds(graph, 2)).toEqual(new Set([4, 5, 6]));
    });

    it('start from middle of branch B (opt4) returns only its tail', () => {
      expect(findDescendantOptionIds(graph, 4)).toEqual(new Set([5]));
    });

    it('start from condition opt6 (→ end) returns empty', () => {
      expect(findDescendantOptionIds(graph, 6)).toEqual(new Set());
    });
  });

  describe('cycle graph (self-loop)', () => {
    const graph = cycleGraph();

    it('start from opt1 (entry) traverses cycle without infinite loop', () => {
      expect(findDescendantOptionIds(graph, 1)).toEqual(new Set([2, 3]));
    });

    it('start from self-loop opt2 excludes itself from result', () => {
      expect(findDescendantOptionIds(graph, 2)).toEqual(new Set([3]));
    });
  });

  describe('shop location graph (complex cycles + conditional targets)', () => {
    const graph = shopLocationGraph();

    it('start from opt1 reaches all reachable shop options', () => {
      expect(findDescendantOptionIds(graph, 1)).toEqual(new Set([2, 3, 4, 5, 6, 7]));
    });

    it('start from opt3 (enter shop) returns shop interior options', () => {
      expect(findDescendantOptionIds(graph, 3)).toEqual(new Set([5, 6, 7]));
    });

    it('start from buy-food self-loop opt5 returns all shop options except itself', () => {
      expect(findDescendantOptionIds(graph, 5)).toEqual(new Set([6, 7]));
    });
  });

  describe('conditionalTargets graph', () => {
    const graph = conditionalTargetsGraph();

    it('start from opt1 traverses both conditional branches', () => {
      expect(findDescendantOptionIds(graph, 1)).toEqual(new Set([3, 4]));
    });

    it('start from sibling opt2 (→ end) returns empty', () => {
      expect(findDescendantOptionIds(graph, 2)).toEqual(new Set());
    });
  });

  describe('children graph', () => {
    const graph = childrenGraph();

    it('start from opt1 traverses both children targets', () => {
      expect(findDescendantOptionIds(graph, 1)).toEqual(new Set([2, 3]));
    });
  });

  describe('diamond graph (two paths converge)', () => {
    const graph = diamondGraph();

    it('start from opt1 (path A) reaches merge point and tail, but not opt4 of path B', () => {
      expect(findDescendantOptionIds(graph, 1)).toEqual(new Set([3, 5]));
    });

    it('start from opt2 (path B) reaches merge point and tail, but not opt3 of path A', () => {
      expect(findDescendantOptionIds(graph, 2)).toEqual(new Set([4, 5]));
    });
  });

  describe('cross-location graph', () => {
    const graph = crossLocationGraph();

    it('descends into cross-location target if its node is present in graph', () => {
      // opt2 leads to 999:5 which is included in this fixture, so opt4 is reachable
      expect(findDescendantOptionIds(graph, 2)).toEqual(new Set([4]));
    });

    it('skips cross-location targets that are absent from the graph', () => {
      // Drop the cross-location node — opt2 then leads nowhere reachable
      const trimmed: Graph = new Map(graph);
      trimmed.delete('999:5');
      expect(findDescendantOptionIds(trimmed, 2)).toEqual(new Set());
    });
  });

  describe('edge cases', () => {
    it('returns empty set when option is not present in any node', () => {
      const graph = linearGraph();
      expect(findDescendantOptionIds(graph, 99999)).toEqual(new Set());
    });

    it('does not include the start option in the result', () => {
      const graph = cycleGraph();
      // opt2 is a self-loop that visits itself; result must exclude it
      expect(findDescendantOptionIds(graph, 2).has(2)).toBe(false);
    });
  });
});

import { describe, it, expect } from 'vitest';
import { findRemaining } from '../../src/services/remaining.js';
import {
  TEST_LOC,
  CROSS_LOC_TARGET,
  linearGraph,
  branchingGraph,
  cycleGraph,
  crossLocationGraph,
  conditionalTargetsGraph,
  childrenGraph,
  diamondGraph,
  shopLocationGraph,
  ksGraph,
} from '../helpers/fixtures.js';
import type { NodeKey } from '../../src/types/index.js';

function k(verseDn: number): NodeKey {
  return `${TEST_LOC}:${verseDn}`;
}

describe('findRemaining', () => {
  // -------------------------------------------------------------------------
  // Linear graph: #0 → #1 → #2 → end
  // -------------------------------------------------------------------------

  describe('linear graph', () => {
    it('returns all options when nothing visited', () => {
      const graph = linearGraph();
      const remaining = findRemaining(graph, new Set(), k(0));

      expect(remaining).toHaveLength(3);
      expect(remaining.map((r) => r.option.id)).toEqual([1, 2, 3]);
    });

    it('returns nothing when everything visited', () => {
      const graph = linearGraph();
      const remaining = findRemaining(graph, new Set([1, 2, 3]), k(0));

      expect(remaining).toHaveLength(0);
    });

    it('still traverses through visited options to find deeper unvisited', () => {
      const graph = linearGraph();
      const remaining = findRemaining(graph, new Set([1, 2]), k(0));

      expect(remaining).toHaveLength(1);
      expect(remaining[0].option.id).toBe(3);
      expect(remaining[0].verseDn).toBe(2);
    });

    it('includes correct pathFromEntry', () => {
      const graph = linearGraph();
      const remaining = findRemaining(graph, new Set([1]), k(0));

      const opt2 = remaining.find((r) => r.option.id === 2)!;
      expect(opt2.pathFromEntry).toHaveLength(2);
      expect(opt2.pathFromEntry[0].optionId).toBe(1);
      expect(opt2.pathFromEntry[1].optionId).toBe(2);

      const opt3 = remaining.find((r) => r.option.id === 3)!;
      expect(opt3.pathFromEntry).toHaveLength(3);
    });

    it('sorts by path length (shortest first)', () => {
      const graph = linearGraph();
      const remaining = findRemaining(graph, new Set(), k(0));

      for (let i = 1; i < remaining.length; i++) {
        expect(remaining[i].pathFromEntry.length).toBeGreaterThanOrEqual(
          remaining[i - 1].pathFromEntry.length,
        );
      }
    });
  });

  // -------------------------------------------------------------------------
  // Branching graph
  // -------------------------------------------------------------------------

  describe('branching graph', () => {
    it('returns all 6 options when nothing visited', () => {
      const graph = branchingGraph();
      const remaining = findRemaining(graph, new Set(), k(0));

      expect(remaining).toHaveLength(6);
    });

    it('visiting one branch does not affect the other', () => {
      const graph = branchingGraph();
      const remaining = findRemaining(graph, new Set([1, 3]), k(0));

      const ids = remaining.map((r) => r.option.id);
      expect(ids).toContain(2);
      expect(ids).toContain(4);
      expect(ids).toContain(5);
      expect(ids).toContain(6);
      expect(ids).not.toContain(1);
      expect(ids).not.toContain(3);
    });

    it('includes condition type options', () => {
      const graph = branchingGraph();
      const remaining = findRemaining(graph, new Set(), k(0));

      const condOpt = remaining.find((r) => r.option.id === 6)!;
      expect(condOpt.option.type).toBe('condition');
    });
  });

  // -------------------------------------------------------------------------
  // Cycle graph (shop pattern)
  // -------------------------------------------------------------------------

  describe('cycle graph', () => {
    it('does not infinite loop on self-referencing verse', () => {
      const graph = cycleGraph();
      const remaining = findRemaining(graph, new Set(), k(0));

      expect(remaining).toHaveLength(3);
    });

    it('cycle vertex is visited only once per path (backtracking)', () => {
      const graph = cycleGraph();
      const remaining = findRemaining(graph, new Set(), k(0));

      const opt2 = remaining.find((r) => r.option.id === 2)!;
      const verseVisits = opt2.pathFromEntry.filter((s) => s.verseDn === 1);
      expect(verseVisits.length).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // Cross-location graph — now traverses into target location
  // -------------------------------------------------------------------------

  describe('cross-location graph', () => {
    it('traverses into cross-location vertices', () => {
      const graph = crossLocationGraph();
      const remaining = findRemaining(graph, new Set(), k(0));

      // opt1 (enter cave) + opt2 (book of secrets) + opt3 (leave) + opt4 (read passage in loc 999)
      expect(remaining).toHaveLength(4);
      const ids = remaining.map((r) => r.option.id);
      expect(ids).toContain(4); // option from target location
    });

    it('cross-location option not remaining when visited', () => {
      const graph = crossLocationGraph();
      const remaining = findRemaining(graph, new Set([1, 2, 3, 4]), k(0));

      expect(remaining).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // ConditionalTargets graph
  // -------------------------------------------------------------------------

  describe('conditionalTargets graph', () => {
    it('traverses all conditional target branches', () => {
      const graph = conditionalTargetsGraph();
      const remaining = findRemaining(graph, new Set(), k(0));

      expect(remaining).toHaveLength(4);
      const ids = remaining.map((r) => r.option.id);
      expect(ids).toContain(1);
      expect(ids).toContain(3);
      expect(ids).toContain(4);
    });

    it('paths through conditional targets are correct', () => {
      const graph = conditionalTargetsGraph();
      const remaining = findRemaining(graph, new Set(), k(0));

      const opt3 = remaining.find((r) => r.option.id === 3)!;
      expect(opt3.pathFromEntry[0].optionId).toBe(1);
      expect(opt3.pathFromEntry[1].optionId).toBe(3);
    });
  });

  // -------------------------------------------------------------------------
  // Children graph (fallback pattern)
  // -------------------------------------------------------------------------

  describe('children graph', () => {
    it('extracts targets from children JSONB', () => {
      const graph = childrenGraph();
      const remaining = findRemaining(graph, new Set(), k(0));

      expect(remaining).toHaveLength(3);
      const ids = remaining.map((r) => r.option.id);
      expect(ids).toContain(2);
      expect(ids).toContain(3);
    });
  });

  // -------------------------------------------------------------------------
  // Diamond graph (convergence)
  // -------------------------------------------------------------------------

  describe('diamond graph (convergence)', () => {
    it('visits merged vertex via both paths (backtracking)', () => {
      const graph = diamondGraph();
      const remaining = findRemaining(graph, new Set(), k(0));

      const opt5entries = remaining.filter((r) => r.option.id === 5);
      expect(opt5entries.length).toBe(2);

      const pathTexts = opt5entries.map(
        (r) => r.pathFromEntry[0].text,
      );
      expect(pathTexts).toContain('Path A');
      expect(pathTexts).toContain('Path B');
    });

    it('total remaining count accounts for duplicate paths', () => {
      const graph = diamondGraph();
      const remaining = findRemaining(graph, new Set(), k(0));

      expect(remaining).toHaveLength(6);
    });
  });

  // -------------------------------------------------------------------------
  // Shop location graph (self-loop repeatable options)
  // -------------------------------------------------------------------------

  describe('shop location graph', () => {
    it('returns all options when nothing visited', () => {
      const graph = shopLocationGraph();
      const remaining = findRemaining(graph, new Set(), k(0));

      const uniqueIds = new Set(remaining.map((r) => r.option.id));
      expect(uniqueIds).toEqual(new Set([1, 2, 3, 4, 5, 6, 7]));
    });

    it('UC5: self-loop once=false option remains when all visited', () => {
      const graph = shopLocationGraph();
      const remaining = findRemaining(graph, new Set([1, 2, 3, 4, 5, 6, 7]), k(0));

      const ids = remaining.map((r) => r.option.id);
      expect(ids).toContain(5);
    });

    it('UC4: self-loop once=true option does NOT remain when visited', () => {
      const graph = shopLocationGraph();
      const remaining = findRemaining(graph, new Set([1, 2, 3, 4, 5, 6, 7]), k(0));

      const ids = remaining.map((r) => r.option.id);
      expect(ids).not.toContain(6);
    });

    it('gateway chain: repeatable option path includes gateway ancestors', () => {
      const graph = shopLocationGraph();
      const remaining = findRemaining(graph, new Set([1, 2, 3, 4, 5, 6, 7]), k(0));

      const opt5 = remaining.find((r) => r.option.id === 5)!;
      const pathOptionIds = opt5.pathFromEntry.map((s) => s.optionId);
      expect(pathOptionIds).toContain(1);
      expect(pathOptionIds).toContain(5);
    });
  });

  // -------------------------------------------------------------------------
  // Regression: cycle graph (once=true) must NOT keep visited options
  // -------------------------------------------------------------------------

  describe('cycle graph regression', () => {
    it('once=true self-loop option does NOT remain when all visited', () => {
      const graph = cycleGraph();
      const remaining = findRemaining(graph, new Set([1, 2, 3]), k(0));

      expect(remaining).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  describe('edge cases', () => {
    it('empty graph returns empty', () => {
      const graph = new Map();
      const remaining = findRemaining(graph, new Set(), k(0));
      expect(remaining).toHaveLength(0);
    });

    it('graph with only verse 0 and no options returns empty', () => {
      const graph = new Map();
      graph.set(k(0), { key: k(0), options: [] });
      const remaining = findRemaining(graph, new Set(), k(0));
      expect(remaining).toHaveLength(0);
    });

    it('option with null targetType and no conditionalTargets/children is a dead end', () => {
      const graph = new Map();
      graph.set(k(0), {
        key: k(0),
        options: [
          {
            optionId: 1, position: 0, type: 'choice' as const, text: 'Dead end',
            targetType: null, targetKey: null,
            requirement: null, result: null, hidden: null, once: false,
            conditionGroup: null, conditionalTargets: null, children: null,
          },
        ],
      });

      const remaining = findRemaining(graph, new Set(), k(0));
      expect(remaining).toHaveLength(1);
      expect(remaining[0].option.id).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // KS graph (non-zero start)
  // -------------------------------------------------------------------------

  describe('KS graph (non-zero start)', () => {
    it('returns all options starting from verse 42', () => {
      const graph = ksGraph();
      const remaining = findRemaining(graph, new Set(), k(42));

      expect(remaining).toHaveLength(4);
      expect(remaining.map((r) => r.option.id)).toEqual([101, 102, 103, 104]);
    });

    it('returns unvisited options from verse 42', () => {
      const graph = ksGraph();
      const remaining = findRemaining(graph, new Set([101, 102]), k(42));

      const ids = remaining.map((r) => r.option.id);
      expect(ids).toContain(103);
      expect(ids).toContain(104);
      expect(ids).not.toContain(101);
      expect(ids).not.toContain(102);
    });

    it('returns nothing when all visited', () => {
      const graph = ksGraph();
      const remaining = findRemaining(graph, new Set([101, 102, 103, 104]), k(42));

      expect(remaining).toHaveLength(0);
    });

    it('works from mid-chain verse 43', () => {
      const graph = ksGraph();
      const remaining = findRemaining(graph, new Set(), k(43));

      expect(remaining).toHaveLength(3);
      const ids = remaining.map((r) => r.option.id);
      expect(ids).toContain(102);
      expect(ids).toContain(103);
      expect(ids).toContain(104);
      expect(ids).not.toContain(101);
    });

    it('returns empty for non-existent startKey', () => {
      const graph = ksGraph();
      const remaining = findRemaining(graph, new Set(), k(999));

      expect(remaining).toHaveLength(0);
    });

    it('includes correct verseDn in results', () => {
      const graph = ksGraph();
      const remaining = findRemaining(graph, new Set(), k(42));

      const opt101 = remaining.find((r) => r.option.id === 101)!;
      expect(opt101.verseDn).toBe(42);

      const opt104 = remaining.find((r) => r.option.id === 104)!;
      expect(opt104.verseDn).toBe(44);
    });
  });
});

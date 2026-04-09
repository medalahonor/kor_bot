import { describe, it, expect } from 'vitest';
import { countPaths } from '../../src/services/paths.js';
import { nodeKey } from '../../src/services/graph.js';
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
  ksGraph,
} from '../helpers/fixtures.js';
import type { Graph, GraphEdge, GraphNode, NodeKey } from '../../src/types/index.js';

function k(verseDn: number): NodeKey {
  return `${TEST_LOC}:${verseDn}`;
}

function edge(overrides: Partial<GraphEdge> & { optionId: number; text: string }): GraphEdge {
  return {
    position: 0,
    type: 'choice',
    targetType: null,
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

describe('countPaths', () => {
  // Use Case 1: Линейный путь
  describe('linear graph', () => {
    it('counts 1 path, 0 completed when nothing visited', () => {
      const result = countPaths(linearGraph(), new Set(), k(0));
      expect(result).toEqual({
        totalPaths: 1,
        completedPaths: 0,
        totalCyclic: 0,
        completedCyclic: 0,
      });
    });

    it('counts 1 completed when all options visited', () => {
      const result = countPaths(linearGraph(), new Set([1, 2, 3]), k(0));
      expect(result).toEqual({
        totalPaths: 1,
        completedPaths: 1,
        totalCyclic: 0,
        completedCyclic: 0,
      });
    });

    // Use Case 16: только промежуточные посещены, end нет
    it('counts 0 completed when only intermediate options visited', () => {
      const result = countPaths(linearGraph(), new Set([1, 2]), k(0));
      expect(result).toEqual({
        totalPaths: 1,
        completedPaths: 0,
        totalCyclic: 0,
        completedCyclic: 0,
      });
    });
  });

  // Use Case 2: Ветвление
  describe('branching graph', () => {
    it('counts 3 paths, 0 completed when nothing visited', () => {
      const result = countPaths(branchingGraph(), new Set(), k(0));
      expect(result).toEqual({
        totalPaths: 3,
        completedPaths: 0,
        totalCyclic: 0,
        completedCyclic: 0,
      });
    });

    it('counts 1 completed when one branch fully visited', () => {
      const result = countPaths(branchingGraph(), new Set([1, 3]), k(0));
      expect(result).toEqual({
        totalPaths: 3,
        completedPaths: 1,
        totalCyclic: 0,
        completedCyclic: 0,
      });
    });

    it('counts all 3 completed when all options visited', () => {
      const result = countPaths(branchingGraph(), new Set([1, 2, 3, 4, 5, 6]), k(0));
      expect(result).toEqual({
        totalPaths: 3,
        completedPaths: 3,
        totalCyclic: 0,
        completedCyclic: 0,
      });
    });
  });

  // Use Case 3: Цикл-магазин
  describe('cycle graph (shop pattern)', () => {
    it('counts 1 path + 1 cyclic when nothing visited', () => {
      const result = countPaths(cycleGraph(), new Set(), k(0));
      expect(result).toEqual({
        totalPaths: 1,
        completedPaths: 0,
        totalCyclic: 1,
        completedCyclic: 0,
      });
    });

    it('counts cyclic completed when all options in cyclic path visited', () => {
      const result = countPaths(cycleGraph(), new Set([1, 2]), k(0));
      expect(result).toEqual({
        totalPaths: 1,
        completedPaths: 0,
        totalCyclic: 1,
        completedCyclic: 1,
      });
    });

    // Use Case 11: цикл пройден, обычный нет
    it('cyclic completed but regular not', () => {
      const result = countPaths(cycleGraph(), new Set([1, 2]), k(0));
      expect(result.completedCyclic).toBe(1);
      expect(result.completedPaths).toBe(0);
    });

    it('counts regular completed when all options in regular path visited', () => {
      const result = countPaths(cycleGraph(), new Set([1, 3]), k(0));
      expect(result).toEqual({
        totalPaths: 1,
        completedPaths: 1,
        totalCyclic: 1,
        completedCyclic: 0,
      });
    });
  });

  // Use Case 4: Cross-location — граф уже содержит вершины целевой локации
  describe('cross-location graph', () => {
    it('counts paths through cross-location transitions', () => {
      const result = countPaths(crossLocationGraph(), new Set(), k(0));
      expect(result).toEqual({
        totalPaths: 2,
        completedPaths: 0,
        totalCyclic: 0,
        completedCyclic: 0,
      });
    });

    it('counts completed when end path fully visited', () => {
      const result = countPaths(crossLocationGraph(), new Set([1, 3]), k(0));
      expect(result).toEqual({
        totalPaths: 2,
        completedPaths: 1,
        totalCyclic: 0,
        completedCyclic: 0,
      });
    });

    it('counts completed for cross-location path', () => {
      // Path: opt1 → opt2 → opt4 (cross-loc end). All options: 1, 2, 4
      const result = countPaths(crossLocationGraph(), new Set([1, 2, 4]), k(0));
      expect(result.completedPaths).toBe(1);
    });

    it('counts all completed when both paths fully visited', () => {
      const result = countPaths(crossLocationGraph(), new Set([1, 2, 3, 4]), k(0));
      expect(result).toEqual({
        totalPaths: 2,
        completedPaths: 2,
        totalCyclic: 0,
        completedCyclic: 0,
      });
    });
  });

  // Use Case 5: ConditionalTargets
  describe('conditionalTargets graph', () => {
    it('counts 3 paths when nothing visited', () => {
      const result = countPaths(conditionalTargetsGraph(), new Set(), k(0));
      expect(result).toEqual({
        totalPaths: 3,
        completedPaths: 0,
        totalCyclic: 0,
        completedCyclic: 0,
      });
    });

    it('counts 1 completed when one conditional branch fully visited', () => {
      const result = countPaths(conditionalTargetsGraph(), new Set([1, 3]), k(0));
      expect(result).toEqual({
        totalPaths: 3,
        completedPaths: 1,
        totalCyclic: 0,
        completedCyclic: 0,
      });
    });
  });

  // Use Case 6: Children
  describe('children graph', () => {
    it('counts 3 paths when nothing visited', () => {
      const result = countPaths(childrenGraph(), new Set(), k(0));
      expect(result).toEqual({
        totalPaths: 3,
        completedPaths: 0,
        totalCyclic: 0,
        completedCyclic: 0,
      });
    });

    it('counts completed correctly', () => {
      const result = countPaths(childrenGraph(), new Set([1]), k(0));
      expect(result.completedPaths).toBe(1);
    });
  });

  // Use Cases 7, 13, 14, 15: Diamond/сходимость
  describe('diamond graph', () => {
    it('counts 2 paths when nothing visited', () => {
      const result = countPaths(diamondGraph(), new Set(), k(0));
      expect(result).toEqual({
        totalPaths: 2,
        completedPaths: 0,
        totalCyclic: 0,
        completedCyclic: 0,
      });
    });

    // Use Case 13: только end посещена
    it('counts 0 completed when only end option visited', () => {
      const result = countPaths(diamondGraph(), new Set([5]), k(0));
      expect(result.completedPaths).toBe(0);
    });

    // Use Case 14: путь A полностью, путь B нет
    it('counts 1 completed when path A fully visited', () => {
      const result = countPaths(diamondGraph(), new Set([1, 3, 5]), k(0));
      expect(result.completedPaths).toBe(1);
    });

    // Use Case 15: оба пути полностью
    it('counts 2 completed when both paths fully visited', () => {
      const result = countPaths(diamondGraph(), new Set([1, 2, 3, 4, 5]), k(0));
      expect(result.completedPaths).toBe(2);
    });
  });

  // Use Case 8: Пустой граф
  describe('empty graph', () => {
    it('returns all zeros', () => {
      const result = countPaths(new Map(), new Set(), k(0));
      expect(result).toEqual({
        totalPaths: 0,
        completedPaths: 0,
        totalCyclic: 0,
        completedCyclic: 0,
      });
    });
  });

  // Use Case 9: Параграф без опций
  describe('graph with verse 0 but no options', () => {
    it('returns all zeros', () => {
      const graph: Graph = new Map();
      graph.set(k(0), { key: k(0), options: [] });
      const result = countPaths(graph, new Set(), k(0));
      expect(result).toEqual({
        totalPaths: 0,
        completedPaths: 0,
        totalCyclic: 0,
        completedCyclic: 0,
      });
    });
  });

  // Use Case 12: Множественные циклы
  describe('multiple cycles', () => {
    it('counts multiple cyclic paths', () => {
      const graph: Graph = new Map();
      graph.set(k(0), {
        key: k(0),
        options: [
          edge({ optionId: 1, text: 'Enter shop', targetType: 'node', targetKey: k(1) }),
        ],
      });
      graph.set(k(1), {
        key: k(1),
        options: [
          edge({ optionId: 2, text: 'Buy sword', targetType: 'node', targetKey: k(1) }),
          edge({ optionId: 3, text: 'Buy shield', targetType: 'node', targetKey: k(1) }),
          edge({ optionId: 4, text: 'Leave', targetType: 'end' }),
        ],
      });

      const result = countPaths(graph, new Set(), k(0));
      expect(result).toEqual({
        totalPaths: 1,
        completedPaths: 0,
        totalCyclic: 2,
        completedCyclic: 0,
      });
    });
  });

  // Dead-end option (no target at all)
  describe('dead-end option', () => {
    it('does not count options with no target', () => {
      const graph: Graph = new Map();
      graph.set(k(0), {
        key: k(0),
        options: [
          edge({ optionId: 1, text: 'Dead end', targetType: null }),
          edge({ optionId: 2, text: 'Real end', targetType: 'end' }),
        ],
      });

      const result = countPaths(graph, new Set(), k(0));
      expect(result).toEqual({
        totalPaths: 1,
        completedPaths: 0,
        totalCyclic: 0,
        completedCyclic: 0,
      });
    });
  });

  // КС (Book of Secrets): старт от произвольной строфы
  describe('KS graph (non-zero start)', () => {
    it('counts paths starting from verse 42', () => {
      const result = countPaths(ksGraph(), new Set(), k(42));
      expect(result).toEqual({
        totalPaths: 2,
        completedPaths: 0,
        totalCyclic: 0,
        completedCyclic: 0,
      });
    });

    it('counts completed paths from verse 42', () => {
      const result = countPaths(ksGraph(), new Set([101, 102]), k(42));
      expect(result).toEqual({
        totalPaths: 2,
        completedPaths: 1,
        totalCyclic: 0,
        completedCyclic: 0,
      });
    });

    it('counts all completed from verse 42', () => {
      const result = countPaths(ksGraph(), new Set([101, 102, 103, 104]), k(42));
      expect(result).toEqual({
        totalPaths: 2,
        completedPaths: 2,
        totalCyclic: 0,
        completedCyclic: 0,
      });
    });

    it('counts paths from mid-chain verse 43', () => {
      const result = countPaths(ksGraph(), new Set(), k(43));
      expect(result).toEqual({
        totalPaths: 2,
        completedPaths: 0,
        totalCyclic: 0,
        completedCyclic: 0,
      });
    });

    it('returns zeros when startKey does not exist in graph', () => {
      const result = countPaths(ksGraph(), new Set(), k(999));
      expect(result).toEqual({
        totalPaths: 0,
        completedPaths: 0,
        totalCyclic: 0,
        completedCyclic: 0,
      });
    });
  });
});

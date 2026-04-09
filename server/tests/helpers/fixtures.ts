import type { Graph, GraphEdge, GraphNode, NodeKey } from '../../src/types/index.js';

// Test location display number used in all single-location fixtures
export const TEST_LOC = 1;

function k(verseDn: number): NodeKey {
  return `${TEST_LOC}:${verseDn}`;
}

/**
 * Helper to create a GraphEdge with defaults.
 */
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

/**
 * Linear graph: #0 → opt1 → #1 → opt2 → #2 → opt3 → end
 */
export function linearGraph(): Graph {
  const graph: Graph = new Map();

  graph.set(k(0), {
    key: k(0),
    options: [
      edge({ optionId: 1, position: 0, text: 'Go to verse 1', targetType: 'node', targetKey: k(1) }),
    ],
  });

  graph.set(k(1), {
    key: k(1),
    options: [
      edge({ optionId: 2, position: 0, text: 'Go to verse 2', targetType: 'node', targetKey: k(2) }),
    ],
  });

  graph.set(k(2), {
    key: k(2),
    options: [
      edge({ optionId: 3, position: 0, text: 'End exploration', targetType: 'end' }),
    ],
  });

  return graph;
}

/**
 * Branching graph:
 *
 *   #0 → opt1 → #1 → opt3 → end
 *     → opt2 → #2 → opt4 → #3 → opt5 → end
 *                  → opt6 → end (condition)
 */
export function branchingGraph(): Graph {
  const graph: Graph = new Map();

  graph.set(k(0), {
    key: k(0),
    options: [
      edge({ optionId: 1, position: 0, text: 'Branch A', targetType: 'node', targetKey: k(1) }),
      edge({ optionId: 2, position: 1, text: 'Branch B', targetType: 'node', targetKey: k(2) }),
    ],
  });

  graph.set(k(1), {
    key: k(1),
    options: [
      edge({ optionId: 3, position: 0, text: 'End A', targetType: 'end' }),
    ],
  });

  graph.set(k(2), {
    key: k(2),
    options: [
      edge({ optionId: 4, position: 0, text: 'Continue to 3', targetType: 'node', targetKey: k(3) }),
      edge({ optionId: 6, position: 1, text: 'Condition check', type: 'condition', targetType: 'end' }),
    ],
  });

  graph.set(k(3), {
    key: k(3),
    options: [
      edge({ optionId: 5, position: 0, text: 'End B', targetType: 'end' }),
    ],
  });

  return graph;
}

/**
 * Cycle graph (shop pattern):
 *
 *   #0 → opt1 → #1 → opt2 → #1 (self-loop)
 *                   → opt3 → end
 */
export function cycleGraph(): Graph {
  const graph: Graph = new Map();

  graph.set(k(0), {
    key: k(0),
    options: [
      edge({ optionId: 1, position: 0, text: 'Enter shop', targetType: 'node', targetKey: k(1) }),
    ],
  });

  graph.set(k(1), {
    key: k(1),
    options: [
      edge({ optionId: 2, position: 0, text: 'Buy item', targetType: 'node', targetKey: k(1), once: true }),
      edge({ optionId: 3, position: 1, text: 'Leave shop', targetType: 'end' }),
    ],
  });

  return graph;
}

/**
 * Cross-location graph (single location view, target location included):
 *
 *   Loc 1: #0 → opt1 → #1 → opt2 → Loc999:#5
 *                           → opt3 → end
 *   Loc 999: #5 → opt4 → end
 */
export const CROSS_LOC_TARGET = 999;

export function crossLocationGraph(): Graph {
  const graph: Graph = new Map();

  graph.set(k(0), {
    key: k(0),
    options: [
      edge({ optionId: 1, position: 0, text: 'Enter cave', targetType: 'node', targetKey: k(1) }),
    ],
  });

  graph.set(k(1), {
    key: k(1),
    options: [
      edge({ optionId: 2, position: 0, text: 'Book of Secrets', targetType: 'node', targetKey: `${CROSS_LOC_TARGET}:5` }),
      edge({ optionId: 3, position: 1, text: 'Leave', targetType: 'end' }),
    ],
  });

  // Target location vertex
  graph.set(`${CROSS_LOC_TARGET}:5`, {
    key: `${CROSS_LOC_TARGET}:5`,
    options: [
      edge({ optionId: 4, position: 0, text: 'Read passage', targetType: 'end' }),
    ],
  });

  return graph;
}

/**
 * ConditionalTargets graph:
 *
 *   #0 → opt1 (conditionalTargets: if light → #1, else → #2)
 *        opt2 → end
 *   #1 → opt3 → end
 *   #2 → opt4 → end
 */
export function conditionalTargetsGraph(): Graph {
  const graph: Graph = new Map();

  graph.set(k(0), {
    key: k(0),
    options: [
      edge({
        optionId: 1,
        position: 0,
        text: 'Approach camp',
        conditionalTargets: [
          { condition: 'If no light', targetType: 'node' as const, targetKey: k(1) },
          { condition: 'Otherwise', targetType: 'node' as const, targetKey: k(2) },
        ],
      }),
      edge({ optionId: 2, position: 1, text: 'Leave', targetType: 'end' }),
    ],
  });

  graph.set(k(1), {
    key: k(1),
    options: [
      edge({ optionId: 3, position: 0, text: 'Dark path end', targetType: 'end' }),
    ],
  });

  graph.set(k(2), {
    key: k(2),
    options: [
      edge({ optionId: 4, position: 0, text: 'Light path end', targetType: 'end' }),
    ],
  });

  return graph;
}

/**
 * Children graph (fallback pattern):
 *
 *   #0 → opt1 (children: [{target: #1}, {target: #2}])
 *   #1 → opt2 → end
 *   #2 → opt3 → end
 */
export function childrenGraph(): Graph {
  const graph: Graph = new Map();

  graph.set(k(0), {
    key: k(0),
    options: [
      edge({
        optionId: 1,
        position: 0,
        text: 'Explore ruins',
        targetType: 'end',
        children: [
          { type: 'choice', text: 'Left path', targetType: 'node' as const, targetKey: k(1) },
          { type: 'choice', text: 'Right path', targetType: 'node' as const, targetKey: k(2) },
        ],
      }),
    ],
  });

  graph.set(k(1), {
    key: k(1),
    options: [
      edge({ optionId: 2, position: 0, text: 'Dead end', targetType: 'end' }),
    ],
  });

  graph.set(k(2), {
    key: k(2),
    options: [
      edge({ optionId: 3, position: 0, text: 'Treasure', targetType: 'end' }),
    ],
  });

  return graph;
}

/**
 * Shop location graph (models Loc 105 "Вагенбург"):
 *
 *   #0 → opt1 (conditionalTargets: [v10, v11])
 *   #10 → opt2 → #11
 *   #11 → opt3 → #7 (enter shop)
 *      → opt4 → end (leave)
 *   #7 → opt5 (buy food, → #7, once=false)
 *      → opt6 (buy equip, → #7, once=true)
 *      → opt7 → end (leave shop)
 */
export function shopLocationGraph(): Graph {
  const graph: Graph = new Map();

  graph.set(k(0), {
    key: k(0),
    options: [
      edge({
        optionId: 1,
        position: 0,
        text: 'Approach camp',
        conditionalTargets: [
          { condition: 'If no light', targetType: 'node' as const, targetKey: k(10) },
          { condition: 'Otherwise', targetType: 'node' as const, targetKey: k(11) },
        ],
      }),
    ],
  });

  graph.set(k(10), {
    key: k(10),
    options: [
      edge({ optionId: 2, position: 0, text: 'Continue', targetType: 'node', targetKey: k(11) }),
    ],
  });

  graph.set(k(11), {
    key: k(11),
    options: [
      edge({ optionId: 3, position: 0, text: 'Enter shop', targetType: 'node', targetKey: k(7) }),
      edge({ optionId: 4, position: 1, text: 'Leave', targetType: 'end' }),
    ],
  });

  graph.set(k(7), {
    key: k(7),
    options: [
      edge({ optionId: 5, position: 0, text: 'Buy food', targetType: 'node', targetKey: k(7), once: false }),
      edge({ optionId: 6, position: 1, text: 'Buy equipment', targetType: 'node', targetKey: k(7), once: true }),
      edge({ optionId: 7, position: 2, text: 'Leave shop', targetType: 'end' }),
    ],
  });

  return graph;
}

/**
 * KS (Book of Secrets) graph — no verse 0, starts from verse 42:
 *
 *   #42 → opt101 → #43 → opt102 → end
 *                      → opt103 → #44 → opt104 → end
 *
 * Models an independent KS stanza with a short chain.
 */
export function ksGraph(): Graph {
  const graph: Graph = new Map();

  graph.set(`${TEST_LOC}:42`, {
    key: `${TEST_LOC}:42`,
    options: [
      edge({ optionId: 101, position: 0, text: 'Enter passage', targetType: 'node', targetKey: `${TEST_LOC}:43` }),
    ],
  });

  graph.set(`${TEST_LOC}:43`, {
    key: `${TEST_LOC}:43`,
    options: [
      edge({ optionId: 102, position: 0, text: 'Quick exit', targetType: 'end' }),
      edge({ optionId: 103, position: 1, text: 'Go deeper', targetType: 'node', targetKey: `${TEST_LOC}:44` }),
    ],
  });

  graph.set(`${TEST_LOC}:44`, {
    key: `${TEST_LOC}:44`,
    options: [
      edge({ optionId: 104, position: 0, text: 'Final end', targetType: 'end' }),
    ],
  });

  return graph;
}

/**
 * Diamond graph (two paths converge):
 *
 *   #0 → opt1 → #1 → opt3 → #3 → opt5 → end
 *     → opt2 → #2 → opt4 → #3 (converge)
 */
export function diamondGraph(): Graph {
  const graph: Graph = new Map();

  graph.set(k(0), {
    key: k(0),
    options: [
      edge({ optionId: 1, position: 0, text: 'Path A', targetType: 'node', targetKey: k(1) }),
      edge({ optionId: 2, position: 1, text: 'Path B', targetType: 'node', targetKey: k(2) }),
    ],
  });

  graph.set(k(1), {
    key: k(1),
    options: [
      edge({ optionId: 3, position: 0, text: 'A to merge', targetType: 'node', targetKey: k(3) }),
    ],
  });

  graph.set(k(2), {
    key: k(2),
    options: [
      edge({ optionId: 4, position: 0, text: 'B to merge', targetType: 'node', targetKey: k(3) }),
    ],
  });

  graph.set(k(3), {
    key: k(3),
    options: [
      edge({ optionId: 5, position: 0, text: 'Final end', targetType: 'end' }),
    ],
  });

  return graph;
}

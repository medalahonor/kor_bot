import type {
  Graph,
  GraphEdge,
  NodeKey,
  Successor,
  ChildOption,
} from '../types/index.js';

export function getSuccessors(edge: GraphEdge): Successor[] {
  const results: Successor[] = [];

  if (edge.targetType === 'node' && edge.targetKey) {
    results.push({ type: 'node', key: edge.targetKey });
  } else if (edge.targetType === 'end') {
    results.push({ type: 'end' });
  }

  if (edge.conditionalTargets) {
    for (const ct of edge.conditionalTargets) {
      if (ct.targetType === 'end') {
        results.push({ type: 'end' });
      } else if (ct.targetType === 'node' && ct.targetKey) {
        results.push({ type: 'node', key: ct.targetKey });
      }
    }
  }

  if (edge.children) {
    results.push(...extractTargetsFromChildren(edge.children));
  }

  return results;
}

export function extractTargetsFromChildren(children: ChildOption[]): Successor[] {
  const results: Successor[] = [];

  for (const child of children) {
    if (child.targetType === 'end') {
      results.push({ type: 'end' });
    } else if (child.targetType === 'node' && child.targetKey) {
      results.push({ type: 'node', key: child.targetKey });
    }

    if (child.children) {
      results.push(...extractTargetsFromChildren(child.children));
    }
  }

  return results;
}

/**
 * Возвращает все optionId, достижимые из startOptionId по графу переходов
 * (forward DFS через getSuccessors). Сам startOptionId в результат не входит,
 * даже если граф приводит к нему по циклу. Узлы, отсутствующие в графе
 * (например, cross-location за границей текущей локации), пропускаются.
 */
export function findDescendantOptionIds(
  graph: Graph,
  startOptionId: number,
): Set<number> {
  const result = new Set<number>();

  let startEdge: GraphEdge | undefined;
  for (const node of graph.values()) {
    const found = node.options.find((e) => e.optionId === startOptionId);
    if (found) {
      startEdge = found;
      break;
    }
  }
  if (!startEdge) return result;

  const visitedNodes = new Set<NodeKey>();

  function dfs(key: NodeKey) {
    if (visitedNodes.has(key)) return;
    visitedNodes.add(key);

    const node = graph.get(key);
    if (!node) return;

    for (const edge of node.options) {
      result.add(edge.optionId);
      for (const succ of getSuccessors(edge)) {
        if (succ.type === 'node' && succ.key !== undefined) {
          dfs(succ.key);
        }
      }
    }
  }

  for (const succ of getSuccessors(startEdge)) {
    if (succ.type === 'node' && succ.key !== undefined) {
      dfs(succ.key);
    }
  }

  // Цикл мог привести нас обратно к стартовой опции — она не считается своим потомком.
  result.delete(startOptionId);
  return result;
}

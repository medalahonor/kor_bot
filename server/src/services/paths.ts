import type { NodeKey, Graph } from '../types/index.js';
import type { PathCount } from '@tg/shared';
import { getSuccessors } from './graph-utils.js';

export function countPaths(
  graph: Graph,
  completedOptionIds: Set<number>,
  startKey: NodeKey,
): PathCount {
  let totalPaths = 0;
  let completedPaths = 0;
  let totalCyclic = 0;
  let completedCyclic = 0;

  function isPathCompleted(path: number[]): boolean {
    return path.every((id) => completedOptionIds.has(id));
  }

  function dfs(
    key: NodeKey,
    currentPath: number[],
    nodeStack: Set<NodeKey>,
  ) {
    const node = graph.get(key);
    if (!node) return;

    for (const edge of node.options) {
      const pathWithEdge = [...currentPath, edge.optionId];
      const successors = getSuccessors(edge);

      for (const successor of successors) {
        if (successor.type === 'end') {
          totalPaths++;
          if (isPathCompleted(pathWithEdge)) {
            completedPaths++;
          }
        } else if (successor.type === 'node' && successor.key !== undefined) {
          if (nodeStack.has(successor.key)) {
            totalCyclic++;
            if (isPathCompleted(pathWithEdge)) {
              completedCyclic++;
            }
          } else {
            nodeStack.add(successor.key);
            dfs(successor.key, pathWithEdge, nodeStack);
            nodeStack.delete(successor.key);
          }
        }
      }
    }
  }

  dfs(startKey, [], new Set([startKey]));

  return { totalPaths, completedPaths, totalCyclic, completedCyclic };
}

import type { NodeKey, Graph } from '../types/index.js';
import type { PathStep, RemainingOption } from '@tg/shared';
import { getSuccessors } from './graph-utils.js';

export function findRemaining(
  graph: Graph,
  completedOptionIds: Set<number>,
  startKey: NodeKey,
): RemainingOption[] {
  const result: RemainingOption[] = [];

  function dfs(key: NodeKey, verseDn: number, path: PathStep[], nodeStack: Set<NodeKey>) {
    const node = graph.get(key);
    if (!node) return;

    for (const edge of node.options) {
      const step: PathStep = {
        verseDn,
        optionId: edge.optionId,
        text: edge.text,
        position: edge.position,
        type: edge.type,
      };
      const currentPath = [...path, step];

      const successors = getSuccessors(edge);
      const isSelfLoop =
        !edge.once &&
        successors.some(
          (s) => s.type === 'node' && s.key === key,
        );

      if (!completedOptionIds.has(edge.optionId) || isSelfLoop) {
        result.push({
          option: {
            id: edge.optionId,
            text: edge.text,
            type: edge.type,
            requirement: edge.requirement,
            position: edge.position,
          },
          verseDn,
          pathFromEntry: currentPath,
        });
      }

      for (const successor of successors) {
        if (
          successor.type === 'node' &&
          successor.key !== undefined &&
          !nodeStack.has(successor.key)
        ) {
          const targetVerseDn = parseVerseDn(successor.key);
          nodeStack.add(successor.key);
          dfs(successor.key, targetVerseDn, currentPath, nodeStack);
          nodeStack.delete(successor.key);
        }
      }
    }
  }

  const startVerseDn = parseVerseDn(startKey);
  dfs(startKey, startVerseDn, [], new Set([startKey]));

  result.sort((a, b) => a.pathFromEntry.length - b.pathFromEntry.length);

  return result;
}

function parseVerseDn(key: NodeKey): number {
  return parseInt(key.split(':')[1], 10);
}

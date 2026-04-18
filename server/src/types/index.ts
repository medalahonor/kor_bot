// Internal types for graph algorithms. API contracts live in @tg/shared.

export type NodeKey = string; // "locDn:verseDn", e.g. "104:0"

export interface GraphEdge {
  optionId: number;
  position: number;
  type: 'choice' | 'condition';
  text: string;
  targetType: 'node' | 'end' | null;
  targetKey: NodeKey | null;
  requirement: string | null;
  result: string | null;
  hidden: string | null;
  once: boolean;
  conditionGroup: string | null;
  conditionalTargets: ConditionalTarget[] | null;
  children: ChildOption[] | null;
}

export interface GraphNode {
  key: NodeKey;
  options: GraphEdge[];
}

export type Graph = Map<NodeKey, GraphNode>;

export interface ConditionalTarget {
  condition: string;
  targetType: 'node' | 'end';
  targetKey?: NodeKey;
  result?: string;
}

export interface ChildOption {
  type: string;
  text: string;
  targetType: 'node' | 'end' | null;
  targetKey?: NodeKey;
  requirement?: string;
  result?: string;
  children?: ChildOption[];
}

export interface Successor {
  type: 'node' | 'end';
  key?: NodeKey;
}

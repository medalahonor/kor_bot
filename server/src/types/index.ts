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

export interface PathStep {
  verseDn: number;
  optionId: number;
  text: string;
  position: number;
  type: string;
}

export interface RemainingOption {
  option: {
    id: number;
    text: string;
    type: string;
    requirement: string | null;
    position: number;
  };
  verseDn: number;
  pathFromEntry: PathStep[];
}

export interface PathCount {
  totalPaths: number;
  completedPaths: number;
  totalCyclic: number;
  completedCyclic: number;
}

export type OptionStatus = 'available' | 'visited' | 'requirements_not_met' | 'closed';

export interface ProgressEvent {
  type: 'status_changed';
  optionId: number;
  status: OptionStatus;
  locationDn: number;
  verseDn: number;
  by: string; // telegram_id as string (BigInt serialization)
  timestamp: string;
}

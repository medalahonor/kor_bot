export interface Campaign {
  id: number;
  source_id: number;
  name: string;
}

export interface Location {
  id: number;
  displayNumber: number;
  name: string;
  verseCount: number;
}

export interface Option {
  id: number;
  position: number;
  type: 'choice' | 'condition';
  text: string;
  targetType: 'verse' | 'cross_location' | 'end' | null;
  targetVerseDn: number | null;
  targetLocationDn: number | null;
  requirement: string | null;
  result: string | null;
  hidden: string | null;
  once: boolean;
  conditionGroup: string | null;
  conditionalTargets: ConditionalTarget[] | null;
  children: ChildOption[] | null;
}

export interface Verse {
  id: number;
  displayNumber: number;
  options: Option[];
}

export interface LocationDetail {
  id: number;
  displayNumber: number;
  name: string;
  verses: Verse[];
}

export interface ConditionalTarget {
  condition: string;
  verse?: number;
  location?: number;
  result?: string;
  target?: string;
}

export interface ChildOption {
  type: string;
  text: string;
  target: { verse: number; location?: number } | 'end' | null;
  requirement?: string;
  result?: string;
  children?: ChildOption[];
}

export type OptionStatus = 'available' | 'visited' | 'requirements_not_met' | 'closed';

export interface LocationProgress {
  locationDn: number;
  optionStatuses: Record<number, OptionStatus>;
}

export interface BatchLocationProgress {
  displayNumber: number;
  totalPaths: number;
  completedPaths: number;
  totalCyclic: number;
  completedCyclic: number;
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

export interface RemainingResponse {
  locationDn: number;
  totalPaths: number;
  completedPaths: number;
  totalCyclic: number;
  completedCyclic: number;
  remaining: RemainingOption[];
}

export interface ProgressEvent {
  type: 'status_changed';
  optionId: number;
  status: OptionStatus;
  locationDn: number;
  verseDn: number;
  by: string;
  timestamp: string;
}

export interface KsVerseEntry {
  verseDn: number;
  locationDn: number;
  totalPaths: number;
  completedPaths: number;
  totalCyclic: number;
  completedCyclic: number;
}

export interface KsVersesResponse {
  verses: KsVerseEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface EkVerseEntry {
  verseDn: number;
  totalPaths: number;
  completedPaths: number;
  totalCyclic: number;
  completedCyclic: number;
}

export interface EkLocationEntry {
  locationDn: number;
  name: string;
  totalPaths: number;
  completedPaths: number;
  totalCyclic: number;
  completedCyclic: number;
  verses: EkVerseEntry[];
}

export interface EkResponse {
  locations: EkLocationEntry[];
}

export const KS_LOCATION_DNS = new Set([999, 1001]);

export type ContextType = 'locations' | 'ks' | 'ek';

export function getContextType(displayNumber: number): ContextType {
  if (displayNumber >= 999 && displayNumber <= 1103) return 'ks';
  if (displayNumber >= 1200) return 'ek';
  return 'locations';
}

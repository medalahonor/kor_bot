import { z } from 'zod';

export const ContextTypeSchema = z.enum(['locations', 'ks', 'ek']);
export type ContextType = z.infer<typeof ContextTypeSchema>;

export const KS_LOCATION_DNS: ReadonlySet<number> = new Set([999, 1001]);

export function getContextType(displayNumber: number): ContextType {
  if (displayNumber >= 999 && displayNumber <= 1103) return 'ks';
  if (displayNumber >= 1200) return 'ek';
  return 'locations';
}

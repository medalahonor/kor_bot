import { z } from 'zod';

export const ContextTypeSchema = z.enum(['chapters', 'locations', 'ks', 'ek']);
export type ContextType = z.infer<typeof ContextTypeSchema>;

export const KS_LOCATION_DN_LIST: readonly number[] = [999, 1001];
export const EK_LOCATION_DN_LIST: readonly number[] = [1201, 1202, 1203, 1204];

export const KS_LOCATION_DNS: ReadonlySet<number> = new Set(KS_LOCATION_DN_LIST);
export const EK_LOCATION_DNS: ReadonlySet<number> = new Set(EK_LOCATION_DN_LIST);

// Сюжетные интро-локации KoR, скрытые из обоих UI-вкладок и недоступные для выбора
// в добавлении в главу (не должны попадать в пользовательский флоу).
export const HIDDEN_LOCATION_DN_LIST: readonly number[] = [1101, 1102, 1103];
export const HIDDEN_LOCATION_DNS: ReadonlySet<number> = new Set(HIDDEN_LOCATION_DN_LIST);

export function getContextType(displayNumber: number): ContextType {
  if (displayNumber >= 999 && displayNumber <= 1103) return 'ks';
  if (displayNumber >= 1200) return 'ek';
  return 'locations';
}

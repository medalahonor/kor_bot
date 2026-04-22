import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { NotePath } from '@tg/shared';

export interface PathEntry {
  optionId: number;
  verseDn: number;
  locationDn: number;
}

interface AppState {
  gameMode: boolean;
  adminMode: boolean;
  showOnlyNew: boolean;
  explorationPath: PathEntry[];
  toggleGameMode: () => void;
  toggleAdminMode: () => void;
  toggleShowOnlyNew: () => void;
  addToPath: (optionId: number, verseDn: number, locationDn: number) => void;
  truncatePath: (toIndex: number) => void;
  clearPath: () => void;
  replaceWithNotePath: (path: NotePath) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      gameMode: false,
      adminMode: false,
      showOnlyNew: true,
      explorationPath: [],
      toggleGameMode: () =>
        set((s) => ({
          gameMode: !s.gameMode,
        })),
      toggleAdminMode: () => set((s) => ({ adminMode: !s.adminMode })),
      toggleShowOnlyNew: () => set((s) => ({ showOnlyNew: !s.showOnlyNew })),
      addToPath: (optionId, verseDn, locationDn) =>
        set((s) => ({
          explorationPath: [...s.explorationPath, { optionId, verseDn, locationDn }],
        })),
      truncatePath: (toIndex) =>
        set((s) => ({
          explorationPath: s.explorationPath.slice(0, toIndex),
        })),
      clearPath: () => set({ explorationPath: [] }),
      replaceWithNotePath: (path) =>
        set({
          explorationPath: path.slice(0, -1).map((step, index) => {
            if (step.optionId === undefined) {
              throw new Error(
                `replaceWithNotePath: missing optionId at step ${index}`,
              );
            }
            return {
              optionId: step.optionId,
              verseDn: step.verseDn,
              locationDn: step.locationDn,
            };
          }),
        }),
    }),
    {
      name: 'tg-app-settings',
      partialize: (state) => ({ showOnlyNew: state.showOnlyNew }),
    },
  ),
);

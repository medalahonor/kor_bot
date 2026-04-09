import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
    }),
    {
      name: 'tg-app-settings',
      partialize: (state) => ({ showOnlyNew: state.showOnlyNew }),
    },
  ),
);

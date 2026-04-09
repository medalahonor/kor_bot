import { useAppStore } from './app';

// Reset store between tests
beforeEach(() => {
  useAppStore.setState({
    gameMode: false,
    adminMode: false,
    showOnlyNew: true,
    explorationPath: [],
  });
  localStorage.clear();
});

describe('showOnlyNew (Story 1+2)', () => {
  it('по умолчанию true', () => {
    expect(useAppStore.getState().showOnlyNew).toBe(true);
  });

  it('toggleShowOnlyNew переключает значение', () => {
    useAppStore.getState().toggleShowOnlyNew();
    expect(useAppStore.getState().showOnlyNew).toBe(false);

    useAppStore.getState().toggleShowOnlyNew();
    expect(useAppStore.getState().showOnlyNew).toBe(true);
  });
});

describe('explorationPath (Story 3)', () => {
  it('addToPath добавляет запись с locationDn', () => {
    useAppStore.getState().addToPath(108, 0, 104);
    expect(useAppStore.getState().explorationPath).toEqual([
      { optionId: 108, verseDn: 0, locationDn: 104 },
    ]);
  });

  it('множественные addToPath строят корректную последовательность', () => {
    useAppStore.getState().addToPath(108, 0, 104);
    useAppStore.getState().addToPath(120, 1, 104);
    useAppStore.getState().addToPath(130, 2, 104);

    expect(useAppStore.getState().explorationPath).toEqual([
      { optionId: 108, verseDn: 0, locationDn: 104 },
      { optionId: 120, verseDn: 1, locationDn: 104 },
      { optionId: 130, verseDn: 2, locationDn: 104 },
    ]);
  });

  it('addToPath с разными locationDn строит cross-location последовательность', () => {
    useAppStore.getState().addToPath(108, 0, 104);
    useAppStore.getState().addToPath(120, 2, 104);
    useAppStore.getState().addToPath(130, 231, 999);

    expect(useAppStore.getState().explorationPath).toEqual([
      { optionId: 108, verseDn: 0, locationDn: 104 },
      { optionId: 120, verseDn: 2, locationDn: 104 },
      { optionId: 130, verseDn: 231, locationDn: 999 },
    ]);
  });

  it('clearPath очищает массив', () => {
    useAppStore.getState().addToPath(108, 0, 104);
    useAppStore.getState().addToPath(120, 1, 104);
    useAppStore.getState().clearPath();

    expect(useAppStore.getState().explorationPath).toEqual([]);
  });

  it('truncatePath оставляет первые N записей', () => {
    useAppStore.getState().addToPath(108, 0, 104);
    useAppStore.getState().addToPath(120, 2, 104);
    useAppStore.getState().addToPath(130, 231, 999);
    useAppStore.getState().addToPath(140, 5, 999);

    useAppStore.getState().truncatePath(2);
    expect(useAppStore.getState().explorationPath).toEqual([
      { optionId: 108, verseDn: 0, locationDn: 104 },
      { optionId: 120, verseDn: 2, locationDn: 104 },
    ]);
  });

  it('truncatePath(0) очищает путь', () => {
    useAppStore.getState().addToPath(108, 0, 104);
    useAppStore.getState().addToPath(120, 2, 104);

    useAppStore.getState().truncatePath(0);
    expect(useAppStore.getState().explorationPath).toEqual([]);
  });

  it('toggleGameMode (off) НЕ очищает explorationPath', () => {
    // Turn game mode on
    useAppStore.getState().toggleGameMode();
    expect(useAppStore.getState().gameMode).toBe(true);

    // Add some path entries
    useAppStore.getState().addToPath(108, 0, 104);
    useAppStore.getState().addToPath(120, 1, 104);

    // Turn game mode off — path should NOT be cleared
    useAppStore.getState().toggleGameMode();
    expect(useAppStore.getState().gameMode).toBe(false);
    expect(useAppStore.getState().explorationPath).toEqual([
      { optionId: 108, verseDn: 0, locationDn: 104 },
      { optionId: 120, verseDn: 1, locationDn: 104 },
    ]);
  });

  it('toggleGameMode (on) не очищает путь', () => {
    useAppStore.getState().addToPath(108, 0, 104);
    useAppStore.getState().toggleGameMode(); // on
    expect(useAppStore.getState().explorationPath).toEqual([
      { optionId: 108, verseDn: 0, locationDn: 104 },
    ]);
  });
});

describe('persist', () => {
  it('showOnlyNew сохраняется в localStorage', () => {
    useAppStore.getState().toggleShowOnlyNew();
    expect(useAppStore.getState().showOnlyNew).toBe(false);

    const stored = JSON.parse(localStorage.getItem('tg-app-settings') ?? '{}');
    expect(stored.state?.showOnlyNew).toBe(false);
  });

  it('explorationPath НЕ сохраняется в localStorage', () => {
    useAppStore.getState().addToPath(108, 0, 104);

    const stored = JSON.parse(localStorage.getItem('tg-app-settings') ?? '{}');
    expect(stored.state?.explorationPath).toBeUndefined();
  });

  it('gameMode НЕ сохраняется в localStorage', () => {
    useAppStore.getState().toggleGameMode();

    const stored = JSON.parse(localStorage.getItem('tg-app-settings') ?? '{}');
    expect(stored.state?.gameMode).toBeUndefined();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Note } from '@tg/shared';
import NotesPanel from './NotesPanel';

vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
}));

const useVerseNotes = vi.fn();
const createMutateAsync = vi.fn().mockResolvedValue(undefined);
const updateMutateAsync = vi.fn().mockResolvedValue(undefined);
const deleteMutateAsync = vi.fn().mockResolvedValue(undefined);

vi.mock('../../api/queries', () => ({
  useVerseNotes: (id: number | null | undefined) => useVerseNotes(id),
  useCreateNote: () => ({ mutateAsync: createMutateAsync, isPending: false }),
  useUpdateNote: () => ({ mutateAsync: updateMutateAsync, isPending: false }),
  useDeleteNote: () => ({ mutateAsync: deleteMutateAsync, isPending: false }),
}));

const attachedNote: Note = {
  id: 1,
  campaignId: 1,
  type: 'quest',
  body: 'Найти шлем',
  verseId: 50,
  path: [
    { locationDn: 105, verseDn: 0 },
    { locationDn: 105, verseDn: 1 },
  ],
  locationName: 'Вагенбург',
  createdAt: '2026-04-20T10:00:00Z',
};

const DEFAULT_PATH = [
  { locationDn: 105, verseDn: 0 },
  { locationDn: 105, verseDn: 1 },
];

describe('NotesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createMutateAsync.mockResolvedValue(undefined);
  });

  it('shows empty-state label when no notes', () => {
    useVerseNotes.mockReturnValue({ data: [], isLoading: false });
    render(
      <NotesPanel
        verseId={50}
        defaultPath={DEFAULT_PATH}
        locationName="Вагенбург"
      />,
    );
    expect(screen.getByText('Добавить заметку')).toBeInTheDocument();
  });

  it('opens form when clicking empty header', async () => {
    useVerseNotes.mockReturnValue({ data: [], isLoading: false });
    const user = userEvent.setup();
    render(
      <NotesPanel
        verseId={50}
        defaultPath={DEFAULT_PATH}
        locationName="Вагенбург"
      />,
    );
    await user.click(screen.getByText('Добавить заметку'));
    expect(screen.getByText('Новая заметка')).toBeInTheDocument();
    expect(screen.getByText(/Путь: 105 → #0 → #1/)).toBeInTheDocument();
  });

  it('shows collapsed count when notes exist', () => {
    useVerseNotes.mockReturnValue({ data: [attachedNote], isLoading: false });
    render(
      <NotesPanel
        verseId={50}
        defaultPath={DEFAULT_PATH}
        locationName="Вагенбург"
      />,
    );
    expect(screen.getByText('Заметки (1)')).toBeInTheDocument();
    expect(screen.queryByText('Найти шлем')).not.toBeInTheDocument();
  });

  it('expands and shows notes + "+ заметка" when header clicked', async () => {
    useVerseNotes.mockReturnValue({ data: [attachedNote], isLoading: false });
    const user = userEvent.setup();
    render(
      <NotesPanel
        verseId={50}
        defaultPath={DEFAULT_PATH}
        locationName="Вагенбург"
      />,
    );
    await user.click(screen.getByText('Заметки (1)'));
    expect(screen.getByText('Найти шлем')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /заметка/ })).toBeInTheDocument();
  });

  it('calls createNote with path when submitting new note from panel', async () => {
    useVerseNotes.mockReturnValue({ data: [], isLoading: false });
    const user = userEvent.setup();
    render(
      <NotesPanel
        verseId={50}
        defaultPath={DEFAULT_PATH}
        locationName="Вагенбург"
      />,
    );
    await user.click(screen.getByText('Добавить заметку'));
    const textarea = screen.getByPlaceholderText('Текст заметки...');
    await user.click(textarea);
    await user.paste('новая');
    await user.click(screen.getByRole('button', { name: 'Создать' }));
    expect(createMutateAsync).toHaveBeenCalledWith({
      type: 'general',
      body: 'новая',
      path: DEFAULT_PATH,
    });
  });
});

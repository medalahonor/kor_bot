import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Note } from '@tg/shared';
import NotesPage from './NotesPage';

const mockNavigate = vi.fn();
vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

const useCampaignNotes = vi.fn();
const createMutateAsync = vi.fn().mockResolvedValue(undefined);
const updateMutateAsync = vi.fn().mockResolvedValue(undefined);
const deleteMutateAsync = vi.fn().mockResolvedValue(undefined);

vi.mock('../api/queries', () => ({
  useCampaignNotes: () => useCampaignNotes(),
  useCreateNote: () => ({ mutateAsync: createMutateAsync, isPending: false }),
  useUpdateNote: () => ({ mutateAsync: updateMutateAsync, isPending: false }),
  useDeleteNote: () => ({ mutateAsync: deleteMutateAsync, isPending: false }),
}));

const quest: Note = {
  id: 1, campaignId: 1, type: 'quest', body: 'найти X',
  verseId: null, path: null, locationName: null,
  createdAt: '2026-04-20T12:00:00Z',
};
const hint: Note = { ...quest, id: 2, type: 'hint', body: 'подсказка' };
const general: Note = { ...quest, id: 3, type: 'general', body: 'общее' };

describe('NotesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createMutateAsync.mockResolvedValue(undefined);
  });

  it('shows 3 subtabs and empty state for active (Quest)', () => {
    useCampaignNotes.mockReturnValue({ data: [], isLoading: false });
    render(<NotesPage />);
    expect(screen.getByRole('button', { name: 'Задания' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Подсказки' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Общие' })).toBeInTheDocument();
    expect(screen.getByText('Нет заданий')).toBeInTheDocument();
  });

  it('filters notes by active subtab', async () => {
    useCampaignNotes.mockReturnValue({ data: [quest, hint, general], isLoading: false });
    const user = userEvent.setup();
    render(<NotesPage />);
    expect(screen.getByText('найти X')).toBeInTheDocument();
    expect(screen.queryByText('подсказка')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Подсказки' }));
    expect(screen.getByText('подсказка')).toBeInTheDocument();
    expect(screen.queryByText('найти X')).not.toBeInTheDocument();
  });

  it('opens create form on "+" click and creates without verseId', async () => {
    useCampaignNotes.mockReturnValue({ data: [], isLoading: false });
    const user = userEvent.setup();
    render(<NotesPage />);
    await user.click(screen.getByRole('button', { name: 'Новая заметка' }));
    expect(screen.getByText('Новая заметка')).toBeInTheDocument();
    expect(screen.getByText('Без привязки к строфе')).toBeInTheDocument();
    const textarea = screen.getByPlaceholderText('Текст заметки...');
    await user.click(textarea);
    await user.paste('тест');
    await user.click(screen.getByRole('button', { name: 'Создать' }));
    expect(createMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'quest', body: 'тест' }),
    );
    const args = createMutateAsync.mock.calls[0][0];
    expect(args.path ?? null).toBeNull();
  });

  it('back button navigates to home', async () => {
    useCampaignNotes.mockReturnValue({ data: [], isLoading: false });
    const user = userEvent.setup();
    render(<NotesPage />);
    await user.click(screen.getByRole('button', { name: /Назад/ }));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});

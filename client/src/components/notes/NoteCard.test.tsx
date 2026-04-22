import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Note } from '@tg/shared';
import NoteCard from './NoteCard';
import { useAppStore } from '../../stores/app';

const mockNavigate = vi.fn();
vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

const attachedNote: Note = {
  id: 10,
  campaignId: 1,
  type: 'quest',
  body: 'Найти шлем',
  verseId: 50,
  path: [
    { locationDn: 105, verseDn: 0, optionId: 108 },
    { locationDn: 105, verseDn: 1 },
  ],
  locationName: 'Вагенбург',
  createdAt: '2026-04-20T10:00:00Z',
};

const unattachedNote: Note = {
  ...attachedNote,
  id: 11,
  type: 'general',
  verseId: null,
  path: null,
  locationName: null,
};

describe('NoteCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.getState().clearPath();
  });

  it('renders body and type label', () => {
    render(<NoteCard note={attachedNote} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Найти шлем')).toBeInTheDocument();
    expect(screen.getByText('Задание')).toBeInTheDocument();
  });

  it('renders address and navigates with returnTo on click', async () => {
    const user = userEvent.setup();
    render(
      <NoteCard
        note={attachedNote}
        returnTo="/notes"
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    const addressBtn = screen.getByRole('button', { name: /105 → #0 → #1.*Вагенбург/ });
    await user.click(addressBtn);
    expect(mockNavigate).toHaveBeenCalledWith(
      '/location/105/verse/1',
      { state: { returnTo: '/notes' } },
    );
  });

  it('replaces explorationPath with restored note path on click', async () => {
    const user = userEvent.setup();
    useAppStore.setState({
      explorationPath: [
        { optionId: 999, verseDn: 7, locationDn: 200 },
      ],
    });
    render(
      <NoteCard
        note={attachedNote}
        returnTo="/notes"
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    const addressBtn = screen.getByRole('button', { name: /105 → #0 → #1.*Вагенбург/ });
    await user.click(addressBtn);
    expect(useAppStore.getState().explorationPath).toEqual([
      { optionId: 108, verseDn: 0, locationDn: 105 },
    ]);
  });

  it('does not modify explorationPath for unattached note click', async () => {
    useAppStore.setState({
      explorationPath: [{ optionId: 50, verseDn: 1, locationDn: 105 }],
    });
    render(<NoteCard note={unattachedNote} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(useAppStore.getState().explorationPath).toEqual([
      { optionId: 50, verseDn: 1, locationDn: 105 },
    ]);
  });

  it('hides address block for unattached note', () => {
    render(<NoteCard note={unattachedNote} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByText(/→ #/)).not.toBeInTheDocument();
  });

  it('calls onEdit and onDelete', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<NoteCard note={attachedNote} onEdit={onEdit} onDelete={onDelete} />);
    await user.click(screen.getByRole('button', { name: 'Редактировать заметку' }));
    expect(onEdit).toHaveBeenCalledWith(attachedNote);
    await user.click(screen.getByRole('button', { name: 'Удалить заметку' }));
    expect(onDelete).toHaveBeenCalledWith(attachedNote);
  });
});

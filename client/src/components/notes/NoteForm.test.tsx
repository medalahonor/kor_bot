import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import NoteForm from './NoteForm';

describe('NoteForm', () => {
  it('disables submit when body is empty', () => {
    render(
      <NoteForm
        open
        mode="create"
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Создать' })).toBeDisabled();
  });

  it('disables submit when body exceeds 2000 chars', async () => {
    const user = userEvent.setup();
    render(
      <NoteForm
        open
        mode="create"
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const textarea = screen.getByPlaceholderText('Текст заметки...');
    await user.click(textarea);
    await user.paste('a'.repeat(2001));
    expect(screen.getByRole('button', { name: 'Создать' })).toBeDisabled();
  });

  it('submits trimmed body + selected type', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <NoteForm
        open
        mode="create"
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Подсказка' }));
    const textarea = screen.getByPlaceholderText('Текст заметки...');
    await user.click(textarea);
    await user.paste('  полезная инфа  ');
    await user.click(screen.getByRole('button', { name: 'Создать' }));
    expect(onSubmit).toHaveBeenCalledWith({ type: 'hint', body: 'полезная инфа' });
  });

  it('shows attachment path when attachmentPath provided', () => {
    render(
      <NoteForm
        open
        mode="create"
        attachmentPath={[
          { locationDn: 105, verseDn: 0 },
          { locationDn: 105, verseDn: 7 },
        ]}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/Путь: 105 → #0 → #7/)).toBeInTheDocument();
  });

  it('fills initial values in edit mode', () => {
    render(
      <NoteForm
        open
        mode="edit"
        initial={{ type: 'hint', body: 'существующий текст' }}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByDisplayValue('существующий текст')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeInTheDocument();
  });
});

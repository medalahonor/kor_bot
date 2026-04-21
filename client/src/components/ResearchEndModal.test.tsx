import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResearchEndModal from './ResearchEndModal';

describe('ResearchEndModal', () => {
  it('pending-state: видно текст и глиф, кнопок нет', () => {
    render(
      <ResearchEndModal state="pending" onRetry={() => {}} onClose={() => {}} />,
    );

    expect(screen.getByText('Завершение исследования...')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Повторить' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Закрыть' })).toBeNull();
  });

  it('error-state: виден message + обе кнопки', () => {
    render(
      <ResearchEndModal
        state={{ kind: 'error', message: 'Нет сети' }}
        onRetry={() => {}}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText('Нет сети')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Закрыть' })).toBeDefined();
  });

  it('error-state: клик «Повторить» вызывает onRetry, «Закрыть» — onClose', async () => {
    const onRetry = vi.fn();
    const onClose = vi.fn();
    render(
      <ResearchEndModal
        state={{ kind: 'error', message: 'Ошибка сервера' }}
        onRetry={onRetry}
        onClose={onClose}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Закрыть' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('рендерится через Dialog с role=dialog', () => {
    render(
      <ResearchEndModal state="pending" onRetry={() => {}} onClose={() => {}} />,
    );

    expect(screen.getByRole('dialog')).toBeDefined();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StatusPicker from './StatusPicker';
import type { OptionStatus } from '../lib/types';

describe('StatusPicker', () => {
  it('рендерит триггер-кнопку', () => {
    render(<StatusPicker status="available" onStatusChange={vi.fn()} />);
    expect(screen.getByTitle('Изменить статус')).toBeInTheDocument();
  });

  it('открывает popover с 4 статусами по клику', async () => {
    const user = userEvent.setup();
    render(<StatusPicker status="available" onStatusChange={vi.fn()} />);

    await user.click(screen.getByTitle('Изменить статус'));

    expect(screen.getByText('Доступно')).toBeInTheDocument();
    expect(screen.getByText('Пройдено')).toBeInTheDocument();
    expect(screen.getByText('Требования')).toBeInTheDocument();
    expect(screen.getByText('Закрыто')).toBeInTheDocument();
  });

  it('подсказка "навсегда" отображается рядом с "Закрыто"', async () => {
    const user = userEvent.setup();
    render(<StatusPicker status="available" onStatusChange={vi.fn()} />);

    await user.click(screen.getByTitle('Изменить статус'));

    expect(screen.getByText('навсегда')).toBeInTheDocument();
  });

  it('подсказка "не выполнены" отображается рядом с "Требования"', async () => {
    const user = userEvent.setup();
    render(<StatusPicker status="available" onStatusChange={vi.fn()} />);

    await user.click(screen.getByTitle('Изменить статус'));

    expect(screen.getByText('не выполнены')).toBeInTheDocument();
  });

  it.each<OptionStatus>(['available', 'visited', 'requirements_not_met', 'closed'])(
    'вызывает onStatusChange со статусом "%s" при выборе',
    async (targetStatus) => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<StatusPicker status="available" onStatusChange={onChange} />);

      await user.click(screen.getByTitle('Изменить статус'));

      const labels: Record<OptionStatus, string> = {
        available: 'Доступно',
        visited: 'Пройдено',
        requirements_not_met: 'Требования',
        closed: 'Закрыто',
      };
      await user.click(screen.getByText(labels[targetStatus]));

      expect(onChange).toHaveBeenCalledWith(targetStatus);
    },
  );
});

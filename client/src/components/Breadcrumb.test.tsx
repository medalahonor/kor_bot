import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Breadcrumb from './Breadcrumb';
import type { BreadcrumbItem } from './Breadcrumb';

describe('Breadcrumb', () => {
  it('одна локация + одна строфа — одна группа без разделителя', () => {
    const items: BreadcrumbItem[] = [
      { label: '104', type: 'location' },
      { label: '#0', type: 'verse', current: true },
    ];
    render(<Breadcrumb items={items} />);
    const bc = within(screen.getByTestId('breadcrumb'));

    expect(bc.getByText('104')).toBeDefined();
    expect(bc.getByText('#0')).toBeDefined();
    expect(bc.queryAllByTestId('breadcrumb-separator')).toHaveLength(0);
    expect(bc.getAllByTestId('breadcrumb-group')).toHaveLength(1);
  });

  it('одна локация + несколько строф — все в одной группе', () => {
    const items: BreadcrumbItem[] = [
      { label: '104', type: 'location' },
      { label: '#0', type: 'verse' },
      { label: '#2', type: 'verse' },
      { label: '#15', type: 'verse', current: true },
    ];
    render(<Breadcrumb items={items} />);
    const bc = within(screen.getByTestId('breadcrumb'));

    expect(bc.getAllByTestId('breadcrumb-group')).toHaveLength(1);
    expect(bc.getByText('#0')).toBeDefined();
    expect(bc.getByText('#2')).toBeDefined();
    expect(bc.getByText('#15')).toBeDefined();
  });

  it('несколько локаций — группы разделены разделителем', () => {
    const items: BreadcrumbItem[] = [
      { label: '104', type: 'location' },
      { label: '#0', type: 'verse' },
      { label: '#2', type: 'verse' },
      { label: 'КС', type: 'location' },
      { label: '#231', type: 'verse', current: true },
    ];
    render(<Breadcrumb items={items} />);
    const bc = within(screen.getByTestId('breadcrumb'));

    expect(bc.getAllByTestId('breadcrumb-group')).toHaveLength(2);
    expect(bc.getAllByTestId('breadcrumb-separator')).toHaveLength(1);
  });

  it('текущая строфа выделена атрибутом data-current', () => {
    const items: BreadcrumbItem[] = [
      { label: '104', type: 'location' },
      { label: '#0', type: 'verse', current: true },
    ];
    render(<Breadcrumb items={items} />);

    const currentEl = screen.getByText('#0').closest('[data-current]');
    expect(currentEl).toBeDefined();
    expect(currentEl?.getAttribute('data-current')).toBe('true');
  });

  it('клик по строфе вызывает onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const items: BreadcrumbItem[] = [
      { label: '104', type: 'location' },
      { label: '#0', type: 'verse', onClick },
    ];
    render(<Breadcrumb items={items} />);

    await user.click(screen.getByText('#0'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('клик по локации вызывает onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const items: BreadcrumbItem[] = [
      { label: '104', type: 'location', onClick },
      { label: '#0', type: 'verse', current: true },
    ];
    render(<Breadcrumb items={items} />);

    await user.click(screen.getByText('104'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('контейнер использует flex-wrap, не overflow-x-auto', () => {
    const items: BreadcrumbItem[] = [
      { label: '104', type: 'location' },
      { label: '#0', type: 'verse', current: true },
    ];
    render(<Breadcrumb items={items} />);
    const container = screen.getByTestId('breadcrumb');

    expect(container.className).toContain('flex-wrap');
    expect(container.className).not.toContain('overflow-x-auto');
    expect(container.className).not.toContain('whitespace-nowrap');
  });
});

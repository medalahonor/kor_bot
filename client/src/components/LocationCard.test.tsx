import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router';
import LocationCard from './LocationCard';
import type { Location } from '@tg/shared';

const mockLocation: Location = {
  id: 1,
  displayNumber: 101,
  name: 'Запустелые земли',
  verseCount: 5,
};

function renderCard(props: Partial<Parameters<typeof LocationCard>[0]> = {}) {
  return render(
    <MemoryRouter>
      <LocationCard
        location={mockLocation}
        visited={0}
        total={10}
        visitedCyclic={0}
        totalCyclic={0}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe('LocationCard', () => {
  it('renders location name and number', () => {
    renderCard();
    expect(screen.getByText('Запустелые земли')).toBeInTheDocument();
    expect(screen.getByText('101')).toBeInTheDocument();
  });

  it('shows remaining count when not done', () => {
    renderCard({ visited: 3, total: 10 });
    expect(screen.getByText('7 осталось')).toBeInTheDocument();
  });

  it('shows done badge when all paths completed', () => {
    renderCard({ visited: 10, total: 10 });
    expect(screen.getByText(/Пройдено/)).toBeInTheDocument();
  });

  it('shows done when main paths complete regardless of cyclic', () => {
    // All main done but cyclic not done — should still be "done"
    renderCard({ visited: 10, total: 10, visitedCyclic: 3, totalCyclic: 5 });
    expect(screen.getByText(/Пройдено/)).toBeInTheDocument();
  });

  it('is fully done when both main and cyclic are complete', () => {
    renderCard({ visited: 10, total: 10, visitedCyclic: 5, totalCyclic: 5 });
    expect(screen.getByText(/Пройдено/)).toBeInTheDocument();
  });

  it('renders progress bar with cyclic data', () => {
    renderCard({ visited: 5, total: 10, visitedCyclic: 3, totalCyclic: 5 });
    expect(screen.getByText(/3\/5↻/)).toBeInTheDocument();
  });

  it('renders formatted display number for 2XX locations', () => {
    const loc252: Location = { id: 2, displayNumber: 252, name: 'Тестовая', verseCount: 3 };
    renderCard({ location: loc252 });
    expect(screen.getByText('152-Б')).toBeInTheDocument();
  });

  it('renders formatted display number for 3XX locations', () => {
    const loc332: Location = { id: 3, displayNumber: 332, name: 'Тестовая В', verseCount: 2 };
    renderCard({ location: loc332 });
    expect(screen.getByText('132-В')).toBeInTheDocument();
  });

  it('номер с суффиксом (115-Б) помещается в колонку без переноса', () => {
    // Номера локаций до 5 символов (напр. "115-Б") не должны переноситься —
    // колонка должна вмещать их целиком, span должен иметь whitespace-nowrap
    const loc215: Location = { id: 4, displayNumber: 215, name: 'Проверка', verseCount: 1 };
    renderCard({ location: loc215 });
    const numberEl = screen.getByText('115-Б');
    expect(numberEl.className).toContain('whitespace-nowrap');
  });
});

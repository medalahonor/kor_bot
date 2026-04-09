import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router';
import KsVerseCard from './KsVerseCard';
import type { KsVerseEntry } from '../lib/types';

function renderCard(overrides: Partial<KsVerseEntry> = {}) {
  const verse: KsVerseEntry = {
    verseDn: 42,
    locationDn: 999,
    totalPaths: 5,
    completedPaths: 0,
    totalCyclic: 0,
    completedCyclic: 0,
    ...overrides,
  };
  return render(
    <MemoryRouter>
      <KsVerseCard verse={verse} />
    </MemoryRouter>,
  );
}

describe('KsVerseCard', () => {
  it('shows done badge when all main paths completed', () => {
    renderCard({
      totalPaths: 5,
      completedPaths: 5,
      totalCyclic: 3,
      completedCyclic: 0,
    });
    expect(screen.getByText(/Пройдено/)).toBeInTheDocument();
  });

  it('shows remaining badge when main paths incomplete', () => {
    renderCard({ totalPaths: 5, completedPaths: 2 });
    expect(screen.getByText('3 осталось')).toBeInTheDocument();
  });

  it('does not show done when totalPaths is 0', () => {
    renderCard({ totalPaths: 0, completedPaths: 0 });
    expect(screen.queryByText(/Пройдено/)).not.toBeInTheDocument();
    expect(screen.queryByText(/осталось/)).not.toBeInTheDocument();
  });
});

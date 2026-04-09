import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProgressBar from './ProgressBar';

describe('ProgressBar', () => {
  it('renders main progress without cyclic data', () => {
    render(<ProgressBar visited={5} total={10} />);
    expect(screen.getByText('5/10')).toBeInTheDocument();
  });

  it('does not show cyclic indicator when totalCyclic is 0', () => {
    render(<ProgressBar visited={5} total={10} />);
    expect(screen.queryByText(/↻/)).not.toBeInTheDocument();
  });

  it('renders combined counter with cyclic data', () => {
    render(
      <ProgressBar visited={11} total={33} visitedCyclic={15} totalCyclic={30} />,
    );
    expect(screen.getByText('11/33')).toBeInTheDocument();
    expect(screen.getByText(/15\/30↻/)).toBeInTheDocument();
  });

  it('does not render cyclic segment when visitedCyclic is 0', () => {
    const { container } = render(
      <ProgressBar visited={5} total={10} visitedCyclic={0} totalCyclic={10} />,
    );
    // Track should have only one child segment (main), not two
    const track = container.querySelector('.bg-separator');
    const segments = track?.querySelectorAll(':scope > div') ?? [];
    expect(segments.length).toBe(1);
  });

  it('renders cyclic segment when visitedCyclic > 0', () => {
    const { container } = render(
      <ProgressBar visited={5} total={10} visitedCyclic={3} totalCyclic={10} />,
    );
    const track = container.querySelector('.bg-separator');
    const segments = track?.querySelectorAll(':scope > div') ?? [];
    expect(segments.length).toBe(2);
  });

  it('shows cyclic text even when visitedCyclic is 0 but totalCyclic > 0', () => {
    render(
      <ProgressBar visited={5} total={10} visitedCyclic={0} totalCyclic={10} />,
    );
    expect(screen.getByText(/0\/10↻/)).toBeInTheDocument();
  });

  it('uses moss-green gradient when all main paths are done', () => {
    const { container } = render(
      <ProgressBar visited={10} total={10} />,
    );
    const track = container.querySelector('.bg-separator');
    const segment = track?.querySelector(':scope > div') as HTMLElement;
    expect(segment?.style.background).toContain('94, 138, 106');
  });

  it('uses rune gradient when main paths are not done', () => {
    const { container } = render(
      <ProgressBar visited={3} total={10} />,
    );
    const track = container.querySelector('.bg-separator');
    const segment = track?.querySelector(':scope > div') as HTMLElement;
    expect(segment?.style.background).toContain('94, 200, 216');
  });
});

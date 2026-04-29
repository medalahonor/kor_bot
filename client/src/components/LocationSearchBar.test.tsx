import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LocationSearchBar from './LocationSearchBar';

describe('LocationSearchBar', () => {
  it('задаёт inputMode="numeric" для мобильной цифровой клавиатуры', () => {
    render(<LocationSearchBar value="" onChange={vi.fn()} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('inputmode', 'numeric');
  });
});

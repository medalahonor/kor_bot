import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useTelegramBackButton } from './useTelegramBackButton';

const mockNavigate = vi.fn();
vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

const show = vi.fn();
const hide = vi.fn();
const onClick = vi.fn();
const offClick = vi.fn();
const getTelegramWebApp = vi.fn();

vi.mock('../lib/telegram', () => ({
  getTelegramWebApp: () => getTelegramWebApp(),
}));

describe('useTelegramBackButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTelegramWebApp.mockReturnValue({
      BackButton: { show, hide, onClick, offClick },
    });
  });

  it('does nothing when returnTo is undefined', () => {
    renderHook(() => useTelegramBackButton(undefined));
    expect(show).not.toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does nothing when Telegram WebApp is not available', () => {
    getTelegramWebApp.mockReturnValue(null);
    renderHook(() => useTelegramBackButton('/notes'));
    expect(show).not.toHaveBeenCalled();
  });

  it('calls show + onClick with navigate handler on mount', () => {
    renderHook(() => useTelegramBackButton('/notes'));
    expect(show).toHaveBeenCalledOnce();
    expect(onClick).toHaveBeenCalledOnce();
    const handler = onClick.mock.calls[0][0] as () => void;
    handler();
    expect(mockNavigate).toHaveBeenCalledWith('/notes');
  });

  it('calls offClick + hide on unmount', () => {
    const { unmount } = renderHook(() => useTelegramBackButton('/notes'));
    const handler = onClick.mock.calls[0][0] as () => void;
    unmount();
    expect(offClick).toHaveBeenCalledWith(handler);
    expect(hide).toHaveBeenCalledOnce();
  });
});

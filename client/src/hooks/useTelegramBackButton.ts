import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { getTelegramWebApp } from '../lib/telegram';

export function useTelegramBackButton(returnTo: string | undefined) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!returnTo) return;

    const tg = getTelegramWebApp();
    if (!tg) return;

    const handler = () => navigate(returnTo);
    tg.BackButton.show();
    tg.BackButton.onClick(handler);

    return () => {
      tg.BackButton.offClick(handler);
      tg.BackButton.hide();
    };
  }, [returnTo, navigate]);
}

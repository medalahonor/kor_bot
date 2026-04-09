import { setInitData } from '../api/client';

// Базовый цвет темы «Марь и менгиры» — bg туман.
// Синхронизирован с --color-bg в client/src/index.css.
const THEME_BG = '#141a1c';

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      username?: string;
      first_name?: string;
    };
  };
  ready: () => void;
  expand: () => void;
  isVersionAtLeast: (version: string) => boolean;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  HapticFeedback: {
    notificationOccurred: (type: 'success' | 'warning' | 'error') => void;
    impactOccurred: (style: 'light' | 'medium' | 'heavy') => void;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export function getTelegramWebApp(): TelegramWebApp | null {
  return window.Telegram?.WebApp ?? null;
}

export function initTelegram() {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.ready();
    tg.expand();
    // Синхронизируем native Telegram header и фон с нашей тёмной темой.
    // Без этого над web-контентом торчит header другого цвета, ломая иммерсию.
    // setHeaderColor / setBackgroundColor доступны с WebApp 6.1.
    if (tg.isVersionAtLeast?.('6.1')) {
      tg.setHeaderColor(THEME_BG);
      tg.setBackgroundColor(THEME_BG);
    }
    if (tg.initData) {
      setInitData(tg.initData);
    }
  }
}

export function hapticSuccess() {
  getTelegramWebApp()?.HapticFeedback.notificationOccurred('success');
}

export function hapticLight() {
  getTelegramWebApp()?.HapticFeedback.impactOccurred('light');
}

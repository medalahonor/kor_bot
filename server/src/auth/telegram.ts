import { createHmac } from 'crypto';

export interface TelegramUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
}

interface ValidationResult {
  valid: boolean;
  user?: TelegramUser;
}

export function validateInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds = 86400,
): ValidationResult {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return { valid: false };

  params.delete('hash');

  const entries = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

  const secretKey = createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();
  const computed = createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (computed !== hash) return { valid: false };

  const authDate = parseInt(params.get('auth_date') || '0', 10);
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > maxAgeSeconds) return { valid: false };

  const userStr = params.get('user');
  if (!userStr) return { valid: false };

  try {
    const user: TelegramUser = JSON.parse(userStr);
    return { valid: true, user };
  } catch {
    return { valid: false };
  }
}

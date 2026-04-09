import { createHmac } from 'crypto';

/**
 * Build a valid Telegram initData string for tests.
 * Uses the same BOT_TOKEN that config.ts reads from env.
 */
export function buildTestInitData(
  userId: number,
  username = 'testuser',
  botToken = process.env.BOT_TOKEN || 'test-bot-token',
): string {
  const user = JSON.stringify({ id: userId, username, first_name: 'Test' });
  const authDate = String(Math.floor(Date.now() / 1000));

  const params: Record<string, string> = { auth_date: authDate, user };
  const entries = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  const urlParams = new URLSearchParams(params);
  urlParams.set('hash', hash);
  return urlParams.toString();
}

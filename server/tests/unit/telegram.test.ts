import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHmac } from 'crypto';
import { validateInitData } from '../../src/auth/telegram.js';

const BOT_TOKEN = '7890123456:AAHfakeTokenForTesting_xyz123abc';

/**
 * Build a valid initData string with correct HMAC hash.
 */
function buildInitData(
  params: Record<string, string>,
  botToken: string = BOT_TOKEN,
): string {
  const entries = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

  const secretKey = createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();
  const hash = createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  const urlParams = new URLSearchParams(params);
  urlParams.set('hash', hash);
  return urlParams.toString();
}

function freshAuthDate(): string {
  return String(Math.floor(Date.now() / 1000));
}

const validUser = JSON.stringify({
  id: 123456789,
  username: 'testplayer',
  first_name: 'Test',
});

describe('validateInitData', () => {
  describe('valid data', () => {
    it('accepts correctly signed initData', () => {
      const initData = buildInitData({
        auth_date: freshAuthDate(),
        user: validUser,
        query_id: 'AAHtest',
      });

      const result = validateInitData(initData, BOT_TOKEN);

      expect(result.valid).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user!.id).toBe(123456789);
      expect(result.user!.username).toBe('testplayer');
    });

    it('works with minimal fields (auth_date + user)', () => {
      const initData = buildInitData({
        auth_date: freshAuthDate(),
        user: validUser,
      });

      const result = validateInitData(initData, BOT_TOKEN);
      expect(result.valid).toBe(true);
    });

    it('parses user without username', () => {
      const user = JSON.stringify({ id: 999, first_name: 'NoUsername' });
      const initData = buildInitData({
        auth_date: freshAuthDate(),
        user,
      });

      const result = validateInitData(initData, BOT_TOKEN);
      expect(result.valid).toBe(true);
      expect(result.user!.id).toBe(999);
      expect(result.user!.username).toBeUndefined();
    });
  });

  describe('invalid hash', () => {
    it('rejects tampered data (modified after signing)', () => {
      const initData = buildInitData({
        auth_date: freshAuthDate(),
        user: validUser,
      });

      // Tamper with the data
      const tampered = initData.replace('testplayer', 'hacker');

      const result = validateInitData(tampered, BOT_TOKEN);
      expect(result.valid).toBe(false);
    });

    it('rejects wrong bot token', () => {
      const initData = buildInitData({
        auth_date: freshAuthDate(),
        user: validUser,
      });

      const result = validateInitData(initData, 'wrong:token');
      expect(result.valid).toBe(false);
    });

    it('rejects missing hash', () => {
      const params = new URLSearchParams({
        auth_date: freshAuthDate(),
        user: validUser,
      });

      const result = validateInitData(params.toString(), BOT_TOKEN);
      expect(result.valid).toBe(false);
    });
  });

  describe('expired data', () => {
    it('rejects auth_date older than maxAgeSeconds', () => {
      const oldDate = String(Math.floor(Date.now() / 1000) - 100000);
      const initData = buildInitData({
        auth_date: oldDate,
        user: validUser,
      });

      const result = validateInitData(initData, BOT_TOKEN, 86400);
      expect(result.valid).toBe(false);
    });

    it('accepts auth_date within maxAgeSeconds', () => {
      const recentDate = String(Math.floor(Date.now() / 1000) - 100);
      const initData = buildInitData({
        auth_date: recentDate,
        user: validUser,
      });

      const result = validateInitData(initData, BOT_TOKEN, 86400);
      expect(result.valid).toBe(true);
    });

    it('respects custom maxAgeSeconds', () => {
      const date = String(Math.floor(Date.now() / 1000) - 50);
      const initData = buildInitData({
        auth_date: date,
        user: validUser,
      });

      // 10 seconds max age — 50 seconds ago should fail
      const result = validateInitData(initData, BOT_TOKEN, 10);
      expect(result.valid).toBe(false);
    });
  });

  describe('missing/invalid user', () => {
    it('rejects missing user field', () => {
      const initData = buildInitData({
        auth_date: freshAuthDate(),
        query_id: 'test',
      });

      const result = validateInitData(initData, BOT_TOKEN);
      expect(result.valid).toBe(false);
    });

    it('rejects invalid JSON in user field', () => {
      const initData = buildInitData({
        auth_date: freshAuthDate(),
        user: '{invalid json',
      });

      const result = validateInitData(initData, BOT_TOKEN);
      expect(result.valid).toBe(false);
    });
  });
});

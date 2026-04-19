import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { api, apiUrl, setInitData } from './client';

const OkSchema = z.object({ ok: z.literal(true) });

function setBase(href: string) {
  document.head.querySelector('base')?.remove();
  const base = document.createElement('base');
  base.href = href;
  document.head.appendChild(base);
}

describe('apiUrl', () => {
  afterEach(() => {
    document.head.querySelector('base')?.remove();
  });

  it('без <base> строит относительно текущего URL', () => {
    expect(apiUrl('/campaigns')).toMatch(/\/api\/campaigns$/);
  });

  it('на deep-URL использует <base href="/"> вместо location.href', () => {
    setBase(new URL('/', window.location.origin).href);
    window.history.pushState({}, '', '/location/112');
    try {
      expect(apiUrl('/locations/112/verses')).toBe(
        new URL('/api/locations/112/verses', window.location.origin).href,
      );
    } finally {
      window.history.pushState({}, '', '/');
    }
  });

  it('учитывает <base href> с префиксом', () => {
    setBase('http://localhost/SECRET/');
    expect(apiUrl('/campaigns')).toBe('http://localhost/SECRET/api/campaigns');
  });

  it('нормализует путь без ведущего слэша', () => {
    setBase('http://localhost/SECRET/');
    expect(apiUrl('campaigns')).toBe('http://localhost/SECRET/api/campaigns');
  });

  it('сохраняет query-string и hash', () => {
    setBase('http://localhost/SECRET/');
    expect(apiUrl('/campaigns?x=1')).toBe('http://localhost/SECRET/api/campaigns?x=1');
  });
});

describe('api', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    setInitData('');
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })),
    ) as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    document.head.querySelector('base')?.remove();
  });

  it('вызывает fetch по apiUrl', async () => {
    setBase('http://localhost/SECRET/');
    await api('/campaigns', OkSchema);
    const [url] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toBe('http://localhost/SECRET/api/campaigns');
  });

  it('добавляет X-Telegram-Init-Data если initData установлен', async () => {
    setInitData('test-init-data');
    await api('/campaigns', OkSchema);
    const [, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(init.headers['X-Telegram-Init-Data']).toBe('test-init-data');
  });
});

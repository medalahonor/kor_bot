import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, apiUrl, setInitData } from './client';

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
    await api('/campaigns');
    const [url] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toBe('http://localhost/SECRET/api/campaigns');
  });

  it('добавляет X-Telegram-Init-Data если initData установлен', async () => {
    setInitData('test-init-data');
    await api('/campaigns');
    const [, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(init.headers['X-Telegram-Init-Data']).toBe('test-init-data');
  });
});

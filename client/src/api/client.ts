let initData = '';

export function setInitData(data: string) {
  initData = data;
}

// Строит URL относительно document.baseURI — при развёртывании за префиксом
// (/SECRET/) nginx вставляет <base href="/SECRET/"> через sub_filter, чтобы
// API-запросы резольвились с префиксом независимо от текущего SPA-роута.
export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return new URL(`api/${normalized}`, document.baseURI).href;
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (initData) {
    headers['X-Telegram-Init-Data'] = initData;
  }

  const res = await fetch(apiUrl(path), {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error ${res.status}`);
  }

  return res.json();
}

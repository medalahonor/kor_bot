import { z, type ZodTypeAny } from 'zod';
import { ApiErrorSchema } from '@tg/shared';

let initData = '';

export function setInitData(data: string) {
  initData = data;
}

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return new URL(`api/${normalized}`, document.baseURI).href;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function api<S extends ZodTypeAny>(
  path: string,
  schema: S,
  options?: RequestInit,
): Promise<z.infer<S>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (initData) {
    headers['X-Telegram-Init-Data'] = initData;
  }

  const res = await fetch(apiUrl(path), { ...options, headers });

  if (!res.ok) {
    const raw = await res.json().catch(() => null);
    const parsed = ApiErrorSchema.safeParse(raw);
    const message = parsed.success ? parsed.data.error : `API error ${res.status}`;
    throw new ApiError(message, res.status);
  }

  const json = await res.json();
  return schema.parse(json);
}

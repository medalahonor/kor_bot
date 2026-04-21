import { ApiError } from '../api/client';

export function classifyApiError(err: unknown): string {
  if (err instanceof ApiError) return 'Ошибка сервера';
  if (err instanceof DOMException && err.name === 'AbortError') return 'Сервер не отвечает';
  if (err instanceof TypeError) return 'Нет сети';
  return 'Не удалось сохранить';
}

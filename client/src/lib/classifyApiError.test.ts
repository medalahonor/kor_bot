import { describe, it, expect } from 'vitest';
import { classifyApiError } from './classifyApiError';
import { ApiError } from '../api/client';

describe('classifyApiError', () => {
  it('ApiError (HTTP 4xx/5xx) → «Ошибка сервера»', () => {
    expect(classifyApiError(new ApiError('boom', 500))).toBe('Ошибка сервера');
    expect(classifyApiError(new ApiError('bad', 400))).toBe('Ошибка сервера');
  });

  it('AbortError (timeout) → «Сервер не отвечает»', () => {
    expect(classifyApiError(new DOMException('timeout', 'AbortError'))).toBe(
      'Сервер не отвечает',
    );
  });

  it('TypeError (network failure) → «Нет сети»', () => {
    expect(classifyApiError(new TypeError('Failed to fetch'))).toBe('Нет сети');
  });

  it('unknown → «Не удалось сохранить»', () => {
    expect(classifyApiError(new Error('weird'))).toBe('Не удалось сохранить');
    expect(classifyApiError('string')).toBe('Не удалось сохранить');
    expect(classifyApiError(null)).toBe('Не удалось сохранить');
  });
});

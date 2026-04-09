import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildTestApp } from '../helpers/app-factory.js';
import { buildTestInitData } from '../helpers/telegram-init-data.js';
import type { FastifyInstance } from 'fastify';

const BOT_TOKEN = process.env.BOT_TOKEN || 'test-bot-token';
const ADMIN_TG_ID = parseInt(process.env.ADMIN_TELEGRAM_ID || '111', 10);

describe('PUT /api/progress', () => {
  let app: FastifyInstance;
  let initData: string;

  beforeAll(async () => {
    app = await buildTestApp();
    initData = buildTestInitData(ADMIN_TG_ID, 'admin', BOT_TOKEN);
  });

  afterAll(async () => {
    await app.close();
  });

  it('sets status to visited', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/progress',
      payload: { optionId: 108, status: 'visited' },
      headers: { 'X-Telegram-Init-Data': initData },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  it('sets status to closed', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/progress',
      payload: { optionId: 108, status: 'closed' },
      headers: { 'X-Telegram-Init-Data': initData },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  it('sets status to requirements_not_met', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/progress',
      payload: { optionId: 108, status: 'requirements_not_met' },
      headers: { 'X-Telegram-Init-Data': initData },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  it('sets status to available (deletes progress)', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/progress',
      payload: { optionId: 108, status: 'available' },
      headers: { 'X-Telegram-Init-Data': initData },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  it('returns 400 with invalid status', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/progress',
      payload: { optionId: 108, status: 'invalid_status' },
      headers: { 'X-Telegram-Init-Data': initData },
    });

    expect(res.statusCode).toBe(400);
  });

  it('returns 400 without optionId', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/progress',
      payload: { status: 'visited' },
      headers: { 'X-Telegram-Init-Data': initData },
    });

    expect(res.statusCode).toBe(400);
  });

  it('returns 401 without auth header', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/progress',
      payload: { optionId: 108, status: 'visited' },
    });

    expect(res.statusCode).toBe(401);
  });

  it('cascades visited via $transaction (batch path)', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/progress',
      payload: { optionId: 108, status: 'visited' },
      headers: { 'X-Telegram-Init-Data': initData },
    });

    expect(res.statusCode).toBe(200);
    // Cascade goes through batchSetStatus → prisma.$transaction
    expect((app.prisma as any).$transaction).toHaveBeenCalled();
  });

  it('cascades closed via $transaction', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/progress',
      payload: { optionId: 108, status: 'closed' },
      headers: { 'X-Telegram-Init-Data': initData },
    });

    expect(res.statusCode).toBe(200);
    expect((app.prisma as any).$transaction).toHaveBeenCalled();
  });

  it('cascades available via $transaction', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/progress',
      payload: { optionId: 108, status: 'available' },
      headers: { 'X-Telegram-Init-Data': initData },
    });

    expect(res.statusCode).toBe(200);
    expect((app.prisma as any).$transaction).toHaveBeenCalled();
  });

  it('does NOT cascade requirements_not_met (no $transaction call)', async () => {
    const txMock = (app.prisma as any).$transaction;
    const callsBefore = txMock.mock.calls.length;
    const upsertMock = (app.prisma as any).progress.upsert;
    const upsertCallsBefore = upsertMock.mock.calls.length;

    const res = await app.inject({
      method: 'PUT',
      url: '/api/progress',
      payload: { optionId: 108, status: 'requirements_not_met' },
      headers: { 'X-Telegram-Init-Data': initData },
    });

    expect(res.statusCode).toBe(200);
    expect(txMock.mock.calls.length).toBe(callsBefore);
    expect(upsertMock.mock.calls.length).toBe(upsertCallsBefore + 1);
  });

  it('returns 404 when option does not exist', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/progress',
      payload: { optionId: 9999999, status: 'visited' },
      headers: { 'X-Telegram-Init-Data': initData },
    });

    expect(res.statusCode).toBe(404);
  });
});

describe('PUT /api/progress/batch', () => {
  let app: FastifyInstance;
  let initData: string;

  beforeAll(async () => {
    app = await buildTestApp();
    initData = buildTestInitData(ADMIN_TG_ID, 'admin', BOT_TOKEN);
  });

  afterAll(async () => {
    await app.close();
  });

  it('batch sets status to visited', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/progress/batch',
      payload: { optionIds: [108, 110, 120], status: 'visited' },
      headers: { 'X-Telegram-Init-Data': initData },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true, count: 3 });
  });

  it('batch sets status to closed', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/progress/batch',
      payload: { optionIds: [108, 110], status: 'closed' },
      headers: { 'X-Telegram-Init-Data': initData },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true, count: 2 });
  });

  it('returns 400 with empty optionIds array', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/progress/batch',
      payload: { optionIds: [], status: 'visited' },
      headers: { 'X-Telegram-Init-Data': initData },
    });

    expect(res.statusCode).toBe(400);
  });

  it('returns 400 without status', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/progress/batch',
      payload: { optionIds: [108] },
      headers: { 'X-Telegram-Init-Data': initData },
    });

    expect(res.statusCode).toBe(400);
  });

  it('returns 401 without auth header', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/api/progress/batch',
      payload: { optionIds: [108], status: 'visited' },
    });

    expect(res.statusCode).toBe(401);
  });
});

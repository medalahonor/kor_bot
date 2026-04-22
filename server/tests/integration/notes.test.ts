import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { buildTestApp } from '../helpers/app-factory.js';
import { buildTestInitData } from '../helpers/telegram-init-data.js';
import { sseBroker } from '../../src/sse/broker.js';
import type { FastifyInstance } from 'fastify';

const BOT_TOKEN = process.env.BOT_TOKEN || 'test-bot-token';
const PLAYER_TG_ID = 123456789;

describe('Notes API', () => {
  let app: FastifyInstance;
  let initData: string;
  let broadcastSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(async () => {
    app = await buildTestApp();
    initData = buildTestInitData(PLAYER_TG_ID, 'player', BOT_TOKEN);
    broadcastSpy = vi.spyOn(sseBroker, 'broadcast').mockImplementation(() => {});
  });

  afterAll(async () => {
    broadcastSpy.mockRestore();
    await app.close();
  });

  describe('GET /api/campaigns/:id/notes', () => {
    it('returns 401 without auth header', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/campaigns/1/notes' });
      expect(res.statusCode).toBe(401);
    });

    it('returns list sorted by createdAt desc', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/notes',
        headers: { 'X-Telegram-Init-Data': initData },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as any[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThanOrEqual(3);
      for (let i = 1; i < body.length; i++) {
        expect(new Date(body[i - 1].createdAt).getTime())
          .toBeGreaterThanOrEqual(new Date(body[i].createdAt).getTime());
      }
    });

    it('includes DTO fields: verseId, path array, locationName for attached note', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/notes',
        headers: { 'X-Telegram-Init-Data': initData },
      });
      const body = res.json() as any[];
      const attached = body.find((n) => n.verseId !== null);
      expect(attached).toBeDefined();
      expect(Array.isArray(attached.path)).toBe(true);
      expect(attached.path.length).toBeGreaterThan(0);
      expect(attached.path[0]).toEqual({ locationDn: expect.any(Number), verseDn: expect.any(Number) });
      expect(attached.locationName).toBeTypeOf('string');
    });

    it('path and verseId are null for unattached note', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/notes',
        headers: { 'X-Telegram-Init-Data': initData },
      });
      const body = res.json() as any[];
      const unattached = body.find((n) => n.verseId === null);
      expect(unattached).toBeDefined();
      expect(unattached.path).toBeNull();
      expect(unattached.locationName).toBeNull();
    });

    it('filters by type via querystring', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/notes?type=quest',
        headers: { 'X-Telegram-Init-Data': initData },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as any[];
      for (const n of body) expect(n.type).toBe('quest');
    });

    it('returns 400 for invalid type query value', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/notes?type=bogus',
        headers: { 'X-Telegram-Init-Data': initData },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/verses/:verseId/notes', () => {
    it('returns 401 without auth', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/verses/50/notes' });
      expect(res.statusCode).toBe(401);
    });

    it('returns only notes attached to the verse', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/verses/50/notes',
        headers: { 'X-Telegram-Init-Data': initData },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as any[];
      expect(body.length).toBeGreaterThan(0);
      for (const n of body) expect(n.verseId).toBe(50);
    });

    it('returns empty array for verse without notes', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/verses/49/notes',
        headers: { 'X-Telegram-Init-Data': initData },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual([]);
    });
  });

  describe('POST /api/campaigns/:id/notes', () => {
    it('returns 401 without auth', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/campaigns/1/notes',
        payload: { type: 'general', body: 'x' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('creates unattached note and broadcasts note_created', async () => {
      broadcastSpy.mockClear();
      const res = await app.inject({
        method: 'POST',
        url: '/api/campaigns/1/notes',
        payload: { type: 'general', body: 'новая общая' },
        headers: { 'X-Telegram-Init-Data': initData },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeTypeOf('number');
      expect(body.type).toBe('general');
      expect(body.body).toBe('новая общая');
      expect(body.verseId).toBeNull();
      expect(body.path).toBeNull();
      expect(broadcastSpy).toHaveBeenCalledOnce();
      expect(broadcastSpy.mock.calls[0][0]).toMatchObject({
        type: 'note_created',
        note: { id: body.id, type: 'general' },
      });
    });

    it('creates attached note: resolves verseId from last path step, returns locationName', async () => {
      broadcastSpy.mockClear();
      const res = await app.inject({
        method: 'POST',
        url: '/api/campaigns/1/notes',
        payload: {
          type: 'quest',
          body: 'новый квест',
          path: [
            { locationDn: 105, verseDn: 0 },
            { locationDn: 105, verseDn: 1 },
          ],
        },
        headers: { 'X-Telegram-Init-Data': initData },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.verseId).toBe(50);
      expect(body.path).toEqual([
        { locationDn: 105, verseDn: 0 },
        { locationDn: 105, verseDn: 1 },
      ]);
      expect(body.locationName).toBe('Вагенбург');
      expect(broadcastSpy).toHaveBeenCalledOnce();
    });

    it('rejects body > 2000 chars with 400', async () => {
      const big = 'a'.repeat(2001);
      const res = await app.inject({
        method: 'POST',
        url: '/api/campaigns/1/notes',
        payload: { type: 'general', body: big },
        headers: { 'X-Telegram-Init-Data': initData },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects empty body with 400', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/campaigns/1/notes',
        payload: { type: 'general', body: '' },
        headers: { 'X-Telegram-Init-Data': initData },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects invalid type with 400', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/campaigns/1/notes',
        payload: { type: 'bogus', body: 'x' },
        headers: { 'X-Telegram-Init-Data': initData },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 404 when last path step points to non-existent verse', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/campaigns/1/notes',
        payload: {
          type: 'general',
          body: 'x',
          path: [{ locationDn: 105, verseDn: 9999 }],
        },
        headers: { 'X-Telegram-Init-Data': initData },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/notes/:noteId', () => {
    it('returns 401 without auth', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/notes/1',
        payload: { type: 'hint', body: 'обновлено' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('updates type and body, leaves verseId and path unchanged, broadcasts note_updated', async () => {
      broadcastSpy.mockClear();
      const res = await app.inject({
        method: 'PUT',
        url: '/api/notes/1',
        payload: { type: 'hint', body: 'обновлено' },
        headers: { 'X-Telegram-Init-Data': initData },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.id).toBe(1);
      expect(body.type).toBe('hint');
      expect(body.body).toBe('обновлено');
      expect(body.verseId).toBe(50);
      expect(body.path).toEqual([
        { locationDn: 105, verseDn: 0 },
        { locationDn: 105, verseDn: 1 },
      ]);
      expect(broadcastSpy).toHaveBeenCalledOnce();
      expect(broadcastSpy.mock.calls[0][0]).toMatchObject({
        type: 'note_updated',
        note: { id: 1, type: 'hint' },
      });
    });

    it('ignores path in body (schema does not accept it)', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/notes/1',
        payload: {
          type: 'hint',
          body: 'x',
          path: [{ locationDn: 999, verseDn: 999 }],
        },
        headers: { 'X-Telegram-Init-Data': initData },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().path).toEqual([
        { locationDn: 105, verseDn: 0 },
        { locationDn: 105, verseDn: 1 },
      ]);
    });

    it('returns 404 for non-existent id', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/notes/99999999',
        payload: { type: 'hint', body: 'x' },
        headers: { 'X-Telegram-Init-Data': initData },
      });
      expect(res.statusCode).toBe(404);
    });

    it('rejects body > 2000 with 400', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/notes/1',
        payload: { type: 'hint', body: 'a'.repeat(2001) },
        headers: { 'X-Telegram-Init-Data': initData },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/notes/:noteId', () => {
    it('returns 401 without auth', async () => {
      const res = await app.inject({ method: 'DELETE', url: '/api/notes/3' });
      expect(res.statusCode).toBe(401);
    });

    it('deletes note and broadcasts note_deleted', async () => {
      broadcastSpy.mockClear();
      const res = await app.inject({
        method: 'DELETE',
        url: '/api/notes/3',
        headers: { 'X-Telegram-Init-Data': initData },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ ok: true });
      expect(broadcastSpy).toHaveBeenCalledOnce();
      expect(broadcastSpy.mock.calls[0][0]).toMatchObject({
        type: 'note_deleted',
        noteId: 3,
        campaignId: 1,
      });
    });

    it('returns 404 for non-existent id', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/api/notes/99999999',
        headers: { 'X-Telegram-Init-Data': initData },
      });
      expect(res.statusCode).toBe(404);
    });
  });
});

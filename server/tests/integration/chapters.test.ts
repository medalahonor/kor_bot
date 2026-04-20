import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildTestApp } from '../helpers/app-factory.js';
import type { FastifyInstance } from 'fastify';

describe('Chapters routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildTestApp();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/campaigns/:id/chapters', () => {
    it('returns chapters with their locations', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/campaigns/1/chapters' });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body).toHaveLength(3);

      const ch1 = body.find((c: any) => c.code === '1');
      expect(ch1).toBeDefined();
      expect(ch1.title).toBe('Глава 1');
      expect(ch1.locations.map((l: any) => l.dn)).toEqual([105, 101]);
      expect(ch1.locations[0]).toHaveProperty('name');
      expect(ch1.locations[0]).toHaveProperty('verseCount');
    });

    it('returns multi-chapter location in multiple chapters', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/campaigns/1/chapters' });

      const body = res.json();
      const ch1 = body.find((c: any) => c.code === '1');
      const ch2 = body.find((c: any) => c.code === '2');
      expect(ch1.locations.some((l: any) => l.dn === 105)).toBe(true);
      expect(ch2.locations.some((l: any) => l.dn === 105)).toBe(true);
    });

    it('returns empty array for campaign with no chapters', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/campaigns/999/chapters' });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual([]);
    });

    it('orders chapters by menu_order', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/campaigns/1/chapters' });
      const body = res.json();
      const orders = body.map((c: any) => c.menuOrder);
      expect(orders).toEqual([...orders].sort((a, b) => a - b));
    });
  });

  describe('POST /api/campaigns/:id/chapters', () => {
    it('creates chapter with 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/campaigns/1/chapters',
        payload: { code: 'new', title: 'Новая', menuOrder: 50 },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body).toMatchObject({ code: 'new', title: 'Новая', menuOrder: 50 });
      expect(body.id).toBeGreaterThan(0);
    });

    it('rejects duplicate code with 409', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/campaigns/1/chapters',
        payload: { code: '1', title: 'Дубль', menuOrder: 1 },
      });
      expect(res.statusCode).toBe(409);
    });

    it('validates body fail-fast (empty title)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/campaigns/1/chapters',
        payload: { code: 'x', title: '', menuOrder: 1 },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('PATCH /api/chapters/:chapterId', () => {
    it('updates chapter title', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/chapters/1',
        payload: { title: 'Новое имя' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ ok: true });
    });

    it('returns 404 for unknown chapter', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/chapters/9999',
        payload: { title: 'x' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('rejects empty body', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/chapters/1',
        payload: {},
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/chapters/:chapterId', () => {
    it('deletes empty chapter', async () => {
      const res = await app.inject({ method: 'DELETE', url: '/api/chapters/3' });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ ok: true });
    });

    it('refuses to delete non-empty chapter with 400', async () => {
      const res = await app.inject({ method: 'DELETE', url: '/api/chapters/1' });
      expect(res.statusCode).toBe(400);
    });

    it('returns 404 for unknown chapter', async () => {
      const res = await app.inject({ method: 'DELETE', url: '/api/chapters/9999' });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PATCH /api/chapters/:chapterId/locations', () => {
    it('adds a known location', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/chapters/2/locations',
        payload: { addLocations: [101] },
      });
      expect(res.statusCode).toBe(200);

      const after = await app.inject({ method: 'GET', url: '/api/campaigns/1/chapters' });
      const ch2 = after.json().find((c: any) => c.code === '2');
      expect(ch2.locations.some((l: any) => l.dn === 101)).toBe(true);
    });

    it('removes a location', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/chapters/1/locations',
        payload: { removeLocations: [101] },
      });
      expect(res.statusCode).toBe(200);

      const after = await app.inject({ method: 'GET', url: '/api/campaigns/1/chapters' });
      const ch1 = after.json().find((c: any) => c.code === '1');
      expect(ch1.locations.some((l: any) => l.dn === 101)).toBe(false);
    });

    it('rejects unknown dn with 400 fail-fast', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/chapters/1/locations',
        payload: { addLocations: [9999] },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 404 for unknown chapter', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/chapters/9999/locations',
        payload: { addLocations: [101] },
      });
      expect(res.statusCode).toBe(404);
    });

    it('rejects empty body', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/chapters/1/locations',
        payload: {},
      });
      expect(res.statusCode).toBe(400);
    });

    it('add is idempotent — duplicate add does not error', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/chapters/1/locations',
        payload: { addLocations: [105] },
      });
      expect(res.statusCode).toBe(200);
    });
  });
});

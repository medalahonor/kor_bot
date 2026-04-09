import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildTestApp } from '../helpers/app-factory.js';
import type { FastifyInstance } from 'fastify';

describe('GET /api/locations/:dn/remaining', () => {
  describe('no progress', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
      app = await buildTestApp();
    });

    afterAll(async () => {
      await app.close();
    });

    it('returns all options as remaining when no progress', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/locations/105/remaining' });

      expect(res.statusCode).toBe(200);
      const body = res.json();

      expect(body.locationDn).toBe(105);
      expect(body.totalPaths).toBe(2);
      expect(body.completedPaths).toBe(0);
      expect(body.totalCyclic).toBe(0);
      expect(body.completedCyclic).toBe(0);
      expect(body.remaining.length).toBe(4);
    });

    it('remaining options have pathFromEntry', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/locations/105/remaining' });
      const body = res.json();

      for (const r of body.remaining) {
        expect(r).toHaveProperty('option');
        expect(r).toHaveProperty('verseDn');
        expect(r).toHaveProperty('pathFromEntry');
        expect(r.pathFromEntry.length).toBeGreaterThan(0);
      }
    });

    it('results are sorted by path length', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/locations/105/remaining' });
      const body = res.json();

      for (let i = 1; i < body.remaining.length; i++) {
        expect(body.remaining[i].pathFromEntry.length).toBeGreaterThanOrEqual(
          body.remaining[i - 1].pathFromEntry.length,
        );
      }
    });
  });

  describe('with progress', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
      // Visit options 108, 110, 120 (all except 130)
      app = await buildTestApp({ 108: 'visited', 110: 'visited', 120: 'visited' });
    });

    afterAll(async () => {
      await app.close();
    });

    it('excludes visited options from remaining', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/locations/105/remaining' });
      const body = res.json();

      // Path counts reflect visited state
      expect(body.totalPaths).toBe(2);
      expect(body.completedPaths).toBe(1); // path [108,120] fully visited

      const remainingIds = body.remaining.map((r: any) => r.option.id);
      expect(remainingIds).not.toContain(108);
      expect(remainingIds).not.toContain(110);
      expect(remainingIds).not.toContain(120);
      expect(remainingIds).toContain(130);
    });
  });

  describe('all visited', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
      app = await buildTestApp({ 108: 'visited', 110: 'visited', 120: 'visited', 130: 'visited' });
    });

    afterAll(async () => {
      await app.close();
    });

    it('returns empty remaining when all visited', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/locations/105/remaining' });
      const body = res.json();

      expect(body.completedPaths).toBe(2);
      expect(body.remaining).toHaveLength(0);
    });
  });
});

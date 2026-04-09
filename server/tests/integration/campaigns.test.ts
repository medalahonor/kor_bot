import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildTestApp } from '../helpers/app-factory.js';
import type { FastifyInstance } from 'fastify';

describe('GET /api/campaigns', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns list of campaigns', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/campaigns' });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveLength(1);
    expect(body[0]).toEqual({
      id: 1,
      source_id: 26,
      name: 'Короли краха',
    });
  });
});

describe('GET /api/campaigns/:id/locations', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns locations for campaign', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/campaigns/1/locations' });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveLength(5);
    expect(body[0]).toHaveProperty('displayNumber');
    expect(body[0]).toHaveProperty('name');
    expect(body[0]).toHaveProperty('verseCount');
  });
});

describe('GET /api/campaigns/:id/locations/progress', () => {
  describe('without visited options', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
      app = await buildTestApp();
    });

    afterAll(async () => {
      await app.close();
    });

    it('returns 200 with batch progress array', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/locations/progress',
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body)).toBe(true);
    });

    it('returns correct shape for each entry', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/locations/progress',
      });

      const body = res.json();
      for (const entry of body) {
        expect(entry).toHaveProperty('displayNumber');
        expect(entry).toHaveProperty('totalPaths');
        expect(entry).toHaveProperty('completedPaths');
        expect(entry).toHaveProperty('totalCyclic');
        expect(entry).toHaveProperty('completedCyclic');
        expect(typeof entry.displayNumber).toBe('number');
        expect(typeof entry.totalPaths).toBe('number');
        expect(typeof entry.completedPaths).toBe('number');
      }
    });

    it('returns correct path counts for location 105 with no progress', async () => {
      // Location 105 graph: verse 0 → opt108→verse1, opt110→verse2
      //                     verse 1 → opt120→end
      //                     verse 2 → opt130→end
      // Paths: [108,120]→end, [110,130]→end = 2 total paths
      const res = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/locations/progress',
      });

      const body = res.json();
      const loc105 = body.find((e: any) => e.displayNumber === 105);
      expect(loc105).toBeDefined();
      expect(loc105.totalPaths).toBe(2);
      expect(loc105.completedPaths).toBe(0);
      expect(loc105.totalCyclic).toBe(0);
      expect(loc105.completedCyclic).toBe(0);
    });
  });

  describe('with visited options', () => {
    let app: FastifyInstance;
    // Visit all options in path: opt108→opt120→end
    beforeAll(async () => {
      app = await buildTestApp({ 108: 'visited', 120: 'visited' });
    });

    afterAll(async () => {
      await app.close();
    });

    it('returns correct completedPaths when one path fully visited', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/locations/progress',
      });

      const body = res.json();
      const loc105 = body.find((e: any) => e.displayNumber === 105);
      expect(loc105).toBeDefined();
      expect(loc105.totalPaths).toBe(2);
      expect(loc105.completedPaths).toBe(1);
    });
  });

  describe('with only end option visited (not intermediate)', () => {
    let app: FastifyInstance;
    // Visit only end option, not the intermediate
    beforeAll(async () => {
      app = await buildTestApp({ 120: 'visited' });
    });

    afterAll(async () => {
      await app.close();
    });

    it('returns 0 completedPaths when only end visited but not intermediate', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/locations/progress',
      });

      const body = res.json();
      const loc105 = body.find((e: any) => e.displayNumber === 105);
      expect(loc105).toBeDefined();
      expect(loc105.totalPaths).toBe(2);
      expect(loc105.completedPaths).toBe(0);
    });
  });
});

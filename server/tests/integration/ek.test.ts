import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildTestApp } from '../helpers/app-factory.js';
import type { FastifyInstance } from 'fastify';

describe('GET /api/campaigns/:id/ek/verses', () => {
  describe('without progress', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
      app = await buildTestApp();
    });

    afterAll(async () => {
      await app.close();
    });

    it('returns 200 with locations', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/ek/verses',
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body).toHaveProperty('locations');
      expect(body.locations.length).toBeGreaterThan(0);
    });

    it('returns EK location 1201', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/ek/verses',
      });

      const body = res.json();
      const loc1201 = body.locations.find((l: any) => l.locationDn === 1201);
      expect(loc1201).toBeDefined();
      expect(loc1201.name).toBe('Часть 1. Элган');
    });

    it('excludes empty verse 0', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/ek/verses',
      });

      const body = res.json();
      const loc1201 = body.locations.find((l: any) => l.locationDn === 1201);
      const verseDns = loc1201.verses.map((v: any) => v.verseDn);
      expect(verseDns).not.toContain(0);
    });

    it('returns correct verse shape', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/ek/verses',
      });

      const body = res.json();
      const loc1201 = body.locations.find((l: any) => l.locationDn === 1201);
      for (const verse of loc1201.verses) {
        expect(verse).toHaveProperty('verseDn');
        expect(verse).toHaveProperty('totalPaths');
        expect(verse).toHaveProperty('completedPaths');
        expect(verse).toHaveProperty('totalCyclic');
        expect(verse).toHaveProperty('completedCyclic');
      }
    });

    it('returns per-location totals', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/ek/verses',
      });

      const body = res.json();
      const loc1201 = body.locations.find((l: any) => l.locationDn === 1201);
      expect(loc1201).toHaveProperty('totalPaths');
      expect(loc1201).toHaveProperty('completedPaths');
      expect(loc1201).toHaveProperty('totalCyclic');
      expect(loc1201).toHaveProperty('completedCyclic');
      // location totals = sum of verse totals
      const verseTotal = loc1201.verses.reduce((sum: number, v: any) => sum + v.totalPaths, 0);
      expect(loc1201.totalPaths).toBe(verseTotal);
    });

    it('returns correct path counts for verse 5 (standalone end)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/ek/verses',
      });

      const body = res.json();
      const loc1201 = body.locations.find((l: any) => l.locationDn === 1201);
      const verse5 = loc1201.verses.find((v: any) => v.verseDn === 5);
      expect(verse5).toBeDefined();
      // verse 5 → end = 1 path
      expect(verse5.totalPaths).toBe(1);
      expect(verse5.completedPaths).toBe(0);
    });

    it('returns correct path counts for verse 12 (chain root)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/ek/verses',
      });

      const body = res.json();
      const loc1201 = body.locations.find((l: any) => l.locationDn === 1201);
      const verse12 = loc1201.verses.find((v: any) => v.verseDn === 12);
      expect(verse12).toBeDefined();
      // verse 12 → verse 5 → end, verse 12 → end = 2 paths
      expect(verse12.totalPaths).toBe(2);
      expect(verse12.completedPaths).toBe(0);
    });
  });

  describe('with progress', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
      // Mark option 401 (verse 5 → end) as visited
      app = await buildTestApp({ 401: 'visited' });
    });

    afterAll(async () => {
      await app.close();
    });

    it('returns correct completedPaths for verse 5', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/ek/verses',
      });

      const body = res.json();
      const loc1201 = body.locations.find((l: any) => l.locationDn === 1201);
      const verse5 = loc1201.verses.find((v: any) => v.verseDn === 5);
      expect(verse5.completedPaths).toBe(1);
    });

    it('returns correct location-level completedPaths', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/ek/verses',
      });

      const body = res.json();
      const loc1201 = body.locations.find((l: any) => l.locationDn === 1201);
      // Only verse 5's single path is completed, verse 12 has 2 paths (0 completed)
      expect(loc1201.completedPaths).toBe(1);
    });
  });
});

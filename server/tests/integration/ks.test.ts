import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildTestApp } from '../helpers/app-factory.js';
import type { FastifyInstance } from 'fastify';

describe('GET /api/campaigns/:id/ks/verses', () => {
  describe('without progress', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
      app = await buildTestApp();
    });

    afterAll(async () => {
      await app.close();
    });

    it('returns 200 with verses from KS locations', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/ks/verses',
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body).toHaveProperty('verses');
      expect(body).toHaveProperty('total');
      expect(body).toHaveProperty('page');
      expect(body).toHaveProperty('limit');
    });

    it('returns verses from locations 999 and 1001', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/ks/verses',
      });

      const body = res.json();
      const locationDns = new Set(body.verses.map((v: any) => v.locationDn));
      expect(locationDns.has(999)).toBe(true);
      expect(locationDns.has(1001)).toBe(true);
    });

    it('excludes empty verse 0', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/ks/verses',
      });

      const body = res.json();
      const verseDns = body.verses.map((v: any) => v.verseDn);
      expect(verseDns).not.toContain(0);
    });

    it('returns correct shape for each verse entry', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/ks/verses',
      });

      const body = res.json();
      for (const verse of body.verses) {
        expect(verse).toHaveProperty('verseDn');
        expect(verse).toHaveProperty('locationDn');
        expect(verse).toHaveProperty('totalPaths');
        expect(verse).toHaveProperty('completedPaths');
        expect(verse).toHaveProperty('totalCyclic');
        expect(verse).toHaveProperty('completedCyclic');
        expect(typeof verse.verseDn).toBe('number');
        expect(typeof verse.locationDn).toBe('number');
      }
    });

    it('returns correct path counts for verse 42 (chain root)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/ks/verses',
      });

      const body = res.json();
      const verse42 = body.verses.find((v: any) => v.verseDn === 42);
      expect(verse42).toBeDefined();
      // verse 42 → 43 → end, 43 → 44 → end = 2 paths
      expect(verse42.totalPaths).toBe(2);
      expect(verse42.completedPaths).toBe(0);
    });

    it('returns correct path counts for verse 601 (standalone)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/ks/verses',
      });

      const body = res.json();
      const verse601 = body.verses.find((v: any) => v.verseDn === 601);
      expect(verse601).toBeDefined();
      expect(verse601.locationDn).toBe(1001);
      // verse 601 → end = 1 path
      expect(verse601.totalPaths).toBe(1);
      expect(verse601.completedPaths).toBe(0);
    });

    it('total matches number of returned verses', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/ks/verses',
      });

      const body = res.json();
      expect(body.total).toBe(body.verses.length);
    });
  });

  describe('with progress', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
      // Mark options 201, 202 as visited (verse 42→43, quick exit)
      app = await buildTestApp({ 201: 'visited', 202: 'visited' });
    });

    afterAll(async () => {
      await app.close();
    });

    it('returns correct completedPaths for verse 42', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/ks/verses',
      });

      const body = res.json();
      const verse42 = body.verses.find((v: any) => v.verseDn === 42);
      expect(verse42.completedPaths).toBe(1); // path 201→202→end completed
    });
  });

  describe('search filter', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
      app = await buildTestApp();
    });

    afterAll(async () => {
      await app.close();
    });

    it('filters by verse number prefix', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/ks/verses?search=42',
      });

      const body = res.json();
      expect(body.verses.every((v: any) => String(v.verseDn).startsWith('42'))).toBe(true);
    });

    it('returns empty when no match', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/ks/verses?search=9999',
      });

      const body = res.json();
      expect(body.verses).toHaveLength(0);
      expect(body.total).toBe(0);
    });
  });

  describe('onlyNew filter', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
      // Mark verse 601's only option as visited → verse 601 fully completed
      app = await buildTestApp({ 301: 'visited' });
    });

    afterAll(async () => {
      await app.close();
    });

    it('hides completed verses when onlyNew=true', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/ks/verses?onlyNew=true',
      });

      const body = res.json();
      const verseDns = body.verses.map((v: any) => v.verseDn);
      expect(verseDns).not.toContain(601);
    });

    it('does not treat incomplete cyclic as new', async () => {
      // verse 50 has all main paths completed (205→206→end) but cyclic path (205→207→verse50) is not
      // With onlyNew=true, verse 50 should NOT appear — cyclic progress is irrelevant
      const appCyclic = await buildTestApp({ 205: 'visited', 206: 'visited' });
      const res = await appCyclic.inject({
        method: 'GET',
        url: '/api/campaigns/1/ks/verses?onlyNew=true',
      });

      const body = res.json();
      const verseDns = body.verses.map((v: any) => v.verseDn);
      expect(verseDns).not.toContain(50);
      await appCyclic.close();
    });

    it('shows all verses when onlyNew is not set', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/ks/verses',
      });

      const body = res.json();
      const verseDns = body.verses.map((v: any) => v.verseDn);
      expect(verseDns).toContain(601);
    });
  });

  describe('pagination', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
      app = await buildTestApp();
    });

    afterAll(async () => {
      await app.close();
    });

    it('respects limit parameter', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/ks/verses?limit=2',
      });

      const body = res.json();
      expect(body.verses.length).toBeLessThanOrEqual(2);
      expect(body.limit).toBe(2);
    });

    it('respects page parameter', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/ks/verses?limit=2&page=2',
      });

      const body = res.json();
      expect(body.page).toBe(2);
    });

    it('returns correct total regardless of pagination', async () => {
      const res1 = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/ks/verses?limit=1&page=1',
      });

      const res2 = await app.inject({
        method: 'GET',
        url: '/api/campaigns/1/ks/verses?limit=100',
      });

      expect(res1.json().total).toBe(res2.json().total);
    });
  });
});

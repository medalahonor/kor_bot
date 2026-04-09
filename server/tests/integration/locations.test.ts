import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildTestApp } from '../helpers/app-factory.js';
import type { FastifyInstance } from 'fastify';

describe('GET /api/locations/:dn/verses', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns location with verses and options', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/locations/105/verses' });

    expect(res.statusCode).toBe(200);
    const body = res.json();

    expect(body.displayNumber).toBe(105);
    expect(body.name).toBe('Вагенбург');
    expect(body.verses).toHaveLength(3);
  });

  it('returns verses ordered by displayNumber', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/locations/105/verses' });
    const body = res.json();

    const dns = body.verses.map((v: any) => v.displayNumber);
    expect(dns).toEqual([0, 1, 2]);
  });

  it('options have correct shape', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/locations/105/verses' });
    const body = res.json();

    const firstOption = body.verses[0].options[0];
    expect(firstOption).toHaveProperty('id');
    expect(firstOption).toHaveProperty('position');
    expect(firstOption).toHaveProperty('type');
    expect(firstOption).toHaveProperty('text');
    expect(firstOption).toHaveProperty('targetType');
    expect(firstOption).toHaveProperty('targetVerseDn');
  });

  it('returns 404 for unknown location', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/locations/9999/verses' });
    expect(res.statusCode).toBe(404);
  });

  it('keeps verse 0 when it has options (location 105)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/locations/105/verses' });
    const body = res.json();
    const dns = body.verses.map((v: any) => v.displayNumber);
    expect(dns).toContain(0);
  });

  it('excludes empty verse 0 (location 1201)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/locations/1201/verses' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    const dns = body.verses.map((v: any) => v.displayNumber);
    expect(dns).not.toContain(0);
    expect(dns).toContain(5);
    expect(dns).toContain(12);
  });
});

describe('GET /api/locations/:dn/progress', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp({ 108: 'visited', 110: 'visited' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns option statuses', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/locations/105/progress' });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.locationDn).toBe(105);
    expect(body.optionStatuses).toBeDefined();
    expect(body.optionStatuses['108']).toBe('visited');
    expect(body.optionStatuses['110']).toBe('visited');
  });

  it('returns 404 for unknown location', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/locations/9999/progress' });
    expect(res.statusCode).toBe(404);
  });
});

describe('GET /api/locations/:dn/progress with mixed statuses', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp({ 108: 'visited', 110: 'closed', 120: 'requirements_not_met' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns correct statuses for each option', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/locations/105/progress' });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.optionStatuses['108']).toBe('visited');
    expect(body.optionStatuses['110']).toBe('closed');
    expect(body.optionStatuses['120']).toBe('requirements_not_met');
  });
});

describe('GET /api/locations/:dn/verse-numbers', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns verse display numbers', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/locations/105/verse-numbers' });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.verses).toEqual([0, 1, 2]);
  });

  it('returns 404 for unknown location', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/locations/9999/verse-numbers' });
    expect(res.statusCode).toBe(404);
  });
});

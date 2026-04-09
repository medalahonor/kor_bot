import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { buildTestApp } from '../helpers/app-factory.js';
import { buildTestInitData } from '../helpers/telegram-init-data.js';
import type { FastifyInstance } from 'fastify';

const BOT_TOKEN = process.env.BOT_TOKEN || 'test-bot-token';
const ADMIN_TG_ID = parseInt(process.env.ADMIN_TELEGRAM_ID || '111', 10);
const PLAYER_TG_ID = 222;

describe('Admin CRUD', () => {
  let app: FastifyInstance;
  let adminInitData: string;
  let playerInitData: string;

  beforeAll(async () => {
    app = await buildTestApp();
    adminInitData = buildTestInitData(ADMIN_TG_ID, 'admin', BOT_TOKEN);
    playerInitData = buildTestInitData(PLAYER_TG_ID, 'player', BOT_TOKEN);
  });

  afterAll(async () => {
    await app.close();
  });

  // ---------------------------------------------------------------------------
  // Options CRUD
  // ---------------------------------------------------------------------------

  describe('PUT /api/options/:id', () => {
    it('updates option as admin', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/options/108',
        headers: { 'x-telegram-init-data': adminInitData },
        payload: { text: 'Updated text' },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.text).toBe('Updated text');
    });

    it('rejects player role', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/options/108',
        headers: { 'x-telegram-init-data': playerInitData },
        payload: { text: 'Hacked' },
      });

      expect(res.statusCode).toBe(403);
    });

    it('rejects unauthenticated request', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/options/108',
        payload: { text: 'No auth' },
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/verses/:verseId/options', () => {
    it('creates new option as admin', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/verses/49/options',
        headers: { 'x-telegram-init-data': adminInitData },
        payload: {
          type: 'choice',
          text: 'New option',
          targetType: 'end',
        },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.type).toBe('choice');
      expect(body.text).toBe('New option');
    });

    it('rejects player role', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/verses/49/options',
        headers: { 'x-telegram-init-data': playerInitData },
        payload: { type: 'choice', text: 'Nope' },
      });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/options/:id', () => {
    it('deletes option as admin', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/api/options/108',
        headers: { 'x-telegram-init-data': adminInitData },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ ok: true });
    });

    it('rejects player role', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/api/options/108',
        headers: { 'x-telegram-init-data': playerInitData },
      });

      expect(res.statusCode).toBe(403);
    });
  });

  // ---------------------------------------------------------------------------
  // Verses CRUD
  // ---------------------------------------------------------------------------

  describe('PUT /api/verses/:id', () => {
    it('updates verse as admin', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/verses/49',
        headers: { 'x-telegram-init-data': adminInitData },
        payload: { displayNumber: 99 },
      });

      expect(res.statusCode).toBe(200);
    });

    it('rejects player role', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/verses/49',
        headers: { 'x-telegram-init-data': playerInitData },
        payload: { displayNumber: 99 },
      });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('POST /api/locations/:locationId/verses', () => {
    it('creates new verse as admin', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/locations/5/verses',
        headers: { 'x-telegram-init-data': adminInitData },
        payload: { displayNumber: 50 },
      });

      expect(res.statusCode).toBe(201);
    });
  });

  describe('DELETE /api/verses/:id', () => {
    it('deletes verse as admin', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/api/verses/49',
        headers: { 'x-telegram-init-data': adminInitData },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ ok: true });
    });
  });
});

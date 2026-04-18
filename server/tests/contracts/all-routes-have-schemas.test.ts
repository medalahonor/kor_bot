import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp, type CollectedRoute } from '../helpers/app-factory.js';

const WHITELIST = new Set(['/api/sse/progress']);
const METHODS_WITH_BODY = new Set(['POST', 'PUT', 'PATCH']);
const SUCCESS_STATUS_CODES = [200, 201, 204];

function hasResponseSchema(schema: CollectedRoute['schema']): boolean {
  if (!schema || typeof schema !== 'object') return false;
  const response = (schema as Record<string, unknown>).response;
  if (!response || typeof response !== 'object') return false;
  return SUCCESS_STATUS_CODES.some((code) => (response as Record<string, unknown>)[code] !== undefined);
}

function hasBodySchema(schema: CollectedRoute['schema']): boolean {
  if (!schema || typeof schema !== 'object') return false;
  return (schema as Record<string, unknown>).body !== undefined;
}

describe('API contracts — every route must have Zod schemas', () => {
  let app: FastifyInstance;
  let routes: CollectedRoute[];

  beforeAll(async () => {
    app = await buildTestApp();
    await app.ready();
    routes = app.collectedRoutes.filter((r) => {
      const url = typeof r.url === 'string' ? r.url : '';
      return url.startsWith('/api') && !WHITELIST.has(url);
    });
  });

  afterAll(async () => {
    await app.close();
  });

  test('every API route is registered with a success response schema', () => {
    const missing = routes.filter((r) => !hasResponseSchema(r.schema));
    expect(missing, `routes missing response schema: ${JSON.stringify(missing.map((r) => `${String(r.method)} ${r.url}`))}`).toEqual([]);
  });

  test('every body-accepting route (POST/PUT/PATCH) has a body schema', () => {
    const missing = routes.filter((r) => {
      const methods = Array.isArray(r.method) ? r.method : [r.method];
      const needsBody = methods.some((m) => METHODS_WITH_BODY.has(String(m).toUpperCase()));
      return needsBody && !hasBodySchema(r.schema);
    });
    expect(missing, `body-accepting routes missing body schema: ${JSON.stringify(missing.map((r) => `${String(r.method)} ${r.url}`))}`).toEqual([]);
  });

  test('no duplicate route registrations', () => {
    const keys = routes.flatMap((r) => {
      const methods = Array.isArray(r.method) ? r.method : [r.method];
      return methods.map((m) => `${String(m).toUpperCase()} ${r.url}`);
    });
    const duplicates = keys.filter((k, i) => keys.indexOf(k) !== i);
    expect(duplicates).toEqual([]);
  });
});

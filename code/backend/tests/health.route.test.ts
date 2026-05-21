import { describe, it, expect, afterAll } from 'vitest';
import { buildServer } from '../src/app';

// Default-logger path (no arg) + explicit-logger path (false) — both exercised.
const app = buildServer();
const appExplicit = buildServer(false);

afterAll(async () => {
  await app.close();
  await appExplicit.close();
});

describe('GET /api/health', () => {
  it('returns a 200 ok payload with traceable fields', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);

    const body = res.json() as {
      status: string;
      service: string;
      counterId: number;
      metrikaTokenPresent: boolean;
      timestamp: string;
    };
    expect(body.status).toBe('ok');
    expect(body.service).toBe('productcamp-analytics-backend');
    expect(typeof body.counterId).toBe('number');
    expect(typeof body.metrikaTokenPresent).toBe('boolean');
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('is mounted under the /api prefix (bare /health is 404)', async () => {
    const res = await appExplicit.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(404);
  });
});

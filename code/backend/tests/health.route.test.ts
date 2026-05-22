import { describe, it, expect, afterAll } from 'vitest';
import { buildTestApp } from './api/helpers';

const { app, db } = buildTestApp();
afterAll(async () => {
  await app.close();
  db.close();
});

describe('GET /api/health', () => {
  it('returns a 200 ok payload with traceable fields', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { status: string; service: string; counterId: number };
    expect(body.status).toBe('ok');
    expect(body.service).toBe('productcamp-analytics-backend');
    expect(typeof body.counterId).toBe('number');
  });

  it('is mounted under /api (bare /health is 404)', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(404);
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildTestApp, type TestApp } from './helpers';
import { validHypothesis } from '../db/helpers';

let ctx: TestApp;
beforeEach(() => {
  ctx = buildTestApp();
});
afterEach(async () => {
  await ctx.app.close();
  ctx.db.close();
});

describe('hypotheses API', () => {
  it('creates a valid hypothesis (201) and lists/reads it', async () => {
    const created = await ctx.app.inject({
      method: 'POST',
      url: '/api/hypotheses',
      payload: validHypothesis(),
    });
    expect(created.statusCode).toBe(201);
    const id = created.json().id as number;

    const list = await ctx.app.inject({ method: 'GET', url: '/api/hypotheses' });
    expect(list.json()).toHaveLength(1);

    const one = await ctx.app.inject({ method: 'GET', url: `/api/hypotheses/${id}` });
    expect(one.statusCode).toBe(200);
    const missing = await ctx.app.inject({ method: 'GET', url: '/api/hypotheses/9999' });
    expect(missing.statusCode).toBe(404);
  });

  it('rejects an incomplete hypothesis with 422 and the error list', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/hypotheses',
      payload: validHypothesis({ hiddenAssumptions: [{ category: 'behavior', text: 'x' }] }),
    });
    expect(res.statusCode).toBe(422);
    expect(res.json().error).toBe('invalid hypothesis');
    expect(Array.isArray(res.json().issues)).toBe(true);
  });

  it('returns 500 when the repo throws a non-validation error (bad parent FK)', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/hypotheses',
      payload: validHypothesis({ parentId: 9999 }),
    });
    expect(res.statusCode).toBe(500);
  });

  it('patches status, validates the value, and 404s a missing id', async () => {
    const created = await ctx.app.inject({
      method: 'POST',
      url: '/api/hypotheses',
      payload: validHypothesis(),
    });
    const id = created.json().id as number;

    const ok = await ctx.app.inject({
      method: 'PATCH',
      url: `/api/hypotheses/${id}/status`,
      payload: { status: 'in_progress' },
    });
    expect(ok.json().status).toBe('in_progress');

    const bad = await ctx.app.inject({
      method: 'PATCH',
      url: `/api/hypotheses/${id}/status`,
      payload: { status: 'banana' },
    });
    expect(bad.statusCode).toBe(400);

    const missing = await ctx.app.inject({
      method: 'PATCH',
      url: '/api/hypotheses/9999/status',
      payload: { status: 'green' },
    });
    expect(missing.statusCode).toBe(404);
  });
});

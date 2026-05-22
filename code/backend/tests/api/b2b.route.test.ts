import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildTestApp, type TestApp } from './helpers';

let ctx: TestApp;
beforeEach(() => {
  ctx = buildTestApp();
});
afterEach(async () => {
  await ctx.app.close();
  ctx.db.close();
});

const deal = { company: 'BigCorp', tickets: 20, stage: 'lead', dateAdded: '2025-01-01' };

describe('b2b API', () => {
  it('creates (201) and lists deals', async () => {
    const created = await ctx.app.inject({ method: 'POST', url: '/api/b2b', payload: deal });
    expect(created.statusCode).toBe(201);
    const list = await ctx.app.inject({ method: 'GET', url: '/api/b2b' });
    expect(list.json()).toHaveLength(1);
  });

  it('patches stage, validates it, and 404s a missing id', async () => {
    const id = (await ctx.app.inject({ method: 'POST', url: '/api/b2b', payload: deal })).json()
      .id as number;

    const ok = await ctx.app.inject({
      method: 'PATCH',
      url: `/api/b2b/${id}`,
      payload: { stage: 'paid', datePaid: '2025-01-05' },
    });
    expect(ok.json().stage).toBe('paid');

    const bad = await ctx.app.inject({
      method: 'PATCH',
      url: `/api/b2b/${id}`,
      payload: { stage: 'nope' },
    });
    expect(bad.statusCode).toBe(400);

    const missing = await ctx.app.inject({
      method: 'PATCH',
      url: '/api/b2b/9999',
      payload: { stage: 'paid' },
    });
    expect(missing.statusCode).toBe(404);
  });

  it('deletes a deal (204) and 404s a missing id', async () => {
    const id = (await ctx.app.inject({ method: 'POST', url: '/api/b2b', payload: deal })).json()
      .id as number;
    const ok = await ctx.app.inject({ method: 'DELETE', url: `/api/b2b/${id}` });
    expect(ok.statusCode).toBe(204);
    const missing = await ctx.app.inject({ method: 'DELETE', url: `/api/b2b/${id}` });
    expect(missing.statusCode).toBe(404);
  });
});

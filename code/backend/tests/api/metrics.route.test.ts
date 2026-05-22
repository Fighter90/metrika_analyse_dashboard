import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildTestApp, type TestApp } from './helpers';

let ctx: TestApp;

beforeAll(() => {
  ctx = buildTestApp();
  ctx.deps.metrics.upsertGoals([
    { id: 80, name: 'pay', type: 'action', isB2b: false, isArchived: false, syncedAt: 'x' },
    { id: 10, name: 'old', type: 'action', isB2b: false, isArchived: true, syncedAt: 'x' },
  ]);
  ctx.deps.metrics.upsertChannelStats([
    {
      date: '2025-01-01',
      channel: 'podcast',
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      visits: 100,
      users: 90,
      bounceRate: 0.2,
      avgDuration: 65,
      goalReaches: 5,
      conversionRate: 0.05,
    },
    {
      date: '2025-01-09',
      channel: 'direct',
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      visits: 50,
      users: 45,
      bounceRate: 0.3,
      avgDuration: 40,
      goalReaches: 2,
      conversionRate: 0.04,
    },
  ]);
});
afterAll(async () => {
  await ctx.app.close();
  ctx.db.close();
});

describe('GET /api/metrics', () => {
  it('returns all channel stats, and a date-filtered subset', async () => {
    const all = await ctx.app.inject({ method: 'GET', url: '/api/metrics/channels' });
    expect(all.json()).toHaveLength(2);

    const ranged = await ctx.app.inject({
      method: 'GET',
      url: '/api/metrics/channels?from=2025-01-01&to=2025-01-05',
    });
    expect(ranged.json()).toHaveLength(1);
  });

  it('hides archived goals by default, includes them with ?archived=true', async () => {
    const def = await ctx.app.inject({ method: 'GET', url: '/api/metrics/goals' });
    expect(def.json()).toHaveLength(1);
    const all = await ctx.app.inject({ method: 'GET', url: '/api/metrics/goals?archived=true' });
    expect(all.json()).toHaveLength(2);
  });

  it('returns a raw response or 404', async () => {
    const id = ctx.deps.metrics.saveRawResponse({
      endpoint: '/stat/v1/data',
      queryHash: 'h',
      dateFrom: '2025-01-01',
      dateTo: '2025-01-01',
      payload: { ok: true },
      fetchedAt: 't',
    });
    const found = await ctx.app.inject({ method: 'GET', url: `/api/metrics/raw/${id}` });
    expect(found.statusCode).toBe(200);
    const missing = await ctx.app.inject({ method: 'GET', url: '/api/metrics/raw/9999' });
    expect(missing.statusCode).toBe(404);
  });
});

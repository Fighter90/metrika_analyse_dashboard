import { describe, it, expect, afterEach } from 'vitest';
import { buildTestApp, type TestApp } from './helpers';

let ctx: TestApp;
afterEach(async () => {
  await ctx.app.close();
  ctx.db.close();
});

describe('app assembly', () => {
  it('serves the OpenAPI spec at /docs/json', async () => {
    ctx = buildTestApp();
    const res = await ctx.app.inject({ method: 'GET', url: '/docs/json' });
    expect(res.statusCode).toBe(200);
    expect(res.json().info.title).toBe('ProductCamp Analytics API');
  });

  it('accepts an explicit logger argument', async () => {
    ctx = buildTestApp(false);
    const res = await ctx.app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
  });
});

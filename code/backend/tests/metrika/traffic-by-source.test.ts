import { describe, it, expect, vi } from 'vitest';
import { trafficBySource, trafficMetrics } from '../../src/metrika/queries/traffic-by-source';
import type { MetrikaClient } from '../../src/metrika/client';

function fakeClient(fixture: unknown): MetrikaClient {
  return { get: vi.fn(async () => fixture) } as unknown as MetrikaClient;
}

describe('trafficMetrics', () => {
  it('returns the base four metrics without a goal', () => {
    expect(trafficMetrics().split(',')).toHaveLength(4);
  });

  it('appends goal metrics when a goalId is given', () => {
    const metrics = trafficMetrics(80);
    expect(metrics).toContain('ym:s:goal80reaches');
    expect(metrics).toContain('ym:s:goal80conversionRate');
  });
});

describe('trafficBySource', () => {
  it('maps rows to ChannelStat without goal metrics', async () => {
    const client = fakeClient({
      data: [{ dimensions: [{ name: 'podcast' }, { name: 'rss' }], metrics: [100, 90, 0.2, 65] }],
    });
    const { stats } = await trafficBySource(client, {
      counterId: 1,
      from: '2025-01-01',
      to: '2025-01-01',
    });
    expect(stats[0]).toMatchObject({
      date: '2025-01-01',
      channel: 'podcast',
      visits: 100,
      users: 90,
      goalReaches: 0,
      conversionRate: 0,
    });
  });

  it('includes goal metrics when goalId is set', async () => {
    const client = fakeClient({
      data: [{ dimensions: [{ name: 'podcast' }], metrics: [100, 90, 20, 65, 5, 5] }],
    });
    const { stats } = await trafficBySource(client, {
      counterId: 1,
      from: '2025-01-02',
      to: '2025-01-02',
      goalId: 80,
    });
    expect(stats[0]?.goalReaches).toBe(5);
    expect(stats[0]?.conversionRate).toBe(0.05);
  });

  it('aggregates sibling rows of the same channel (source split across engines) into one', async () => {
    // "Search engine traffic" arrives twice (Google + Yandex); both must be summed, not collapsed.
    const client = fakeClient({
      data: [
        {
          dimensions: [{ name: 'Search engine traffic' }, { name: 'Google' }],
          metrics: [46, 40, 0.5, 60, 4, 0.087],
        },
        {
          dimensions: [{ name: 'Search engine traffic' }, { name: 'Yandex' }],
          metrics: [24, 20, 0.25, 100, 1, 0.042],
        },
        {
          dimensions: [{ name: 'Direct traffic' }, { name: null }],
          metrics: [359, 300, 0.3, 80, 2, 0.0056],
        },
      ],
    });
    const { stats } = await trafficBySource(client, {
      counterId: 1,
      from: '2025-01-04',
      to: '2025-01-04',
      goalId: 80,
    });
    expect(stats).toHaveLength(2); // two channels, not three rows
    const search = stats.find((s) => s.channel === 'Search engine traffic');
    expect(search?.visits).toBe(70); // 46 + 24 — was previously collapsed to 24
    expect(search?.users).toBe(60);
    expect(search?.goalReaches).toBe(5); // 4 + 1
    expect(search?.conversionRate).toBeCloseTo(5 / 70);
    // bounce is visit-weighted; raw percentages are normalised to ratios (÷100) at ingestion
    expect(search?.bounceRate).toBeCloseTo((0.005 * 46 + 0.0025 * 24) / 70);
  });

  it('defaults null metrics to 0 and a missing dimension name to "unknown"', async () => {
    const client = fakeClient({
      data: [{ dimensions: [{ name: null }], metrics: [null, null, null, null] }],
    });
    const { stats } = await trafficBySource(client, {
      counterId: 1,
      from: '2025-01-03',
      to: '2025-01-03',
    });
    expect(stats[0]?.channel).toBe('unknown');
    expect(stats[0]?.visits).toBe(0);
  });
});

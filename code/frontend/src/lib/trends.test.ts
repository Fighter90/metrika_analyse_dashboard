import { describe, it, expect } from 'vitest';
import type { ChannelStat } from '@pca/shared';
import { dailySeries, weekOverWeek, trendsOption } from './trends';

const stat = (date: string, over: Partial<ChannelStat> = {}): ChannelStat => ({
  date,
  channel: 'podcast',
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  visits: 10,
  users: 9,
  bounceRate: 0.2,
  avgDuration: 60,
  goalReaches: 1,
  conversionRate: 0.1,
  ...over,
});

describe('dailySeries', () => {
  it('sums visits + reaches per date, sorted ascending', () => {
    const series = dailySeries([
      stat('2025-01-02', { visits: 5, goalReaches: 1 }),
      stat('2025-01-01', { visits: 10, goalReaches: 2 }),
      stat('2025-01-01', { visits: 3, goalReaches: 1 }), // same date merges
    ]);
    expect(series).toEqual([
      { date: '2025-01-01', visits: 13, reaches: 3 },
      { date: '2025-01-02', visits: 5, reaches: 1 },
    ]);
  });
});

describe('weekOverWeek', () => {
  it('compares the last 7 days against the prior 7, as ratios', () => {
    // 14 days: previous week visits=10/day (70), current week visits=20/day (140) → +100%.
    const stats: ChannelStat[] = [];
    for (let d = 1; d <= 7; d += 1) {
      stats.push(stat(`2025-01-${String(d).padStart(2, '0')}`, { visits: 10, goalReaches: 1 }));
    }
    for (let d = 8; d <= 14; d += 1) {
      stats.push(stat(`2025-01-${String(d).padStart(2, '0')}`, { visits: 20, goalReaches: 3 }));
    }
    const wow = weekOverWeek(stats);
    expect(wow.currentVisits).toBe(140);
    expect(wow.previousVisits).toBe(70);
    expect(wow.visitsDelta).toBeCloseTo(1);
    expect(wow.currentReaches).toBe(21);
    expect(wow.previousReaches).toBe(7);
    expect(wow.reachesDelta).toBeCloseTo(2);
  });

  it('returns 0 deltas when there is no previous week (no divide-by-zero)', () => {
    const wow = weekOverWeek([stat('2025-01-01', { visits: 10, goalReaches: 2 })]);
    expect(wow.previousVisits).toBe(0);
    expect(wow.visitsDelta).toBe(0);
    expect(wow.reachesDelta).toBe(0);
  });
});

describe('trendsOption', () => {
  it('builds a two-line ECharts option (visits + reaches) over the dates', () => {
    const option = trendsOption(
      dailySeries([stat('2025-01-01', { visits: 10, goalReaches: 2 })]),
    ) as {
      xAxis: { data: string[] };
      series: { name: string; data: number[] }[];
    };
    expect(option.xAxis.data).toEqual(['2025-01-01']);
    expect(option.series[0]?.name).toBe('Визиты');
    expect(option.series[0]?.data).toEqual([10]);
    expect(option.series[1]?.data).toEqual([2]);
  });
});

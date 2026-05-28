import { describe, it, expect } from 'vitest';
import type { ChannelStat, B2bDeal } from '@pca/shared';
import { summarizeChannels, channelMixOption, dailyReachesOption, weakSpots } from './overview';

function stat(over: Partial<ChannelStat>): ChannelStat {
  return {
    date: '2025-01-01',
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
  };
}

describe('summarizeChannels', () => {
  it('application goal: paid = B2B paid only; gap = target - B2B paid (заявка ≠ оплата)', () => {
    const deals: B2bDeal[] = [
      { id: 1, company: 'A', tickets: 10, stage: 'paid', dateAdded: '2025-01-01' },
      { id: 2, company: 'B', tickets: 5, stage: 'lead', dateAdded: '2025-01-01' },
    ];
    const kpi = summarizeChannels([stat({ goalReaches: 5 }), stat({ goalReaches: 3 })], deals);
    // applications (8) are NOT payments for a plain goal → paid = 10, gap = 300 - 10.
    expect(kpi).toEqual({ target: 300, applications: 8, b2bPaid: 10, paid: 10, gap: 290 });
  });

  it('defaults paid/gap to 0/300 when no B2B deals and not a purchase goal', () => {
    const kpi = summarizeChannels([stat({ goalReaches: 5 })], []);
    expect(kpi).toEqual({ target: 300, applications: 5, b2bPaid: 0, paid: 0, gap: 300 });
  });

  it('purchase goal (goalIsPaid): goal reaches count as payments toward the target', () => {
    // 52 purchase reaches + 0 B2B paid → paid 52, gap 248 (matches Goals page & snapshot).
    const kpi = summarizeChannels([stat({ goalReaches: 52 })], [], true);
    expect(kpi).toEqual({ target: 300, applications: 52, b2bPaid: 0, paid: 52, gap: 248 });
  });

  it('purchase goal: B2B paid + purchase reaches both count; gap clamps at 0', () => {
    const deals: B2bDeal[] = [
      { id: 1, company: 'A', tickets: 280, stage: 'paid', dateAdded: '2025-01-01' },
    ];
    const kpi = summarizeChannels([stat({ goalReaches: 50 })], deals, true);
    // paid = 280 + 50 = 330 > 300 → gap clamped to 0.
    expect(kpi).toEqual({ target: 300, applications: 50, b2bPaid: 280, paid: 330, gap: 0 });
  });
});

describe('weakSpots', () => {
  it('flags channels with traffic but below-overall conversion, sorted by visits desc', () => {
    // overall CR = (1+1+9) / (100+50+10) = 11/160 ≈ 0.069.
    // podcast CR 0.01 (<overall, high traffic), direct CR 0.02 (<overall), vip CR 0.9 (>overall).
    const spots = weakSpots([
      stat({ channel: 'podcast', visits: 100, goalReaches: 1 }),
      stat({ channel: 'direct', visits: 50, goalReaches: 1 }),
      stat({ channel: 'vip', visits: 10, goalReaches: 9 }),
      stat({ channel: 'empty', visits: 0, goalReaches: 0 }), // zero visits → CR 0, excluded
    ]);
    expect(spots.map((s) => s.channel)).toEqual(['podcast', 'direct']);
    expect(spots[0]?.conversionRate).toBeCloseTo(0.01);
  });

  it('returns an empty list when there is no data (no divide-by-zero)', () => {
    expect(weakSpots([])).toEqual([]);
  });
});

describe('channelMixOption', () => {
  it('aggregates visits by channel (incl. repeated channel)', () => {
    const o = channelMixOption([
      stat({ channel: 'podcast', visits: 10 }),
      stat({ channel: 'podcast', visits: 5 }),
      stat({ channel: 'direct', visits: 2 }),
    ]) as { series: { data: { name: string; value: number }[] }[] };
    const byName = new Map(o.series[0]?.data.map((d) => [d.name, d.value]));
    expect(byName.get('podcast')).toBe(15);
    expect(byName.get('direct')).toBe(2);
  });

  it('includes a legend with channel names', () => {
    const o = channelMixOption([
      stat({ channel: 'podcast', visits: 10 }),
      stat({ channel: 'direct', visits: 2 }),
    ]) as { legend: { data: string[] } };
    expect(o.legend.data).toContain('podcast');
    expect(o.legend.data).toContain('direct');
  });
});

describe('dailyReachesOption', () => {
  it('aggregates reaches by date, sorted (incl. repeated date)', () => {
    const o = dailyReachesOption([
      stat({ date: '2025-01-02', goalReaches: 2 }),
      stat({ date: '2025-01-01', goalReaches: 1 }),
      stat({ date: '2025-01-01', goalReaches: 3 }),
    ]) as { xAxis: { data: string[] }; series: { data: number[] }[] };
    expect(o.xAxis.data).toEqual(['2025-01-01', '2025-01-02']);
    expect(o.series[0]?.data).toEqual([4, 2]);
  });
});

import { describe, it, expect } from 'vitest';
import type { PageStat } from '@pca/shared';
import { pageRows } from './behavior';

const page = (over: Partial<PageStat>): PageStat => ({
  date: '2025-01-01',
  page: '/lp',
  visits: 10,
  users: 9,
  bounceRate: 0.2,
  goalReaches: 1,
  conversionRate: 0.1,
  ...over,
});

describe('pageRows', () => {
  it('aggregates by page, visit-weights bounce rate, sorts by visits desc, guards zero visits', () => {
    const rows = pageRows([
      page({ page: '/lp', visits: 10, goalReaches: 1, bounceRate: 0.5 }),
      page({ page: '/lp', visits: 30, goalReaches: 2, bounceRate: 0.1 }),
      page({ page: '/pricing', visits: 5, goalReaches: 1, bounceRate: 0.4 }),
      page({ page: '/empty', visits: 0, goalReaches: 0, bounceRate: 0 }),
    ]);
    expect(rows[0]?.page).toBe('/lp');
    expect(rows[0]?.visits).toBe(40);
    // visit-weighted bounce: (0.5*10 + 0.1*30) / 40 = 0.2
    expect(rows[0]?.bounceRate).toBeCloseTo(0.2);
    expect(rows[0]?.conversionRate).toBeCloseTo(3 / 40);
    const empty = rows.find((r) => r.page === '/empty');
    expect(empty?.bounceRate).toBe(0);
    expect(empty?.conversionRate).toBe(0);
  });
});

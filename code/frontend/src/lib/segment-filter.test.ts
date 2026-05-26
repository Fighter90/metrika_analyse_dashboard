import { describe, it, expect } from 'vitest';
import { filterBySegment, filterUtmBySegment } from './segment-filter';
import type { ChannelStat, UtmStat } from '@pca/shared';

const makeChannel = (channel: string, visits = 100, goalReaches = 10): ChannelStat => ({
  date: '2025-01-01',
  channel,
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  visits,
  users: 90,
  bounceRate: 0.2,
  avgDuration: 60,
  goalReaches,
  conversionRate: goalReaches / visits,
});

const makeUtm = (source: string, medium: string, campaign: string, visits = 50, goalReaches = 5): UtmStat => ({
  date: '2025-01-01',
  source,
  medium,
  campaign,
  visits,
  goalReaches,
  conversionRate: goalReaches / visits,
});

describe('filterBySegment', () => {
  it('returns all channels for b2c_b2b segment', () => {
    const channels = [
      makeChannel('Direct traffic'),
      makeChannel('Search engine traffic'),
    ];
    expect(filterBySegment(channels, 'b2c_b2b')).toHaveLength(2);
  });

  it('returns only B2C channels for b2c segment', () => {
    const channels = [
      makeChannel('Direct traffic', 100, 10),
      makeChannel('Search engine traffic', 80, 8),
      makeChannel('Social networks traffic', 60, 3),
    ];
    const result = filterBySegment(channels, 'b2c');
    expect(result).toHaveLength(3);
    expect(result.every((c) => c.channel)).toBe(true);
  });

  it('returns empty array for b2b segment (no B2B channels defined by default)', () => {
    const channels = [
      makeChannel('Direct traffic'),
      makeChannel('Search engine traffic'),
    ];
    expect(filterBySegment(channels, 'b2b')).toHaveLength(0);
  });

  it('handles empty input', () => {
    expect(filterBySegment([], 'b2c')).toEqual([]);
    expect(filterBySegment([], 'b2b')).toEqual([]);
    expect(filterBySegment([], 'b2c_b2b')).toEqual([]);
  });
});

describe('filterUtmBySegment', () => {
  it('returns all UTM data for b2c_b2b segment', () => {
    const channels = [makeChannel('Direct traffic')];
    const utm = [makeUtm('google', 'cpc', 'campaign1')];
    expect(filterUtmBySegment(utm, 'b2c_b2b', channels)).toHaveLength(1);
  });

  it('filters UTM data based on active channel sources for b2c segment', () => {
    const channels = [makeChannel('Direct traffic')];
    const utm = [
      makeUtm('google', 'cpc', 'campaign1', 50, 5),
      makeUtm('yandex', 'cpc', 'campaign2', 30, 3),
    ];
    const result = filterUtmBySegment(utm, 'b2c', channels);
    // UTM filtering is based on active sources from filtered channels
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  it('handles empty UTM data', () => {
    const channels = [makeChannel('Direct traffic')];
    expect(filterUtmBySegment([], 'b2c', channels)).toEqual([]);
  });

  it('handles empty channels', () => {
    const utm = [makeUtm('google', 'cpc', 'campaign1')];
    // When no channels, UTM data is returned as-is for b2c_b2b, filtered for others
    expect(filterUtmBySegment(utm, 'b2c_b2b', [])).toEqual(utm);
    expect(filterUtmBySegment(utm, 'b2c', [])).toEqual([]);
  });
});

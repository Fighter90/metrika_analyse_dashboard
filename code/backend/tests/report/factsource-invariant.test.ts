import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { periodTotals } from '@pca/shared';
import type { DB } from '../../src/db/connection';
import { MetricsRepo } from '../../src/db/repositories/metrics-repo';
import { HypothesesRepo } from '../../src/db/repositories/hypotheses-repo';
import { DecisionsRepo } from '../../src/db/repositories/decisions-repo';
import { B2bRepo } from '../../src/db/repositories/b2b-repo';
import { SnapshotBuilder } from '../../src/report/snapshot-builder';
import { freshDb } from '../db/helpers';

/**
 * §2 invariant: every surface that shows «Визиты»/«Заявки» derives them from the SAME factsource —
 * `periodTotals(channel_stats)`. Overview / Goals / Funnel (frontend) call periodTotals directly;
 * the report snapshot computes funnel.visits/kpi from the same channel rows. This test pins that
 * the snapshot agrees with periodTotals, so the numbers can never diverge between pages.
 */
let db: DB;
let metrics: MetricsRepo;
let builder: SnapshotBuilder;

const ch = (date: string, channel: string, visits: number, goalReaches: number) => ({
  date,
  channel,
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  visits,
  users: visits,
  bounceRate: 0.2,
  avgDuration: 60,
  goalReaches,
  conversionRate: visits ? goalReaches / visits : 0,
});

beforeEach(() => {
  db = freshDb();
  metrics = new MetricsRepo(db);
  builder = new SnapshotBuilder({
    metrics,
    hypotheses: new HypothesesRepo(db),
    decisions: new DecisionsRepo(db),
    b2b: new B2bRepo(db),
  });
  // Multiple channels across multiple days — the realistic shape.
  metrics.upsertChannelStats([
    ch('2025-01-01', 'direct', 100, 5),
    ch('2025-01-01', 'search', 40, 3),
    ch('2025-01-02', 'direct', 60, 2),
    ch('2025-01-03', 'ads', 25, 0),
  ]);
});
afterEach(() => db.close());

describe('factsource invariant — visits/applications consistent across surfaces', () => {
  it('snapshot funnel.visits + kpi == periodTotals(channels) (the value Overview/Goals/Funnel show)', () => {
    const channels = metrics.listChannelStats({ from: '2025-01-01', to: '2025-01-07' });
    const fact = periodTotals(channels);
    const snap = builder.build({ id: 's', generatedAt: 'T', from: '2025-01-01', to: '2025-01-07' });

    // Visits: factsource == snapshot funnel == snapshot funnel headline.
    expect(fact.visits).toBe(225); // 100+40+60+25
    expect(snap.funnel.visits).toBe(fact.visits);

    // Applications (goal reaches): factsource == snapshot kpi == snapshot funnel.
    expect(fact.applications).toBe(10); // 5+3+2+0
    expect(snap.kpi.b2cApplications).toBe(fact.applications);
    expect(snap.funnel.b2cApplications).toBe(fact.applications);
  });

  it('stays consistent when the period excludes some days', () => {
    const channels = metrics.listChannelStats({ from: '2025-01-01', to: '2025-01-01' });
    const fact = periodTotals(channels);
    const snap = builder.build({
      id: 's2',
      generatedAt: 'T',
      from: '2025-01-01',
      to: '2025-01-01',
    });
    expect(snap.funnel.visits).toBe(fact.visits); // both = 140 (only day 1)
    expect(fact.visits).toBe(140);
  });
});

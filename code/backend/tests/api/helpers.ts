import type { FastifyInstance, FastifyServerOptions } from 'fastify';
import { buildServer, type AppDeps } from '../../src/app';
import type { DB } from '../../src/db/connection';
import { MetricsRepo } from '../../src/db/repositories/metrics-repo';
import { HypothesesRepo } from '../../src/db/repositories/hypotheses-repo';
import { DecisionsRepo } from '../../src/db/repositories/decisions-repo';
import { B2bRepo } from '../../src/db/repositories/b2b-repo';
import { freshDb } from '../db/helpers';

export interface TestApp {
  readonly app: FastifyInstance;
  readonly db: DB;
  readonly deps: AppDeps;
}

/** Assemble the full app over an in-memory DB. Pass a logger to exercise that arg explicitly. */
export function buildTestApp(logger?: FastifyServerOptions['logger']): TestApp {
  const db = freshDb();
  const deps: AppDeps = {
    metrics: new MetricsRepo(db),
    hypotheses: new HypothesesRepo(db),
    decisions: new DecisionsRepo(db),
    b2b: new B2bRepo(db),
    runSync: async () => ({ goals: 0, days: 0, channelRows: 0 }),
  };
  const app = logger === undefined ? buildServer(deps) : buildServer(deps, logger);
  return { app, db, deps };
}

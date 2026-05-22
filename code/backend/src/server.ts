import { buildServer } from './app';
import { config } from './config';
import { openDb } from './db/connection';
import { migrate } from './db/migrate';
import { MetricsRepo } from './db/repositories/metrics-repo';
import { HypothesesRepo } from './db/repositories/hypotheses-repo';
import { DecisionsRepo } from './db/repositories/decisions-repo';
import { B2bRepo } from './db/repositories/b2b-repo';
import { makeSyncRunner } from './metrika/production-sync';

/** Entry point. Excluded from coverage — opens the real DB and binds the port. */
async function main(): Promise<void> {
  const db = openDb(config.DB_PATH);
  migrate(db);
  const app = buildServer(
    {
      metrics: new MetricsRepo(db),
      hypotheses: new HypothesesRepo(db),
      decisions: new DecisionsRepo(db),
      b2b: new B2bRepo(db),
      runSync: makeSyncRunner(),
    },
    true,
  );
  try {
    await app.listen({ port: config.API_PORT, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void main();

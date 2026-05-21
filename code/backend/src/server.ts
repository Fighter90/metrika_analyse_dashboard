import { buildServer } from './app';
import { config } from './config';

/** Entry point. Excluded from coverage — pure bootstrap. */
async function main(): Promise<void> {
  const app = buildServer(true);
  try {
    await app.listen({ port: config.API_PORT, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void main();

import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import { healthRoutes } from './routes/health';

/**
 * Build the Fastify app without listening — keeps it testable via `app.inject()`.
 * Logger defaults to off so tests stay quiet; the entry point passes `true`.
 */
export function buildServer(logger: FastifyServerOptions['logger'] = false): FastifyInstance {
  const app = Fastify({ logger });
  app.register(healthRoutes, { prefix: '/api' });
  return app;
}

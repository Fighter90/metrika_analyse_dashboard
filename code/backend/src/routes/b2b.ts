import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { NewB2bDeal } from '@pca/shared';
import type { B2bRepo } from '../db/repositories/b2b-repo';

export interface B2bRouteOptions {
  readonly repo: B2bRepo;
}

const StageBody = z.object({
  stage: z.enum(['lead', 'negotiation', 'invoiced', 'paid']),
  datePaid: z.string().optional(),
});

/** Manual B2B pipeline CRUD. */
export async function b2bRoutes(app: FastifyInstance, opts: B2bRouteOptions): Promise<void> {
  app.get('/b2b', { schema: { tags: ['b2b'] } }, async () => opts.repo.list());

  app.post('/b2b', { schema: { tags: ['b2b'] } }, async (req, reply) =>
    reply.code(201).send(opts.repo.create(req.body as NewB2bDeal)),
  );

  app.patch('/b2b/:id', { schema: { tags: ['b2b'] } }, async (req, reply) => {
    const parsed = StageBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid stage' });
    const updated = opts.repo.updateStage(
      Number((req.params as { id: string }).id),
      parsed.data.stage,
      parsed.data.datePaid,
    );
    return updated ?? reply.code(404).send({ error: 'not found' });
  });

  app.delete('/b2b/:id', { schema: { tags: ['b2b'] } }, async (req, reply) => {
    const removed = opts.repo.remove(Number((req.params as { id: string }).id));
    return removed ? reply.code(204).send() : reply.code(404).send({ error: 'not found' });
  });
}

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import pino from 'pino';
import { env } from '../config/env.js';
import { mapsRoutes } from '../routes/maps.routes.js';
import { MapsService } from '../services/maps/maps.service.js';
import { mockProvider } from '../services/providers/mock.provider.js';
import { orsProvider } from '../services/providers/ors.provider.js';
import { httpDuration, metricsRegistry } from './metrics.js';

export const buildApp = () => {
  const app = Fastify({
    logger: pino({ level: env.NODE_ENV === 'production' ? 'info' : 'debug' }),
    bodyLimit: 1024 * 20,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
  });

  const provider = env.ORS_API_KEY ? orsProvider : env.NODE_ENV === 'production' ? null : mockProvider;
  if (!provider) throw new Error('ORS_API_KEY is required in production');

  const mapsService = new MapsService(provider);
  app.decorate('mapsService', mapsService);

  app.register(cors, { origin: true });
  app.register(helmet);

  app.addHook('onResponse', (req, res, done) => {
    const route = req.routerPath ?? req.url;
    httpDuration.observe(
      { route, method: req.method, status_code: String(res.statusCode) },
      res.elapsedTime,
    );
    done();
  });

  app.get('/metrics', async (_req, reply) => {
    reply.type(metricsRegistry.contentType);
    return metricsRegistry.metrics();
  });

  app.get('/health', async () => ({ ok: true }));

  app.register(mapsRoutes);

  return app;
};

declare module 'fastify' {
  interface FastifyInstance {
    mapsService: MapsService;
  }
}

import { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { cacheHits, cacheMisses, providerErrors, providerLatency } from '../server/metrics.js';
import { classifyCaller, checkRateLimit } from '../services/rateLimit/rateLimiter.js';
import { autocompleteSchema, reverseGeocodeSchema, routeSchema } from '../utils/validation.js';

const now = () => performance.now();

export const mapsRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get('/api/maps/config', async (req, reply) => {
    return reply.send({
      ok: true,
      data: {
        styleUrl: env.MAP_STYLE_URL,
        tileAttribution: env.MAP_TILE_ATTRIBUTION,
        defaultCountryBias: env.ORS_COUNTRY_BIAS,
        provider: 'ORS',
      },
      meta: { requestId: req.id },
    });
  });

  app.post('/api/maps/autocomplete', async (req, reply) => {
    try {
      const body = autocompleteSchema.parse(req.body);
      const tier = classifyCaller(req.headers['x-api-key'] as string | undefined);
      const limit = checkRateLimit({ key: `ac:${tier}:${req.ip}`, isReverse: false, tier });
      if (!limit.allowed) {
        return reply.code(429).send({
          ok: false,
          error: { code: 'RATE_LIMITED', message: 'Too many requests' },
          requestId: req.id,
        });
      }
      const t0 = now();
      const result = await app.mapsService.autocomplete(body.query, body.location);
      const durationMs = now() - t0;
      providerLatency.observe({ operation: 'autocomplete', provider: 'ORS' }, durationMs);
      if (result.cacheHit) cacheHits.inc();
      else cacheMisses.inc();
      return reply.send({
        ok: true,
        data: result.data,
        meta: { requestId: req.id, cacheHit: result.cacheHit, provider: 'ORS', durationMs },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send({
          ok: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid payload', details: error.flatten() },
          requestId: req.id,
        });
      }
      providerErrors.inc({ operation: 'autocomplete', provider: 'ORS' });
      return reply.code(502).send({
        ok: false,
        error: { code: 'PROVIDER_ERROR', message: (error as Error).message },
        requestId: req.id,
      });
    }
  });

  app.post('/api/maps/reverse-geocode', async (req, reply) => {
    try {
      const body = reverseGeocodeSchema.parse(req.body);
      const tier = classifyCaller(req.headers['x-api-key'] as string | undefined);
      const limit = checkRateLimit({ key: `rg:${tier}:${req.ip}`, isReverse: true, tier });
      if (!limit.allowed) {
        return reply.code(429).send({ ok: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' }, requestId: req.id });
      }
      const t0 = now();
      const result = await app.mapsService.reverseGeocode(body.lat, body.lng);
      const durationMs = now() - t0;
      providerLatency.observe({ operation: 'reverse', provider: 'ORS' }, durationMs);
      if (result.cacheHit) cacheHits.inc();
      else cacheMisses.inc();
      return reply.send({ ok: true, data: result.data, meta: { requestId: req.id, cacheHit: result.cacheHit, provider: 'ORS', durationMs } });
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid payload', details: error.flatten() }, requestId: req.id });
      }
      providerErrors.inc({ operation: 'reverse', provider: 'ORS' });
      return reply.code(502).send({ ok: false, error: { code: 'PROVIDER_ERROR', message: (error as Error).message }, requestId: req.id });
    }
  });

  app.post('/api/maps/route', async (req, reply) => {
    try {
      const body = routeSchema.parse(req.body);
      const tier = classifyCaller(req.headers['x-api-key'] as string | undefined);
      const limit = checkRateLimit({ key: `rt:${tier}:${req.ip}`, isReverse: false, tier });
      if (!limit.allowed) {
        return reply.code(429).send({ ok: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' }, requestId: req.id });
      }
      const t0 = now();
      const result = await app.mapsService.route(body.origin, body.destination, body.travelMode);
      const durationMs = now() - t0;
      providerLatency.observe({ operation: 'route', provider: 'ORS' }, durationMs);
      if (result.cacheHit) cacheHits.inc();
      else cacheMisses.inc();
      return reply.send({ ok: true, data: result.data, meta: { requestId: req.id, cacheHit: result.cacheHit, provider: 'ORS', durationMs } });
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.code(400).send({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid payload', details: error.flatten() }, requestId: req.id });
      }
      providerErrors.inc({ operation: 'route', provider: 'ORS' });
      return reply.code(502).send({ ok: false, error: { code: 'PROVIDER_ERROR', message: (error as Error).message }, requestId: req.id });
    }
  });
};

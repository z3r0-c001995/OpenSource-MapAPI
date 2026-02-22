import client from 'prom-client';

client.collectDefaultMetrics();

export const httpDuration = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration in ms',
  labelNames: ['route', 'method', 'status_code'],
  buckets: [20, 50, 100, 200, 400, 800, 1500, 3000],
});

export const cacheHits = new client.Counter({ name: 'maps_cache_hits_total', help: 'Cache hits' });
export const cacheMisses = new client.Counter({ name: 'maps_cache_misses_total', help: 'Cache misses' });
export const providerLatency = new client.Histogram({
  name: 'provider_latency_ms',
  help: 'Provider latency in ms',
  labelNames: ['operation', 'provider'],
  buckets: [20, 50, 100, 200, 400, 800, 1500, 3000, 5000],
});
export const providerErrors = new client.Counter({
  name: 'provider_errors_total',
  help: 'Provider errors',
  labelNames: ['operation', 'provider'],
});

export const metricsRegistry = client.register;

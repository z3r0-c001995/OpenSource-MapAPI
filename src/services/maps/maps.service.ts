import { env } from '../../config/env.js';
import type { LatLng, MapsTravelMode } from '../../types/maps.js';
import { readCache, writeCache } from '../cache/cache.js';
import type { MapsProvider } from '../providers/mapsProvider.js';

const inFlight = new Map<string, Promise<unknown>>();

const roundCoord = (n: number): number => Math.round(n * 1000) / 1000;

const key = (prefix: string, data: unknown): string => `${prefix}:${JSON.stringify(data)}`;

const singleFlight = async <T>(id: string, fn: () => Promise<T>): Promise<T> => {
  const pending = inFlight.get(id);
  if (pending) return pending as Promise<T>;
  const run = fn().finally(() => inFlight.delete(id));
  inFlight.set(id, run);
  return run;
};

const cached = async <T>(cacheKey: string, producer: () => Promise<T>): Promise<{ data: T; cacheHit: boolean }> => {
  const found = await readCache<T>(cacheKey);
  if (found.kind === 'fresh') return { data: found.value, cacheHit: true };
  if (found.kind === 'stale') {
    void singleFlight(`${cacheKey}:refresh`, async () => {
      const fresh = await producer();
      await writeCache(cacheKey, fresh, env.MAPS_CACHE_TTL_MS, env.MAPS_CACHE_STALE_TTL_MS);
      return fresh;
    });
    return { data: found.value, cacheHit: true };
  }
  const data = await singleFlight(cacheKey, producer);
  await writeCache(cacheKey, data, env.MAPS_CACHE_TTL_MS, env.MAPS_CACHE_STALE_TTL_MS);
  return { data, cacheHit: false };
};

export class MapsService {
  constructor(private provider: MapsProvider) {}

  async autocomplete(query: string, location?: LatLng, countryBias = env.ORS_COUNTRY_BIAS) {
    const cacheKey = key('ac', {
      q: query.toLowerCase().trim(),
      loc: location ? [roundCoord(location.lat), roundCoord(location.lng)] : null,
      c: countryBias,
    });
    return cached(cacheKey, () => this.provider.autocomplete({ query, location, countryBias }));
  }

  async reverseGeocode(lat: number, lng: number, countryBias = env.ORS_COUNTRY_BIAS) {
    const cacheKey = key('rg', {
      lat: roundCoord(lat),
      lng: roundCoord(lng),
      c: countryBias,
    });
    return cached(cacheKey, () => this.provider.reverseGeocode({ lat, lng, countryBias }));
  }

  async route(origin: LatLng, destination: LatLng, travelMode: MapsTravelMode, countryBias = env.ORS_COUNTRY_BIAS) {
    const cacheKey = key('rt', {
      o: [roundCoord(origin.lat), roundCoord(origin.lng)],
      d: [roundCoord(destination.lat), roundCoord(destination.lng)],
      m: travelMode,
      c: countryBias,
    });
    return cached(cacheKey, () =>
      this.provider.computeRoute({ origin, destination, travelMode, countryBias }),
    );
  }
}

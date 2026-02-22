import { env } from '../../config/env.js';
import { fetchWithPolicy } from '../../utils/fetchWithPolicy.js';
import type { AutocompleteItem, MapsTravelMode, ReverseGeocodeResult, RouteResult } from '../../types/maps.js';
import type { MapsProvider } from './mapsProvider.js';

const modeMap: Record<MapsTravelMode, string> = {
  DRIVE: 'driving-car',
  WALK: 'foot-walking',
  BIKE: 'cycling-regular',
};

const headers = () => ({
  Authorization: env.ORS_API_KEY ?? '',
  'Content-Type': 'application/json',
});

export const orsProvider: MapsProvider = {
  name: 'ORS',

  async autocomplete({ query, location, countryBias }): Promise<AutocompleteItem[]> {
    const text = encodeURIComponent(query);
    const focus = location ? `&focus.point.lon=${location.lng}&focus.point.lat=${location.lat}` : '';
    const url = `${env.ORS_BASE_URL}/geocode/autocomplete?text=${text}&boundary.country=${countryBias}${focus}`;
    const resp = await fetchWithPolicy(url, { method: 'GET', headers: headers(), timeoutMs: 1500 });
    if (!resp.ok) throw new Error(`ORS autocomplete failed: ${resp.status}`);
    const json = (await resp.json()) as any;
    return (json.features ?? []).map((f: any) => ({
      id: String(f.properties?.id ?? f.properties?.gid ?? crypto.randomUUID()),
      label: f.properties?.label ?? f.properties?.name ?? query,
      country: f.properties?.country ?? 'Unknown',
      region: f.properties?.region,
      location: { lat: f.geometry?.coordinates?.[1], lng: f.geometry?.coordinates?.[0] },
      bbox: f.bbox,
      source: 'ORS',
    }));
  },

  async reverseGeocode({ lat, lng, countryBias }): Promise<ReverseGeocodeResult> {
    const url = `${env.ORS_BASE_URL}/geocode/reverse?point.lon=${lng}&point.lat=${lat}&boundary.country=${countryBias}`;
    const resp = await fetchWithPolicy(url, { method: 'GET', headers: headers(), timeoutMs: 1000 });
    if (!resp.ok) throw new Error(`ORS reverse geocode failed: ${resp.status}`);
    const json = (await resp.json()) as any;
    const f = json.features?.[0];
    return {
      formatted: f?.properties?.label ?? 'Unknown location',
      components: {
        road: f?.properties?.street,
        neighbourhood: f?.properties?.neighbourhood,
        city: f?.properties?.locality,
        state: f?.properties?.region,
        country: f?.properties?.country,
        postcode: f?.properties?.postalcode,
      },
      location: { lat, lng },
      confidence: f?.properties?.confidence,
      source: 'ORS',
    };
  },

  async computeRoute({ origin, destination, travelMode }): Promise<RouteResult> {
    const profile = modeMap[travelMode];
    const url = `${env.ORS_BASE_URL}/v2/directions/${profile}`;
    const resp = await fetchWithPolicy(url, {
      method: 'POST',
      headers: headers(),
      timeoutMs: 3500,
      retries: 1,
      body: JSON.stringify({
        coordinates: [
          [origin.lng, origin.lat],
          [destination.lng, destination.lat],
        ],
        instructions: true,
        alternative_routes: { target_count: 2 },
      }),
    });
    if (!resp.ok) throw new Error(`ORS route failed: ${resp.status}`);
    const json = (await resp.json()) as any;
    const route = json.routes?.[0];

    const base: RouteResult = {
      distanceMeters: route?.summary?.distance ?? 0,
      durationSeconds: route?.summary?.duration ?? 0,
      polyline: {
        encoding: 'polyline5',
        value: route?.geometry ?? '',
      },
      bbox: route?.bbox,
      steps: (route?.segments ?? []).flatMap((s: any) =>
        (s.steps ?? []).map((st: any) => ({
          instruction: st.instruction,
          distanceMeters: st.distance,
          durationSeconds: st.duration,
        })),
      ),
      source: 'ORS',
    };

    const alternatives = (json.routes ?? []).slice(1, 3).map((alt: any) => ({
      distanceMeters: alt.summary?.distance ?? 0,
      durationSeconds: alt.summary?.duration ?? 0,
      polyline: { encoding: 'polyline5' as const, value: alt.geometry ?? '' },
      bbox: alt.bbox,
      steps: (alt.segments ?? []).flatMap((s: any) =>
        (s.steps ?? []).map((st: any) => ({
          instruction: st.instruction,
          distanceMeters: st.distance,
          durationSeconds: st.duration,
        })),
      ),
      source: 'ORS' as const,
    }));

    if (alternatives.length) base.alternatives = alternatives;
    return base;
  },
};

export type LatLng = { lat: number; lng: number };

export type MapsTravelMode = 'DRIVE' | 'WALK' | 'BIKE';

export type ApiMeta = {
  requestId: string;
  cacheHit?: boolean;
  provider?: string;
  durationMs?: number;
};

export type SuccessEnvelope<T> = {
  ok: true;
  data: T;
  meta: ApiMeta;
};

export type ErrorEnvelope = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId: string;
};

export type AutocompleteItem = {
  id: string;
  label: string;
  country: string;
  region?: string;
  location: LatLng;
  bbox?: [number, number, number, number];
  source: 'ORS';
};

export type ReverseGeocodeResult = {
  formatted: string;
  components: {
    road?: string;
    neighbourhood?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
  location: LatLng;
  confidence?: number;
  source: 'ORS';
};

export type RouteStep = {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
};

export type RouteResult = {
  distanceMeters: number;
  durationSeconds: number;
  polyline: { encoding: 'polyline6' | 'polyline5'; value: string };
  bbox?: [number, number, number, number];
  steps?: RouteStep[];
  alternatives?: Array<Omit<RouteResult, 'alternatives'>>;
  source: 'ORS';
};

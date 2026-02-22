import type { AutocompleteItem, LatLng, MapsTravelMode, ReverseGeocodeResult, RouteResult } from '../../types/maps.js';

export interface MapsProvider {
  name: 'ORS' | 'MOCK';
  autocomplete(input: { query: string; location?: LatLng; countryBias: string }): Promise<AutocompleteItem[]>;
  reverseGeocode(input: { lat: number; lng: number; countryBias: string }): Promise<ReverseGeocodeResult>;
  computeRoute(input: {
    origin: LatLng;
    destination: LatLng;
    travelMode: MapsTravelMode;
    countryBias: string;
  }): Promise<RouteResult>;
}

import type { LatLng, MapsTravelMode } from '../../types/maps.js';
import { MapsService } from './maps.service.js';

export const buildMapsTrpcCompat = (mapsService: MapsService) => ({
  placesAutocomplete: (input: { query: string; location?: LatLng }) =>
    mapsService.autocomplete(input.query, input.location).then((r) => r.data),
  reverseGeocode: (input: { lat: number; lng: number }) =>
    mapsService.reverseGeocode(input.lat, input.lng).then((r) => r.data),
  computeRoute: (input: { origin: LatLng; destination: LatLng; travelMode: MapsTravelMode }) =>
    mapsService.route(input.origin, input.destination, input.travelMode).then((r) => r.data),
});

import type { MapsProvider } from './mapsProvider.js';

export const mockProvider: MapsProvider = {
  name: 'MOCK',
  async autocomplete(input) {
    return [
      {
        id: 'mock-1',
        label: `${input.query}, Lusaka, Zambia`,
        country: 'Zambia',
        region: 'Lusaka',
        location: input.location ?? { lat: -15.3875, lng: 28.3228 },
        source: 'ORS',
      },
    ];
  },
  async reverseGeocode(input) {
    return {
      formatted: 'Mock Address, Lusaka, Zambia',
      components: { city: 'Lusaka', country: 'Zambia' },
      location: { lat: input.lat, lng: input.lng },
      confidence: 0.75,
      source: 'ORS',
    };
  },
  async computeRoute() {
    return {
      distanceMeters: 8500,
      durationSeconds: 1020,
      polyline: { encoding: 'polyline5', value: 'mock_polyline' },
      steps: [{ instruction: 'Head east', distanceMeters: 8500, durationSeconds: 1020 }],
      source: 'ORS',
    };
  },
};

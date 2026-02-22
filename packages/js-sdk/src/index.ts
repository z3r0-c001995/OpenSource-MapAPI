export class OpenSourceMapApiClient {
  constructor(private baseUrl: string, private apiKey?: string) {}

  private async req(path: string, init?: RequestInit): Promise<any> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(this.apiKey ? { 'x-api-key': this.apiKey } : {}),
        ...(init?.headers ?? {}),
      },
    });
    return res.json();
  }

  getConfig() {
    return this.req('/api/maps/config');
  }
  autocomplete(payload: { query: string; location?: { lat: number; lng: number } }) {
    return this.req('/api/maps/autocomplete', { method: 'POST', body: JSON.stringify(payload) });
  }
  reverseGeocode(payload: { lat: number; lng: number }) {
    return this.req('/api/maps/reverse-geocode', { method: 'POST', body: JSON.stringify(payload) });
  }
  route(payload: {
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
    travelMode: 'DRIVE' | 'WALK' | 'BIKE';
  }) {
    return this.req('/api/maps/route', { method: 'POST', body: JSON.stringify(payload) });
  }
}

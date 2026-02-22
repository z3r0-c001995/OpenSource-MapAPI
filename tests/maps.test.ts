import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/server/app.js';

let app: ReturnType<typeof buildApp>;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.ORS_API_KEY = '';
  app = buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('maps endpoints', () => {
  it('GET /api/maps/config', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/maps/config' });
    expect(res.statusCode).toBe(200);
    expect(res.json().ok).toBe(true);
  });

  it('POST /api/maps/autocomplete', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/maps/autocomplete',
      payload: { query: 'East Park Mall', location: { lat: -15.4, lng: 28.2 } },
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
  });

  it('POST /api/maps/reverse-geocode validates input', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/maps/reverse-geocode',
      payload: { lat: 500, lng: 28.2 },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().ok).toBe(false);
  });

  it('POST /api/maps/route', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/maps/route',
      payload: {
        origin: { lat: -15.4067, lng: 28.2871 },
        destination: { lat: -15.3305, lng: 28.4529 },
        travelMode: 'DRIVE',
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.distanceMeters).toBeGreaterThan(0);
  });
});

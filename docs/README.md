# OpenSource MapAPI

Production-ready Zambia-focused map API with ORS + MapLibre integration.

## Endpoints
- `GET /api/maps/config`
- `POST /api/maps/autocomplete`
- `POST /api/maps/reverse-geocode`
- `POST /api/maps/route`

## Quickstart
```bash
cp .env.example .env
npm install
npm run dev
```

## Env vars
- `ORS_API_KEY`
- `ORS_BASE_URL`
- `ORS_TIMEOUT_MS`
- `ORS_COUNTRY_BIAS`
- `MAP_STYLE_URL`
- `MAP_TILE_ATTRIBUTION`
- `MAPS_CACHE_TTL_MS`
- `MAPS_RATE_WINDOW_MS`
- `MAPS_RATE_MAX`

## cURL
```bash
curl -s http://localhost:3000/api/maps/config | jq

curl -s -X POST http://localhost:3000/api/maps/autocomplete \
  -H 'content-type: application/json' \
  -d '{"query":"East Park Mall","location":{"lat":-15.4067,"lng":28.2871}}' | jq

curl -s -X POST http://localhost:3000/api/maps/reverse-geocode \
  -H 'content-type: application/json' \
  -d '{"lat":-15.4067,"lng":28.2871}' | jq

curl -s -X POST http://localhost:3000/api/maps/route \
  -H 'content-type: application/json' \
  -d '{"origin":{"lat":-15.4067,"lng":28.2871},"destination":{"lat":-15.3305,"lng":28.4529},"travelMode":"DRIVE"}' | jq
```

# API Understanding Notes

## Overview
The repository documents an open-source mapping stack for a taxi/ride-hailing product using:
- **MapLibre** for client map rendering.
- **OpenStreetMap (OSM)** for map data/tiles.
- **OpenRouteService (ORS)** for geocoding and routing.
- **Socket.IO** for realtime trip/driver updates.

## Existing Backend Capabilities
Documented backend support includes:
- `maps.placesAutocomplete`
- `maps.reverseGeocode`
- `maps.computeRoute`

It also references ride-hailing modules for driver tracking, trip orchestration, and state transitions.

## Public REST Surface (`/api/maps/*`)
The quickstart describes these endpoints:
- `GET /api/maps/config`
- `POST /api/maps/autocomplete`
- `POST /api/maps/reverse-geocode`
- `POST /api/maps/route`

These map to the ORS-backed router and are intended to provide map config, place search, reverse geocoding, and route/ETA data.

## Key Integration Flow
Suggested frontend flow:
1. Render MapLibre style from provider URL.
2. Use autocomplete for pickup/dropoff input.
3. Use reverse-geocode for dragged map pins.
4. Use route endpoint to draw trip polyline and ETA.
5. Subscribe to trip events via Socket.IO for live tracking.

## Operational Notes
- Keep `ORS_API_KEY` server-side.
- Use managed/self-hosted tiles for production scale (avoid public OSM tile endpoints at volume).
- Apply rate limits and stale/suspicious location protections.
- Tune environment variables for cache, rate window, and realtime thresholds.

## Architecture Upgrade Guidance (Zambia Taxi Focus)
Short truth first: beating Google Maps globally is unrealistic, but this API can be faster and better for Zambia taxi workflows by optimizing for local routes, cities, and rider behavior.

1. **Move from in-memory cache to Redis (highest immediate ROI).**
   - Share warm cache across all API instances.
   - Improve repeat request latency for autocomplete/reverse/route.
   - Reduce ORS load and improve consistency during horizontal scaling.

2. **Precompute high-demand routes (airport, malls, CBD corridors).**
   - Precompute and refresh ETA/route for top origin-destination pairs (for example, KKIA ↔ Lusaka hotspots).
   - Enables sub-100ms responses for common trip searches.

3. **Adopt geospatial DB lookup for nearby drivers (PostGIS/H3).**
   - Replace broad in-memory radius filtering early when dispatch latency becomes critical.
   - Improves matching quality and query performance under fleet density.

4. **Add stale-while-revalidate cache behavior to map endpoints.**
   - Return cached results instantly and refresh asynchronously near expiry.
   - Improves P95 responsiveness during provider slowness.

5. **Use endpoint-specific timeout/retry policies for ORS calls.**
   - `autocomplete`: short timeout.
   - `reverse-geocode`: very short timeout.
   - `route`: slightly longer timeout with one bounded retry.

6. **Run API + cache in-region (or nearest region to Zambia traffic).**
   - Lower network latency directly improves realtime loops and user responsiveness.

7. **Add local ETA post-processing model.**
   - Build time-of-day corridor speed profiles.
   - Add weather/event multipliers and fleet-observed speeds.
   - Use ORS route outputs as base, then apply Zambia-specific ETA correction.

8. **Return route alternatives and ETA confidence bands.**
   - Include primary + 1-2 alternatives.
   - Add confidence range (for example, 12-16 minutes) for UX transparency.

9. **Instrument full observability for performance + reliability.**
   - Track endpoint latency (P50/P95/P99).
   - Track ORS latency, cache hit ratio, fallback usage %, and dispatch assignment time.

10. **Keep Zambia-only specialization as a deliberate strategy.**
   - Maintain location bias/bounds to reduce irrelevant search scope and improve quality.

### Practical Roadmap
- **Phase 1 (1-2 weeks):** Redis shared cache, metrics dashboard, endpoint-specific timeout/retry, precompute top 100 OD pairs.
- **Phase 2 (2-4 weeks):** PostGIS nearby-driver queries, ETA model v1 (time-of-day + corridor), route alternatives.
- **Phase 3:** live traffic weighting from fleet telemetry, advanced anti-spoof/anomaly correction, multi-region resilience.

### Direct Answer: “Better Than Google Maps?”
- **Globally:** no.
- **For Zambia taxi workflows:** yes, if optimization focuses on local demand patterns, dispatch latency, and ETA consistency.


## Additional Open-Source Improvements for a Zambia-Specific Map API
1. **Run your own geocoder/routing stack for Zambia-first resilience.**
   - Use `Nominatim` (or `Pelias`) for geocoding and `Valhalla`/`OSRM` for routing as a fallback or primary for local trips.
   - Keep ORS as secondary provider to reduce vendor risk and improve outage tolerance.

2. **Maintain Zambia-focused OSM extracts and rapid map updates.**
   - Ingest `Geofabrik` Zambia extracts and apply minutely/hourly diffs with `pyosmium`/`osm2pgsql`.
   - Prioritize local POI curation (bus stations, markets, compounds, landmarks riders actually use).

3. **Build a place-alias layer for local language and colloquial names.**
   - Add synonym tables for common local references (e.g., malls, stages, compounds, junction nicknames).
   - Use PostgreSQL full-text + trigram (`pg_trgm`) ranking on top of official OSM names.

4. **Map matching for noisy GPS in dense or low-signal areas.**
   - Apply `Valhalla`/`OSRM` map matching before ETA and fraud checks.
   - Reduces false jump detection and improves driver trace quality.

5. **Road graph customization for taxi reality.**
   - Add penalties/weights for known bottlenecks, unpaved roads, seasonal flooding segments, and turn friction.
   - Keep a Zambia override table applied after base OSM graph build.

6. **Tile and edge caching tuned to Lusaka/Copperbelt hotspots.**
   - Use `TileServer GL`/`tegola` with CDN caching and hotspot prewarming.
   - Cache route matrix results for recurring demand clusters and shift-change peaks.

7. **Fleet-telemetry traffic layer using open tooling.**
   - Stream telemetry to `Kafka`/`Redpanda` and compute corridor speeds with `Flink` or scheduled jobs.
   - Publish lightweight traffic multipliers consumed by ETA service.

8. **Offline-first driver support.**
   - Ship prepacked MBTiles/vector tiles for key cities and allow queued location updates during dropouts.
   - Improves continuity where network quality is inconsistent.

9. **Data quality operations as a product loop.**
   - Add a “report wrong place/road” endpoint; review and push corrections to internal overrides + OSM contributions.
   - Track map QA metrics per district (missing roads, reverse-geocode precision, pickup success rate).

10. **Security and abuse controls for location APIs.**
   - Use per-device signatures, rate classes by actor type (rider/driver/system), and replay detection.
   - Keep audit trails in immutable storage (e.g., object storage + checksum manifests).

### Zambia-Centric Open-Source Stack (Suggested)
- **Geocoding/Search:** Nominatim or Pelias + PostgreSQL/Elastic/OpenSearch.
- **Routing/Map Matching:** Valhalla (preferred for multi-costing) or OSRM.
- **Spatial DB:** PostgreSQL + PostGIS (+ optional H3 extensions).
- **Tiles:** OpenMapTiles + TileServer GL/tegola + CDN.
- **Streaming/Telemetry:** Redpanda/Kafka + ClickHouse/TimescaleDB for speed profile analytics.
- **Observability:** Prometheus + Grafana + Tempo/Jaeger for traces.

## Recent Updates (Current Revision)
- Added Zambia-specific architecture improvements focused on latency, resilience, and ETA quality.
- Added recommended open-source tooling options for geocoding, routing, tiles, spatial storage, telemetry, and observability.
- Kept guidance implementation-oriented with phased rollout suggestions and local-market specialization.

## Environment Variables Mentioned
- `ORS_API_KEY`
- `ORS_BASE_URL`
- `ORS_TIMEOUT_MS`
- `ORS_COUNTRY_BIAS`
- `MAPS_CACHE_TTL_MS`
- `MAPS_RATE_WINDOW_MS`
- `MAPS_RATE_MAX`
- `RIDE_HAILING_DRIVER_STALE_AFTER_MS`
- `RIDE_HAILING_DRIVER_LOCATION_MAX_SPEED_KMH`
- `RIDE_HAILING_DRIVER_LOCATION_MAX_JUMP_METERS`
- `RIDE_HAILING_DRIVER_LOCATION_MAX_JUMP_WINDOW_MS`
- Optional UI config: `MAP_STYLE_URL`, `MAP_TILE_ATTRIBUTION`

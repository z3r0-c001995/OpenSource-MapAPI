import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  ORS_API_KEY: z.string().optional(),
  ORS_BASE_URL: z.string().default('https://api.openrouteservice.org'),
  ORS_COUNTRY_BIAS: z.string().default('ZM'),
  ORS_TIMEOUT_MS: z.coerce.number().default(4500),
  MAP_STYLE_URL: z.string().default('https://demotiles.maplibre.org/style.json'),
  MAP_TILE_ATTRIBUTION: z.string().default('© OpenStreetMap contributors'),
  MAPS_CACHE_TTL_MS: z.coerce.number().default(45000),
  MAPS_CACHE_STALE_TTL_MS: z.coerce.number().default(120000),
  MAPS_RATE_WINDOW_MS: z.coerce.number().default(60000),
  MAPS_RATE_MAX: z.coerce.number().default(120),
  MAPS_RATE_MAX_REVERSE: z.coerce.number().default(60),
  PUBLIC_API_KEY: z.string().optional(),
  SERVER_API_KEY: z.string().optional(),
  ENABLE_OTEL: z.coerce.boolean().default(false),
  REDIS_URL: z.string().default('redis://localhost:6379'),
});

export const env = envSchema.parse(process.env);

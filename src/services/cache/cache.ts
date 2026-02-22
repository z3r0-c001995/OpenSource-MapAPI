import Redis from 'ioredis';
import { env } from '../../config/env.js';

type CacheEntry<T> = { value: T; expiresAt: number; staleUntil: number };

export type CacheRead<T> =
  | { kind: 'miss' }
  | { kind: 'fresh'; value: T }
  | { kind: 'stale'; value: T };

const memory = new Map<string, CacheEntry<unknown>>();

const redis = (() => {
  try {
    return new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
  } catch {
    return null;
  }
})();

const connectRedis = async (): Promise<boolean> => {
  if (!redis) return false;
  if (redis.status === 'ready') return true;
  try {
    await redis.connect();
    return true;
  } catch {
    return false;
  }
};

export const readCache = async <T>(key: string): Promise<CacheRead<T>> => {
  const now = Date.now();

  if (await connectRedis()) {
    const raw = await redis!.get(key);
    if (!raw) return { kind: 'miss' };
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (now <= parsed.expiresAt) return { kind: 'fresh', value: parsed.value };
    if (now <= parsed.staleUntil) return { kind: 'stale', value: parsed.value };
    return { kind: 'miss' };
  }

  const found = memory.get(key) as CacheEntry<T> | undefined;
  if (!found) return { kind: 'miss' };
  if (now <= found.expiresAt) return { kind: 'fresh', value: found.value };
  if (now <= found.staleUntil) return { kind: 'stale', value: found.value };
  memory.delete(key);
  return { kind: 'miss' };
};

export const writeCache = async <T>(key: string, value: T, ttlMs: number, staleTtlMs: number): Promise<void> => {
  const now = Date.now();
  const entry: CacheEntry<T> = {
    value,
    expiresAt: now + ttlMs,
    staleUntil: now + staleTtlMs,
  };

  if (await connectRedis()) {
    const ttlSec = Math.ceil(staleTtlMs / 1000);
    await redis!.set(key, JSON.stringify(entry), 'EX', ttlSec);
    return;
  }

  memory.set(key, entry);
};

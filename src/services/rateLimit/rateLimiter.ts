import { env } from '../../config/env.js';

type Counter = { count: number; resetAt: number };
const counters = new Map<string, Counter>();

export const classifyCaller = (apiKey?: string): 'public' | 'server' => {
  if (apiKey && env.SERVER_API_KEY && apiKey === env.SERVER_API_KEY) return 'server';
  return 'public';
};

export const checkRateLimit = ({
  key,
  isReverse,
  tier,
}: {
  key: string;
  isReverse: boolean;
  tier: 'public' | 'server';
}): { allowed: boolean; remaining: number; retryAfterMs: number } => {
  const now = Date.now();
  const windowMs = env.MAPS_RATE_WINDOW_MS;
  const baseMax = isReverse ? env.MAPS_RATE_MAX_REVERSE : env.MAPS_RATE_MAX;
  const max = tier === 'server' ? baseMax * 4 : baseMax;

  const current = counters.get(key);
  if (!current || now >= current.resetAt) {
    counters.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, retryAfterMs: windowMs };
  }

  if (current.count >= max) {
    return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, current.resetAt - now) };
  }

  current.count += 1;
  return { allowed: true, remaining: max - current.count, retryAfterMs: current.resetAt - now };
};

import { Agent, fetch } from 'undici';

const dispatcher = new Agent({ keepAliveTimeout: 10_000, keepAliveMaxTimeout: 30_000 });

export const fetchWithPolicy = async (
  input: string,
  init: RequestInit & { timeoutMs: number; retries?: number },
): Promise<Response> => {
  const retries = init.retries ?? 0;
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), init.timeoutMs);
    try {
      const response = await fetch(input, {
        ...init,
        dispatcher,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok && response.status >= 500 && attempt < retries) {
        attempt += 1;
        continue;
      }
      return response;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      if (attempt >= retries) break;
      attempt += 1;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Provider request failed');
};

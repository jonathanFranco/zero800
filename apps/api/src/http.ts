export function json(data: unknown, { maxAge, status = 200 }: { maxAge: number; status?: number }): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': status === 200 ? `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}` : 'no-store',
    },
  });
}

export const USER_AGENT = 'Zero800/0.1 (game deals aggregator)';

export async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: { 'User-Agent': USER_AGENT, ...init.headers },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`${new URL(url).host} responded ${res.status}`);
  return res;
}

export function memo<T>(ttlMs: number, load: () => Promise<T>): () => Promise<T> {
  let value: { data: T; until: number } | undefined;
  let pending: Promise<T> | undefined;
  return async () => {
    if (value && value.until > Date.now()) return value.data;
    pending ??= load()
      .then((data) => {
        value = { data, until: Date.now() + ttlMs };
        return data;
      })
      .finally(() => {
        pending = undefined;
      });
    return pending;
  };
}

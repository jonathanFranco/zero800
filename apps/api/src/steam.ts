import { fetchWithTimeout } from './http.js';

export interface SteamPrice {
  initial: number;
  final: number;
  discount: number;
  currency: string;
}

interface AppDetails {
  success: boolean;
  data?: { price_overview?: { currency: string; initial: number; final: number; discount_percent: number } } | [];
}

const TTL_MS = 30 * 60_000;
const BATCH = 50;
const cache = new Map<string, { value: SteamPrice | null; until: number }>();

export async function getSteamPrices(cc: string, appids: string[]): Promise<Record<string, SteamPrice | null>> {
  const now = Date.now();
  const result: Record<string, SteamPrice | null> = {};
  const missing: string[] = [];

  for (const id of appids) {
    const hit = cache.get(`${cc}:${id}`);
    if (hit && hit.until > now) result[id] = hit.value;
    else missing.push(id);
  }

  for (let i = 0; i < missing.length; i += BATCH) {
    const chunk = missing.slice(i, i + BATCH);
    const params = new URLSearchParams({ appids: chunk.join(','), cc, filters: 'price_overview' });
    const res = await fetchWithTimeout(`https://store.steampowered.com/api/appdetails?${params}`);
    const body = (await res.json()) as Record<string, AppDetails> | null;

    for (const id of chunk) {
      const entry = body?.[id];
      const overview = entry?.success && entry.data && !Array.isArray(entry.data) ? entry.data.price_overview : undefined;
      const value = overview
        ? {
            initial: overview.initial / 100,
            final: overview.final / 100,
            discount: overview.discount_percent,
            currency: overview.currency,
          }
        : null;
      cache.set(`${cc}:${id}`, { value, until: now + TTL_MS });
      result[id] = value;
    }
  }
  return result;
}

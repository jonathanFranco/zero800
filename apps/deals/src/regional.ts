import type { Currency } from '@gamevault/shared';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4010';

export type Country = 'br' | 'us' | 'de';

export const COUNTRY_BY_CURRENCY: Record<Currency, Country> = { BRL: 'br', USD: 'us', EUR: 'de' };

export interface RegionalPrice {
  initial: number;
  final: number;
  discount: number;
  currency: string;
}

const STEAM_STORE_ID = '1';
const BATCH = 100;
const cache = new Map<string, RegionalPrice | null>();

export const isSteamStore = (storeID: string | undefined) => storeID === STEAM_STORE_ID;

export async function getSteamPrices(cc: Country, appids: string[]): Promise<Record<string, RegionalPrice | null>> {
  const unique = [...new Set(appids)];
  const missing = unique.filter((id) => !cache.has(`${cc}:${id}`));

  for (let i = 0; i < missing.length; i += BATCH) {
    const chunk = missing.slice(i, i + BATCH);
    const res = await fetch(`${API}/api/steam-prices?cc=${cc}&appids=${chunk.join(',')}`);
    if (!res.ok) throw new Error(`API responded ${res.status}`);
    const { prices } = (await res.json()) as { prices: Record<string, RegionalPrice | null> };
    for (const id of chunk) cache.set(`${cc}:${id}`, prices[id] ?? null);
  }

  return Object.fromEntries(unique.map((id) => [id, cache.get(`${cc}:${id}`) ?? null]));
}

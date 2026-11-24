const ORIGIN = 'https://www.cheapshark.com';
const API = `${ORIGIN}/api/1.0`;

export interface Store {
  storeID: string;
  storeName: string;
  isActive: 0 | 1;
  images: { logo: string; icon: string };
}

interface GameSearchResult {
  gameID: string;
  external: string;
  thumb: string;
}

interface GameDeals {
  info: { title: string; thumb: string; steamAppID: string | null };
  cheapestPriceEver: { price: string; date: number };
  deals: { storeID: string; dealID: string; price: string; retailPrice: string; savings: string }[];
}

export interface Deal {
  storeID: string;
  store: Store | undefined;
  url: string;
  price: number;
  retailPrice: number;
  savings: number;
}

export interface GameOffers {
  title: string;
  steamAppID: string | null;
  deals: Deal[];
  lowestEver: { price: number; date: Date } | null;
}

async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API}${path}`, { signal });
  if (!res.ok) throw new Error(`CheapShark responded ${res.status}`);
  return res.json();
}

let storesPromise: Promise<Map<string, Store>> | undefined;

export function getStores(signal?: AbortSignal) {
  storesPromise ??= get<Store[]>('/stores', signal)
    .then((stores) => new Map(stores.map((s) => [s.storeID, s])))
    .catch((error) => {
      storesPromise = undefined;
      throw error;
    });
  return storesPromise;
}

export function storeIcon(store: Store) {
  return ORIGIN + store.images.icon;
}

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export async function findOffers(title: string, signal?: AbortSignal): Promise<GameOffers | null> {
  const results = await get<GameSearchResult[]>(`/games?title=${encodeURIComponent(title)}&limit=10`, signal);
  if (results.length === 0) return null;

  const wanted = normalize(title);
  const match = results.find((r) => normalize(r.external) === wanted) ?? results[0];

  const [game, stores] = await Promise.all([get<GameDeals>(`/games?id=${match.gameID}`, signal), getStores(signal)]);

  const deals = game.deals
    .map((d) => ({
      storeID: d.storeID,
      store: stores.get(d.storeID),
      url: `${ORIGIN}/redirect?dealID=${d.dealID}`,
      price: Number(d.price),
      retailPrice: Number(d.retailPrice),
      savings: Math.round(Number(d.savings)),
    }))
    .sort((a, b) => a.price - b.price);

  const ever = game.cheapestPriceEver;
  return {
    title: game.info.title,
    steamAppID: game.info.steamAppID,
    deals,
    lowestEver: ever ? { price: Number(ever.price), date: new Date(ever.date * 1000) } : null,
  };
}

export function slugify(title: string) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface ListedDealResponse {
  internalName: string;
  title: string;
  dealID: string;
  storeID: string;
  salePrice: string;
  normalPrice: string;
  savings: string;
  metacriticScore: string;
  steamRatingPercent: string;
  steamAppID: string | null;
  thumb: string;
}

export type DealSort = 'Deal Rating' | 'Savings' | 'Price' | 'Metacritic' | 'Recent';

export interface DealQuery {
  title: string;
  storeID: string;
  upperPrice: number | null;
  sortBy: DealSort;
  page: number;
}

export interface FeedDeal {
  key: string;
  storeID: string;
  steamAppID: string | null;
  title: string;
  slug: string;
  url: string;
  store: Store | undefined;
  price: number;
  normalPrice: number;
  savings: number;
  metacritic: number | null;
  steamRating: number | null;
  image: string;
  thumb: string;
}

const PAGE_SIZE = 30;

export async function listDeals(query: DealQuery, signal?: AbortSignal) {
  const params = new URLSearchParams({
    onSale: '1',
    pageSize: String(PAGE_SIZE),
    pageNumber: String(query.page),
    sortBy: query.sortBy,
  });
  if (query.title) params.set('title', query.title);
  if (query.storeID) params.set('storeID', query.storeID);
  if (query.upperPrice !== null) params.set('upperPrice', String(query.upperPrice));
  if (query.sortBy === 'Price') params.set('desc', '0');

  const [rows, stores] = await Promise.all([get<ListedDealResponse[]>(`/deals?${params}`, signal), getStores(signal)]);
  const seen = new Set<string>();
  const deals: FeedDeal[] = [];
  for (const row of rows) {
    if (seen.has(row.internalName)) continue;
    seen.add(row.internalName);
    const metacritic = Number(row.metacriticScore);
    const steamRating = Number(row.steamRatingPercent);
    deals.push({
      key: row.internalName,
      storeID: row.storeID,
      steamAppID: row.steamAppID,
      title: row.title,
      slug: slugify(row.title),
      url: `${ORIGIN}/redirect?dealID=${row.dealID}`,
      store: stores.get(row.storeID),
      price: Number(row.salePrice),
      normalPrice: Number(row.normalPrice),
      savings: Math.round(Number(row.savings)),
      metacritic: metacritic > 0 ? metacritic : null,
      steamRating: steamRating > 0 ? steamRating : null,
      image: row.steamAppID ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${row.steamAppID}/header.jpg` : row.thumb,
      thumb: row.thumb,
    });
  }
  return { deals, hasMore: rows.length === PAGE_SIZE };
}

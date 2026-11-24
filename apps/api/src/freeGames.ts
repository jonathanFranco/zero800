import { fetchWithTimeout } from './http.js';

export interface FreeGame {
  id: string;
  title: string;
  store: string;
  image: string | null;
  worth: { amount: number; currency: string } | null;
  startsAt: string | null;
  endsAt: string | null;
  url: string;
}

export interface FreeGamesResponse {
  now: FreeGame[];
  upcoming: FreeGame[];
}

interface EpicOffer {
  startDate: string;
  endDate: string;
  discountSetting: { discountPercentage: number };
}

interface EpicElement {
  id: string;
  title: string;
  offerType: string;
  productSlug: string | null;
  catalogNs?: { mappings?: { pageSlug: string }[] | null };
  offerMappings?: { pageSlug: string }[] | null;
  keyImages: { type: string; url: string }[];
  price: { totalPrice: { originalPrice: number; currencyCode: string; currencyInfo: { decimals: number } } };
  promotions: {
    promotionalOffers: { promotionalOffers: EpicOffer[] }[];
    upcomingPromotionalOffers: { promotionalOffers: EpicOffer[] }[];
  } | null;
}

const EPIC_URL = 'https://store-site-backend-static-ipv4.ak.epicgames.com/freeGamesPromotions';

function epicSlug(el: EpicElement): string | null {
  const slug = el.productSlug?.replace(/\/home$/, '') || el.catalogNs?.mappings?.[0]?.pageSlug || el.offerMappings?.[0]?.pageSlug;
  return slug || null;
}

function epicImage(el: EpicElement): string | null {
  for (const type of ['OfferImageWide', 'DieselStoreFrontWide', 'Thumbnail', 'OfferImageTall']) {
    const image = el.keyImages.find((i) => i.type === type);
    if (image) return image.url;
  }
  return null;
}

function freeOffer(groups: { promotionalOffers: EpicOffer[] }[] | undefined): EpicOffer | undefined {
  return groups?.flatMap((g) => g.promotionalOffers).find((o) => o.discountSetting.discountPercentage === 0);
}

async function loadEpic(country: string): Promise<FreeGamesResponse> {
  const params = new URLSearchParams({ locale: 'en-US', country, allowCountries: country });
  const body = (await (await fetchWithTimeout(`${EPIC_URL}?${params}`)).json()) as {
    data: { Catalog: { searchStore: { elements: EpicElement[] } } };
  };
  const now: FreeGame[] = [];
  const upcoming: FreeGame[] = [];
  const nowMs = Date.now();

  for (const el of body.data.Catalog.searchStore.elements) {
    const slug = epicSlug(el);
    if (!slug || !el.promotions) continue;
    const { originalPrice, currencyCode, currencyInfo } = el.price.totalPrice;
    const toGame = (offer: EpicOffer): FreeGame => ({
      id: `epic:${el.id}`,
      title: el.title,
      store: 'Epic Games Store',
      image: epicImage(el),
      worth: originalPrice > 0 ? { amount: originalPrice / 10 ** currencyInfo.decimals, currency: currencyCode } : null,
      startsAt: offer.startDate,
      endsAt: offer.endDate,
      url: `https://store.epicgames.com/p/${slug}`,
    });

    const current = freeOffer(el.promotions.promotionalOffers);
    if (current && Date.parse(current.startDate) <= nowMs && Date.parse(current.endDate) > nowMs) {
      now.push(toGame(current));
      continue;
    }
    const next = freeOffer(el.promotions.upcomingPromotionalOffers);
    if (next) upcoming.push(toGame(next));
  }
  return { now, upcoming };
}

interface Giveaway {
  id: number;
  title: string;
  worth: string;
  image: string;
  platforms: string;
  end_date: string;
  published_date: string;
  open_giveaway_url: string;
  status: string;
}

const GAMERPOWER_URL = 'https://www.gamerpower.com/api/giveaways?platform=pc&type=game&sort-by=popularity';

const STORE_NAMES: Record<string, string> = {
  'epic games': 'Epic Games Store',
  'epic games store': 'Epic Games Store',
  indiegala: 'IndieGala',
  'itch.io': 'itch.io',
  gog: 'GOG',
  steam: 'Steam',
};

const storeName = (raw: string) => STORE_NAMES[raw.trim().toLowerCase()] ?? raw.trim();

function parseGiveawayTitle(raw: string, platforms: string): { title: string; store: string } {
  const match = /^(.*?)\s*\(([^)]+)\)\s*(?:Key\s*)?Giveaway$/i.exec(raw);
  if (match) return { title: match[1].trim(), store: storeName(match[2]) };
  const store = platforms
    .split(',')
    .map((p) => p.trim())
    .find((p) => p !== 'PC' && p !== 'DRM-Free');
  return { title: raw.replace(/\s*(?:Key\s*)?Giveaway$/i, '').trim(), store: store ? storeName(store) : 'PC' };
}

function parseGamerPowerDate(value: string): string | null {
  if (!value || value === 'N/A') return null;
  const ms = Date.parse(`${value.replace(' ', 'T')}Z`);
  return Number.isNaN(ms) ? null : new Date(ms).toISOString();
}

async function loadGamerPower(): Promise<FreeGame[]> {
  const res = await fetchWithTimeout(GAMERPOWER_URL, {}, 12_000);
  const body = (await res.json()) as Giveaway[] | { status: number };
  if (!Array.isArray(body)) return [];

  return body
    .filter((g) => g.status === 'Active')
    .map((g) => {
      const { title, store } = parseGiveawayTitle(g.title, g.platforms);
      const worth = Number.parseFloat(g.worth.replace(/[^0-9.]/g, ''));
      return {
        id: `gp:${g.id}`,
        title,
        store,
        image: g.image || null,
        worth: Number.isFinite(worth) && worth > 0 ? { amount: worth, currency: 'USD' } : null,
        startsAt: parseGamerPowerDate(g.published_date),
        endsAt: parseGamerPowerDate(g.end_date),
        url: g.open_giveaway_url,
      };
    });
}

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export async function loadFreeGames(country: string): Promise<FreeGamesResponse> {
  const [epic, others] = await Promise.allSettled([loadEpic(country), loadGamerPower()]);
  if (epic.status === 'rejected' && others.status === 'rejected') {
    throw new AggregateError([epic.reason, others.reason], 'No free games source responded');
  }

  const epicNow = epic.status === 'fulfilled' ? epic.value.now : [];
  const upcoming = epic.status === 'fulfilled' ? epic.value.upcoming : [];
  const epicTitles = new Set(epicNow.map((g) => normalize(g.title)));
  const rest = others.status === 'fulfilled' ? others.value.filter((g) => !epicTitles.has(normalize(g.title))) : [];

  const byEnd = (a: FreeGame, b: FreeGame) => (a.endsAt ?? '9999').localeCompare(b.endsAt ?? '9999');
  return { now: [...epicNow, ...rest].sort(byEnd), upcoming: upcoming.sort((a, b) => (a.startsAt ?? '').localeCompare(b.startsAt ?? '')) };
}

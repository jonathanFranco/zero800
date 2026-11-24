const API = 'https://api.rawg.io/api';

export interface Named {
  id: number;
  name: string;
  slug?: string;
}

export interface GameDetails {
  id: number;
  slug: string;
  name: string;
  released: string | null;
  background_image: string | null;
  background_image_additional: string | null;
  rating: number;
  ratings_count: number;
  metacritic: number | null;
  playtime: number;
  description_raw: string;
  website: string;
  esrb_rating: Named | null;
  genres: Named[];
  developers: Named[];
  publishers: Named[];
  platforms: { platform: Named }[] | null;
}

export interface Screenshot {
  id: number;
  image: string;
}

export class MissingKeyError extends Error {
  constructor() {
    super('VITE_RAWG_KEY is not set');
  }
}

export class NotFoundError extends Error {}

async function get<T>(path: string, signal?: AbortSignal, query: Record<string, string> = {}): Promise<T> {
  const key = import.meta.env.VITE_RAWG_KEY;
  if (!key) throw new MissingKeyError();

  const params = new URLSearchParams({ ...query, key });
  const res = await fetch(`${API}${path}?${params}`, { signal });
  if (res.status === 404) throw new NotFoundError();
  if (!res.ok) throw new Error(`RAWG responded ${res.status}`);
  return res.json();
}

export async function getGame(slug: string, signal?: AbortSignal): Promise<GameDetails> {
  try {
    return await get<GameDetails>(`/games/${encodeURIComponent(slug)}`, signal);
  } catch (error) {
    if (!(error instanceof NotFoundError)) throw error;
    const search = await get<{ results: { slug: string }[] }>('/games', signal, {
      search: slug.replace(/-/g, ' '),
      page_size: '1',
    });
    const match = search.results[0];
    if (!match || match.slug === slug) throw error;
    return get<GameDetails>(`/games/${encodeURIComponent(match.slug)}`, signal);
  }
}

export async function getScreenshots(slug: string, signal?: AbortSignal) {
  const page = await get<{ results: Screenshot[] }>(`/games/${encodeURIComponent(slug)}/screenshots`, signal);
  return page.results;
}

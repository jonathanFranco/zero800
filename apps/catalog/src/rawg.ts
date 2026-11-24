const API = 'https://api.rawg.io/api';

export interface GameSummary {
  id: number;
  slug: string;
  name: string;
  released: string | null;
  background_image: string | null;
  rating: number;
  metacritic: number | null;
  genres: { id: number; name: string; slug: string }[];
  parent_platforms?: { platform: { id: number; name: string; slug: string } }[];
}

export interface Page<T> {
  count: number;
  next: string | null;
  results: T[];
}

export interface GameQuery {
  search: string;
  genre: string;
  ordering: string;
  page: number;
}

export class MissingKeyError extends Error {
  constructor() {
    super('VITE_RAWG_KEY is not set');
  }
}

export async function listGames(query: GameQuery, signal?: AbortSignal): Promise<Page<GameSummary>> {
  const key = import.meta.env.VITE_RAWG_KEY;
  if (!key) throw new MissingKeyError();

  const params = new URLSearchParams({ key, page: String(query.page), page_size: '24' });
  if (query.search) {
    params.set('search', query.search);
    params.set('search_precise', 'true');
  }
  if (query.genre) params.set('genres', query.genre);
  if (query.ordering && !query.search) params.set('ordering', query.ordering);

  const res = await fetch(`${API}/games?${params}`, { signal });
  if (!res.ok) throw new Error(`RAWG responded ${res.status}`);
  return res.json();
}

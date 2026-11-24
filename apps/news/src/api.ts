import type { Locale } from '@gamevault/shared';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4010';

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string | null;
  image: string | null;
  summary: string;
}

export class NewsNotFoundError extends Error {}

export async function getNews(locale: Locale, signal?: AbortSignal): Promise<NewsItem[]> {
  const res = await fetch(`${API}/api/news?locale=${encodeURIComponent(locale)}`, { signal });
  if (!res.ok) throw new Error(`API responded ${res.status}`);
  return ((await res.json()) as { items: NewsItem[] }).items;
}

export async function getNewsItem(id: string, signal?: AbortSignal): Promise<NewsItem> {
  const res = await fetch(`${API}/api/news-item?id=${encodeURIComponent(id)}`, { signal });
  if (res.status === 404) throw new NewsNotFoundError();
  if (!res.ok) throw new Error(`API responded ${res.status}`);
  return ((await res.json()) as { item: NewsItem }).item;
}

export interface MentionedGame {
  slug: string;
  name: string;
  image: string | null;
}

export async function findMentionedGame(title: string, signal?: AbortSignal): Promise<MentionedGame | null> {
  const key = import.meta.env.VITE_RAWG_KEY;
  if (!key) return null;
  const params = new URLSearchParams({ key, search: title, page_size: '5' });
  const res = await fetch(`https://api.rawg.io/api/games?${params}`, { signal });
  if (!res.ok) return null;
  const { results } = (await res.json()) as {
    results: { slug: string; name: string; background_image: string | null }[];
  };

  const normalize = (s: string) =>
    ` ${s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()} `;
  const headline = normalize(title);
  const match = results
    .filter((g) => g.name.length >= 4 && headline.includes(normalize(g.name)))
    .sort((a, b) => b.name.length - a.name.length)[0];
  return match ? { slug: match.slug, name: match.name, image: match.background_image } : null;
}

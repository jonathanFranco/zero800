import { createHash } from 'node:crypto';
import { decodeHTML } from 'entities';
import { XMLParser } from 'fast-xml-parser';
import { fetchWithTimeout, memo } from './http.js';

export const NEWS_LOCALES = ['pt-BR', 'en', 'es'] as const;
export type NewsLocale = (typeof NEWS_LOCALES)[number];

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string | null;
  image: string | null;
  summary: string;
}

interface Feed {
  source: string;
  url: string;
}

const FEEDS: Record<NewsLocale, Feed[]> = {
  'pt-BR': [
    { source: 'IGN Brasil', url: 'https://br.ign.com/feed.xml' },
    { source: 'Eurogamer Portugal', url: 'https://www.eurogamer.pt/feed' },
    { source: 'Adrenaline', url: 'https://www.adrenaline.com.br/feed/' },
  ],
  en: [
    { source: 'PC Gamer', url: 'https://www.pcgamer.com/rss/' },
    { source: 'Rock Paper Shotgun', url: 'https://www.rockpapershotgun.com/feed' },
    { source: 'GameSpot', url: 'https://www.gamespot.com/feeds/news/' },
    { source: 'Polygon', url: 'https://www.polygon.com/rss/index.xml' },
  ],
  es: [
    { source: '3DJuegos', url: 'https://www.3djuegos.com/feedburner.xml' },
    { source: 'Eurogamer España', url: 'https://www.eurogamer.es/feed' },
  ],
};

const PER_FEED = 15;
const LIMIT = 48;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  htmlEntities: true,
  isArray: (name) => ['item', 'entry', 'media:content', 'media:thumbnail', 'enclosure', 'link'].includes(name),
});

type Node = Record<string, unknown>;

function text(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') return text((value as Node)['#text']);
  return String(value).trim();
}

function stripHtml(html: string): string {
  return decodeHTML(html.replace(/<[^>]*>/g, ' '))
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const SUMMARY_MAX = 450;

function summarize(html: string): string {
  const plain = stripHtml(html);
  if (plain.length <= SUMMARY_MAX) return plain;
  return `${plain.slice(0, SUMMARY_MAX).replace(/\s+\S*$/, '')}…`;
}

const newsId = (url: string) => createHash('sha1').update(url).digest('base64url').slice(0, 12);

function attr(nodes: unknown, name: string): string | undefined {
  if (!Array.isArray(nodes)) return undefined;
  for (const node of nodes as Node[]) {
    const value = node?.[`@_${name}`];
    const type = String(node?.['@_type'] ?? node?.['@_medium'] ?? 'image');
    if (typeof value === 'string' && value && /image/.test(type)) return value;
  }
  return undefined;
}

function findImage(item: Node, html: string): string | null {
  const fromTags =
    attr(item['media:content'], 'url') ?? attr(item['media:thumbnail'], 'url') ?? attr(item.enclosure, 'url');
  if (fromTags) return fromTags;
  const fromHtml = /<img[^>]+src=["']([^"']+)["']/i.exec(html)?.[1];
  return fromHtml ?? null;
}

function toIso(value: string): string | null {
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : new Date(ms).toISOString();
}

function linkOf(item: Node): string {
  const links = item.link as unknown[] | undefined;
  for (const link of links ?? []) {
    if (typeof link === 'string') return link.trim();
    const node = link as Node;
    if (node['@_href'] && (node['@_rel'] ?? 'alternate') === 'alternate') return String(node['@_href']);
  }
  return text(item.guid) || text(item.id);
}

async function loadFeed(feed: Feed): Promise<NewsItem[]> {
  const xml = await (await fetchWithTimeout(feed.url)).text();
  const doc = parser.parse(xml) as Node;
  const channel = (doc.rss as Node | undefined)?.channel as Node | undefined;
  const items = ((channel?.item ?? (doc.feed as Node | undefined)?.entry ?? []) as Node[]).slice(0, PER_FEED);

  return items.flatMap((item): NewsItem[] => {
    const url = linkOf(item);
    const title = stripHtml(text(item.title));
    if (!url || !title) return [];
    const html = text(item['content:encoded']) || text(item.description) || text(item.summary) || text(item.content);
    return [
      {
        id: newsId(url),
        title,
        url,
        source: feed.source,
        publishedAt: toIso(text(item.pubDate) || text(item.published) || text(item.updated) || text(item['dc:date'])),
        image: findImage(item, html),
        summary: summarize(html),
      },
    ];
  });
}

async function loadNews(locale: NewsLocale): Promise<NewsItem[]> {
  const results = await Promise.allSettled(FEEDS[locale].map(loadFeed));
  const items = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
  if (items.length === 0) {
    const reasons = results.flatMap((r) => (r.status === 'rejected' ? [r.reason] : []));
    throw new AggregateError(reasons, `No ${locale} feed responded`);
  }
  for (const r of results) if (r.status === 'rejected') console.warn('[news] feed failed:', String(r.reason));
  return items.sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '')).slice(0, LIMIT);
}

const cache = Object.fromEntries(NEWS_LOCALES.map((l) => [l, memo(10 * 60_000, () => loadNews(l))])) as Record<
  NewsLocale,
  () => Promise<NewsItem[]>
>;

export function getNews(locale: NewsLocale): Promise<NewsItem[]> {
  return cache[locale]();
}

export async function findNewsItem(id: string): Promise<NewsItem | undefined> {
  const lists = await Promise.allSettled(NEWS_LOCALES.map(getNews));
  for (const list of lists) {
    const item = list.status === 'fulfilled' ? list.value.find((i) => i.id === id) : undefined;
    if (item) return item;
  }
  return undefined;
}

export function isNewsLocale(value: string | null): value is NewsLocale {
  return NEWS_LOCALES.includes(value as NewsLocale);
}

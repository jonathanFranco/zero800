import { json } from '../src/http.js';
import { getNews, isNewsLocale } from '../src/news.js';

export async function GET(request: Request): Promise<Response> {
  const locale = new URL(request.url).searchParams.get('locale');
  if (!isNewsLocale(locale)) return json({ error: 'locale must be pt-BR, en or es' }, { maxAge: 0, status: 400 });

  try {
    return json({ items: await getNews(locale) }, { maxAge: 900 });
  } catch (error) {
    console.error('[api/news]', error);
    return json({ error: 'News feeds unavailable' }, { maxAge: 0, status: 502 });
  }
}

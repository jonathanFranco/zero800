import { json } from '../src/http.js';
import { findNewsItem } from '../src/news.js';

export async function GET(request: Request): Promise<Response> {
  const id = new URL(request.url).searchParams.get('id');
  if (!id || !/^[\w-]{6,32}$/.test(id)) return json({ error: 'invalid id' }, { maxAge: 0, status: 400 });

  try {
    const item = await findNewsItem(id);
    if (!item) return json({ error: 'News item not found' }, { maxAge: 0, status: 404 });
    return json({ item }, { maxAge: 900 });
  } catch (error) {
    console.error('[api/news-item]', error);
    return json({ error: 'News feeds unavailable' }, { maxAge: 0, status: 502 });
  }
}

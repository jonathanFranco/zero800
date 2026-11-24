import { json } from '../src/http.js';
import { getSteamPrices } from '../src/steam.js';

const COUNTRIES = new Set(['br', 'us', 'de']);

export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const cc = params.get('cc') ?? '';
  const appids = (params.get('appids') ?? '').split(',').filter((id) => /^\d{1,10}$/.test(id));

  if (!COUNTRIES.has(cc)) return json({ error: 'cc must be br, us or de' }, { maxAge: 0, status: 400 });
  if (appids.length === 0 || appids.length > 100) {
    return json({ error: 'appids must list 1 to 100 Steam app ids' }, { maxAge: 0, status: 400 });
  }

  try {
    return json({ prices: await getSteamPrices(cc, [...new Set(appids)]) }, { maxAge: 1800 });
  } catch (error) {
    console.error('[api/steam-prices]', error);
    return json({ error: 'Steam prices unavailable' }, { maxAge: 0, status: 502 });
  }
}

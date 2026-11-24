import { loadFreeGames } from '../src/freeGames.js';
import { json, memo } from '../src/http.js';

const COUNTRIES = { br: 'BR', us: 'US', de: 'DE' } as const;
type Country = keyof typeof COUNTRIES;

const cached = Object.fromEntries(
  Object.entries(COUNTRIES).map(([cc, country]) => [cc, memo(10 * 60_000, () => loadFreeGames(country))]),
) as Record<Country, ReturnType<typeof memo<Awaited<ReturnType<typeof loadFreeGames>>>>>;

export async function GET(request: Request): Promise<Response> {
  const cc = new URL(request.url).searchParams.get('cc') ?? 'us';
  if (!(cc in COUNTRIES)) return json({ error: 'cc must be br, us or de' }, { maxAge: 0, status: 400 });

  try {
    return json(await cached[cc as Country](), { maxAge: 1800 });
  } catch (error) {
    console.error('[api/free-games]', error);
    return json({ error: 'Free games sources unavailable' }, { maxAge: 0, status: 502 });
  }
}

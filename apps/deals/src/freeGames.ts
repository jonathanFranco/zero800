const API = import.meta.env.VITE_API_URL || 'http://localhost:4010';

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

export interface FreeGames {
  now: FreeGame[];
  upcoming: FreeGame[];
}

const pending = new Map<string, Promise<FreeGames>>();

export function getFreeGames(cc: string): Promise<FreeGames> {
  let request = pending.get(cc);
  if (!request) {
    request = fetch(`${API}/api/free-games?cc=${cc}`)
      .then((res) => {
        if (!res.ok) throw new Error(`API responded ${res.status}`);
        return res.json() as Promise<FreeGames>;
      })
      .catch((error) => {
        pending.delete(cc);
        throw error;
      });
    pending.set(cc, request);
  }
  return request;
}

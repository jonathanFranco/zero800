import type { Locale } from './i18n';

const GENRES: Record<string, Record<Locale, string>> = {
  action: { 'pt-BR': 'Ação', en: 'Action', es: 'Acción' },
  indie: { 'pt-BR': 'Indie', en: 'Indie', es: 'Indie' },
  adventure: { 'pt-BR': 'Aventura', en: 'Adventure', es: 'Aventura' },
  'role-playing-games-rpg': { 'pt-BR': 'RPG', en: 'RPG', es: 'RPG' },
  strategy: { 'pt-BR': 'Estratégia', en: 'Strategy', es: 'Estrategia' },
  shooter: { 'pt-BR': 'Tiro', en: 'Shooter', es: 'Disparos' },
  casual: { 'pt-BR': 'Casual', en: 'Casual', es: 'Casual' },
  simulation: { 'pt-BR': 'Simulação', en: 'Simulation', es: 'Simulación' },
  puzzle: { 'pt-BR': 'Puzzle', en: 'Puzzle', es: 'Puzle' },
  arcade: { 'pt-BR': 'Arcade', en: 'Arcade', es: 'Arcade' },
  platformer: { 'pt-BR': 'Plataforma', en: 'Platformer', es: 'Plataformas' },
  'massively-multiplayer': { 'pt-BR': 'Multijogador massivo', en: 'Massively multiplayer', es: 'Multijugador masivo' },
  racing: { 'pt-BR': 'Corrida', en: 'Racing', es: 'Carreras' },
  sports: { 'pt-BR': 'Esportes', en: 'Sports', es: 'Deportes' },
  fighting: { 'pt-BR': 'Luta', en: 'Fighting', es: 'Lucha' },
  family: { 'pt-BR': 'Família', en: 'Family', es: 'Familia' },
  'board-games': { 'pt-BR': 'Jogos de tabuleiro', en: 'Board games', es: 'Juegos de mesa' },
  card: { 'pt-BR': 'Cartas', en: 'Card', es: 'Cartas' },
  educational: { 'pt-BR': 'Educativo', en: 'Educational', es: 'Educativo' },
};

export function genreName(genre: { slug?: string; name: string }, locale: Locale): string {
  return (genre.slug && GENRES[genre.slug]?.[locale]) || genre.name;
}

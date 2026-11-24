import { createTranslator, getLocale, onLocaleChange } from '@gamevault/shared';
import { computed, onBeforeUnmount, ref } from 'vue';

const ptBR = {
  title: 'Catálogo',
  subtitle: 'Abra qualquer jogo para ver em qual loja ele está mais barato agora.',
  resultsFor: 'Resultados para “{query}”',
  clearSearch: 'Limpar busca e ver o catálogo todo',
  genreLabel: 'Gênero',
  sortLabel: 'Ordenar por',
  genreAll: 'Todos',
  sortPopular: 'Mais populares',
  sortMetacritic: 'Nota no Metacritic',
  sortRating: 'Nota dos jogadores',
  sortReleased: 'Lançamentos recentes',
  missingKeyTitle: 'Falta a chave da RAWG.',
  missingKeyBefore: 'Crie uma chave grátis em',
  missingKeyAfter: 'coloque no .env como VITE_RAWG_KEY e reinicie o servidor.',
  errorTitle: 'Não foi possível carregar os jogos.',
  retry: 'Tentar de novo',
  empty: 'Nenhum jogo encontrado. Tente outro nome ou outro gênero.',
  loadMore: 'Carregar mais jogos',
  loading: 'Carregando jogos',
  metacritic: 'Metacritic {score}',
  rating: 'Nota dos jogadores: {rating}',
  tba: 'A definir',
};

type Key = keyof typeof ptBR;

const translate = createTranslator<Key>({
  'pt-BR': ptBR,
  en: {
    title: 'Catalog',
    subtitle: 'Open any game to see which store has it cheapest right now.',
    resultsFor: 'Results for “{query}”',
    clearSearch: 'Clear search and see the full catalog',
    genreLabel: 'Genre',
    sortLabel: 'Sort by',
    genreAll: 'All',
    sortPopular: 'Most popular',
    sortMetacritic: 'Metacritic score',
    sortRating: 'Player rating',
    sortReleased: 'Newest releases',
    missingKeyTitle: 'The RAWG key is missing.',
    missingKeyBefore: 'Create a free key at',
    missingKeyAfter: 'put it in .env as VITE_RAWG_KEY and restart the server.',
    errorTitle: 'Could not load games.',
    retry: 'Try again',
    empty: 'No games found. Try another name or genre.',
    loadMore: 'Load more games',
    loading: 'Loading games',
    metacritic: 'Metacritic {score}',
    rating: 'Player rating: {rating}',
    tba: 'TBA',
  },
  es: {
    title: 'Catálogo',
    subtitle: 'Abre cualquier juego para ver en qué tienda está más barato ahora.',
    resultsFor: 'Resultados para “{query}”',
    clearSearch: 'Borrar la búsqueda y ver todo el catálogo',
    genreLabel: 'Género',
    sortLabel: 'Ordenar por',
    genreAll: 'Todos',
    sortPopular: 'Más populares',
    sortMetacritic: 'Nota en Metacritic',
    sortRating: 'Nota de jugadores',
    sortReleased: 'Lanzamientos recientes',
    missingKeyTitle: 'Falta la clave de RAWG.',
    missingKeyBefore: 'Crea una clave gratis en',
    missingKeyAfter: 'ponla en .env como VITE_RAWG_KEY y reinicia el servidor.',
    errorTitle: 'No se pudieron cargar los juegos.',
    retry: 'Reintentar',
    empty: 'No se encontraron juegos. Prueba otro nombre u otro género.',
    loadMore: 'Cargar más juegos',
    loading: 'Cargando juegos',
    metacritic: 'Metacritic {score}',
    rating: 'Nota de jugadores: {rating}',
    tba: 'Por anunciar',
  },
});

export type CatalogKey = Key;
export type CatalogT = ReturnType<typeof translate>;

export function useI18n() {
  const locale = ref(getLocale());
  onBeforeUnmount(onLocaleChange((next) => (locale.value = next)));
  const t = computed(() => translate(locale.value));
  return { locale, t };
}

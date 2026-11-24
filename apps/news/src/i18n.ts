import { createTranslator, getLocale, onLocaleChange } from '@gamevault/shared';
import { computed, onBeforeUnmount, ref } from 'vue';

const ptBR = {
  title: 'Notícias',
  subtitle: 'O que está rolando no mundo dos games, direto dos principais portais.',
  loading: 'Carregando notícias',
  error: 'Não foi possível carregar as notícias.',
  retry: 'Tentar de novo',
  empty: 'Nenhuma notícia agora. Tente de novo em alguns minutos.',
  sources: 'Notícias selecionadas de portais de games. A matéria completa fica no site de cada portal.',
  articleLoading: 'Carregando notícia',
  articleError: 'Não foi possível carregar a notícia.',
  articleGone: 'Esta notícia não está mais disponível.',
  articleGoneBody: 'Os portais atualizam os feeds o tempo todo e ela saiu da lista. Veja as mais recentes abaixo.',
  readFull: 'Ler matéria completa no {source}',
  excerptNote: 'Trecho publicado por {source}. A matéria completa está no site do portal.',
  mentioned: 'Jogo citado',
  seeGame: 'Ver preços e detalhes',
  moreNews: 'Mais notícias',
};

type Key = keyof typeof ptBR;

const translate = createTranslator<Key>({
  'pt-BR': ptBR,
  en: {
    title: 'News',
    subtitle: "What's happening in gaming, straight from the main outlets.",
    loading: 'Loading news',
    error: 'Could not load the news.',
    retry: 'Try again',
    empty: 'No news right now. Try again in a few minutes.',
    sources: 'Stories picked from gaming outlets. The full article lives on each outlet’s site.',
    articleLoading: 'Loading story',
    articleError: 'Could not load this story.',
    articleGone: 'This story is no longer available.',
    articleGoneBody: 'Outlets refresh their feeds all the time and it dropped off the list. See the latest below.',
    readFull: 'Read the full story on {source}',
    excerptNote: 'Excerpt published by {source}. The full story is on the outlet’s site.',
    mentioned: 'Game mentioned',
    seeGame: 'See prices and details',
    moreNews: 'More news',
  },
  es: {
    title: 'Noticias',
    subtitle: 'Lo que pasa en el mundo de los videojuegos, directo de los principales medios.',
    loading: 'Cargando noticias',
    error: 'No se pudieron cargar las noticias.',
    retry: 'Reintentar',
    empty: 'No hay noticias ahora. Vuelve a intentarlo en unos minutos.',
    sources: 'Noticias seleccionadas de medios de videojuegos. El artículo completo está en el sitio de cada medio.',
    articleLoading: 'Cargando noticia',
    articleError: 'No se pudo cargar la noticia.',
    articleGone: 'Esta noticia ya no está disponible.',
    articleGoneBody: 'Los medios actualizan sus feeds todo el tiempo y salió de la lista. Mira las más recientes abajo.',
    readFull: 'Leer el artículo completo en {source}',
    excerptNote: 'Extracto publicado por {source}. El artículo completo está en el sitio del medio.',
    mentioned: 'Juego mencionado',
    seeGame: 'Ver precios y detalles',
    moreNews: 'Más noticias',
  },
});

export function useI18n() {
  const locale = ref(getLocale());
  onBeforeUnmount(onLocaleChange((next) => (locale.value = next)));
  const t = computed(() => translate(locale.value));
  return { locale, t };
}

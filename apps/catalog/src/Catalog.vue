<script setup lang="ts">
import { emit, genreName, type CatalogProps } from '@gamevault/shared';
import { onBeforeUnmount, reactive, ref, watch } from 'vue';
import GameCard from './components/GameCard.vue';
import { useI18n, type CatalogKey } from './i18n';
import { listGames, MissingKeyError, type GameSummary } from './rawg';

const GENRES = [
  'action',
  'adventure',
  'role-playing-games-rpg',
  'indie',
  'shooter',
  'strategy',
  'platformer',
  'puzzle',
  'racing',
  'sports',
  'simulation',
] as const;

const ORDERINGS: readonly (readonly [string, CatalogKey])[] = [
  ['-added', 'sortPopular'],
  ['-metacritic', 'sortMetacritic'],
  ['-rating', 'sortRating'],
  ['-released', 'sortReleased'],
];

const props = defineProps<CatalogProps>();
const { locale, t } = useI18n();

const filters = reactive({ search: props.search?.trim() ?? '', genre: '', ordering: '-added' });
const games = ref<GameSummary[]>([]);
const page = ref(1);
const hasMore = ref(false);
const status = ref<'loading' | 'ready' | 'error' | 'missing-key'>('loading');

let controller: AbortController | undefined;

async function load(reset: boolean) {
  controller?.abort();
  controller = new AbortController();
  if (reset) page.value = 1;
  status.value = 'loading';

  try {
    const data = await listGames({ ...filters, page: page.value }, controller.signal);
    games.value = reset ? data.results : [...games.value, ...data.results];
    hasMore.value = data.next !== null;
    status.value = 'ready';
  } catch (error) {
    if ((error as Error).name === 'AbortError') return;
    status.value = error instanceof MissingKeyError ? 'missing-key' : 'error';
  }
}

function loadMore() {
  page.value += 1;
  load(false);
}

function select(game: GameSummary) {
  emit('game:selected', { slug: game.slug, name: game.name });
}

watch(() => [filters.genre, filters.ordering], () => load(true));

function clearSearch() {
  emit('navigate', { path: '/games' });
}

load(true);

onBeforeUnmount(() => {
  controller?.abort();
});
</script>

<template>
  <section class="catalog" :aria-busy="status === 'loading'">
    <header class="gv-page-head">
      <template v-if="filters.search">
        <h1>{{ t('resultsFor', { query: filters.search }) }}</h1>
        <p><button type="button" class="link" @click="clearSearch">{{ t('clearSearch') }}</button></p>
      </template>
      <template v-else>
        <h1>{{ t('title') }}</h1>
        <p>{{ t('subtitle') }}</p>
      </template>
    </header>

    <div class="filters">
      <div class="chips" role="group" :aria-label="t('genreLabel')">
        <button type="button" :aria-pressed="filters.genre === ''" @click="filters.genre = ''">
          {{ t('genreAll') }}
        </button>
        <button
          v-for="slug in GENRES"
          :key="slug"
          type="button"
          :aria-pressed="filters.genre === slug"
          @click="filters.genre = slug"
        >
          {{ genreName({ slug, name: slug }, locale) }}
        </button>
      </div>
      <label v-if="!filters.search" class="field">
        <span class="sr-only">{{ t('sortLabel') }}</span>
        <select v-model="filters.ordering" class="gv-select">
          <option v-for="[value, key] in ORDERINGS" :key="value" :value="value">{{ t(key) }}</option>
        </select>
      </label>
    </div>

    <div v-if="status === 'missing-key'" class="notice">
      <strong>{{ t('missingKeyTitle') }}</strong>
      <span>
        {{ t('missingKeyBefore') }}
        <a href="https://rawg.io/apidocs" target="_blank" rel="noopener">rawg.io/apidocs</a>,
        {{ t('missingKeyAfter') }}
      </span>
    </div>
    <div v-else-if="status === 'error' && games.length === 0" class="notice" role="alert">
      <strong>{{ t('errorTitle') }}</strong>
      <button type="button" class="ghost" @click="load(true)">{{ t('retry') }}</button>
    </div>
    <p v-else-if="status === 'ready' && games.length === 0" class="notice">{{ t('empty') }}</p>

    <ul class="gv-grid">
      <li v-for="game in games" :key="game.id">
        <GameCard :game="game" :t="t" :locale="locale" @select="select(game)" />
      </li>
    </ul>

    <div class="footer">
      <div v-if="status === 'loading'" class="spinner" role="status" :aria-label="t('loading')" />
      <button v-else-if="hasMore && status === 'ready'" type="button" class="ghost" @click="loadMore">
        {{ t('loadMore') }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.link {
  padding: 0;
  border: 0;
  background: none;
  color: var(--gv-accent-text);
  font-weight: 700;
  cursor: pointer;
}
.link:hover { text-decoration: underline; }

.filters { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 12px 24px; margin-bottom: 32px; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; flex: 1 1 480px; }
.chips button {
  padding: 8px 16px;
  border: 1px solid var(--gv-border);
  border-radius: 999px;
  background: transparent;
  color: var(--gv-muted);
  cursor: pointer;
}
.chips button:hover { color: var(--gv-text); border-color: var(--gv-muted); }
.chips button[aria-pressed='true'] { border-color: var(--gv-accent); background: var(--gv-accent); color: var(--gv-accent-ink); font-weight: 700; }
.field { flex: 0 0 220px; }

.notice {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  margin: 0 0 20px;
  padding: 18px 20px;
  border-radius: var(--gv-radius);
  background: var(--gv-surface);
  color: var(--gv-muted);
}
.notice strong { color: var(--gv-text); }

.footer { display: flex; justify-content: center; padding: 40px 0 0; }
.ghost {
  padding: 12px 24px;
  border: 1px solid var(--gv-accent);
  border-radius: 999px;
  background: transparent;
  color: var(--gv-accent-text);
  font-weight: 700;
  cursor: pointer;
}
.ghost:hover { background: var(--gv-accent); color: var(--gv-accent-ink); }

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--gv-border);
  border-top-color: var(--gv-accent-text);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .spinner { animation-duration: 3s; } }

.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
</style>

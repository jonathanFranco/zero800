<script setup lang="ts">
import { emit } from '@gamevault/shared';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { findMentionedGame, getNews, getNewsItem, NewsNotFoundError, type MentionedGame, type NewsItem } from './api';
import NewsCard from './components/NewsCard.vue';
import { useI18n } from './i18n';
import { timeAgo } from './time';

const props = defineProps<{ id: string }>();
const { locale, t } = useI18n();

const item = ref<NewsItem | null>(null);
const status = ref<'loading' | 'ready' | 'gone' | 'error'>('loading');
const game = ref<MentionedGame | null>(null);
const more = ref<NewsItem[]>([]);

const controller = new AbortController();
onBeforeUnmount(() => controller.abort());

async function load() {
  status.value = 'loading';
  try {
    item.value = await getNewsItem(props.id, controller.signal);
    status.value = 'ready';
    emit('news:loaded', { id: props.id, title: item.value.title, source: item.value.source });
    findMentionedGame(item.value.title, controller.signal)
      .then((found) => (game.value = found))
      .catch(() => {
      });
  } catch (error) {
    if ((error as Error).name === 'AbortError') return;
    status.value = error instanceof NewsNotFoundError ? 'gone' : 'error';
  }
}
load();

watch(
  locale,
  (current) => {
    getNews(current, controller.signal)
      .then((list) => (more.value = list.filter((n) => n.id !== props.id).slice(0, 6)))
      .catch(() => (more.value = []));
  },
  { immediate: true },
);

const published = computed(() =>
  item.value?.publishedAt
    ? new Intl.DateTimeFormat(locale.value, { dateStyle: 'long', timeStyle: 'short' }).format(new Date(item.value.publishedAt))
    : '',
);

function openGame(event: MouseEvent) {
  if (!game.value || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
  event.preventDefault();
  emit('game:selected', { slug: game.value.slug, name: game.value.name });
}
</script>

<template>
  <div class="page">
    <div v-if="status === 'loading'" class="skeleton" role="status" :aria-label="t('articleLoading')">
      <div class="line short" />
      <div class="line" />
      <div class="line" />
      <div class="block" />
    </div>

    <div v-else-if="status === 'error'" class="notice" role="alert">
      <p>{{ t('articleError') }}</p>
      <button type="button" class="ghost" @click="load">{{ t('retry') }}</button>
    </div>

    <div v-else-if="status === 'gone'" class="notice">
      <strong>{{ t('articleGone') }}</strong>
      <p>{{ t('articleGoneBody') }}</p>
    </div>

    <article v-else-if="item" class="article">
      <header class="head">
        <p class="meta">
          <span class="source">{{ item.source }}</span>
          <time v-if="item.publishedAt" :datetime="item.publishedAt" :title="published">
            {{ timeAgo(locale, item.publishedAt) }}
          </time>
        </p>
        <h1>{{ item.title }}</h1>
      </header>

      <figure v-if="item.image" class="hero">
        <img :src="item.image" alt="" referrerpolicy="no-referrer" />
      </figure>

      <div class="content">
        <div class="text">
          <p v-if="item.summary" class="summary">{{ item.summary }}</p>
          <a class="cta" :href="item.url" target="_blank" rel="noopener">{{ t('readFull', { source: item.source }) }}</a>
          <p class="note">{{ t('excerptNote', { source: item.source }) }}</p>
        </div>

        <aside v-if="game" class="game">
          <p class="game-label">{{ t('mentioned') }}</p>
          <a class="game-card" :href="`/game/${game.slug}`" @click="openGame">
            <img v-if="game.image" :src="game.image.replace('/media/games/', '/media/crop/600/400/games/')" alt="" />
            <span class="game-name">{{ game.name }}</span>
            <span class="game-cta">{{ t('seeGame') }}</span>
          </a>
        </aside>
      </div>
    </article>

    <section v-if="more.length > 0 && status !== 'loading'" class="more">
      <h2>{{ t('moreNews') }}</h2>
      <ul class="gv-shelf">
        <li v-for="n in more.slice(0, 4)" :key="n.id">
          <NewsCard :item="n" :locale="locale" />
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.head { max-width: 52rem; margin-bottom: 24px; }
.meta { display: flex; flex-wrap: wrap; gap: 4px 12px; margin: 0 0 12px; color: var(--gv-muted); font-size: 0.95rem; }
.source { color: var(--gv-accent-text); font-weight: 700; }
h1 {
  margin: 0;
  font-size: clamp(2rem, 5vw, 3.6rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
  text-wrap: balance;
}

.hero { margin: 0 0 28px; border-radius: var(--gv-radius-lg); overflow: hidden; background: var(--gv-surface); }
.hero img { display: block; width: 100%; max-height: 560px; object-fit: cover; }

.content { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 40px; align-items: start; }
@media (max-width: 860px) { .content { grid-template-columns: minmax(0, 1fr); } }

.text { max-width: 68ch; }
.summary { margin: 0 0 24px; color: color-mix(in srgb, var(--gv-text) 92%, var(--gv-bg)); font-size: 1.2rem; line-height: 1.7; }
.cta {
  display: inline-block;
  padding: 14px 24px;
  border-radius: 999px;
  background: var(--gv-accent);
  color: var(--gv-accent-ink);
  font-weight: 700;
  text-decoration: none;
}
.cta:hover { filter: brightness(1.06); }
.note { margin: 14px 0 0; color: var(--gv-muted); font-size: 0.85rem; }

.game-label { margin: 0 0 8px; color: var(--gv-muted); font-size: 0.9rem; font-weight: 600; }
.game-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: 14px;
  border-radius: var(--gv-radius);
  background: var(--gv-surface);
  color: var(--gv-text);
  text-decoration: none;
  overflow: hidden;
}
.game-card:hover { border-color: var(--gv-accent); }
.game-card img { display: block; width: 100%; aspect-ratio: 3 / 2; object-fit: cover; margin-bottom: 8px; }
.game-name { padding: 0 16px; font-size: 1.1rem; font-weight: 800; }
.game-cta { padding: 0 16px; color: var(--gv-accent-text); font-weight: 600; font-size: 0.9rem; }

.more { margin-top: 64px; }
.more h2 { margin: 0 0 18px; font-size: clamp(1.35rem, 2.6vw, 1.8rem); font-weight: 800; letter-spacing: -0.02em; }

.notice {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 20px 22px;
  border-radius: var(--gv-radius);
  background: var(--gv-surface);
  color: var(--gv-muted);
}
.notice p { margin: 0; }
.notice strong { color: var(--gv-text); }
.ghost {
  padding: 10px 20px;
  border: 1px solid var(--gv-accent);
  border-radius: var(--gv-radius-sm);
  background: transparent;
  color: var(--gv-accent-text);
  font-weight: 700;
  cursor: pointer;
}

.skeleton { display: flex; flex-direction: column; gap: 14px; }
.line { height: 40px; max-width: 52rem; border-radius: var(--gv-radius-sm); background: var(--gv-surface); }
.line.short { max-width: 14rem; height: 18px; }
.block { height: 420px; border-radius: var(--gv-radius-lg); background: var(--gv-surface); }
</style>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { getNews, type NewsItem } from './api';
import NewsCard from './components/NewsCard.vue';
import { useI18n } from './i18n';

const props = defineProps<{ limit?: number }>();
const { locale, t } = useI18n();

const items = ref<NewsItem[]>([]);
const status = ref<'loading' | 'ready' | 'error'>('loading');
let controller: AbortController | undefined;

async function load() {
  controller?.abort();
  const current = (controller = new AbortController());
  status.value = 'loading';
  try {
    items.value = await getNews(locale.value, current.signal);
    status.value = 'ready';
  } catch (error) {
    if ((error as Error).name !== 'AbortError') status.value = 'error';
  }
}

watch(locale, load, { immediate: true });
onBeforeUnmount(() => controller?.abort());

const compact = computed(() => props.limit !== undefined);
const shown = computed(() => (props.limit ? items.value.slice(0, props.limit) : items.value));
</script>

<template>
  <section class="news" :aria-busy="status === 'loading'">
    <header v-if="!compact" class="gv-page-head">
      <h1>{{ t('title') }}</h1>
      <p>{{ t('subtitle') }}</p>
    </header>

    <div v-if="status === 'loading' && items.length === 0" class="skeleton" role="status" :aria-label="t('loading')" />
    <div v-else-if="status === 'error' && items.length === 0" class="notice" role="alert">
      <p>{{ t('error') }}</p>
      <button type="button" class="ghost" @click="load">{{ t('retry') }}</button>
    </div>
    <p v-else-if="status === 'ready' && items.length === 0" class="notice">{{ t('empty') }}</p>

    <ul v-else-if="compact" class="gv-shelf">
      <li v-for="item in shown" :key="item.id">
        <NewsCard :item="item" :locale="locale" />
      </li>
    </ul>
    <template v-else>
      <NewsCard v-if="shown[0]" class="lead-item" :item="shown[0]" :locale="locale" lead summary />
      <ul class="gv-grid">
        <li v-for="item in shown.slice(1)" :key="item.id">
          <NewsCard :item="item" :locale="locale" summary />
        </li>
      </ul>
      <p class="note">{{ t('sources') }}</p>
    </template>
  </section>
</template>

<style scoped>
.lead-item { margin-bottom: 48px; }
.skeleton { height: 280px; border-radius: var(--gv-radius); background: var(--gv-surface); }
.notice {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin: 0;
  padding: 18px 20px;
  border-radius: var(--gv-radius);
  background: var(--gv-surface);
  color: var(--gv-muted);
}
.notice p { margin: 0; }
.ghost {
  padding: 10px 20px;
  border: 1px solid var(--gv-accent);
  border-radius: 999px;
  background: transparent;
  color: var(--gv-accent-text);
  font-weight: 700;
  cursor: pointer;
}
.note { margin: 32px 0 0; color: var(--gv-muted); font-size: 0.8rem; }
</style>

<script setup lang="ts">
import { emit, type Locale } from '@gamevault/shared';
import type { NewsItem } from '../api';
import { timeAgo } from '../time';

const props = defineProps<{ item: NewsItem; locale: Locale; lead?: boolean; summary?: boolean }>();

function open(event: MouseEvent) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
  event.preventDefault();
  emit('news:selected', { id: props.item.id });
}
</script>

<template>
  <a class="gv-tile" :class="{ lead }" :href="`/news/${item.id}`" @click="open">
    <div class="gv-tile-cover">
      <img v-if="item.image" :src="item.image" alt="" loading="lazy" referrerpolicy="no-referrer" />
    </div>
    <div class="gv-tile-body">
      <p class="gv-tile-meta">
        <span class="source">{{ item.source }}</span>
        <time v-if="item.publishedAt" :datetime="item.publishedAt">{{ timeAgo(locale, item.publishedAt) }}</time>
      </p>
      <h3 class="gv-tile-title">{{ item.title }}</h3>
      <p v-if="summary && item.summary" class="summary">{{ item.summary }}</p>
    </div>
  </a>
</template>

<style scoped>
.source { color: var(--gv-accent-text); font-weight: 700; }
.gv-tile-meta { gap: 10px; }
.gv-tile-title { -webkit-line-clamp: 3; line-clamp: 3; }
.summary {
  display: -webkit-box;
  margin: 4px 0 0;
  overflow: hidden;
  color: var(--gv-muted);
  font-size: 0.92rem;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
}

@media (min-width: 760px) {
  .lead { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); align-items: center; gap: 32px; }
  .lead .gv-tile-cover { border-radius: var(--gv-radius-lg); }
  .lead .gv-tile-body { gap: 10px; }
  .lead .gv-tile-title {
    font-size: clamp(1.7rem, 3vw, 2.6rem);
    font-weight: 800;
    line-height: 1.02;
    letter-spacing: -0.025em;
    -webkit-line-clamp: 4;
    line-clamp: 4;
  }
  .lead .summary { font-size: 1.02rem; -webkit-line-clamp: 5; line-clamp: 5; }
}
</style>

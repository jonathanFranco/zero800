<script setup lang="ts">
import { genreName, type Locale } from '@gamevault/shared';
import { computed } from 'vue';
import type { CatalogT } from '../i18n';
import type { GameSummary } from '../rawg';

const props = defineProps<{ game: GameSummary; t: CatalogT; locale: Locale }>();
const emit = defineEmits<{ select: [] }>();

const cover = computed(() =>
  props.game.background_image?.replace('/media/games/', '/media/crop/600/400/games/') ?? null,
);
const year = computed(() => props.game.released?.slice(0, 4) ?? props.t('tba'));
const genres = computed(() =>
  props.game.genres
    .slice(0, 2)
    .map((g) => genreName(g, props.locale))
    .join(', '),
);
const metaClass = computed(() => {
  const m = props.game.metacritic ?? 0;
  return m >= 75 ? 'good' : m >= 50 ? 'mid' : 'bad';
});

function open(event: MouseEvent) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
  event.preventDefault();
  emit('select');
}
</script>

<template>
  <a class="gv-tile" :href="`/game/${game.slug}`" @click="open">
    <div class="gv-tile-cover">
      <img v-if="cover" :src="cover" alt="" loading="lazy" />
      <span v-if="game.metacritic" class="meta" :class="metaClass" :title="t('metacritic', { score: game.metacritic })">
        {{ game.metacritic }}
      </span>
    </div>
    <div class="gv-tile-body">
      <p class="gv-tile-meta">
        <span>{{ year }}</span>
        <span v-if="genres">{{ genres }}</span>
      </p>
      <h3 class="gv-tile-title">{{ game.name }}</h3>
      <p v-if="game.rating" class="rating" :title="t('rating', { rating: game.rating.toFixed(1) })">
        ★ {{ game.rating.toFixed(1) }}
      </p>
    </div>
  </a>
</template>

<style scoped>
.gv-tile-meta { gap: 10px; }
.meta {
  position: absolute;
  top: 10px;
  right: 10px;
  min-width: 34px;
  padding: 3px 7px;
  border-radius: 8px;
  font-weight: 800;
  font-size: 0.9rem;
  text-align: center;
  font-variant-numeric: tabular-nums;
  color: var(--gv-bg);
}
.meta.good { background: var(--gv-good); }
.meta.mid { background: var(--gv-warn); }
.meta.bad { background: var(--gv-danger); }
.rating { margin: 2px 0 0; color: var(--gv-muted); font-size: 0.88rem; font-variant-numeric: tabular-nums; }
</style>

<script lang="ts">
  import type { FreeGamesProps } from '@gamevault/shared';
  import { getFreeGames, type FreeGame, type FreeGames } from './freeGames';
  import { usePrefs } from './prefs.svelte';

  let { view, limit }: FreeGamesProps = $props();

  const prefs = usePrefs();
  const t = $derived(prefs.t);

  let result = $state<{ status: 'loading' | 'error' } | { status: 'ready'; data: FreeGames }>({ status: 'loading' });
  let attempt = $state(0);

  $effect(() => {
    void attempt;
    const cc = prefs.country;
    let active = true;
    result = { status: 'loading' };
    getFreeGames(cc)
      .then((data) => active && (result = { status: 'ready', data }))
      .catch(() => active && (result = { status: 'error' }));
    return () => {
      active = false;
    };
  });

  let now = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => (now = Date.now()), 60_000);
    return () => clearInterval(id);
  });

  const relative = $derived(new Intl.RelativeTimeFormat(prefs.locale, { numeric: 'auto' }));
  const longDate = $derived(
    new Intl.DateTimeFormat(prefs.locale, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
  );
  const shortDay = $derived(new Intl.DateTimeFormat(prefs.locale, { weekday: 'short', day: 'numeric', month: 'short' }));

  function endsLabel(game: FreeGame): string {
    if (!game.endsAt) return t('noDeadline');
    const hours = (Date.parse(game.endsAt) - now) / 3_600_000;
    const when =
      hours < 1
        ? relative.format(Math.max(1, Math.round(hours * 60)), 'minute')
        : hours < 36
          ? relative.format(Math.round(hours), 'hour')
          : relative.format(Math.round(hours / 24), 'day');
    return t('endsIn', { when });
  }

  function worthLabel(game: FreeGame): string | null {
    const worth = game.worth;
    if (!worth) return null;
    const money = prefs.money;
    if (worth.currency === 'USD' && money.currency !== 'USD') {
      return t('worth', { price: `${money.converted ? '≈ ' : ''}${money.format(worth.amount)}` });
    }
    return t('worth', { price: money.formatExact(worth.amount, worth.currency) });
  }

  const endingSoon = (game: FreeGame) => !!game.endsAt && Date.parse(game.endsAt) - now < 48 * 3_600_000;

  const lead = $derived(result.status === 'ready' ? result.data.now[0] : undefined);
  const others = $derived(result.status === 'ready' ? result.data.now.slice(1, limit ? limit + 1 : undefined) : []);
  const upcoming = $derived(result.status === 'ready' ? result.data.upcoming : []);
</script>

{#snippet hero(game: FreeGame)}
  <article class="hero">
    {#if game.image}<img class="hero-art" src={game.image} alt="" />{/if}
    <div class="hero-content">
      <p class="hero-store">{t('freeOn', { store: game.store })}</p>
      <h2 class="hero-title">{game.title}</h2>
      <p class="hero-when" class:soon={endingSoon(game)}>
        <strong>{endsLabel(game)}</strong>
        {#if game.endsAt}<span>{t('until', { date: longDate.format(new Date(game.endsAt)) })}</span>{/if}
      </p>
      <div class="hero-actions">
        <a class="hero-cta" href={game.url} target="_blank" rel="noopener">{t('claimFree')}</a>
        {#if worthLabel(game)}<span class="hero-worth">{worthLabel(game)}</span>{/if}
      </div>
    </div>
  </article>
{/snippet}

{#snippet freeTile(game: FreeGame)}
  <a class="gv-tile" href={game.url} target="_blank" rel="noopener">
    <div class="gv-tile-cover">
      {#if game.image}<img src={game.image} alt="" loading="lazy" />{/if}
    </div>
    <div class="gv-tile-body">
      <p class="gv-tile-meta">{game.store}</p>
      <h3 class="gv-tile-title">{game.title}</h3>
      <p class="gv-price">
        <strong>{t('freeLabel')}</strong>
        {#if worthLabel(game)}<span>{worthLabel(game)}</span>{/if}
      </p>
      <p class="deadline" class:soon={endingSoon(game)}>{endsLabel(game)}</p>
    </div>
  </a>
{/snippet}

{#snippet upcomingTile(game: FreeGame)}
  <a class="gv-tile" href={game.url} target="_blank" rel="noopener">
    <div class="gv-tile-cover">
      {#if game.image}<img src={game.image} alt="" loading="lazy" />{/if}
      {#if game.startsAt}<span class="gv-tile-badge soon-badge">{shortDay.format(new Date(game.startsAt))}</span>{/if}
    </div>
    <div class="gv-tile-body">
      <p class="gv-tile-meta">{game.store}</p>
      <h3 class="gv-tile-title">{game.title}</h3>
      {#if game.startsAt}
        <p class="deadline">{t('startsOn', { date: shortDay.format(new Date(game.startsAt)) })}</p>
      {/if}
    </div>
  </a>
{/snippet}

{#if result.status === 'loading'}
  <div class="skeleton {view}" role="status" aria-label={t('freeLoading')}></div>
{:else if result.status === 'error'}
  <div class="notice" role="alert">
    <p>{t('freeError')}</p>
    <button type="button" class="ghost" onclick={() => attempt++}>{t('retry')}</button>
  </div>
{:else if view === 'hero'}
  {#if lead}{@render hero(lead)}{:else}<p class="notice">{t('freeEmpty')}</p>{/if}
{:else if view === 'others'}
  {#if others.length > 0}
    <ul class="gv-shelf">
      {#each others as game (game.id)}<li>{@render freeTile(game)}</li>{/each}
    </ul>
  {:else}
    <p class="gv-empty">{t('othersEmpty')}</p>
  {/if}
{:else if view === 'upcoming'}
  {#if upcoming.length > 0}
    <ul class="gv-shelf">
      {#each upcoming as game (game.id)}<li>{@render upcomingTile(game)}</li>{/each}
    </ul>
  {:else}
    <p class="gv-empty">{t('upcomingEmpty')}</p>
  {/if}
{:else}
  <header class="gv-page-head">
    <h1>{t('freeTitle')}</h1>
    <p>{t('freeSubtitle')}</p>
  </header>
  {#if lead}
    {@render hero(lead)}
    {#if others.length > 0}
      <ul class="gv-grid all">
        {#each others as game (game.id)}<li>{@render freeTile(game)}</li>{/each}
      </ul>
    {/if}
  {:else}
    <p class="notice">{t('freeEmpty')}</p>
  {/if}
  <section class="upcoming">
    <h2>{t('upcomingTitle')}</h2>
    {#if upcoming.length > 0}
      <ul class="gv-shelf">
        {#each upcoming as game (game.id)}<li>{@render upcomingTile(game)}</li>{/each}
      </ul>
    {:else}
      <p class="gv-empty">{t('upcomingEmpty')}</p>
    {/if}
  </section>
  <p class="source">{t('freeSource')} {prefs.conversionNote}</p>
{/if}

<style>
  .hero {
    position: relative;
    display: flex;
    align-items: flex-end;
    min-height: clamp(380px, 52vw, 560px);
    border-radius: var(--gv-radius-lg);
    background: var(--gv-surface);
    overflow: hidden;
    isolation: isolate;
  }
  .hero-art { position: absolute; inset: 0; z-index: -2; width: 100%; height: 100%; object-fit: cover; }
  .hero::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background:
      linear-gradient(90deg, color-mix(in srgb, var(--gv-bg) 92%, transparent) 0%, color-mix(in srgb, var(--gv-bg) 55%, transparent) 45%, transparent 75%),
      linear-gradient(0deg, color-mix(in srgb, var(--gv-bg) 85%, transparent) 0%, transparent 55%);
  }
  .hero-content { display: flex; flex-direction: column; gap: 14px; max-width: 34rem; padding: clamp(24px, 4vw, 48px); }
  .hero-store { margin: 0; color: var(--gv-accent-text); font-weight: 700; }
  .hero-title {
    margin: 0;
    font-size: clamp(2.4rem, 6vw, 4.75rem);
    font-weight: 800;
    line-height: 0.92;
    letter-spacing: -0.04em;
    text-wrap: balance;
  }
  .hero-when { display: flex; flex-direction: column; gap: 2px; margin: 0; }
  .hero-when strong { font-size: 1.1rem; }
  .hero-when span { color: var(--gv-muted); font-size: 0.92rem; }
  .hero-when.soon strong { color: var(--gv-warn); }
  .hero-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 18px; margin-top: 6px; }
  .hero-cta {
    padding: 14px 26px;
    border-radius: 999px;
    background: var(--gv-accent);
    color: var(--gv-accent-ink);
    font-size: 1.05rem;
    font-weight: 800;
    text-decoration: none;
  }
  .hero-cta:hover { filter: brightness(1.07); }
  .hero-worth { color: var(--gv-muted); font-variant-numeric: tabular-nums; }

  .deadline { margin: 2px 0 0; color: var(--gv-muted); font-size: 0.88rem; }
  .deadline.soon { color: var(--gv-warn); font-weight: 600; }
  .soon-badge { background: var(--gv-text); color: var(--gv-bg); font-size: 0.85rem; }

  .all { margin-top: 36px; }
  .upcoming { margin-top: 56px; }
  .upcoming h2 { margin: 0 0 18px; font-size: clamp(1.35rem, 2.6vw, 1.8rem); font-weight: 800; letter-spacing: -0.02em; }
  .source { margin: 28px 0 0; max-width: 70ch; color: var(--gv-muted); font-size: 0.8rem; }

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

  .skeleton { border-radius: var(--gv-radius); background: var(--gv-surface); height: 240px; }
  .skeleton.hero, .skeleton.all { height: clamp(380px, 52vw, 560px); border-radius: var(--gv-radius-lg); }
</style>

<script lang="ts">
  import { emit, type DealsFeedProps } from '@gamevault/shared';
  import { untrack } from 'svelte';
  import { getStores, listDeals, storeIcon, type DealSort, type FeedDeal, type Store } from './cheapshark';
  import { usePrefs } from './prefs.svelte';
  import { getSteamPrices, isSteamStore, type Country, type RegionalPrice } from './regional';

  let { limit }: DealsFeedProps = $props();

  const SORTS = [
    ['Deal Rating', 'sortBest'],
    ['Savings', 'sortSavings'],
    ['Price', 'sortPrice'],
    ['Metacritic', 'sortMetacritic'],
    ['Recent', 'sortRecent'],
  ] as const satisfies readonly (readonly [DealSort, string])[];
  const PRICE_CAPS = [null, 5, 10, 20] as const;

  const prefs = usePrefs();
  const t = $derived(prefs.t);
  const money = $derived(prefs.money);
  const shelf = $derived(limit !== undefined);

  let search = $state('');
  let title = $state('');
  let storeID = $state('');
  let upperPrice = $state<number | null>(null);
  let sortBy = $state<DealSort>('Deal Rating');
  let attempt = $state(0);

  let deals = $state<FeedDeal[]>([]);
  let page = $state(0);
  let hasMore = $state(false);
  let status = $state<'loading' | 'ready' | 'error'>('loading');
  let stores = $state<Store[]>([]);

  let controller: AbortController | undefined;

  async function load(reset: boolean) {
    controller?.abort();
    const current = (controller = new AbortController());
    const nextPage = reset ? 0 : page + 1;
    status = 'loading';
    try {
      const result = await listDeals({ title, storeID, upperPrice, sortBy, page: nextPage }, current.signal);
      if (reset) {
        deals = result.deals;
      } else {
        const known = new Set(deals.map((d) => d.key));
        deals = [...deals, ...result.deals.filter((d) => !known.has(d.key))];
      }
      page = nextPage;
      hasMore = result.hasMore;
      status = 'ready';
    } catch (error) {
      if ((error as Error).name !== 'AbortError') status = 'error';
    }
  }

  $effect(() => {
    const value = search.trim();
    const id = setTimeout(() => (title = value), 350);
    return () => clearTimeout(id);
  });

  $effect(() => {
    void [title, storeID, upperPrice, sortBy, attempt];
    untrack(() => load(true));
    return () => controller?.abort();
  });

  $effect(() => {
    if (shelf) return;
    getStores()
      .then((map) => {
        stores = [...map.values()].filter((s) => s.isActive).sort((a, b) => a.storeName.localeCompare(b.storeName));
      })
      .catch(() => {
      });
  });

  const shown = $derived(limit ? deals.slice(0, limit) : deals);

  let steam = $state<{ cc: Country; prices: Record<string, RegionalPrice | null> } | null>(null);

  $effect(() => {
    const cc = prefs.country;
    const ids = shown.flatMap((d) => (d.steamAppID ? [d.steamAppID] : []));
    if (ids.length === 0) return;
    let active = true;
    getSteamPrices(cc, ids)
      .then((prices) => active && (steam = { cc, prices }))
      .catch(() => {});
    return () => {
      active = false;
    };
  });

  function steamPriceOf(deal: FeedDeal): RegionalPrice | null {
    if (!deal.steamAppID || !steam || steam.cc !== prefs.country) return null;
    return steam.prices[deal.steamAppID] ?? null;
  }

  function retry() {
    if (deals.length > 0) load(false);
    else attempt++;
  }

  function open(deal: FeedDeal, event: MouseEvent) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    emit('game:selected', { slug: deal.slug, name: deal.title });
  }

  function useThumb(event: Event, thumb: string) {
    const img = event.currentTarget as HTMLImageElement;
    if (img.src !== thumb) img.src = thumb;
  }
</script>

{#snippet tile(deal: FeedDeal)}
  {@const steamPrice = steamPriceOf(deal)}
  {@const exact = isSteamStore(deal.storeID) ? steamPrice : null}
  {@const cut = exact ? exact.discount : deal.savings}
  <a class="gv-tile" href="/game/{deal.slug}" onclick={(e) => open(deal, e)}>
    <div class="gv-tile-cover">
      <img src={deal.image} alt="" loading="lazy" onerror={(e) => useThumb(e, deal.thumb)} />
      {#if cut > 0}<span class="gv-tile-badge">-{cut}%</span>{/if}
    </div>
    <div class="gv-tile-body">
      <p class="gv-tile-meta">
        {#if deal.store}<img src={storeIcon(deal.store)} alt="" width="14" height="14" />{deal.store.storeName}{/if}
        {#if deal.metacritic}<span class="score" title={t('metacritic', { score: deal.metacritic })}>{deal.metacritic}</span>{/if}
      </p>
      <h3 class="gv-tile-title">{deal.title}</h3>
      {#if exact}
        <p class="gv-price">
          <strong>{exact.final === 0 ? t('free') : money.formatExact(exact.final, exact.currency)}</strong>
          {#if exact.discount > 0}
            <s aria-label={t('wasPrice', { price: money.formatExact(exact.initial, exact.currency) })}>{money.formatExact(exact.initial, exact.currency)}</s>
          {/if}
        </p>
      {:else}
        <p class="gv-price">
          <strong>
            {#if deal.price === 0}{t('free')}{:else}{#if money.converted}<span class="gv-approx">≈</span>{/if}{money.format(deal.price)}{/if}
          </strong>
          <s aria-label={t('wasPrice', { price: money.format(deal.normalPrice) })}>{money.format(deal.normalPrice)}</s>
        </p>
        {#if steamPrice && deal.price > 0}
          {@const cheaper = money.currency === steamPrice.currency && steamPrice.final < money.fromUsd(deal.price)}
          <p class="steam" class:cheaper>
            {t(cheaper ? 'steamCheaper' : 'steamPrice', { price: steamPrice.final === 0 ? t('free') : money.formatExact(steamPrice.final, steamPrice.currency) })}
          </p>
        {/if}
      {/if}
    </div>
  </a>
{/snippet}

{#if shelf}
  {#if status === 'loading' && deals.length === 0}
    <div class="skeleton" role="status" aria-label={t('feedLoading')}></div>
  {:else if status === 'error' && deals.length === 0}
    <div class="notice" role="alert">
      <p>{t('feedError')}</p>
      <button type="button" class="ghost" onclick={retry}>{t('retry')}</button>
    </div>
  {:else}
    <ul class="gv-shelf">
      {#each shown as deal (deal.key)}<li>{@render tile(deal)}</li>{/each}
    </ul>
    {#if prefs.conversionNote}<p class="source">{prefs.conversionNote}</p>{/if}
  {/if}
{:else}
  <section aria-busy={status === 'loading'}>
    <header class="gv-page-head">
      <h1>{t('feedTitle')}</h1>
      <p>{t('feedSubtitle')}</p>
    </header>

    <div class="filters">
      <label class="search">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
        <span class="sr-only">{t('searchLabel')}</span>
        <input bind:value={search} type="search" placeholder={t('searchPlaceholder')} />
      </label>
      {#if stores.length > 0}
        <label class="field">
          <span class="sr-only">{t('storeLabel')}</span>
          <select class="gv-select" bind:value={storeID}>
            <option value="">{t('allStores')}</option>
            {#each stores as store (store.storeID)}
              <option value={store.storeID}>{store.storeName}</option>
            {/each}
          </select>
        </label>
      {/if}
      <label class="field">
        <span class="sr-only">{t('sortLabel')}</span>
        <select class="gv-select" bind:value={sortBy}>
          {#each SORTS as [value, key] (value)}
            <option {value}>{t(key)}</option>
          {/each}
        </select>
      </label>
    </div>

    <div class="caps" role="group" aria-label={t('priceLabel')}>
      {#each PRICE_CAPS as cap (cap)}
        <button type="button" aria-pressed={upperPrice === cap} onclick={() => (upperPrice = cap)}>
          {cap === null ? t('anyPrice') : t('upTo', { price: money.formatRounded(cap) })}
        </button>
      {/each}
    </div>

    {#if status === 'error' && deals.length === 0}
      <div class="notice" role="alert">
        <p>{t('feedError')}</p>
        <button type="button" class="ghost" onclick={retry}>{t('retry')}</button>
      </div>
    {:else if status === 'ready' && deals.length === 0}
      <p class="notice">{t('feedEmpty')}</p>
    {/if}

    <ul class="gv-grid">
      {#each deals as deal (deal.key)}<li>{@render tile(deal)}</li>{/each}
    </ul>

    <footer class="more">
      {#if status === 'loading'}
        <div class="spinner" role="status" aria-label={t('feedLoading')}></div>
      {:else if status === 'error' && deals.length > 0}
        <button type="button" class="ghost" onclick={retry}>{t('retry')}</button>
      {:else if hasMore}
        <button type="button" class="ghost" onclick={() => load(false)}>{t('loadMore')}</button>
      {/if}
      {#if deals.length > 0}<p class="source">{t('feedSource')} {prefs.conversionNote}</p>{/if}
    </footer>
  </section>
{/if}

<style>
  .filters { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; }
  .search {
    flex: 1 1 320px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 16px;
    border: 1px solid var(--gv-border);
    border-radius: 999px;
    background: var(--gv-surface);
    color: var(--gv-muted);
  }
  .search:focus-within { border-color: var(--gv-accent); }
  .search input { flex: 1; min-width: 0; padding: 12px 0; border: 0; background: none; color: var(--gv-text); outline: none; }
  .field { flex: 1 1 140px; max-width: 240px; }
  @media (max-width: 560px) { .field { max-width: none; } }

  .caps { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 32px; }
  .caps button {
    padding: 8px 16px;
    border: 1px solid var(--gv-border);
    border-radius: 999px;
    background: transparent;
    color: var(--gv-muted);
    cursor: pointer;
  }
  .caps button:hover { color: var(--gv-text); border-color: var(--gv-muted); }
  .caps button[aria-pressed='true'] { border-color: var(--gv-accent); background: var(--gv-accent); color: var(--gv-accent-ink); font-weight: 700; }

  .steam { margin: 2px 0 0; color: var(--gv-muted); font-size: 0.85rem; font-variant-numeric: tabular-nums; }
  .steam.cheaper { color: var(--gv-good); font-weight: 600; }

  .score {
    margin-left: auto;
    padding: 0 6px;
    border: 1px solid var(--gv-good);
    border-radius: 6px;
    color: var(--gv-good);
    font-size: 0.78rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .notice {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    margin: 0 0 20px;
    padding: 18px 20px;
    border-radius: var(--gv-radius);
    background: var(--gv-surface);
    color: var(--gv-muted);
  }
  .notice p { margin: 0; }

  .more { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 40px 0 0; }
  .source { margin: 14px 0 0; max-width: 70ch; color: var(--gv-muted); font-size: 0.8rem; }
  .more .source { text-align: center; }
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

  .skeleton { height: 260px; border-radius: var(--gv-radius); background: var(--gv-surface); }
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

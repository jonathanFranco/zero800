<script lang="ts">
  import { on, type DealsProps } from '@gamevault/shared';
  import { findOffers, storeIcon, type Deal, type GameOffers } from './cheapshark';
  import { usePrefs } from './prefs.svelte';
  import { getSteamPrices, isSteamStore, type Country, type RegionalPrice } from './regional';

  let { slug }: DealsProps = $props();

  type State =
    | { status: 'waiting' | 'loading' | 'empty' | 'error' }
    | { status: 'ready'; offers: GameOffers };

  let view = $state<State>({ status: 'waiting' });
  let name = $state<string | null>(null);
  let attempt = $state(0);

  const prefs = usePrefs();
  const t = $derived(prefs.t);
  const money = $derived(prefs.money);
  const date = $derived(new Intl.DateTimeFormat(prefs.locale, { month: 'short', year: 'numeric' }));

  $effect(() =>
    on(
      'game:loaded',
      (game) => {
        if (game.slug === slug) name = game.name;
      },
      { replay: true },
    ),
  );

  $effect(() => {
    if (!name) return;
    void attempt;
    const controller = new AbortController();
    view = { status: 'loading' };
    findOffers(name, controller.signal)
      .then((offers) => {
        view = offers && offers.deals.length > 0 ? { status: 'ready', offers } : { status: 'empty' };
      })
      .catch((error: Error) => {
        if (error.name !== 'AbortError') view = { status: 'error' };
      });
    return () => controller.abort();
  });

  let steam = $state<{ cc: Country; appid: string; price: RegionalPrice | null } | null>(null);

  $effect(() => {
    if (view.status !== 'ready' || !view.offers.steamAppID) return;
    const cc = prefs.country;
    const appid = view.offers.steamAppID;
    let active = true;
    getSteamPrices(cc, [appid])
      .then((prices) => active && (steam = { cc, appid, price: prices[appid] ?? null }))
      .catch(() => {});
    return () => {
      active = false;
    };
  });

  interface Row {
    deal: Deal;
    amount: number;
    regular: number;
    cut: number;
    currency: string;
    exact: boolean;
  }

  const rows = $derived.by((): Row[] => {
    if (view.status !== 'ready') return [];
    const regional =
      steam && steam.cc === prefs.country && steam.appid === view.offers.steamAppID ? steam.price : null;
    return view.offers.deals
      .map((deal): Row =>
        isSteamStore(deal.storeID) && regional
          ? { deal, amount: regional.final, regular: regional.initial, cut: regional.discount, currency: regional.currency, exact: true }
          : {
              deal,
              amount: money.fromUsd(deal.price),
              regular: money.fromUsd(deal.retailPrice),
              cut: deal.savings,
              currency: money.currency,
              exact: false,
            },
      )
      .sort((a, b) => a.amount - b.amount);
  });

  const show = (row: Row, value: number) => (value === 0 ? t('free') : money.formatExact(value, row.currency));
  const approx = (row: Row) => !row.exact && money.converted && row.amount > 0;
</script>

<div class="deals">
  <h2>{t('title')}</h2>

  {#if view.status === 'waiting' || view.status === 'loading'}
    <div class="skeleton" role="status" aria-label={t('loading')}>
      <div class="block tall"></div>
      <div class="block"></div>
      <div class="block"></div>
    </div>
  {:else if view.status === 'empty'}
    <p class="muted">{t('empty')}</p>
  {:else if view.status === 'error'}
    <p class="muted">{t('error')}</p>
    <button type="button" class="retry" onclick={() => attempt++}>{t('retry')}</button>
  {:else if view.status === 'ready'}
    {@const { lowestEver, title } = view.offers}
    {@const best = rows[0]}
    <a class="best" href={best.deal.url} target="_blank" rel="noopener">
      <span class="label">{t('bestNow')}</span>
      <span class="price-line">
        <span class="price">{#if approx(best)}<span class="approx">≈</span>{/if}{show(best, best.amount)}</span>
        {#if best.cut > 0}<span class="cut">-{best.cut}%</span>{/if}
      </span>
      {#if best.cut > 0}<s class="was">{show(best, best.regular)}</s>{/if}
      <span class="store">
        {#if best.deal.store}<img src={storeIcon(best.deal.store)} alt="" width="16" height="16" />{/if}
        {t('atStore', { store: best.deal.store?.storeName ?? t('store') })}
      </span>
    </a>

    {#if rows.length > 1}
      <h3>{t('otherStores')}</h3>
      <ul class="list">
        {#each rows.slice(1, 8) as row (row.deal.url)}
          <li>
            <a class="row" href={row.deal.url} target="_blank" rel="noopener">
              {#if row.deal.store}<img src={storeIcon(row.deal.store)} alt="" width="16" height="16" />{/if}
              <span class="name">{row.deal.store?.storeName ?? t('store')}</span>
              {#if row.cut > 0}<span class="savings">-{row.cut}%</span>{/if}
              <span class="amount">{#if approx(row)}<span class="approx">≈</span>{/if}{show(row, row.amount)}</span>
            </a>
          </li>
        {/each}
      </ul>
    {/if}

    {#if lowestEver}
      <p class="history">
        <span>{t('lowestEver')}</span>
        <strong>{#if money.converted}<span class="approx">≈</span>{/if}{money.format(lowestEver.price)}</strong>
        <span class="when">{date.format(lowestEver.date)}</span>
      </p>
    {/if}
    <p class="muted small">{t('source', { title })} {prefs.conversionNote}</p>
  {/if}
</div>

<style>
  .deals {
    padding: 22px;
    border-radius: var(--gv-radius-lg);
    background: var(--gv-surface);
  }
  h2 { margin: 0 0 16px; font-size: 1.3rem; font-weight: 800; letter-spacing: -0.01em; }
  h3 { margin: 20px 0 8px; color: var(--gv-muted); font-size: 0.9rem; font-weight: 600; }

  .best {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 18px;
    border-radius: var(--gv-radius);
    background: var(--gv-accent);
    color: var(--gv-accent-ink);
    text-decoration: none;
    font-variant-numeric: tabular-nums;
  }
  .best:hover { filter: brightness(1.06); }
  .label { font-size: 0.9rem; font-weight: 600; }
  .price-line { display: flex; align-items: baseline; gap: 10px; }
  .price { font-size: 2.6rem; font-weight: 800; line-height: 1; letter-spacing: -0.03em; }
  .cut {
    padding: 2px 8px;
    border-radius: 6px;
    background: var(--gv-accent-ink);
    color: var(--gv-accent);
    font-weight: 800;
  }
  .was { opacity: 0.7; font-size: 0.9rem; }
  .approx { margin-right: 4px; font-size: 0.6em; font-weight: 600; opacity: 0.75; }
  .store { display: flex; align-items: center; gap: 6px; margin-top: 6px; font-weight: 600; }
  .store img { border-radius: 3px; }

  .list { display: flex; flex-direction: column; gap: 6px; margin: 0; padding: 0; list-style: none; }
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid transparent;
    border-radius: var(--gv-radius-sm);
    background: var(--gv-surface-2);
    color: var(--gv-text);
    text-decoration: none;
    font-size: 0.92rem;
    font-variant-numeric: tabular-nums;
  }
  .row:hover { border-color: var(--gv-border); }
  .row img { border-radius: 3px; }
  .name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .amount { font-weight: 700; }
  .savings { color: var(--gv-accent-text); font-weight: 700; font-size: 0.85rem; }

  .history {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px;
    margin: 20px 0 8px;
    padding-top: 16px;
    border-top: 1px solid var(--gv-border);
    color: var(--gv-muted);
    font-size: 0.9rem;
    font-variant-numeric: tabular-nums;
  }
  .history strong { color: var(--gv-text); font-size: 1.05rem; }
  .when { margin-left: auto; }

  .muted { margin: 0 0 8px; color: var(--gv-muted); }
  .small { font-size: 0.8rem; }

  .skeleton { display: flex; flex-direction: column; gap: 8px; }
  .block { height: 42px; border-radius: var(--gv-radius-sm); background: var(--gv-surface-2); }
  .block.tall { height: 140px; border-radius: var(--gv-radius); }

  .retry {
    padding: 8px 14px;
    border: 1px solid var(--gv-border);
    border-radius: var(--gv-radius-sm);
    background: var(--gv-surface-2);
    color: var(--gv-text);
    cursor: pointer;
  }
</style>

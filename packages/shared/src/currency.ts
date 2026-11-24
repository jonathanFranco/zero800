import { emit, on } from './bus';
import { getLocale, type Locale } from './i18n';

export const CURRENCIES = ['BRL', 'USD', 'EUR'] as const;
export type Currency = (typeof CURRENCIES)[number];

const DEFAULT_BY_LOCALE: Record<Locale, Currency> = { 'pt-BR': 'BRL', en: 'USD', es: 'EUR' };
const STORAGE_KEY = 'gamevault:currency';

declare global {
  interface Window {
    __GAMEVAULT_CURRENCY__?: Currency | null;
  }
}

function isCurrency(value: unknown): value is Currency {
  return CURRENCIES.includes(value as Currency);
}

function chosenCurrency(): Currency | null {
  if (window.__GAMEVAULT_CURRENCY__ === undefined) {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      saved = null;
    }
    window.__GAMEVAULT_CURRENCY__ = isCurrency(saved) ? saved : null;
  }
  return window.__GAMEVAULT_CURRENCY__;
}

export function getCurrency(): Currency {
  return chosenCurrency() ?? DEFAULT_BY_LOCALE[getLocale()];
}

export function setCurrency(currency: Currency): void {
  if (currency === chosenCurrency()) return;
  window.__GAMEVAULT_CURRENCY__ = currency;
  try {
    localStorage.setItem(STORAGE_KEY, currency);
  } catch {
  }
  emit('currency:changed', { currency });
}

export function onCurrencyChange(handler: (currency: Currency) => void): () => void {
  let last = getCurrency();
  const notify = () => {
    const next = getCurrency();
    if (next === last) return;
    last = next;
    handler(next);
  };
  const offCurrency = on('currency:changed', notify);
  const offLocale = on('locale:changed', notify);
  return () => {
    offCurrency();
    offLocale();
  };
}

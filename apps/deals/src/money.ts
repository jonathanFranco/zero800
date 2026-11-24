import type { Currency, Locale } from '@gamevault/shared';

export type Rates = Partial<Record<Currency, number>>;

const RATES_URL = 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=BRL,EUR';

let ratesPromise: Promise<{ rates: Rates; date: string }> | undefined;

export function getRates() {
  ratesPromise ??= fetch(RATES_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`Frankfurter responded ${res.status}`);
      return res.json() as Promise<{ date: string; rates: Rates }>;
    })
    .then((body) => ({ rates: { ...body.rates, USD: 1 }, date: body.date }))
    .catch((error) => {
      ratesPromise = undefined;
      throw error;
    });
  return ratesPromise;
}

export interface Money {
  currency: Currency;
  converted: boolean;
  format: (usd: number) => string;
  formatRounded: (usd: number) => string;
  formatExact: (amount: number, currency: string) => string;
  fromUsd: (usd: number) => number;
}

export function createMoney(locale: Locale, currency: Currency, rates: Rates | null): Money {
  const rate = currency === 'USD' ? 1 : rates?.[currency];
  const target: Currency = rate ? currency : 'USD';
  const factor = rate ?? 1;
  const exact = new Intl.NumberFormat(locale, { style: 'currency', currency: target });
  const rounded = new Intl.NumberFormat(locale, { style: 'currency', currency: target, maximumFractionDigits: 0 });
  return {
    currency: target,
    converted: target !== 'USD',
    format: (usd) => exact.format(usd * factor),
    formatRounded: (usd) => rounded.format(Math.round(usd * factor)),
    formatExact: (amount, code) => new Intl.NumberFormat(locale, { style: 'currency', currency: code }).format(amount),
    fromUsd: (usd) => usd * factor,
  };
}

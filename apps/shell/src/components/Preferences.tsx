import {
  CURRENCIES,
  getCurrency,
  getLocale,
  LOCALE_NAMES,
  LOCALES,
  onCurrencyChange,
  onLocaleChange,
  setCurrency,
  setLocale,
  type Currency,
  type Locale,
} from '@gamevault/shared';
import { useSyncExternalStore } from 'react';
import { useT } from '../i18n';

const SYMBOL: Record<Currency, string> = { BRL: 'R$', USD: 'US$', EUR: '€' };
const SHORT_LOCALE: Record<Locale, string> = { 'pt-BR': 'PT', en: 'EN', es: 'ES' };

export function Preferences({ compact = false }: { compact?: boolean }) {
  const t = useT();
  const locale = useSyncExternalStore(onLocaleChange, getLocale);
  const currency = useSyncExternalStore(onCurrencyChange, getCurrency);
  const currencyName = new Intl.DisplayNames(locale, { type: 'currency' });

  return (
    <div className={compact ? 'prefs compact' : 'prefs'}>
      <label className="pref">
        <span className="pref-label">{t('currency')}</span>
        <select
          className="gv-select"
          value={currency}
          onChange={(e) => setCurrency(e.target.value as Currency)}
          title={`${t('currency')}: ${currencyName.of(currency)}`}
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {compact ? SYMBOL[c] : `${SYMBOL[c]} ${currencyName.of(c)}`}
            </option>
          ))}
        </select>
      </label>
      <label className="pref">
        <span className="pref-label">{t('language')}</span>
        <select
          className="gv-select"
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
          title={`${t('language')}: ${LOCALE_NAMES[locale]}`}
        >
          {LOCALES.map((l) => (
            <option key={l} value={l} lang={l}>
              {compact ? SHORT_LOCALE[l] : LOCALE_NAMES[l]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

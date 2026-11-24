import { getCurrency, getLocale, onCurrencyChange, onLocaleChange } from '@gamevault/shared';
import { translate } from './i18n';
import { createMoney, getRates, type Rates } from './money';
import { COUNTRY_BY_CURRENCY } from './regional';

export function usePrefs() {
  let locale = $state(getLocale());
  let currency = $state(getCurrency());
  let rates = $state<Rates | null>(null);
  let ratesDate = $state<string | null>(null);

  $effect(() => onLocaleChange((next) => (locale = next)));
  $effect(() => onCurrencyChange((next) => (currency = next)));
  $effect(() => {
    getRates()
      .then((result) => {
        rates = result.rates;
        ratesDate = result.date;
      })
      .catch(() => {
      });
  });

  const t = $derived(translate(locale));
  const money = $derived(createMoney(locale, currency, rates));
  const rateDateLabel = $derived(
    ratesDate ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(`${ratesDate}T12:00:00Z`)) : '',
  );

  return {
    get locale() {
      return locale;
    },
    get t() {
      return t;
    },
    get money() {
      return money;
    },
    get country() {
      return COUNTRY_BY_CURRENCY[currency];
    },
    get conversionNote() {
      return money.converted ? t('convertedNote', { date: rateDateLabel }) : '';
    },
  };
}

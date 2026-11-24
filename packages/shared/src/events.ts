import type { Currency } from './currency';
import type { Locale } from './i18n';

export interface GameVaultEvents {
  'game:selected': { slug: string; name: string };
  'game:loaded': { slug: string; name: string };
  'locale:changed': { locale: Locale };
  navigate: { path: string };
  'news:selected': { id: string };
  'news:loaded': { id: string; title: string; source: string };
  'currency:changed': { currency: Currency };
}

export type GameVaultEvent = keyof GameVaultEvents;

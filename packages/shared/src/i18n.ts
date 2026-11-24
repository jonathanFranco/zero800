import { emit, on } from './bus';

export const LOCALES = ['pt-BR', 'en', 'es'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_NAMES: Record<Locale, string> = {
  'pt-BR': 'Português',
  en: 'English',
  es: 'Español',
};

const DEFAULT_LOCALE: Locale = 'pt-BR';
const STORAGE_KEY = 'gamevault:locale';

declare global {
  interface Window {
    __GAMEVAULT_LOCALE__?: Locale;
  }
}

function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale);
}

function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLocale(saved)) return saved;
  } catch {
  }
  for (const tag of navigator.languages ?? [navigator.language]) {
    const lower = tag.toLowerCase();
    const match =
      LOCALES.find((l) => l.toLowerCase() === lower) ??
      LOCALES.find((l) => l.split('-')[0] === lower.split('-')[0]);
    if (match) return match;
  }
  return DEFAULT_LOCALE;
}

export function getLocale(): Locale {
  if (!window.__GAMEVAULT_LOCALE__) {
    window.__GAMEVAULT_LOCALE__ = detectLocale();
    document.documentElement.lang = window.__GAMEVAULT_LOCALE__;
  }
  return window.__GAMEVAULT_LOCALE__;
}

export function setLocale(locale: Locale): void {
  if (locale === getLocale()) return;
  window.__GAMEVAULT_LOCALE__ = locale;
  document.documentElement.lang = locale;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
  }
  emit('locale:changed', { locale });
}

export function onLocaleChange(handler: (locale: Locale) => void): () => void {
  return on('locale:changed', ({ locale }) => handler(locale));
}

export type TranslateParams = Record<string, string | number>;
export type Translate<K extends string> = (key: K, params?: TranslateParams) => string;

export function createTranslator<K extends string>(messages: Record<Locale, Record<K, string>>) {
  return (locale: Locale): Translate<K> =>
    (key, params) =>
      messages[locale][key].replace(/\{(\w+)\}/g, (match, name: string) =>
        params && name in params ? String(params[name]) : match,
      );
}

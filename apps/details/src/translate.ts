import type { Locale } from '@gamevault/shared';

interface BrowserTranslator {
  translate(text: string): Promise<string>;
  destroy?(): void;
}

type Availability = 'available' | 'downloadable' | 'downloading' | 'unavailable';

interface TranslatorFactory {
  availability(options: { sourceLanguage: string; targetLanguage: string }): Promise<Availability>;
  create(options: { sourceLanguage: string; targetLanguage: string }): Promise<BrowserTranslator>;
}

export type TranslationSupport = 'ready' | 'on-request' | 'unsupported';

const targetLanguage = (locale: Locale) => (locale === 'pt-BR' ? 'pt' : locale);

function translatorFactory(): TranslatorFactory | null {
  return (globalThis as { Translator?: TranslatorFactory }).Translator ?? null;
}

export async function translationSupport(locale: Locale): Promise<TranslationSupport> {
  const factory = translatorFactory();
  if (!factory) return 'unsupported';
  try {
    const availability = await factory.availability({ sourceLanguage: 'en', targetLanguage: targetLanguage(locale) });
    if (availability === 'available') return 'ready';
    return availability === 'unavailable' ? 'unsupported' : 'on-request';
  } catch {
    return 'unsupported';
  }
}

export async function translateText(text: string, locale: Locale): Promise<string> {
  const factory = translatorFactory();
  if (!factory) throw new Error('Translator API unavailable');
  const translator = await factory.create({ sourceLanguage: 'en', targetLanguage: targetLanguage(locale) });
  try {
    const lines = text.split('\n');
    const translated: string[] = [];
    for (const line of lines) translated.push(line.trim() ? await translator.translate(line) : line);
    return translated.join('\n');
  } finally {
    translator.destroy?.();
  }
}

export function googleTranslateUrl(text: string, locale: Locale): string {
  const params = new URLSearchParams({ sl: 'en', tl: targetLanguage(locale), op: 'translate', text: text.slice(0, 4000) });
  return `https://translate.google.com/?${params}`;
}

import { useEffect } from 'react';
import { useLocation } from 'react-router';

const SITE_URL = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '');

export interface PageMeta {
  title: string;
  description: string;
  noindex?: boolean;
}

function upsert(selector: string, create: () => HTMLElement, attr: string, value: string) {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

const meta = (key: 'name' | 'property', value: string) => () => {
  const el = document.createElement('meta');
  el.setAttribute(key, value);
  return el;
};

export function usePageMeta({ title, description, noindex = false }: PageMeta) {
  const { pathname } = useLocation();

  useEffect(() => {
    const url = `${SITE_URL}${pathname}`;
    document.title = title;
    upsert('meta[name="description"]', meta('name', 'description'), 'content', description);
    upsert('meta[name="robots"]', meta('name', 'robots'), 'content', noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large');
    upsert('meta[property="og:title"]', meta('property', 'og:title'), 'content', title);
    upsert('meta[property="og:description"]', meta('property', 'og:description'), 'content', description);
    upsert('meta[property="og:url"]', meta('property', 'og:url'), 'content', url);
    upsert('meta[name="twitter:title"]', meta('name', 'twitter:title'), 'content', title);
    upsert('meta[name="twitter:description"]', meta('name', 'twitter:description'), 'content', description);
    upsert(
      'link[rel="canonical"]',
      () => {
        const link = document.createElement('link');
        link.rel = 'canonical';
        return link;
      },
      'href',
      url,
    );
  }, [title, description, noindex, pathname]);
}

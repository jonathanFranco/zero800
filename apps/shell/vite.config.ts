import { federation } from '@module-federation/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';

const ENV_DIR = '../../';
const INDEXED_ROUTES = ['/', '/free', '/deals', '/games', '/news'];

function seo(siteUrl: string): Plugin {
  return {
    name: 'zero800-seo',
    transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', siteUrl),
    generateBundle() {
      const lastmod = new Date().toISOString().slice(0, 10);
      const urls = INDEXED_ROUTES.map(
        (route) =>
          `  <url><loc>${siteUrl}${route}</loc><lastmod>${lastmod}</lastmod><changefreq>daily</changefreq><priority>${route === '/' ? '1.0' : '0.8'}</priority></url>`,
      ).join('\n');
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      });
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ENV_DIR, 'VITE_');
  const siteUrl = (env.VITE_SITE_URL || 'http://localhost:4000').replace(/\/$/, '');
  const remote = (name: string, fallback: string) => ({
    type: 'module' as const,
    name,
    entry: `${env[`VITE_${name.toUpperCase()}_URL`] || fallback}/remoteEntry.js`,
  });

  return {
    envDir: ENV_DIR,
    server: { port: 4000, strictPort: true },
    preview: { port: 4000, strictPort: true },
    build: { target: 'esnext' },
    plugins: [
      seo(siteUrl),
      react(),
      federation({
        name: 'shell',
        remotes: {
          catalog: remote('catalog', 'http://localhost:4001'),
          details: remote('details', 'http://localhost:4002'),
          deals: remote('deals', 'http://localhost:4003'),
          news: remote('news', 'http://localhost:4004'),
        },
        shared: {
          react: { singleton: true },
          'react-dom': { singleton: true },
        },
        dts: false,
      }),
    ],
  };
});

import { federation } from '@module-federation/vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

const PORT = 4003;

export default defineConfig(({ command }) => ({
  envDir: '../../',
  base: command === 'build' ? (process.env.PUBLIC_URL ?? `http://localhost:${PORT}/`) : '/',
  server: { port: PORT, strictPort: true, origin: `http://localhost:${PORT}` },
  preview: { port: PORT, strictPort: true },
  build: { target: 'esnext' },
  plugins: [
    svelte(),
    federation({
      name: 'deals',
      filename: 'remoteEntry.js',
      exposes: {
        './mount': './src/mount.ts',
        './feed': './src/feed.ts',
        './free': './src/free.ts',
      },
      dts: false,
    }),
  ],
}));

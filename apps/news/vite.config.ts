import { federation } from '@module-federation/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

const PORT = 4004;

export default defineConfig(({ command }) => ({
  envDir: '../../',
  base: command === 'build' ? (process.env.PUBLIC_URL ?? `http://localhost:${PORT}/`) : '/',
  server: { port: PORT, strictPort: true, origin: `http://localhost:${PORT}` },
  preview: { port: PORT, strictPort: true },
  build: { target: 'esnext' },
  plugins: [
    vue(),
    federation({
      name: 'news',
      filename: 'remoteEntry.js',
      exposes: {
        './mount': './src/mount.ts',
        './article': './src/article.ts',
      },
      dts: false,
    }),
  ],
}));

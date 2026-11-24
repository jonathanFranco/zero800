import { federation } from '@module-federation/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const PORT = 4002;

export default defineConfig(({ command }) => ({
  envDir: '../../',
  base: command === 'build' ? (process.env.PUBLIC_URL ?? `http://localhost:${PORT}/`) : '/',
  server: { port: PORT, strictPort: true, origin: `http://localhost:${PORT}` },
  preview: { port: PORT, strictPort: true },
  build: { target: 'esnext' },
  plugins: [
    react(),
    federation({
      name: 'details',
      filename: 'remoteEntry.js',
      exposes: { './mount': './src/mount.tsx' },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
      },
      dts: false,
    }),
  ],
}));

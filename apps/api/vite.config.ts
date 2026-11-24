import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, type Plugin, type ViteDevServer } from 'vite';

const PORT = 4010;

function vercelFunctions(): Plugin {
  return {
    name: 'gamevault-vercel-functions',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
        const match = /^\/api\/([\w-]+)$/.exec(url.pathname);
        if (!match || req.method !== 'GET') return next();

        try {
          const mod = (await server.ssrLoadModule(`/api/${match[1]}.ts`)) as {
            GET?: (request: Request) => Promise<Response>;
          };
          if (!mod.GET) return next();
          const response = await mod.GET(new Request(url));
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (error) {
          server.ssrFixStacktrace(error as Error);
          next(error);
        }
      });
    },
  };
}

export default defineConfig({
  envDir: '../../',
  server: { port: PORT, strictPort: true },
  plugins: [vercelFunctions()],
});

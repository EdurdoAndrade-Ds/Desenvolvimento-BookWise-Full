import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  // Backend consumido no desenvolvimento: local por padrao, ambiente publicado
  // com `npm run dev:online` (ver frontend/.env.online).
  const apiProxyTarget = env.API_PROXY_TARGET || 'http://localhost:8080';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      // Proxy para a API Spring Boot durante o desenvolvimento.
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          // O backend publicado so libera CORS para a origem de producao; como o
          // proxy e server-side, removemos Origin/Referer do encaminhamento.
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('origin');
              proxyReq.removeHeader('referer');
            });
          },
        },
      },
    },
  };
});

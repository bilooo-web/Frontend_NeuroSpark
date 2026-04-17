import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/rebrickable': {
        target: 'https://rebrickable.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rebrickable/, '/api/v3/lego'),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            const url = new URL(proxyReq.path, 'https://rebrickable.com');
            url.searchParams.set('key', 'df89f504066bb0f4ede8313f5829b2fe');
            proxyReq.path = url.pathname + url.search;
          });
        }
      },
      '/api/mecabricks': {
        target: 'https://www.mecabricks.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mecabricks/, ''),
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      }
    }
  }
})

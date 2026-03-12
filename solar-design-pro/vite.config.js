import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// ── PDF proxy plugin — bypasses CORS on government PDF servers ──
function pdfProxyPlugin() {
  return {
    name: 'pdf-proxy',
    configureServer(server) {
      server.middlewares.use('/api/pdf-proxy', async (req, res) => {
        const url = new URL(req.url, 'http://localhost').searchParams.get('url');
        if (!url) { res.writeHead(400); res.end('Missing ?url= parameter'); return; }
        try {
          const r = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (SolarDesignPro PDF Fetcher)' },
            redirect: 'follow',
          });
          if (!r.ok) { res.writeHead(r.status); res.end(`Upstream ${r.status}`); return; }
          const buf = Buffer.from(await r.arrayBuffer());
          res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Length': buf.length,
            'Access-Control-Allow-Origin': '*',
          });
          res.end(buf);
        } catch (e) {
          res.writeHead(502); res.end('Proxy error: ' + e.message);
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), pdfProxyPlugin()],
    server: {
      proxy: {
        '/inventory': {
          target: 'http://localhost:5174',
          changeOrigin: true,
        },
        '/api/anthropic': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/anthropic/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('x-api-key', env.VITE_ANTHROPIC_API_KEY || '');
              proxyReq.setHeader('anthropic-version', '2023-06-01');
              proxyReq.removeHeader('origin');
              proxyReq.removeHeader('referer');
            });
          },
        },
      },
    },
  };
});

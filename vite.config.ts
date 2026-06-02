import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
        type: 'module',
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\/api\/sync/,
            handler: 'NetworkOnly',
            options: {
              backgroundSync: {
                name: 'syncQueue',
                options: {
                  maxRetentionTime: 24 * 60 // 24 hours
                }
              }
            }
          }
        ]
      },
      manifest: {
        name: 'CricTrack',
        short_name: 'CricTrack',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    }),
    {
      name: 'mock-api',
      configureServer(server) {
        server.middlewares.use('/api/sync', (_req, res) => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
        });
      }
    }
  ],
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Workout Tracker',
        short_name: 'Workout',
        start_url: '/',
        display: 'standalone',
        background_color: '#0a0612',
        theme_color: '#ffb347',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.jordanscamp\.site\/api\/workout\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'workout-api',
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
            },
          },
        ],
      },
    }),
  ],
  base: '/',
})

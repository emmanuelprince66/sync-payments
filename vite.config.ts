import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      tailwindcss(),
      // Installable app + offline app shell. API and Geoapify calls always go to the network (never cached).
      VitePWA({
        registerType: 'autoUpdate', // a new upload replaces the old version on the next visit, no prompt
        injectRegister: 'script-defer',
        includeAssets: ['favicon.png', 'apple-touch-icon.png', 'brand/*.png'],
        manifest: {
          id: '/',
          name: 'Sync Pay',
          short_name: 'Sync Pay',
          description: 'Accounts, transfers, invoices and expenses in one dashboard.',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          theme_color: '#242424',
          background_color: '#F8FAF8',
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          // App shell only: the built JS/CSS/HTML, fonts and icons.
          globPatterns: ['**/*.{js,css,html,woff,woff2,png,svg,ico,webmanifest}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            { urlPattern: ({ url }) => url.pathname.startsWith('/api/'), handler: 'NetworkOnly' },
            { urlPattern: ({ url }) => url.hostname.endsWith('geoapify.com'), handler: 'NetworkOnly' },
          ],
        },
        devOptions: { enabled: false },
      }),
    ],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: {
      port: 5181,
      // Dev-only proxy so the browser avoids CORS while we talk to the Sync360 API.
      proxy: {
        '/api/v1': { target: env.VITE_API_PROXY_TARGET || 'https://api.sync360.africa', changeOrigin: true, secure: true },
      },
    },
  }
})

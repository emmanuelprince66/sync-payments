import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: {
      port: 5181,
      // Dev-only proxy so the browser avoids CORS while we talk to the Sync360 API.
      proxy: {
        '/api/v1': { target: env.VITE_API_PROXY_TARGET || 'https://staging-api.sync360.africa', changeOrigin: true, secure: true },
      },
    },
  }
})

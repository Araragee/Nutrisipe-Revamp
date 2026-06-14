import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:3000'

  return {
    plugins: [
      vue(),
      vueDevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
        '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
        '@http': fileURLToPath(new URL('./src/http', import.meta.url)),
        '@router': fileURLToPath(new URL('./src/router', import.meta.url)),
        '@schema': fileURLToPath(new URL('./src/schema', import.meta.url)),
        '@stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
        '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
        '@views': fileURLToPath(new URL('./src/views', import.meta.url)),
        '@composables': fileURLToPath(new URL('./src/composables', import.meta.url)),
        '@interface': fileURLToPath(
          new URL('./src/typescript/interface', import.meta.url)
        ),
        '@types': fileURLToPath(new URL('./src/typescript/types', import.meta.url))
      }
    },
    server: {
      proxy: {
        '/api': proxyTarget,
        '/uploads': proxyTarget,
        '/socket.io': {
          target: proxyTarget,
          ws: true,
        },
      },
    },
    preview: {
      proxy: {
        '/api': proxyTarget,
        '/uploads': proxyTarget,
        '/socket.io': {
          target: proxyTarget,
          ws: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          // Only vendor splits — Vite handles component chunks automatically.
          // Explicit component chunks cause circular-chunk warnings when components
          // import each other (UserAvatar used by both feed and post components).
          manualChunks: {
            'vue-vendor': ['vue', 'vue-router', 'pinia'],
            'axios-vendor': ['axios'],
          },
        },
      },
      // Enable chunk size warnings
      chunkSizeWarningLimit: 500,
      // Minify production build
      minify: 'esbuild',
    },
  }
})

import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
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
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'axios-vendor': ['axios'],
          // Component chunks
          'feed-components': [
            './src/components/feed/PinGrid.vue',
            './src/components/feed/PinCard.vue',
            './src/components/feed/PinSkeleton.vue',
          ],
          'post-components': [
            './src/components/post/PostDetailModal.vue',
            './src/components/post/CreatePostModal.vue',
            './src/components/post/CommentSection.vue',
          ],
          'user-components': [
            './src/components/user/UserAvatar.vue',
            './src/components/user/UserCard.vue',
            './src/components/user/UserSearchModal.vue',
          ],
        },
      },
    },
    // Enable chunk size warnings
    chunkSizeWarningLimit: 500,
    // Minify production build
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
})

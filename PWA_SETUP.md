# PWA (Progressive Web App) Setup Guide

## Overview

Transform Nutrisipe into a Progressive Web App for offline support, installability, and native-like experience.

## Installation

```bash
npm install -D vite-plugin-pwa workbox-window
```

## 1. Vite PWA Plugin Configuration

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Nutrisipe - Social Nutrition Platform',
        short_name: 'Nutrisipe',
        description: 'Share recipes, nutrition tips, and healthy eating inspiration',
        theme_color: '#f97316', // Orange-500
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.nutrisipe\.com\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
})
```

## 2. Service Worker Registration

Create `src/registerServiceWorker.ts`:

```typescript
import { registerSW } from 'virtual:pwa-register'

export function registerServiceWorker() {
  const updateSW = registerSW({
    onNeedRefresh() {
      if (confirm('New content available! Reload to update?')) {
        updateSW(true)
      }
    },
    onOfflineReady() {
      console.log('App ready to work offline')
    },
    onRegistered(registration) {
      console.log('Service Worker registered:', registration)
    },
    onRegisterError(error) {
      console.error('Service Worker registration error:', error)
    },
  })
}
```

Import in `src/main.ts`:

```typescript
import { createApp } from 'vue'
import { registerServiceWorker } from './registerServiceWorker'

const app = createApp(App)

// ... other setup

app.mount('#app')

// Register service worker
if ('serviceWorker' in navigator) {
  registerServiceWorker()
}
```

## 3. App Icons

Generate PWA icons using a tool like [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator):

```bash
npx pwa-asset-generator logo.png ./public -i ./public/index.html -m ./public/manifest.json
```

Required icons:
- `pwa-192x192.png` - Android icon
- `pwa-512x512.png` - Android splash screen
- `apple-touch-icon.png` - iOS icon
- `favicon.ico` - Browser tab icon

## 4. Offline Page

Create `public/offline.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - Nutrisipe</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: white;
      text-align: center;
      padding: 20px;
    }
    .container {
      max-width: 400px;
    }
    h1 {
      font-size: 3rem;
      margin: 0 0 1rem;
    }
    p {
      font-size: 1.25rem;
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📡</h1>
    <h1>You're Offline</h1>
    <p>Check your internet connection and try again.</p>
  </div>
</body>
</html>
```

## 5. Install Prompt Component

Create `src/components/ui/InstallPrompt.vue`:

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const showInstallPrompt = ref(false)
let deferredPrompt: any = null

onMounted(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    showInstallPrompt.value = true
  })

  window.addEventListener('appinstalled', () => {
    showInstallPrompt.value = false
    console.log('PWA installed successfully')
  })
})

async function handleInstall() {
  if (!deferredPrompt) return

  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice

  if (outcome === 'accepted') {
    console.log('User accepted the install prompt')
  }

  deferredPrompt = null
  showInstallPrompt.value = false
}

function dismissPrompt() {
  showInstallPrompt.value = false
}
</script>

<template>
  <div
    v-if="showInstallPrompt"
    class="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 z-50 border border-gray-200 dark:border-gray-700"
  >
    <div class="flex items-start gap-3">
      <div class="flex-shrink-0">
        <svg
          class="w-8 h-8 text-orange-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
          />
        </svg>
      </div>
      <div class="flex-1">
        <h3 class="font-semibold text-gray-900 dark:text-white mb-1">
          Install Nutrisipe
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Install our app for a better experience and offline access.
        </p>
        <div class="flex gap-2 mt-3">
          <button
            @click="handleInstall"
            class="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Install
          </button>
          <button
            @click="dismissPrompt"
            class="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
          >
            Not Now
          </button>
        </div>
      </div>
      <button
        @click="dismissPrompt"
        class="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    </div>
  </div>
</template>
```

Add to `App.vue`:

```vue
<script setup lang="ts">
import InstallPrompt from '@/components/ui/InstallPrompt.vue'
</script>

<template>
  <div>
    <!-- App content -->
    <InstallPrompt />
  </div>
</template>
```

## 6. Offline Detection

Create `src/composables/useOnline.ts`:

```typescript
import { ref, onMounted, onUnmounted } from 'vue'

export function useOnline() {
  const isOnline = ref(navigator.onLine)

  function updateOnlineStatus() {
    isOnline.value = navigator.onLine
  }

  onMounted(() => {
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
  })

  onUnmounted(() => {
    window.removeEventListener('online', updateOnlineStatus)
    window.removeEventListener('offline', updateOnlineStatus)
  })

  return { isOnline }
}
```

Usage in components:

```vue
<script setup lang="ts">
import { useOnline } from '@/composables/useOnline'

const { isOnline } = useOnline()
</script>

<template>
  <div v-if="!isOnline" class="offline-banner">
    You're currently offline. Some features may be limited.
  </div>
</template>
```

## 7. Update Notification Component

Create `src/components/ui/UpdateNotification.vue`:

```vue
<script setup lang="ts">
import { ref } from 'vue'

const showUpdate = ref(false)

// Listen for service worker update
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    showUpdate.value = true
  })
}

function reload() {
  window.location.reload()
}
</script>

<template>
  <div
    v-if="showUpdate"
    class="fixed top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-4"
  >
    <span class="font-medium">New version available!</span>
    <button
      @click="reload"
      class="px-4 py-1 bg-white text-orange-500 font-medium rounded hover:bg-orange-50 transition-colors"
    >
      Update
    </button>
  </div>
</template>
```

## 8. Caching Strategy

### Network First (for API calls)
- Try network first
- Fall back to cache if offline
- Good for dynamic content

### Cache First (for images)
- Try cache first
- Fall back to network
- Good for static assets

### Stale While Revalidate (for feeds)
- Serve from cache immediately
- Update cache in background
- Good for frequently updated content

## 9. Testing PWA

### Lighthouse Audit
```bash
npm run build
npm run preview
# Open Chrome DevTools > Lighthouse > Progressive Web App
```

### Test Offline Mode
1. Build the app: `npm run build`
2. Serve locally: `npm run preview`
3. Open Chrome DevTools > Application > Service Workers
4. Check "Offline" checkbox
5. Reload page - should work offline

### Test Installation
1. Visit app in Chrome/Edge
2. Look for install icon in address bar
3. Click to install
4. App should open as standalone

## 10. iOS Considerations

Add to `public/index.html`:

```html
<!-- iOS meta tags -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Nutrisipe">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

## Features Enabled

✅ **Installability**: Add to home screen on mobile/desktop
✅ **Offline Support**: Basic functionality without internet
✅ **Fast Loading**: Cached assets load instantly
✅ **Background Sync**: Queue actions while offline
✅ **Push Notifications**: (Requires backend setup)
✅ **App-like Experience**: Fullscreen, no browser UI

## Best Practices

1. **Cache Strategically**: Don't cache everything, be selective
2. **Update Mechanism**: Always provide way to update
3. **Offline Feedback**: Show when user is offline
4. **Test Thoroughly**: Test on real devices
5. **Monitor Size**: Keep app bundle small
6. **Version Management**: Clear old caches on updates

## Deployment

Update service worker on each deployment:

```typescript
// vite.config.ts
VitePWA({
  workbox: {
    cleanupOutdatedCaches: true,
    skipWaiting: true,
    clientsClaim: true,
  },
})
```

## Notes

- PWA requires HTTPS (except localhost)
- Service workers only work on production builds
- Test offline functionality thoroughly
- Consider data usage for background sync
- Not all browsers support all PWA features

## Resources

- [PWA Builder](https://www.pwabuilder.com/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)

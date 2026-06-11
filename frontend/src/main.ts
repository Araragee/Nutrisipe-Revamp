import './assets/styles.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import vue3GoogleLogin from 'vue3-google-login'

import App from './App.vue'
import router from './router'

// Safe ResizeObserver guard to prevent third-party library unmount race condition crashes
if (typeof window !== 'undefined' && window.ResizeObserver) {
  const originalObserve = window.ResizeObserver.prototype.observe;
  window.ResizeObserver.prototype.observe = function (target, options) {
    if (!target || !(target instanceof Element)) {
      return;
    }
    return originalObserve.call(this, target, options);
  };

  const originalUnobserve = window.ResizeObserver.prototype.unobserve;
  window.ResizeObserver.prototype.unobserve = function (target) {
    if (!target || !(target instanceof Element)) {
      return;
    }
    return originalUnobserve.call(this, target);
  };
}

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vue3GoogleLogin, {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
})

app.mount('#app')

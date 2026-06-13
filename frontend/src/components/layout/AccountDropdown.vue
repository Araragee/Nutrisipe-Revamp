<script setup lang="ts">
import BaseIcons from '@/components/base/BaseIcons.vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import UserAvatar from '@/components/user/UserAvatar.vue'

const emit = defineEmits<{
  close: []
}>()

const router = useRouter()
const authStore = useAuthStore()

function handleLogout() {
  authStore.logout()
  router.push('/login')
  emit('close')
}

function handleNav(path: string) {
  router.push(path)
  emit('close')
}
</script>

<template>
  <div class="account-dropdown w-[280px] bg-white/95 dark:bg-background-secondary/95 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-border z-50 overflow-hidden animate-revamp">
    <!-- Header with user info -->
    <div class="p-6 pb-4 flex items-center gap-3 border-b border-border">
      <UserAvatar :user="authStore.user!" size="md" class="shrink-0 border-2 border-border shadow-sm" />
      <div class="flex-1 min-w-0">
        <p class="font-montserrat font-extrabold text-sm text-text truncate">{{ authStore.user?.displayName }}</p>
        <p class="text-xs font-semibold text-text-dim truncate">@{{ authStore.user?.username }}</p>
      </div>
    </div>
    
    <!-- Menu items -->
    <div class="py-2 flex flex-col">
      <button @click="handleNav(`/profile/${authStore.user?.id}`)" class="flex items-center gap-3 px-6 py-3.5 hover:bg-orange/5 transition-colors text-sm font-bold text-text-muted hover:text-text">
        <BaseIcons name="user" size="sm" />
        Profile
      </button>
      <button v-if="authStore.isAdmin" @click="handleNav('/admin')" class="flex items-center gap-3 px-6 py-3.5 hover:bg-orange/5 transition-colors text-sm font-bold text-text-muted hover:text-text">
        <BaseIcons name="shield-check" size="sm" />
        Admin
      </button>
      <button @click="handleNav('/settings')" class="flex items-center gap-3 px-6 py-3.5 hover:bg-orange/5 transition-colors text-sm font-bold text-text-muted hover:text-text">
        <BaseIcons name="cog-6-tooth" size="sm" />
        Settings
      </button>
    </div>
    
    <!-- Logout -->
    <div class="border-t border-border py-2">
      <button @click="handleLogout" class="w-full flex items-center gap-3 px-6 py-3.5 hover:bg-red-500/10 transition-colors text-sm font-bold text-red-500">
        <BaseIcons name="arrow-right-on-rectangle" size="sm" />
        Logout
      </button>
    </div>
  </div>
</template>

<style scoped>
@keyframes revamp {
  from { opacity: 0; transform: translateY(10px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.animate-revamp {
  animation: revamp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>

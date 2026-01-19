<script setup lang="ts">
import LayoutSidebar from './LayoutSidebar.vue'
import LayoutRightSidebar from './LayoutRightSidebar.vue'
import MobileNav from './MobileNav.vue'
</script>

<template>
  <div class="flex min-h-screen bg-gray-100 dark:bg-gray-900">
    <!-- Left Sidebar - Fixed (Desktop only) -->
    <aside class="hidden lg:block w-64 fixed left-0 top-0 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      <LayoutSidebar />
    </aside>

    <!-- Main Content - Center -->
    <main class="flex-1 lg:ml-64 lg:mr-80 pb-20 md:pb-6">
      <div class="max-w-7xl mx-auto px-4 py-6">
        <slot />
      </div>
    </main>

    <!-- Right Sidebar - Fixed (Desktop only) -->
    <aside class="hidden lg:block w-80 fixed right-0 top-0 h-screen bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
      <LayoutRightSidebar />
    </aside>

    <!-- Mobile Bottom Navigation -->
    <MobileNav />
  </div>
</template>

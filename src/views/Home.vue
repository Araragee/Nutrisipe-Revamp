<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import Sidebar from '@/components/Sidebar.vue'
import Navbar from '@/components/Navbar.vue'
</script>

<template>
  <Navbar />
  <div class="h-full w-full p-5 bg-slate-300 grid grid-cols-5">
    <div>
      <Sidebar />
    </div>
    <div class="col-span-3 items-center justify-center grid">
      Main Content
    </div>
    <div>
      Featured to Follow
    </div>
  </div>
</template>

<template>
  <div class="rounded-card overflow-hidden bg-surface border border-border shadow-card">
    <!-- Image-forward stage matches PinCard's overlay layout -->
    <div class="relative aspect-[4/5] bg-background-secondary animate-pulse">
      <!-- bottom overlay placeholders -->
      <div class="absolute inset-x-0 bottom-0 p-3.5 flex flex-col gap-2">
        <div class="h-3.5 w-2/3 rounded-full bg-text-dim/20"></div>
        <div class="h-3 w-1/2 rounded-full bg-text-dim/20"></div>
        <div class="flex items-center gap-2 pt-1">
          <div class="w-6 h-6 rounded-full bg-text-dim/20"></div>
          <div class="h-3 w-20 rounded-full bg-text-dim/20"></div>
        </div>
      </div>
    </div>
  </div>
</template>

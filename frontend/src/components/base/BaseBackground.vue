<template>
  <div class="fixed inset-0 overflow-hidden pointer-events-none -z-50">
    <div class="relative w-full h-full blur-[120px] opacity-30 dark:opacity-20">
      <div
        class="absolute mix-blend-multiply dark:mix-blend-lighten opacity-80 rounded-full top-[-10%] left-[-10%] w-[60%] h-[60%] bg-orange-300 dark:bg-orange-900/40 animate-pulse"
        style="animation-duration: 8s"
      ></div>
      <div
        class="absolute mix-blend-multiply dark:mix-blend-lighten opacity-70 rounded-full top-[20%] right-[-5%] w-[50%] h-[50%] bg-blue-200 dark:bg-blue-900/30 animate-pulse"
        style="animation-duration: 12s; animation-delay: 1s"
      ></div>
      <div
        class="absolute mix-blend-multiply dark:mix-blend-lighten opacity-60 rounded-full bottom-[-10%] left-[20%] w-[55%] h-[55%] bg-rose-200 dark:bg-red-900/30 animate-pulse"
        style="animation-duration: 10s; animation-delay: 2s"
      ></div>
      <div
        class="absolute mix-blend-multiply dark:mix-blend-lighten opacity-50 rounded-full bottom-[10%] right-[-10%] w-[45%] h-[45%] bg-orange-200 dark:bg-orange-800/30 animate-pulse"
        style="animation-duration: 9s; animation-delay: 0.5s"
      ></div>
    </div>
  </div>
</template>

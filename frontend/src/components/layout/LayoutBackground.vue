<template>
  <div class="relative isolate min-h-screen">
    <!-- Decorative ambient blobs: isolated + clipped so mix-blend never washes
         page content (dark mode bled a gray/red film without isolation). -->
    <div
      class="pointer-events-none fixed inset-0 -z-10 overflow-hidden blur-2xl opacity-30 dark:opacity-15"
      aria-hidden="true"
    >
      <div
        class="absolute mix-blend-multiply dark:mix-blend-lighten opacity-80 rounded-full top-24 left-24 w-2/5 h-64 bg-orange-300 dark:bg-orange-800">
      </div>
      <div
        class="absolute mix-blend-multiply dark:mix-blend-lighten opacity-70 rounded-full mx-auto top-32 inset-x-0 w-3/5 h-96 bg-orange-200 dark:bg-orange-800">
      </div>
      <div
        class="absolute mix-blend-multiply dark:mix-blend-lighten opacity-60 rounded-full right-0 top-0 w-3/5 h-96 bg-blue-200 dark:bg-blue-800">
      </div>
      <div
        class="absolute mix-blend-multiply dark:mix-blend-lighten rounded-full opacity-50 right-0 bottom-0 w-3/5 h-96 bg-orange-200 dark:bg-orange-900">
      </div>
      <div
        class="absolute mix-blend-multiply dark:mix-blend-lighten rounded-full opacity-50 left-0 bottom-0 w-3/5 h-[500px] bg-rose-200 dark:bg-red-900">
      </div>
    </div>
    <slot></slot>
  </div>
</template>

<template>
    <div class="scrollbar scrollbar-thumb-gray-900 scrollbar-track-gray-100">
      <div class="relative w-full blur-2xl opacity-30 dark:opacity-15 h-full" style="z-index: -9999;">
        <div
          class="absolute mix-blend-multiply dark:mix-blend-lighten opacity-80 rounded-full top-24 left-24 w-2/5 h-64 bg-orange-300 default:bg-orange-800">
        </div>
        <div
          class="absolute mix-blend-multiply dark:mix-blend-lighten opacity-70 rounded-full mx-auto top-32 inset-x-0 w-3/5 h-96 bg-orange-200 dark:bg-orange-800">
        </div>
        <div
          class="absolute mix-blend-multiply dark:mix-blend-lighten opacity-60 rounded-full right-0 w-3/5 h-96 bg-blue-200 dark:bg-blue-800">
        </div>
      </div>
      <slot></slot>
      <div class="relative w-full blur-2xl opacity-30 dark:opacity-15 h-full" style="z-index: -9999;">
        <div
          class="absolute mix-blend-multiply dark:mix-blend-lighten rounded-full opacity-50 right-0 bottom-0 w-3/5 h-96 bg-orange-200 dark:bg-orange-900">
        </div>
        <div
          class="h-[500px] absolute mix-blend-multiply dark:mix-blend-lighten rounded-full opacity-50 left-0 bottom-0 w-3/5 bg-rose-200 dark:bg-red-900">
        </div>
      </div>
    </div>
  </template>
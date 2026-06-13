<script setup lang="ts">
// Top-down stylised bowl for the landing "How it works" scrollytelling.
// Food is split into named layer groups (.pl-base / .pl-grain / .pl-top /
// .pl-garnish / .pl-fork) so the parent view can reveal them per scroll step
// with GSAP. Layers default to fully visible — under reduced motion (no GSAP)
// the bowl simply shows complete.
</script>

<template>
  <svg viewBox="0 0 360 360" class="w-full h-full" role="img" aria-label="A bowl filling with fresh ingredients">
    <defs>
      <radialGradient id="ceramic" cx="42%" cy="34%" r="72%">
        <stop offset="0%" stop-color="#fffaf3" />
        <stop offset="62%" stop-color="#f3e8d8" />
        <stop offset="100%" stop-color="#d9c7b0" />
      </radialGradient>
      <radialGradient id="well" cx="46%" cy="40%" r="68%">
        <stop offset="0%" stop-color="#efe3d1" />
        <stop offset="100%" stop-color="#cdb89c" />
      </radialGradient>
      <linearGradient id="tomato" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ff5a3c" />
        <stop offset="100%" stop-color="#d4200f" />
      </linearGradient>
      <linearGradient id="leaf" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#6fb24a" />
        <stop offset="100%" stop-color="#3c7a2e" />
      </linearGradient>
      <linearGradient id="fork" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#e8e8ec" />
        <stop offset="100%" stop-color="#a9adb6" />
      </linearGradient>
      <clipPath id="bowlClip"><circle cx="180" cy="182" r="112" /></clipPath>
      <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000" flood-opacity="0.22" />
      </filter>
    </defs>

    <!-- bowl shadow on the table -->
    <ellipse cx="182" cy="312" rx="132" ry="24" fill="#000" opacity="0.28" />

    <!-- ceramic bowl -->
    <circle cx="180" cy="180" r="146" fill="url(#ceramic)" />
    <circle cx="180" cy="180" r="146" fill="none" stroke="#fff" stroke-opacity="0.5" stroke-width="2" />
    <circle cx="180" cy="182" r="118" fill="url(#well)" />
    <circle cx="180" cy="182" r="118" fill="none" stroke="#000" stroke-opacity="0.08" stroke-width="6" />

    <g clip-path="url(#bowlClip)" filter="url(#soft)">
      <!-- ── leafy base ── -->
      <g class="pl-base">
        <ellipse class="pl-item" cx="138" cy="206" rx="58" ry="40" fill="url(#leaf)" transform="rotate(-18 138 206)" />
        <ellipse class="pl-item" cx="214" cy="214" rx="62" ry="42" fill="url(#leaf)" transform="rotate(14 214 214)" />
        <ellipse class="pl-item" cx="180" cy="170" rx="60" ry="40" fill="#5a9c3c" transform="rotate(-4 180 170)" />
        <ellipse class="pl-item" cx="226" cy="166" rx="44" ry="30" fill="#6fb24a" transform="rotate(22 226 166)" />
        <ellipse class="pl-item" cx="126" cy="158" rx="40" ry="28" fill="#4e8a36" transform="rotate(-26 126 158)" />
      </g>

      <!-- ── grains + protein ── -->
      <g class="pl-grain">
        <path class="pl-item" d="M120 188c14-26 50-34 78-22 26 11 30 36 12 52-22 19-66 16-86-4-12-12-12-16-4-26z" fill="#e3c283" />
        <ellipse class="pl-item" cx="150" cy="196" rx="26" ry="18" fill="#b5662f" transform="rotate(-12 150 196)" />
        <ellipse class="pl-item" cx="206" cy="200" rx="28" ry="19" fill="#a8551f" transform="rotate(16 206 200)" />
        <circle class="pl-item" cx="178" cy="182" r="6" fill="#d9a85a" />
        <circle class="pl-item" cx="160" cy="172" r="5" fill="#d9a85a" />
        <circle class="pl-item" cx="196" cy="178" r="5" fill="#d9a85a" />
      </g>

      <!-- ── colourful toppings ── -->
      <g class="pl-top">
        <path class="pl-item" d="M150 150l30 6-14 28z" fill="url(#tomato)" />
        <path class="pl-item" d="M214 158l22 18-26 12z" fill="url(#tomato)" />
        <path class="pl-item" d="M128 196c12-6 26-4 30 4-6 12-22 16-34 10z" fill="#7a4b8a" />
        <g class="pl-item" transform="rotate(-20 206 206)">
          <ellipse cx="206" cy="206" rx="22" ry="13" fill="#8fbf5a" />
          <ellipse cx="206" cy="206" rx="13" ry="7" fill="#dfeec0" />
        </g>
        <circle class="pl-item" cx="172" cy="214" r="9" fill="#ffd23f" />
        <circle class="pl-item" cx="190" cy="150" r="8" fill="#ffd23f" />
      </g>

      <!-- ── herbs + seeds garnish ── -->
      <g class="pl-garnish">
        <path class="pl-item" d="M150 138c8 10 8 24 2 34" fill="none" stroke="#2f6a22" stroke-width="3.5" stroke-linecap="round" />
        <path class="pl-item" d="M212 134c-6 12-4 26 4 34" fill="none" stroke="#2f6a22" stroke-width="3.5" stroke-linecap="round" />
        <path class="pl-item" d="M180 132c0 12 0 22-4 32" fill="none" stroke="#3c8a2c" stroke-width="3" stroke-linecap="round" />
        <circle class="pl-item" cx="164" cy="200" r="2.4" fill="#fff4d6" />
        <circle class="pl-item" cx="184" cy="208" r="2.4" fill="#fff4d6" />
        <circle class="pl-item" cx="200" cy="192" r="2.4" fill="#fff4d6" />
        <circle class="pl-item" cx="148" cy="184" r="2.4" fill="#fff4d6" />
        <circle class="pl-item" cx="210" cy="180" r="2.4" fill="#fff4d6" />
      </g>
    </g>

    <!-- steam -->
    <g class="pl-steam" stroke="#fff" stroke-opacity="0.4" stroke-width="4" stroke-linecap="round" fill="none">
      <path d="M150 96c-8-12 8-20 0-32" />
      <path d="M182 88c-8-12 8-20 0-32" />
      <path d="M214 96c-8-12 8-20 0-32" />
    </g>

    <!-- serving fork (revealed on the final "share your fork" step) -->
    <g class="pl-fork" transform="rotate(34 286 196)">
      <rect x="280" y="120" width="12" height="150" rx="6" fill="url(#fork)" />
      <rect x="270" y="108" width="6" height="34" rx="3" fill="url(#fork)" />
      <rect x="283" y="104" width="6" height="38" rx="3" fill="url(#fork)" />
      <rect x="296" y="108" width="6" height="34" rx="3" fill="url(#fork)" />
    </g>
  </svg>
</template>

<style scoped>
.pl-steam path {
  stroke-dasharray: 60;
  animation: steam 3.2s ease-in-out infinite;
}
.pl-steam path:nth-child(2) { animation-delay: 0.5s; }
.pl-steam path:nth-child(3) { animation-delay: 1s; }
@keyframes steam {
  0%, 100% { opacity: 0.15; transform: translateY(2px); }
  50% { opacity: 0.5; transform: translateY(-4px); }
}
@media (prefers-reduced-motion: reduce) {
  .pl-steam path { animation: none; }
}
</style>

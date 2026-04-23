# Dave's Vue.js + TypeScript Coding Style Guide

> **Purpose**: This document defines coding patterns for AI assistants to generate code matching Dave's style. Use this as a system prompt context when generating Vue.js components.

---

## 🎯 Core Principles

1. **Composition API + TypeScript** - Always use `<script setup lang="ts">`
2. **Tailwind-First** - Use Tailwind utilities; fall back to custom CSS only when necessary
3. **Descriptive Naming** - camelCase variables with clear, intention-revealing names
4. **Minimal Comments** - Document functions and complex template logic only
5. **Type Safety** - Explicit TypeScript types for props, interfaces, and complex objects

---

## 📁 File Structure

### Component Organization
```vue
<script lang="ts" setup>
  // 1. Imports (grouped by type)
  import { ref, computed, onMounted } from 'vue';
  import type { PropType } from 'vue';
  import { storeToRefs } from 'pinia';
  
  // 2. Type definitions (interfaces, types)
  interface Size {
    sm: string;
    md: string;
    lg: string;
  }
  
  // 3. Props definition
  const props = defineProps({...});
  
  // 4. Refs and reactive state
  const loading = ref(false);
  
  // 5. Computed properties
  const isDisabled = computed(() => props.disabled || props.loading);
  
  // 6. Functions
  const handleResize = () => {...};
  
  // 7. Lifecycle hooks
  onMounted(() => {...});
  
  // 8. Watchers
  watch(() => props.data, () => {...});
</script>

<template>
  <!-- Template content -->
</template>
```

---

## 🔧 Props Pattern

### Always Use This Structure
```typescript
const props = defineProps({
  // String props
  title: {
    type: String
    // No default if optional
  },
  
  // Boolean props with defaults
  loading: {
    type: Boolean,
    default: false
  },
  
  // String props with defaults
  heightClass: {
    type: String,
    default: 'h-full'
  },
  
  // Union types with PropType
  size: {
    type: String as PropType<'sm' | 'md' | 'lg'>,
    default: 'md'
  },
  
  // Complex types
  options: {
    type: Object as PropType<EChartsOption>,
    default: {} as EChartsOption
  }
});
```

### Key Patterns
- ✅ Use `PropType<>` for unions and complex types
- ✅ Provide defaults for all non-required props
- ✅ No `required: true` (just omit default instead)
- ✅ Group similar props together (sizing, styling, behavior)

---

## 🎨 Styling Approach

### Computed Style Classes
```typescript
// Create lookup objects for dynamic styles
const style = computed(() => {
  return {
    withBorder: 'p-2.5 relative bg-white dark:bg-zinc-800 border border-zinc-300 rounded-3xl',
    noStyle: 'relative',
    glass: 'shadow-sm p-2.5 relative bg-white/30 backdrop-blur-lg rounded-3xl'
  }[props.cardStyle];
});

const btnSize = computed(() => {
  return {
    lg: 'px-6 py-3.5 rounded-3xl',
    base: 'px-4 py-3 rounded-3xl',
    sm: 'px-3.5 py-2.5 rounded-3xl text-sm',
    xs: 'px-2.5 py-2 rounded-3xl text-xs'
  }[props.size];
});
```

### Template Class Binding
```vue
<template>
  <div
    :class="[
      widthClass,
      btnSize,
      btnClass,
      btnAlign,
      { 'animate-pulse': loading }
    ]"
    class="relative flex items-center border rounded-xl"
  >
</template>
```

### Dark Mode Pattern
```typescript
// Always include dark mode variants
'bg-white dark:bg-zinc-800'
'text-zinc-600 dark:text-zinc-200'
'border-zinc-300 dark:border-opacity-30'
```

---

## 🧩 Common Patterns

### Refs and Reactive
```typescript
// Use shallowRef for performance-sensitive data
const loading = shallowRef(true);

// Use ref for template refs
const baseCard = ref<HTMLElement | null>(null);
const vChartRef = ref();

// Use ref with type annotation for complex objects
const echartsInstance = ref<echarts.ECharts>();
```

### Computed Properties
```typescript
// Prefer computed over methods for derived state
const isDisabled = computed(() => props.disabled || props.loading);

// Use lookup pattern for style mappings
const footerMobile = computed(() => {
  return {
    desktop: 'text-xs pb-1',
    mobile: 'pb-0 text-[0.5rem]'
  }[props.footer];
});
```

### Lifecycle Hooks
```typescript
onMounted(async () => {
  // Setup event listeners
  window.addEventListener('resize', handleResize);
  
  // Initialize instances
  if (vChartRef.value) {
    echartsInstance.value = vChartRef.value.getEChartsInstance();
  }
  
  // Call async init functions
  await initPhMap();
  
  // Delay operations for smooth render
  setTimeout(() => {
    resizeChart();
  }, 100);
});

onBeforeUnmount(() => {
  // Cleanup listeners
  window.removeEventListener('resize', throttledResize);
});
```

### Watchers
```typescript
// Watch multiple dependencies with array syntax
watch(
  () => [screenWidth, resizableWidth, props.options, props.width],
  () => resizeChart(),
  { deep: true }
);

// Watch single prop with early return
watch(
  () => props.geoJSONData,
  () => {
    if (!props.geoJSONData) return;
    registerMap('PH', props.geoJSONData);
  }
);
```

---

## 📝 Template Patterns

### Conditional Rendering
```vue
<!-- Use v-if for loading states -->
<div v-if="loading" class="animate-pulse gap-2 grid h-full">
  <p class="h-6 w-[60%] rounded-2xl bg-gray-400 bg-opacity-5" />
</div>

<!-- Use template for grouping without wrapper -->
<template v-else>
  <div class="flex justify-between">
    <h4 v-if="title" :class="titleSize[size]">{{ title }}</h4>
  </div>
</template>
```

### Slots
```vue
<!-- Named slots for flexibility -->
<slot name="header" />
<slot name="sdg" />
<slot name="menu" />
<slot></slot> <!-- Default slot -->
<slot name="footer"></slot>

<!-- Conditional slots -->
<slot v-else name="iconSlot"></slot>
```

### Class Binding
```vue
<!-- Array syntax for multiple classes -->
<div :class="[className, heightClass, style, overflow]">

<!-- Object syntax for conditionals -->
<div :class="{ 'animate-pulse': loading }">

<!-- Combined approach -->
<div
  :class="[widthClass, btnSize, btnClass, { 'animate-pulse': loading }]"
  class="relative flex items-center"
>
```

---

## 🎯 TypeScript Patterns

### Interface Definitions
```typescript
// Define interfaces for complex prop structures
interface Size {
  sm: string;
  md: string;
  lg: string;
}

// Use type for unions
type ButtonType = 
  | 'primary'
  | 'primaryOutlined' 
  | 'secondary'
  | 'critical';

type ButtonAlign =
  | 'center'
  | 'left'
  | 'right';
```

### Type Annotations
```typescript
// Explicit types for refs
const baseCard = ref<HTMLElement | null>(null);
const echartsInstance = ref<echarts.ECharts>();

// Type imports
import type { PropType } from 'vue';

// PropType for complex prop types
options: {
  type: Object as PropType<EChartsOption>,
  default: {} as EChartsOption
}
```

---

## 🎬 Animation Guidelines

### GSAP for Scroll Effects
```typescript
// Prefer composables for GSAP logic
import { useScrollAnimation } from '@/composables/useScrollAnimation';

onMounted(() => {
  // Initialize GSAP animations
  gsap.from('.element', {
    scrollTrigger: {
      trigger: '.container',
      start: 'top center'
    },
    opacity: 0,
    y: 50
  });
});
```

### AnimeJS for Other Animations
```typescript
// Use for UI interactions, not scroll
import anime from 'animejs';

const animateButton = () => {
  anime({
    targets: button.value,
    scale: [1, 1.1, 1],
    duration: 300
  });
};
```

---

## 📦 Imports Organization

```typescript
// Group 1: Vue core
import { ref, computed, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import type { PropType } from 'vue';

// Group 2: Third-party libraries
import throttle from 'lodash.throttle';
import { CanvasRenderer } from 'echarts/renderers';

// Group 3: Local stores
import { useMainStore } from '@/stores/main';

// Group 4: Components
import BaseLoaderSpin from '../loader/LoaderSpin.vue';

// Group 5: Utils/helpers
import { useResizableElementHeight } from '@/utils/helpers';
```

---

## 🚫 Anti-Patterns (Avoid These)

### ❌ Don't Do
```typescript
// ❌ Options API
export default {
  data() { return {...} }
}

// ❌ Verbose prop types without defaults
title: {
  type: String,
  required: false,
  default: undefined
}

// ❌ Inline styles in template
<div style="padding: 10px; margin: 20px;">

// ❌ Magic numbers without explanation
setTimeout(() => {...}, 267);

// ❌ Unclear variable names
const x = ref(false);
const data = ref([]);
```

### ✅ Do Instead
```typescript
// ✅ Composition API with setup
<script setup lang="ts">

// ✅ Simple prop definition
title: {
  type: String
}

// ✅ Tailwind classes
<div class="p-2.5 m-5">

// ✅ Commented delays
// Delay for smooth initial render
setTimeout(() => {...}, 100);

// ✅ Descriptive names
const isLoading = ref(false);
const userProfiles = ref([]);
```

---

## 🎨 Tailwind Specifics

### Spacing Pattern
```typescript
// Use consistent spacing scale
'p-2.5'   // Small padding
'px-4 py-3' // Medium button
'px-6 py-3.5' // Large button
'gap-2'   // Small gaps
'gap-3'   // Medium gaps
```

### Border Radius
```typescript
// Consistent rounding
'rounded-2xl' // Cards, inputs
'rounded-3xl' // Buttons, containers
'rounded-xl'  // Smaller elements
```

### Opacity Pattern
```typescript
// Use opacity modifiers
'bg-opacity-50'
'dark:bg-opacity-60'
'border-opacity-30'
'dark:border-opacity-20'
```

---

## 💡 Component Composition

### Composable Usage
```typescript
// Import from utils/helpers
import { useResizableElementHeight } from '@/utils/helpers';

// Use in component
const baseCard = ref<HTMLElement | null>(null);
const { elementHeight } = useResizableElementHeight(baseCard);
```

### Expose Pattern
```typescript
// Expose methods/values to parent
defineExpose({
  getEchartInstance: () => echartsInstance.value,
  resizeChart
});
```

---

## 🧪 Special Cases

### Performance Optimizations
```typescript
// Use throttle for resize handlers
import throttle from 'lodash.throttle';
const throttledResize = throttle(resizeChart, 200);

// Use shallowRef for large objects
const loading = shallowRef(true);

// Prevent zoom on mobile charts
const preventZoom = (e: any) => {
  if (e.touches?.length > 1 || e.scale !== undefined) {
    e.preventDefault();
  }
};
```

### Error Handling
```typescript
// Silent error handling for optional features
try {
  echartsInstance.value.dispatchAction({ type: 'hideTip' });
  echartsInstance.value.resize();
} catch (error) {}
```

---

## 📋 Comment Style

### Function Comments
```typescript
// ======================================================================================================
// CONTENT HEIGHT
// ======================================================================================================
const baseCard = ref<HTMLElement | null>(null);
const { elementHeight } = useResizableElementHeight(baseCard);

// 🔥 throttled resize (smooth on mobile)
const throttledResize = throttle(resizeChart, 200);

// ✅ initialize chart smoothly
const initPhMap = async () => {
  if (props.geoJSONData) registerMap('PH', props.geoJSONData);
  await nextTick();
  
  // delay resize just a bit so first render is smooth
  setTimeout(() => {
    resizeChart();
  }, 100);
};
```

### Template Comments
```vue
<!-- Only comment complex conditional logic -->
<template>
  <!-- Indicator slot for custom content above chart -->
  <slot name="indicator"></slot>
  
  <v-chart
    v-if="!loading"
    :option="props.options"
    @click="(params: any) => $emit('clicked', params)"
  />
</template>
```

---

## 🎯 Complete Component Template

```vue
<script lang="ts" setup>
  import { ref, computed, onMounted } from 'vue';
  import type { PropType } from 'vue';
  
  // Type definitions
  type Size = 'sm' | 'md' | 'lg';
  
  // Props
  const props = defineProps({
    title: {
      type: String
    },
    loading: {
      type: Boolean,
      default: false
    },
    size: {
      type: String as PropType<Size>,
      default: 'md'
    }
  });
  
  // Refs
  const container = ref<HTMLElement | null>(null);
  
  // Computed
  const sizeClass = computed(() => {
    return {
      sm: 'text-sm px-2 py-1',
      md: 'text-base px-4 py-2',
      lg: 'text-lg px-6 py-3'
    }[props.size];
  });
  
  // Functions
  const handleClick = () => {
    // Implementation
  };
  
  // Lifecycle
  onMounted(() => {
    // Setup
  });
</script>

<template>
  <div
    ref="container"
    :class="[sizeClass, { 'animate-pulse': loading }]"
    class="relative flex items-center bg-white dark:bg-zinc-800 rounded-3xl"
    @click="handleClick"
  >
    <h3 v-if="title">{{ title }}</h3>
    <slot></slot>
  </div>
</template>
```

---

## 🚀 AI Code Generation Prompt Template

When asking AI to generate Vue components, use this prompt structure:

```
Generate a Vue 3 component using Dave's coding style:

Requirements:
- Use <script setup lang="ts">
- Composition API with TypeScript
- Tailwind-first styling with dark mode support
- Props pattern: computed style lookups, no required: true
- Name: [ComponentName]
- Purpose: [What it does]
- Props needed: [list]
- Slots: [if any]

Style preferences:
- rounded-3xl for buttons/cards
- Descriptive camelCase naming
- Minimal comments (functions only)
- Loading states with animate-pulse
- Use shallowRef for performance

Follow the patterns in DAVE_CODING_STYLE_GUIDE.md exactly.
```

---

## 🎭 HeadlessUI Integration Patterns

### Using HeadlessUI Components
```typescript
// Import pattern
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue';
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue';

// Use for: dropdowns, modals, transitions
// Always wrap with transitions for smooth animations
```

### Dropdown/Select Pattern (BaseSelect.vue)
```vue
<script lang="ts" setup>
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue';
import { useVModel } from '@vueuse/core';
import { Icon } from '@iconify/vue';

const emit = defineEmits(['update:modelValue', 'change']);
const data = useVModel(props, 'modelValue', emit);

const handleSelect = (value: string | number | null) => {
  data.value = value;
  emit('change', value);
};
</script>

<template>
  <Menu as="div" class="relative w-full">
    <MenuButton class="flex items-center justify-between rounded-xl border">
      <span>{{ selectedOption }}</span>
      <Icon icon="heroicons:chevron-down" class="w-4 h-4" />
    </MenuButton>
    
    <transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
    >
      <MenuItems class="absolute z-[99999] mt-1 w-full rounded-xl">
        <MenuItem v-for="option in options" v-slot="{ active }">
          <button
            @click="handleSelect(option.value)"
            :class="[active ? 'text-primary-base' : 'text-zinc-700']"
          >
            {{ option.label }}
          </button>
        </MenuItem>
      </MenuItems>
    </transition>
  </Menu>
</template>
```

### Modal Pattern (BaseModal.vue)
```vue
<script setup lang="ts">
import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
  DialogTitle
} from '@headlessui/vue';

// Use defineModel for v-model (Vue 3.4+)
const modelValue = defineModel<boolean>({
  type: Boolean,
  default: false,
  required: true
});

const modalType = computed(() => {
  return {
    default: 'bg-white dark:bg-zinc-900 border rounded-3xl',
    glass: 'bg-white/70 dark:bg-zinc-950/50 backdrop-blur-xl'
  }[props.modalType];
});
</script>

<template>
  <TransitionRoot appear :show="modelValue" as="template">
    <Dialog @close="modelValue = !modelValue" class="relative z-10">
      <!-- Backdrop -->
      <TransitionChild
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
      >
        <div class="fixed inset-0 bg-black/40" />
      </TransitionChild>
      
      <!-- Modal Panel -->
      <TransitionChild
        enter="duration-300 ease-out"
        enter-from="opacity-0 scale-95"
        enter-to="opacity-100 scale-100"
      >
        <DialogPanel :class="[modalClass, modalType]" class="transform rounded-2xl p-3">
          <!-- Fixed Header -->
          <div class="flex-shrink-0 flex justify-between">
            <slot name="icon" />{{ title }}
            <button @close="modelValue = !modelValue">×</button>
          </div>
          
          <!-- Scrollable Content -->
          <div class="flex-1 scrollbar-thin">
            <slot></slot>
          </div>
          
          <!-- Fixed Footer -->
          <div class="flex-shrink-0">
            <slot name="footer"></slot>
          </div>
        </DialogPanel>
      </TransitionChild>
    </Dialog>
  </TransitionRoot>
</template>
```

---

## 🔄 V-Model Patterns

### Using VueUse's useVModel
```typescript
import { useVModel } from '@vueuse/core';

const props = defineProps({
  modelValue: {
    type: [String, Number, null] as PropType<string | number | null>
  }
});

const emit = defineEmits(['update:modelValue', 'change']);
const data = useVModel(props, 'modelValue', emit);

// Now use data.value which syncs with parent
const handleChange = () => {
  data.value = newValue; // Automatically emits update:modelValue
  emit('change', newValue); // Custom event for additional logic
};
```

### Using defineModel (Vue 3.4+)
```typescript
// Simpler alternative for newer Vue versions
const modelValue = defineModel<boolean>({
  type: Boolean,
  default: false,
  required: true
});

// Use modelValue.value directly
const toggle = () => {
  modelValue.value = !modelValue.value;
};
```

---

## 📱 Responsive & Mobile Patterns

### Mobile-Specific Rendering
```vue
<template>
  <!-- Mobile: Use modal instead of dropdown -->
  <div v-if="isMobile">
    <button @click="isShowModal = !isShowModal">
      {{ selectedOption }}
    </button>
    <BaseModal v-model="isShowModal" title="Select Filter">
      <button
        v-for="option in options"
        @click="handleSelect(option.value)"
      >
        {{ option.label }}
      </button>
    </BaseModal>
  </div>
  
  <!-- Desktop: Use HeadlessUI dropdown -->
  <Menu v-else as="div">
    <!-- ... -->
  </Menu>
</template>
```

### Window Size Tracking
```typescript
// Create helper function for window tracking
function watchWindowSize(callback: (width: number) => void) {
  callback(window.innerWidth);
  window.addEventListener('resize', () => {
    callback(window.innerWidth);
  });
}

const width = ref();
watchWindowSize(windowWidth => {
  width.value = windowWidth;
});

// Use in template
:modalClass="width < 500 ? 'w-[80vw]' : 'w-96'"
```

---

## 🎨 Form Component Patterns

### Label with Optional Tag
```vue
<label
  v-if="slots.default"
  class="text-zinc-600 dark:text-zinc-300 font-medium text-xs tracking-wider uppercase"
>
  <slot></slot>
  <span
    v-if="optional"
    class="normal-case text-zinc-500 dark:text-zinc-400 font-normal ml-1"
  >
    (optional)
  </span>
</label>
```

### Error Message Slot
```vue
<small class="pt-1.5 text-xs text-red-500" v-if="slots.errorMessage">
  <slot name="errorMessage"></slot>
</small>
```

### Horizontal vs Vertical Display
```typescript
const props = defineProps({
  display: {
    type: String as PropType<'horizontal' | 'vertical'>,
    default: 'vertical'
  }
});

// Template usage
:class="[
  display === 'horizontal'
    ? 'lg:items-center lg:justify-between lg:flex-row flex-col'
    : 'flex-col space-y-1'
]"
```

---

## 🎯 Loading States for Forms

### Pulse Animation for Loading
```typescript
const loadingStyle = computed(() => {
  return {
    notLoading: '',
    loading: 'animate-pulse cursor-disabled'
  }[props.loadingStyle];
});

// Template
:class="[
  loadingStyle,
  loadingStyle === 'loading' ? 'animate-pulse cursor-disabled' : ''
]"
```

---

## 🔧 Utility Functions

### Computed Selected Option Pattern
```typescript
const selectedOption = computed(() => {
  return (
    props.options.find(opt => opt.value === data.value)?.label ||
    props.defaultLabel
  );
});
```

---

## 🎨 Icon Integration (@iconify/vue)

### Icon Usage Pattern
```vue
<script setup lang="ts">
import { Icon } from '@iconify/vue';
</script>

<template>
  <Icon
    icon="heroicons:chevron-down"
    class="w-4 h-4 text-zinc-400"
    :class="{ 'opacity-50': disabled }"
  />
</template>
```

**Common Icons:**
- Chevron: `heroicons:chevron-down`, `heroicons:chevron-up`
- Close/X: `heroicons:x-mark`
- Check: `heroicons:check`

---

## 📐 Layout Patterns

### Modal Fixed Header/Footer Pattern
```vue
<!-- Three-section layout -->
<DialogPanel class="flex flex-col">
  <!-- Fixed Header -->
  <div class="flex-shrink-0 pb-2">
    <slot name="icon" />
    {{ title }}
  </div>
  
  <!-- Scrollable Content -->
  <div class="flex-1 scrollbar-thin">
    <slot></slot>
  </div>
  
  <!-- Fixed Footer -->
  <div class="flex-shrink-0">
    <slot name="footer"></slot>
  </div>
</DialogPanel>
```

### Custom Scrollbar
```css
/* Always use Tailwind's scrollbar-thin utility */
class="overflow-y-auto scrollbar-thin"
```

---

## 🎭 Transition Patterns

### Standard Transition Classes
```vue
<!-- Scale + Fade transition -->
<transition
  enter-active-class="transition duration-100 ease-out"
  enter-from-class="transform scale-95 opacity-0"
  enter-to-class="transform scale-100 opacity-100"
  leave-active-class="transition duration-75 ease-in"
  leave-from-class="transform scale-100 opacity-100"
  leave-to-class="transform scale-95 opacity-0"
>
  <!-- Content -->
</transition>

<!-- Fade only -->
<TransitionChild
  enter="duration-300 ease-out"
  enter-from="opacity-0"
  enter-to="opacity-100"
  leave="duration-200 ease-in"
  leave-from="opacity-100"
  leave-to="opacity-0"
>
  <!-- Backdrop -->
</TransitionChild>
```

---

## 🎨 Glass Morphism Pattern

### Glass Effect Styles
```typescript
const modalType = computed(() => {
  return {
    default: 'bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-opacity-20 rounded-3xl',
    glass: 'bg-white/70 dark:bg-zinc-950/50 backdrop-blur-xl'
  }[props.modalType];
});

// Dropdown glass effect
'bg-white/60 backdrop-blur-2xl dark:bg-zinc-950'
```

**Key Properties:**
- `bg-white/70` or `bg-white/60` (70% or 60% opacity)
- `backdrop-blur-xl` or `backdrop-blur-2xl` or `backdrop-blur-3xl`
- `dark:bg-zinc-950/50` for dark mode

---

## 📋 Props for Options Pattern

### Options Array Type
```typescript
options: {
  type: Array as PropType<
    { value: number | string | null; label: string }[]
  >,
  required: true
}
```

### Default Value Pattern
```typescript
defaultValue: {
  type: [String, Number, null] as PropType<string | number | null>,
  default: ''
},
defaultLabel: {
  type: [String, Number],
  default: '-- Select --'
},
showDefaultValue: {
  type: Boolean,
  default: true
}
```

---

## 🎯 Z-Index Strategy

```typescript
// Modals and overlays
'z-10' // Dialog container
'z-[99999]' // Dropdown menus
'z-[100]' // TransitionRoot for modals

// Use extremely high z-index for dropdowns to ensure they appear above everything
```

---

## 📚 Reference Components

Your best style references:
1. **BaseCard.vue** - Props pattern, computed styles, dark mode, loading states
2. **BaseButton.vue** - Type unions, size variants, disabled logic
3. **BaseEchart.vue** - Lifecycle hooks, watchers, performance optimization, third-party integration
4. **BaseSelect.vue** - HeadlessUI integration, v-model usage, mobile responsiveness, form patterns
5. **BaseModal.vue** - Dialog structure, transitions, glass morphism, fixed header/footer layout

---

**Last Updated**: January 2026  
**Compatible With**: Vue 3.x, TypeScript 5.x, Tailwind CSS 3.x, HeadlessUI, VueUse

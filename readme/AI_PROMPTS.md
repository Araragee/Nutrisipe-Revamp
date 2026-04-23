# AI Prompt Templates for Code Generation

> **Quick prompts to use with Claude or other AI assistants to generate code in your style**

---

## 🎯 System Prompt (Use this first)

```
You are a Vue.js + TypeScript expert generating code for Dave's project.

CODING STYLE REQUIREMENTS:
- Use <script setup lang="ts"> with Composition API
- TypeScript with explicit types
- Tailwind CSS (dark mode support required)
- Props: No `required: true`, use defaults instead
- Computed style lookups (no inline style calculations)
- camelCase naming, descriptive variables
- rounded-3xl for buttons/cards
- Comments only on functions/complex template logic
- Loading states with animate-pulse
- Use shallowRef for performance-critical state

STRUCTURE:
1. Imports (grouped: vue core, libraries, stores, components, utils)
2. Type definitions
3. Props with PropType for unions
4. Refs and reactive state
5. Computed properties
6. Functions
7. Lifecycle hooks (onMounted, onBeforeUnmount)
8. Watchers

DARK MODE PATTERN:
Always include: `class="bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-200"`

REFERENCE:
Follow patterns from Dave's BaseCard.vue, BaseButton.vue, and BaseEchart.vue components exactly.
```

---

## 📦 Component Generation Prompts

### Basic Component
```
Generate a Vue 3 component using my coding style:

Component: [ComponentName]
Purpose: [Brief description]
Props:
  - [propName]: [type] (default: [value])
  - [propName]: [type] (default: [value])
Slots: [list or "none"]

Requirements:
- Use Tailwind for all styling
- Include dark mode variants
- Add loading state with skeleton UI
- Follow the prop pattern from BaseCard.vue
```

**Example:**
```
Generate a Vue 3 component using my coding style:

Component: ProductCard
Purpose: Display product info with image, title, price, and CTA button
Props:
  - imageUrl: String
  - title: String
  - price: Number (default: 0)
  - loading: Boolean (default: false)
  - size: 'sm' | 'md' | 'lg' (default: 'md')
Slots: 
  - actions (for custom buttons)
  - badge (for sale/new tags)

Requirements:
- Use Tailwind for all styling
- Include dark mode variants
- Add loading state with skeleton UI
- Follow the prop pattern from BaseCard.vue
```

---

### Form Input Component
```
Generate a form input component using my coding style:

Component: [InputName]
Type: [text/select/textarea/etc]
Features:
  - Validation state (error, success, default)
  - Label and error message slots
  - Dark mode support
  - Disabled state
  - Optional label tag

Props should include:
  - modelValue for v-model (use useVModel from @vueuse/core)
  - label slot, placeholder, disabled, optional
  - size variants (sm, base)
  - display: 'horizontal' | 'vertical'

Use computed for validation classes like BaseButton.vue
Follow BaseSelect.vue patterns for form structure
```

---

### Dropdown/Select Component
```
Generate a dropdown select component using my coding style:

Component: [SelectName]
Uses: HeadlessUI Menu components
Features:
  - Options array with value/label structure
  - Mobile: modal picker
  - Desktop: dropdown menu
  - Loading state with pulse animation
  - Dark mode support

Props:
  - modelValue: string | number | null
  - options: { value, label }[]
  - defaultLabel: string (default: '-- Select --')
  - size: 'sm' | 'base'
  - isMobile: boolean
  - disabled: boolean

Use useVModel from @vueuse/core
Follow BaseSelect.vue exactly
Include transition animations
Use @iconify/vue for chevron icon
```

---

### Modal Component
```
Generate a modal component using my coding style:

Component: [ModalName]
Uses: HeadlessUI Dialog components
Features:
  - Fixed header with title and close button
  - Scrollable content area
  - Fixed footer slot
  - Glass morphism option
  - Smooth transitions

Props:
  - title: string
  - modalType: 'default' | 'glass'
  - modalClass: custom sizing classes

Use defineModel for v-model
Follow BaseModal.vue structure:
  - TransitionRoot with Dialog
  - TransitionChild for backdrop and panel
  - Three-section layout (header/content/footer)
  - Scale + fade transitions

Backdrop: bg-black/40
Border: rounded-2xl with border-zinc-300
```

---

### Data Display Component
```
Generate a data display component using my coding style:

Component: [ComponentName]
Data Type: [table/list/grid/etc]
Features:
  - Loading skeleton
  - Empty state
  - Responsive (mobile/desktop layouts)
  - Dark mode

Props:
  - data: Array of [DataType]
  - loading: Boolean
  - emptyMessage: String

Follow the loading pattern from BaseCard.vue
```

---

### Chart/Visualization Component
```
Generate a chart component using my coding style:

Component: [ChartName]
Library: [echarts/chart.js/etc]
Chart Type: [bar/line/pie/etc]

Follow BaseEchart.vue patterns:
- Use shallowRef for loading
- Throttled resize handler
- nextTick for smooth initialization
- Watch for options/data changes
- Expose instance and resize method

Props:
  - options: ChartOptions
  - loading: Boolean
  - height/width: String
```

---

## 🔧 Modification Prompts

### Add Feature to Existing Component
```
Modify this component following my coding style:

[Paste component code]

Add this feature:
[Describe feature]

Requirements:
- Maintain existing prop patterns
- Add new props with defaults
- Use computed for new style variants
- Keep dark mode support
- Update types if needed
```

---

### Fix/Refactor Component
```
Refactor this component to match my coding style:

[Paste component code]

Issues to fix:
- [Issue 1]
- [Issue 2]

Apply these patterns:
- Computed style lookups instead of inline
- PropType for unions
- Tailwind classes instead of CSS
- Dark mode variants
- Proper TypeScript types
```

---

## 🎨 Styling Prompts

### Add Dark Mode
```
Add dark mode support to this component following my patterns:

[Paste component code]

Requirements:
- All backgrounds: bg-white dark:bg-zinc-800
- All text: text-zinc-600 dark:text-zinc-200
- All borders: border-zinc-300 dark:border-opacity-30
- Adjust opacity values for dark mode
```

---

### Convert CSS to Tailwind
```
Convert this component's CSS to Tailwind following my style:

[Paste component code]

Requirements:
- Use rounded-3xl for cards/buttons
- Use spacing scale: p-2.5, px-4 py-3, gap-2/3
- Include dark mode variants
- Use opacity modifiers
- Remove <style> section completely
```

---

## 🧩 Composable Generation Prompts

### Create Composable
```
Generate a Vue composable using my coding style:

Composable: use[Name]
Purpose: [What it does]
Parameters: [list]
Returns: [what it exposes]

Requirements:
- TypeScript with explicit return types
- Use camelCase naming
- Include cleanup in onBeforeUnmount if needed
- Add function comments
- Follow pattern from useResizableElementHeight
```

**Example:**
```
Generate a Vue composable using my coding style:

Composable: useDebounce
Purpose: Debounce any function call
Parameters: 
  - fn: Function to debounce
  - delay: number (milliseconds)
Returns: 
  - debouncedFn: debounced version
  - cancel: function to cancel pending calls

Requirements:
- TypeScript with explicit return types
- Use camelCase naming
- Include cleanup in onBeforeUnmount if needed
- Add function comments
```

---

## 📱 Responsive Component Prompts

### Make Component Responsive
```
Make this component responsive following my patterns:

[Paste component code]

Requirements:
- Mobile-first approach
- Breakpoints: sm, md, lg (Tailwind standard)
- Different layouts for mobile/desktop
- Adjust spacing: smaller on mobile
- Consider touch interactions
- Follow BaseEchart.vue responsive patterns
```

---

## 🎬 Animation Prompts

### Add GSAP Scroll Animation
```
Add GSAP scroll animation to this component:

[Paste component code]

Animation:
[Describe what should animate and when]

Requirements:
- Use onMounted for GSAP setup
- ScrollTrigger configuration
- Smooth initialization (100ms delay)
- Clean up on unmount
- Comment animation setup
```

---

### Add AnimeJS Interaction
```
Add AnimeJS animation to this component:

[Paste component code]

Trigger: [click/hover/mount/etc]
Animation: [describe effect]

Requirements:
- Create separate animation function
- Use anime({ targets, ... }) pattern
- Smooth easing
- Comment the animation purpose
```

---

## 🧪 Testing & Debugging Prompts

### Add Console Debugging
```
Add helpful console logs to this component for debugging:

[Paste component code]

Log these events:
- Component mount
- Prop changes
- User interactions
- Data fetching

Use descriptive log messages with emoji icons: 🔥 ✅ ❌
```

---

### Add Error Handling
```
Add error handling to this component following my patterns:

[Paste component code]

Add try-catch for:
- [Operation 1]
- [Operation 2]

Requirements:
- Silent catch with empty block (if non-critical)
- User-friendly error messages
- Loading state management
- Fallback UI if needed
```

---

## 💡 Quick Fixes

### One-liner Fixes
```
Fix this issue in my coding style:
[Describe issue]
[Paste relevant code]

Keep: existing structure, prop names, functionality
Change: only what's needed to fix the issue
```

---

### Type Error Fixes
```
Fix TypeScript errors in this component:

[Paste component code with errors]

Requirements:
- Add proper PropType imports
- Define missing interfaces
- Add type annotations to refs
- Fix any type assertions
```

---

## 🎯 Complete Example Session

Here's a full example of generating a new component:

```
STEP 1: Set context
[Paste system prompt from above]

STEP 2: Generate component
Generate a Vue 3 component using my coding style:

Component: NotificationCard
Purpose: Display notification with icon, message, timestamp, and dismiss button
Props:
  - type: 'success' | 'error' | 'info' | 'warning' (default: 'info')
  - message: String
  - timestamp: String
  - dismissible: Boolean (default: true)
Slots: 
  - icon (custom icon)

Requirements:
- Use Tailwind for all styling
- Color variants based on type (green for success, red for error, etc.)
- Include dark mode variants
- Animate in with slide-in effect
- Emit 'dismiss' event when closed
- Follow the prop pattern from BaseCard.vue

STEP 3: Review and iterate
[After seeing output, request changes]
- "Make the animation smoother with GSAP"
- "Add auto-dismiss after 5 seconds"
- "Change the close button to use BaseButton component"
```

---

## 📋 Checklist After Generation

After AI generates code, verify:

- [ ] Uses `<script setup lang="ts">`
- [ ] Props have defaults (no `required: true`)
- [ ] Computed style lookups (not inline calculations)
- [ ] Dark mode classes on all colored elements
- [ ] Proper TypeScript types (PropType for unions)
- [ ] camelCase naming throughout
- [ ] rounded-3xl on cards/buttons
- [ ] Loading states use animate-pulse
- [ ] Comments only on functions
- [ ] Imports are grouped properly
- [ ] No <style> section (Tailwind only)

---

## 🚀 VS Code Integration Tips

**Option 1: Use as MCP Context**
If using Claude Desktop with MCP, reference this file:
```
Read /path/to/DAVE_CODING_STYLE_GUIDE.md and generate a [component type]
```

**Option 2: Copy-Paste Workflow**
1. Copy system prompt to clipboard
2. Paste in new chat with Claude
3. Use component generation prompt
4. Review output against checklist

**Option 3: Custom VS Code Snippet**
Create a snippet that pastes your system prompt automatically

---

**Pro Tips:**
- Start every coding session with the system prompt
- Keep the style guide open for quick reference
- When in doubt, reference BaseCard/BaseButton/BaseEchart
- Iterate: generate → review → refine
- Save good prompts that worked well

---

**Quick Access**: 
Save this file as `AI_PROMPTS.md` alongside `DAVE_CODING_STYLE_GUIDE.md`

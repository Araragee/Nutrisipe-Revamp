---
name: Nutrisipe
description: Social recipe-sharing app where home cooks discover, save, and share food.
colors:
  ember-orange: "#FF6B35"
  ember-orange-light: "#FF8C42"
  warm-parchment: "oklch(98.5% 0.008 60)"
  warm-parchment-deep: "oklch(96% 0.010 55)"
  dark-slate: "oklch(11% 0.010 240)"
  dark-slate-raised: "oklch(17% 0.014 240)"
  ink: "oklch(18% 0.012 240)"
  ink-muted: "oklch(45% 0.010 240)"
  ink-dim: "oklch(65% 0.008 240)"
  ink-on-dark: "oklch(97% 0.004 60)"
  ink-on-dark-muted: "oklch(75% 0.008 60)"
  surface: "#FFFFFFD9"
  surface-dark: "#1A1820"
typography:
  display:
    fontFamily: "Montserrat, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3.5rem)"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Montserrat, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Montserrat, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Montserrat, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    letterSpacing: "0.1em"
rounded:
  chip: "999px"
  btn: "14px"
  card: "24px"
  modal: "32px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.ember-orange}"
    textColor: "#FFFFFF"
    rounded: "{rounded.btn}"
    padding: "16px 32px"
  button-primary-hover:
    backgroundColor: "{colors.ember-orange-light}"
    textColor: "#FFFFFF"
    rounded: "{rounded.btn}"
    padding: "16px 32px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.btn}"
    padding: "16px 24px"
  button-secondary-hover:
    backgroundColor: "transparent"
    textColor: "{colors.ember-orange}"
    rounded: "{rounded.btn}"
    padding: "16px 24px"
  input-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.btn}"
    padding: "14px 18px"
  input-focus:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.btn}"
    padding: "14px 18px"
---

# Design System: Nutrisipe

## 1. Overview

**Creative North Star: "The Kitchen Table"**

Nutrisipe is the digital equivalent of a kitchen table — the surface where food is shared, recipes are passed around, and cooking becomes communal. The visual system is warm, dimensional, and human. Every surface has slight texture from ambient shadows and translucent glass layers. Nothing is sterile; nothing is corporate. The UI makes room, steps back, and lets food photography claim the frame.

The design is food-first and warmth-forward. Orange acts as a hearth light — present, but never overbearing. Backgrounds carry a barely-there golden tint (warm parchment) rather than clinical white. Type is expressive in headings (Montserrat, heavy weights) and invisible in body copy (Inter, light enough to read without thinking). Rounded edges soften every surface, and generous shadows keep cards from feeling flat.

This system explicitly rejects two failure modes from PRODUCT.md: the overcrowded food blog (walls of text, ad-polluted layouts, recipe content buried in life-story preamble) and the corporate SaaS dashboard (enterprise-blue, form-heavy, dense, treating recipes like data rows). A new screen should always pass the smell test: does it feel like gathering around food, or like filling out a spreadsheet?

**Key Characteristics:**
- Ambient warmth in every surface layer
- Food photography fills the frame — UI decorates the edges, never competes
- Orange as accent, not background color
- Glass + backdrop-blur as the primary depth language for chrome elements
- Generous radius everywhere (nothing has a sharp corner without reason)
- Montserrat for identity, Inter for clarity

## 2. Colors: The Ember Palette

One accent — Ember Orange — carried through interactions, while a warm-tinted neutral system does the atmospheric work.

### Primary
- **Ember Orange** (`#FF6B35` / oklch(66% 0.22 40)): The single named accent. Used on primary CTAs, active navigation states, like buttons, focus rings, hover borders on inputs. Its rarity is the warmth — keep it scarce on any given screen.
- **Ember Orange Light** (`#FF8C42` / oklch(72% 0.20 42)): Gradient endpoint for buttons, used in hover states. Never used flat as a fill on its own.

### Neutral — Light Mode
- **Warm Parchment** (`oklch(98.5% 0.008 60)` ≈ `#FEF9F5`): Primary background. The golden tint reads as warmth, not yellow. Use everywhere the page "breathes."
- **Warm Parchment Deep** (`oklch(96% 0.010 55)` ≈ `#F6EDE4`): Secondary background for sidebar panels, grouped content, alternating rows. Never pure white.
- **Surface** (`rgba(255,255,255,0.85)`): Translucent card and glass surfaces. The transparency layers above warm parchment to create dimensionality without solid blocking.

### Neutral — Dark Mode
- **Dark Slate** (`oklch(11% 0.010 240)` ≈ `#0E1018`): Primary dark background. The blue-green undertone prevents pure-black coldness.
- **Dark Slate Raised** (`oklch(17% 0.014 240)` ≈ `#171A2A`): Elevated surfaces, sidebar cards in dark mode. Visible step above the base.
- **Surface Dark** (`rgb(26, 24, 32)` / `#1A1820`): Card and modal background in dark mode.

### Neutral — Text
- **Ink** (`oklch(18% 0.012 240)`): Primary text. Near-black with a barely visible warm-blue tint — less harsh than `#000000`.
- **Ink Muted** (`oklch(45% 0.010 240)`): Secondary text, labels, metadata.
- **Ink Dim** (`oklch(65% 0.008 240)`): Placeholder text, disabled states, timestamp captions.
- **Ink on Dark** (`oklch(97% 0.004 60)`): Primary text in dark mode. Near-white with a faint warm tint.
- **Ink on Dark Muted** (`oklch(75% 0.008 60)`): Secondary text in dark mode.

### Named Rules
**The Ember Rule.** Ember Orange appears on ≤15% of any given screen's painted area. Its warmth is the point; abundance destroys it. If orange is everywhere, nothing is warm — everything is orange.

**The No-True-White Rule.** `#ffffff` and `#000000` are forbidden. Every neutral is tinted: backgrounds toward warm (hue ~55–60), darks toward cool (hue ~240). The tint is invisible at a glance but removes the clinical edge.

## 3. Typography

**Display Font:** Montserrat (sans-serif fallback)
**Body Font:** Inter (sans-serif fallback)

**Character:** Montserrat at heavy weights (700–900) gives Nutrisipe its personality — confident, warm, approachable without being childish. Inter disappears into the background as it should: readable, neutral, out of the way. The pairing earns contrast through weight difference rather than style difference.

### Hierarchy
- **Display** (900 weight, clamp(2rem, 5vw, 3.5rem), lh 1.1, ls –0.02em): Page heroes, major section headers. Rare — one per screen maximum.
- **Headline** (800 weight, 1.75rem, lh 1.2, ls –0.01em): Recipe titles in modals, profile names, section headings. Montserrat.
- **Title** (700 weight, 1.125rem, lh 1.3): Card overlays, onboarding step titles, sidebar section labels. Montserrat.
- **Body** (400 weight, 0.9375rem, lh 1.6): Recipe descriptions, message copy, settings prose. Inter. Max line length: 65ch.
- **Label** (700 weight, 0.6875rem, ls 0.1em, uppercase): Form field labels, tag text, Nutri-Score badge, category chips. Montserrat. Always all-caps.

### Named Rules
**The Montserrat Gate.** Montserrat is identity type. Use it for headings, buttons, labels, and the brand mark only. Never use Montserrat at weights below 600, and never for body paragraphs. Inter is invisible; Montserrat is expressive — keeping them separate preserves both.

## 4. Elevation

Nutrisipe uses **ambient layering**: surfaces are never fully flat. A soft warm shadow is always present at rest (not just on hover), giving the UI a physical sense of depth — cards lift off the background instead of lying on it. Glass + backdrop-blur is the primary language for chrome elements (sidebars, nav, modals), layered above the ambient shadow system.

The transition timing is `cubic-bezier(0.34, 1.2, 0.64, 1)` — a subtle spring used for state changes (card hover, button press, element entrance). It adds tactility without bouncing.

### Shadow Vocabulary
- **Card Shadow** (`0 4px 24px rgba(30,20,10,0.10), 0 1px 4px rgba(30,20,10,0.06)`): Always-on ambient shadow for recipe cards, profile tiles, and content containers. Warm-tinted black keeps it from reading as cold gray.
- **Modal Shadow** (`0 24px 80px rgba(20,10,0,0.22), 0 4px 16px rgba(20,10,0,0.10)`): For modals, recipe detail overlays, and any surface that floats above content. More dramatic; signals interruption.
- **Glow Shadow** (`0 6px 24px rgba(255,107,53,0.35)`): Orange-tinted halo for primary buttons and active states. Connects the shadow to the accent color.

### Named Rules
**The Warm Shadow Rule.** All shadows use warm-tinted black (rgba with a brown-warm base, hue ~20–40), never neutral gray. `rgba(30,20,10,...)` reads as depth; `rgba(0,0,0,...)` reads as dirt.

**The Glass Layer Rule.** Glass surfaces (`backdrop-blur: 20px`, 18% opacity fill) are reserved for persistent chrome: sidebar navigation, header panels, modal backdrops. Content cards use solid surfaces and shadow depth — glass on recipe cards creates visual noise, not refinement.

## 5. Components

### Buttons
Rounded and inviting. The primary button is one of the few places Ember Orange paints a full surface — it earns the exception by being the clearest call to action on screen.

- **Shape:** Gently rounded (14px radius, `--radius-btn`). Consistent across primary and secondary.
- **Primary:** Orange-to-orange-light gradient (`from: #FF6B35, to: #FF8C42`), white text, Montserrat 700 at 15px, padding 16px × 32px. Box shadow carries orange glow (`0 6px 24px rgba(255,107,53,0.35)`).
- **Hover:** Lifts 2px (`translateY(-2px)`), glow shadow expands to `0 12px 32px rgba(255,107,53,0.35)`. Transition: 200ms ease.
- **Secondary / Ghost:** Transparent background, Ink text, 1.5px glass-border stroke. Hover shifts border and text to Ember Orange. No shadow.
- **Focus-Visible:** 2px Ember Orange outline, 3px offset. Both variants.

### Chips / Tags
Frosted glass pill. Two contexts: recipe tags on card overlays (dark glass against photography) and category filter chips in the feed header (surface glass on light backgrounds).

- **Card variant:** `rgba(255,255,255,0.2)` fill, `rgba(255,255,255,0.3)` border, `backdrop-filter: blur(4px)`, white Montserrat Label text. Full pill radius.
- **Filter variant:** Surface glass fill, glass-border stroke, Ink Muted text at rest. Active: Ember Orange tint fill (`rgba(255,107,53,0.1)`), Ember Orange text.

### Cards / Containers
PinCard is the signature component. Variable aspect ratios (hash-derived per post: 3/4, 4/5, 2/3, square, 3/5, 5/6) create the masonry rhythm — no two adjacent cards share the same proportions.

- **Corner Style:** Generously rounded (24px, `--radius-card`)
- **Background:** Deep `#111` base behind the image — handles broken/loading images gracefully and frames food photography.
- **Image Treatment:** Full-bleed fill with `object-cover`. Hover scales the image 105% (`transition: transform 500ms ease`) while the card crop masks the scale — food "breathes" toward the viewer.
- **Overlay:** Gradient from bottom (`from-black/85 via-black/40 to-transparent`) carries title, tags, and author without obscuring the food.
- **Shadow:** Card Shadow at rest. No additional hover shadow — the image scale is the hover affordance.
- **Border:** 1.5px glass-border stroke. Visible against Warm Parchment backgrounds; nearly invisible against photography.

### Inputs / Fields
Glass-surfaced with focus ring in Ember Orange.

- **Style:** Surface background (`rgba(255,255,255,0.85)`), 1.5px glass-border stroke, 14px radius. Font: Inter 15px, Ink color.
- **Label:** Always Montserrat Label (700, 11px, 0.1em tracking, uppercase) above the input with 8px gap.
- **Focus:** Border shifts to Ember Orange (`transition: border-color 200ms ease`). No glow ring — the border shift is the signal.
- **Error:** Red-500 at 10% opacity fill (`bg-red-500/10`), red-500 at 20% opacity border, red-500 text. Rounded-xl container with 700-weight message.
- **Dark Mode:** Background shifts to `rgb(30, 28, 38)`.

### Navigation (Sidebar)
Glass card stack in a 220px left sidebar on desktop. Mobile: bottom bar.

- **Sidebar Card:** Glass container (`bg-glass`, `backdrop-blur: 20px`), 20px radius, glass-border stroke. Multiple stacked cards (logo + nav / categories / suggested creators).
- **Nav Items:** Icon + label, 10px × 12px padding. Default: Ink Muted color. Hover: Ember Orange tint bg (`rgba(255,107,53,0.08)`), Ember Orange text. Active: Ember Orange soft bg (`rgba(255,107,53,0.1)`), Ember Orange text, 600 weight.
- **Logo Mark:** Montserrat font-black "Nutri" + `<span class="text-orange">sipe</span>`. Orange only on the final four characters.

### Nutri-Score Badge (Signature Component)
EU Nutri-Score traffic-light system adapted as a card overlay badge. Color is regulatory, not brand — do not adjust these values.

- **Position:** Top-left corner of PinCard, absolute.
- **Style:** `backdrop-blur`, white/20 border, rounded-md, Montserrat Label text white.
- **Score Colors:** A `#008b4c`, B `#85bb2f`, C `#fecb02`, D `#ee8100`, E `#e63e11`. These are non-negotiable regulatory colors.

## 6. Do's and Don'ts

### Do:
- **Do** let food photography fill the full card frame. The overlay gradient carries UI chrome; never use a white card background that competes with the image.
- **Do** use warm-tinted shadows (`rgba(30,20,10,...)` family) on every elevated surface. A gray shadow on a warm surface reads as cold contamination.
- **Do** use `--radius-card` (24px) as the minimum corner radius for content containers. Smaller radii feel out of place.
- **Do** apply `backdrop-blur: 20px` on all persistent chrome (sidebar, header, modal backdrop). This is how Nutrisipe creates depth for UI elements without covering food content.
- **Do** vary aspect ratios in the feed grid. The hash-derived ratio system exists to prevent identical card columns — preserve it.
- **Do** label every form field with Montserrat Label style (uppercase, 11px, 0.1em tracking). Unlabeled inputs break the tactile contract.
- **Do** ensure all text on food photography passes WCAG AA via gradient overlays, not hard backgrounds. The overlay spec is `from-black/85 via-black/40 to-transparent`.

### Don't:
- **Don't** use pure `#ffffff` or `#000000`. Every neutral is tinted. Background tint toward warm (hue ~55–60); text tint toward cool-neutral (hue ~240).
- **Don't** use Ember Orange as a background color for sections, page panels, or full-bleed areas. It is an accent. Painting large surfaces orange violates the Ember Rule and reads as garish.
- **Don't** build walls of text before recipe content — no life-story preambles, no context-setting paragraphs. If copy precedes the recipe, it has failed. This is the anti-reference from PRODUCT.md, stated by name: **avoid overcrowded food blog patterns.**
- **Don't** apply enterprise or SaaS visual patterns: navy blue backgrounds, data-dense tables as primary UI, form-heavy layouts, sidebar statistics. This is stated by name from PRODUCT.md: **no corporate SaaS dashboard patterns.**
- **Don't** use `border-left` greater than 1px as a colored stripe on cards or callouts. Use full borders, background tints, or leading icons instead.
- **Don't** use `background-clip: text` with a gradient. Use solid Ember Orange or Ink for emphasis.
- **Don't** apply glassmorphism to recipe cards or content containers. Glass is reserved for chrome elements (sidebar, modals, headers). Glass on content cards creates noise.
- **Don't** use Inter below 400 weight or Montserrat below 600 weight. The contrast between a heavy Montserrat headline and a regular-weight Inter body is the system's typographic identity.
- **Don't** adjust the Nutri-Score badge colors for brand alignment. They are regulatory standards, not design choices.

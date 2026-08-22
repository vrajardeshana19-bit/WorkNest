---
name: WorkNest Executive
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#4648d4'
  on-secondary: '#ffffff'
  secondary-container: '#6063ee'
  on-secondary-container: '#fffbff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#111c2d'
  on-tertiary-container: '#79849a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#d8e3fb'
  tertiary-fixed-dim: '#bcc7de'
  on-tertiary-fixed: '#111c2d'
  on-tertiary-fixed-variant: '#3c475a'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  numeric-kpi:
    fontFamily: Geist
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
---

## Brand & Style
The design system embodies a **Corporate Modern** aesthetic with a precision-engineered feel. It balances the authority of a traditional enterprise HRMS with the high-velocity "pro-tool" efficiency of modern SaaS interfaces. 

The visual narrative is built on clarity and structural intelligence. It utilizes high-contrast typography and expansive whitespace to reduce cognitive load in complex data environments. The atmosphere is professional and "connected," favoring functional elegance over decorative flair. Subtle glassmorphism is reserved for top-tier floating elements to signify intelligence and "the layer above" automation.

## Colors
This design system utilizes a sophisticated foundational palette of deep oceanic tones. 

- **Foundation & Ink:** `Primary` (Deep Navy) and `Tertiary` (Charcoal) are used for high-level navigation, headers, and primary text to establish authority.
- **Surface Strategy:** The system uses `Neutral` (F8FAFC) for page backgrounds, while White (#FFFFFF) is reserved for cards and interactive containers to create a clear visual hierarchy.
- **Action & Intelligence:** `Secondary` (Electric Indigo) is the primary action color, used sparingly for CTAs, focus states, and indicating automated or "intelligent" features.
- **Semantic Feedback:** Emerald, Amber, and Red are applied with lowered saturation to maintain the premium feel while clearly communicating status.

## Typography
Typography is the backbone of the intelligence narrative. We use **Geist** for headlines and numeric data to provide a technical, precise character. **Inter** is used for body copy to ensure maximum readability and a neutral, professional tone.

- **KPI Typography:** Large, bold numeric displays use the `numeric-kpi` style to make data instantly scannable.
- **Hierarchy:** Use `label-md` for small headers above data points or section titles to create a structured, "dashboard" feel.
- **Mobile Scaling:** Large headlines automatically scale down on mobile to prevent awkward text wrapping, ensuring the interface remains functional on smaller viewports.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a strictly enforced 4px baseline rhythm. 

- **Grid:** On desktop, use a 12-column grid with 24px gutters. Content should be centered within a 1440px max-width container.
- **Rhythm:** Spacing between related elements (labels and inputs) should use `sm` (8px). Spacing between independent card components should use `lg` (24px).
- **Mobile Adaptivity:** Margins shrink to 16px on mobile devices. Grids collapse to a 1-column layout, with horizontal scrolling permitted for data tables.
- **Whitespace:** Emphasize generous padding within containers (`md` or `lg`) to prevent the "dense enterprise" look and maintain a premium feel.

## Elevation & Depth
The design system uses a **Tonal Layering** approach combined with low-contrast outlines.

1.  **Level 0 (Background):** Neutral Gray (#F8FAFC).
2.  **Level 1 (Cards/Content):** White (#FFFFFF) with a 1px border (#E2E8F0) and a very soft, diffused shadow (0px 4px 6px -1px rgba(15, 23, 42, 0.05)).
3.  **Level 2 (Dropdowns/Modals):** White (#FFFFFF) with a more pronounced shadow and a 1px border. 
4.  **Intelligence Layer (Glassmorphism):** For AI-driven insights or floating action bars, use a backdrop blur (12px) with 80% white opacity to signify a higher "meta" level of the UI.

Avoid heavy shadows; the "lift" should be felt through the 1px border and subtle shifts in surface color.

## Shapes
The shape language is defined by a **Rounded** (0.5rem / 8px) base, with larger containers using an expanded radius to soften the enterprise environment.

- **Standard Elements:** Buttons, input fields, and chips use 8px (`rounded-md`).
- **Main Containers:** Dashboard cards and modal windows use 16px (`rounded-lg`) to create a modern, approachable frame.
- **Icons:** Use elegant line icons with a 2px stroke and slightly rounded ends to match the UI's geometry.
- **Avatars:** Always circular to provide a soft counter-balance to the structured grid.

## Components
- **Buttons:** Primary buttons use the `Secondary` (Electric Indigo) color with white text. Hover states should darken the background slightly. "Ghost" variants should use the 1px border style.
- **Input Fields:** Use a subtle Gray (#F1F5F9) background for inputs in their resting state, shifting to White with an Indigo 1px border on focus. 
- **Chips/Badges:** Small, low-saturation backgrounds with high-saturation text (e.g., light green background with dark green text for "Active").
- **Cards:** The primary container. Use 16px padding as default. Headlines within cards should use `headline-md`.
- **Data Tables:** High-density but clear. Use `body-sm` for row data. Zebra striping is discouraged; use subtle 1px horizontal dividers instead.
- **Micro-interactions:** All hover states and transitions should use a `200ms ease-out` curve. Avoid "bouncy" animations; prioritize "swift and smooth" transitions to reinforce the feeling of speed.
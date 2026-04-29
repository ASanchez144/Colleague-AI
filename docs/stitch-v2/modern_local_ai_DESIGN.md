---
name: Modern Local AI
colors:
  surface: '#faf8ff'
  surface-dim: '#d9d9e5'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3fe'
  surface-container: '#ededf9'
  surface-container-high: '#e7e7f3'
  surface-container-highest: '#e1e2ed'
  on-surface: '#191b23'
  on-surface-variant: '#434655'
  inverse-surface: '#2e3039'
  inverse-on-surface: '#f0f0fb'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#4059aa'
  on-secondary: '#ffffff'
  secondary-container: '#8fa7fe'
  on-secondary-container: '#1d3989'
  tertiary: '#005b7c'
  on-tertiary: '#ffffff'
  tertiary-container: '#00759f'
  on-tertiary-container: '#e1f2ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#dce1ff'
  secondary-fixed-dim: '#b6c4ff'
  on-secondary-fixed: '#00164e'
  on-secondary-fixed-variant: '#264191'
  tertiary-fixed: '#c4e7ff'
  tertiary-fixed-dim: '#7bd0ff'
  on-tertiary-fixed: '#001e2c'
  on-tertiary-fixed-variant: '#004c69'
  background: '#faf8ff'
  on-background: '#191b23'
  surface-variant: '#e1e2ed'
typography:
  h1:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 0.25rem
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
  xl: 2rem
  gutter: 1.5rem
  margin: 2rem
---

## Brand & Style
The design system focuses on a **Corporate / Modern** aesthetic, blending the precision of high-end productivity tools like Linear with the accessibility required for local business owners. The objective is to establish immediate trust and perceived intelligence through high-quality execution.

The style prioritizes clarity and functional efficiency. It utilizes a restrained color palette, generous whitespace, and a rigorous adherence to systematic spacing. By mimicking the "Stripe-like" clarity, the interface feels less like a complex AI engine and more like a dependable business partner. The emotional response is one of reliability, technological sophistication, and calm control.

## Colors
The palette is rooted in a spectrum of blues to communicate stability and technical depth. The **Primary Blue (#2563EB)** serves as the main action color, while **Deep Blue (#1E3A8A)** is reserved for high-contrast elements or dark-mode surfaces. **Sky Blue (#38BDF8)** acts as a subtle accent for highlighting and active states.

The neutral system uses a cool-toned background (**#F8FAFC**) to maintain a fresh, modern feel. Semantic colors for success and danger are saturated and clear, ensuring that status updates are instantly recognizable without overwhelming the user interface.

## Typography
This design system utilizes **Inter** exclusively to leverage its incredible legibility and systematic feel. Headlines use tighter letter spacing and heavier weights to create a strong visual anchor. Body text is optimized for readability with a slightly increased line height.

Small labels and metadata should use the `label-sm` style with increased letter spacing to maintain clarity at small scales. Consistent use of weight (Semibold vs Regular) is the primary tool for establishing information hierarchy.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy for dashboard views to ensure consistency across different screen sizes, while marketing pages may utilize a more fluid approach. A 12-column system is standard, with 24px (1.5rem) gutters to allow the UI to "breathe."

All spacing is derived from a 4px base unit. This strict mathematical rhythm ensures that all elements—from the padding inside a button to the margin between sections—feel intentional and balanced.

## Elevation & Depth
Depth is achieved through **Tonal Layers** and **Ambient Shadows**. Surfaces are primarily flat, using subtle background shifts to indicate hierarchy (e.g., a slightly darker background for the sidebar vs. the main content area).

Shadows are used sparingly to elevate interactive elements like cards and modals. These should be "Long & Soft" shadows: low opacity (4-8%), large blur radius, and a slight downward Y-offset to simulate a natural light source. Avoid heavy black shadows; instead, use a shadow color tinted with the Deep Blue to maintain color harmony.

## Shapes
The shape language is **Soft**. This choice balances the professional rigidity of a business tool with the approachability of a modern SaaS. Standard components like buttons and inputs use a 4px (0.25rem) radius. Larger containers like cards use an 8px (0.5rem) radius to feel distinct from smaller interactive elements.

## Components
- **Buttons:** Solid primary buttons use White text on the Primary Blue. Secondary buttons use a subtle gray background or a simple border. All buttons have a subtle 1px inner light border on the top edge to create a "pressed" or "tactile" look common in modern SaaS.
- **Cards:** Use a white background with a 1px border (#E2E8F0) and a very soft ambient shadow. No heavy headers; use typography to define sections.
- **Input Fields:** Clean, 1px borders that transition to Primary Blue on focus. Use "Label Sm" for field titles to maintain a compact, professional look.
- **Chips/Badges:** Small, pill-shaped indicators with low-saturation backgrounds (e.g., Success green at 10% opacity) and high-saturation text for status indicators.
- **AI Specific Elements:** Use subtle gradients involving Sky Blue (#38BDF8) or very thin animated borders to indicate "AI Processing" or "Intelligence" states without breaking the clean aesthetic.

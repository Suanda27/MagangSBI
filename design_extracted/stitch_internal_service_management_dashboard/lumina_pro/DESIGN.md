---
name: Lumina Pro
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#444652'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#757684'
  outline-variant: '#c5c5d4'
  surface-tint: '#3d57ba'
  primary: '#00175c'
  on-primary: '#ffffff'
  primary-container: '#00288e'
  on-primary-container: '#7e97fe'
  inverse-primary: '#b8c4ff'
  secondary: '#3755c3'
  on-secondary: '#ffffff'
  secondary-container: '#708cfd'
  on-secondary-container: '#00217a'
  tertiary: '#0f2033'
  on-tertiary: '#ffffff'
  tertiary-container: '#253549'
  on-tertiary-container: '#8d9eb6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c4ff'
  on-primary-fixed: '#001453'
  on-primary-fixed-variant: '#213da0'
  secondary-fixed: '#dde1ff'
  secondary-fixed-dim: '#b8c4ff'
  on-secondary-fixed: '#001453'
  on-secondary-fixed-variant: '#173bab'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
  surface-white: '#FFFFFF'
  border-subtle: '#E2E8F0'
  text-main: '#0F172A'
  text-muted: '#64748B'
typography:
  display:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
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
  xl: 48px
  container-max: 1440px
  gutter: 24px
---

## Brand & Style

The design system embodies a **Minimalist / Corporate Modern** aesthetic, drawing inspiration from high-end developer tools and modern SaaS platforms like Linear and Vercel. The brand personality is precise, calm, and hyper-efficient, aiming to evoke a sense of clarity and professional focus.

The visual language relies on a high-contrast relationship between deep "Professional Blue" accents and expansive white surfaces. By utilizing generous whitespace and a "less is more" approach to decoration, the system ensures that complex data remains digestible. The emotional response is one of "premium utility"—where the software feels like a powerful, unobtrusive tool rather than a complex burden.

## Colors

The palette is strategically limited to maintain a high-signal environment. 

- **Primary & Secondary**: Professional Blues are used sparingly for intent and brand recognition. Primary Blue is reserved for critical actions, while Secondary Blue handles interactive states and accents.
- **Surface Strategy**: The background uses a soft neutral (#F9FAFB) to provide a canvas for the pure white (#FFFFFF) containers. This creates a "layered" effect without needing heavy shadows.
- **Contrast**: Content uses a near-black slate (#0F172A) to ensure maximum legibility, while metadata and secondary information utilize a muted slate grey to recede in the visual hierarchy.

## Typography

This design system uses **Inter** exclusively to leverage its systematic, neutral, and highly legible characteristics. 

- **Tight Tracking**: Larger headlines use a slight negative letter-spacing (-0.02em) to mimic the "display" style of high-end editorial tech sites.
- **Semantic Hierarchy**: Use `headline-md` for all standard card titles. `body-md` is the workhorse for all data entry and table content.
- **Labels**: Small metadata and table headers use `label-md` with a slight tracking increase to ensure clarity at small sizes.

## Layout & Spacing

The system follows a strict **8px linear scale** to ensure mathematical harmony across all views.

- **Grid Model**: A fluid 12-column grid is used for the main content area, while the global navigation is a fixed 240px sidebar.
- **Content Constraints**: Content should never exceed 1440px to ensure line lengths remain readable on ultra-wide monitors.
- **Responsive Behavior**: 
  - **Desktop**: 24px margins, 24px gutters.
  - **Tablet**: 16px margins, 16px gutters; sidebar collapses to an icon rail.
  - **Mobile**: 16px margins; sidebar moves to a bottom-fixed navigation bar or top-level hamburger.

## Elevation & Depth

Visual hierarchy is achieved through **Low-contrast Outlines** and **Tonal Layering** rather than heavy shadows.

- **Flat Depth**: Surfaces are distinguished by their background color (#FFFFFF vs #F9FAFB) and a subtle 1px border (#E2E8F0).
- **Shadows**: Only one shadow level is permitted, reserved for floating elements like popovers, dropdowns, and modals. Use a crisp, multi-layered shadow: `0 1px 2px rgba(0,0,0,0.05), 0 4px 6px -1px rgba(0,0,0,0.05)`.
- **Interaction**: Interactive elements (like cards) should not "lift" on hover. Instead, they should utilize a subtle border-color change to the Primary color.

## Shapes

The shape language is **Rounded (8px)**, providing a modern, approachable feel that remains professional.

- **Components**: Buttons, inputs, and cards all share the same 8px radius to create a unified visual rhythm.
- **Micro-elements**: Checkboxes and small tags may use the smaller 4px radius (`rounded-sm`) to prevent them from looking like circles.
- **Selection States**: Active states in navigation or menus use the same 8px radius for the background highlight.

## Components

### Buttons
- **Primary**: Solid Professional Blue (#00288E) with white text. 8px radius. High-contrast and no gradient.
- **Secondary**: White background with a 1px #E2E8F0 border and #0F172A text.
- **Tertiary**: Ghost style. No border, #64748B text.

### Input Fields
- **Default**: White fill, 1px #E2E8F0 border.
- **Focus State**: Border shifts to #1E40AF with a 2px Primary-tinted outer ring (halo) for accessibility.

### Cards
- **Structure**: White fill, 1px #E2E8F0 border, 8px radius. No shadow unless the card is being dragged or is a floating popover.
- **Padding**: Always use `lg` (24px) for internal padding to maintain the minimalist feel.

### Status Chips
- **Aesthetic**: Low-saturation background (10% opacity of the status color) with high-saturation text of the same hue. 8px radius.

### Navigation
- **Sidebar**: Neutral background (#F9FAFB). Active items are indicated by a subtle grey (#F1F5F9) background block with an 8px radius and a 2px blue vertical line on the leading edge.

### Data Tables
- **Styling**: No vertical borders. Horizontal borders only using #F1F5F9. Header row uses a muted background (#F9FAFB) and `label-md` typography.
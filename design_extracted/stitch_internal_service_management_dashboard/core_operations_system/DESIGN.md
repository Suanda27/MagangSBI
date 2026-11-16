---
name: Core Operations System
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
  on-surface-variant: '#444653'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#757684'
  outline-variant: '#c4c5d5'
  surface-tint: '#3755c3'
  primary: '#00288e'
  on-primary: '#ffffff'
  primary-container: '#1e40af'
  on-primary-container: '#a8b8ff'
  inverse-primary: '#b8c4ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#2d3449'
  on-tertiary: '#ffffff'
  tertiary-container: '#434b60'
  on-tertiary-container: '#b4bbd5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c4ff'
  on-primary-fixed: '#001453'
  on-primary-fixed-variant: '#173bab'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
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
    letterSpacing: 0.05em
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
  xl: 32px
  container-max: 1440px
  gutter: 20px
---

## Brand & Style

This design system is built for high-utility enterprise environments where clarity, speed of processing, and trust are paramount. The aesthetic is **Corporate Minimalism**—prioritizing data density without sacrificing legibility. 

The visual language avoids unnecessary decoration, focusing instead on structural alignment and purposeful white space. The emotional response should be one of "controlled efficiency," providing users with a sense of calm reliability while managing high volumes of internal service requests.

## Colors

The palette is anchored by a deep **Professional Blue** (#1E40AF) to signal authority and stability. 

- **Primary**: Used for key action buttons, active navigation states, and primary brand touchpoints.
- **Surface**: The application utilizes #FFFFFF for primary content containers and #F8FAFC for the global background to create subtle separation.
- **Status Tints**: Each status color (Green, Amber, Red, Blue) should be paired with a 10% opacity background tint for "Badges" or "Chips" to ensure the UI remains soft and readable.
- **Contrast**: Text should primarily use #0F172A for high-contrast readability against white backgrounds.

## Typography

The design system utilizes **Inter** for its exceptional legibility at small sizes and its systematic, neutral character.

- **Hierarchy**: Use `headline-md` for card titles and section headers. 
- **Data Tables**: Standard table cell content should use `body-md`.
- **Labels**: All-caps `label-md` should be used for table headers and small metadata tags to differentiate them from interactive text.
- **Weight**: Reserve Bold (700) and Semi-Bold (600) strictly for emphasizing structural hierarchy or critical data points.

## Layout & Spacing

The system follows an **8px grid** rhythm to maintain mathematical consistency across all components.

- **Desktop Layout**: A fixed left-hand navigation (240px width) with a fluid content area. Content should be contained within a maximum width of 1440px to prevent excessive line lengths in data tables.
- **Sectioning**: Use `lg` (24px) spacing between major card elements. Use `md` (16px) for internal card padding.
- **Responsiveness**: On tablet devices, the sidebar collapses into a hamburger menu or icon-only rail. Margins should reduce from 32px (Desktop) to 16px (Mobile).

## Elevation & Depth

This design system uses **Tonal Layering** supplemented by **Ambient Shadows** to define hierarchy.

- **Level 0 (Background)**: #F8FAFC - The canvas.
- **Level 1 (Cards/Containers)**: #FFFFFF - Used for the primary work surface.
- **Shadows**: Apply a single, highly diffused shadow to Level 1 elements: `0px 1px 3px rgba(0,0,0,0.05), 0px 10px 15px -3px rgba(0,0,0,0.05)`. This creates a subtle lift that feels integrated rather than floating.
- **Interaction**: On hover, interactive cards may increase shadow density slightly, but should not change elevation significantly.

## Shapes

The shape language is **Rounded** to soften the industrial nature of the enterprise software.

- **Standard Elements**: Buttons, Input fields, and Cards utilize a 0.5rem (8px) corner radius.
- **Small Elements**: Checkboxes and small tags use a 0.25rem (4px) radius.
- **Status Badges**: Use a "Soft Pill" approach (rounded-lg) to make them instantly distinguishable from square buttons.

## Components

### Buttons
- **Primary**: Solid #1E40AF with white text. 8px radius.
- **Secondary**: Ghost style with #1E40AF border and text. 
- **Tertiary**: Text-only with no border, used for low-priority actions in tables.

### Input Fields
- White background with a 1px #E2E8F0 border. On focus, the border shifts to the Primary Blue with a 3px soft blue outer glow (halo).

### Status Chips
- Composed of a background tint (10% opacity of the status color) and high-contrast foreground text of the same color. Always use `label-md` typography.

### Data Tables
- Row height: 52px for standard, 64px for high-density.
- Headers: #F8FAFC background, `label-md` text color #64748B.
- Borders: Horizontal-only borders using #F1F5F9.

### Cards
- White fill, 8px radius, subtle ambient shadow. Used to group related request information or dashboard metrics.

### Navigation
- Left-aligned rail. Active state indicated by a 4px vertical "accent bar" on the left edge of the menu item and a subtle #F1F5F9 background highlight.
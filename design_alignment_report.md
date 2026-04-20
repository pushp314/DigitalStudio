# Design Alignment Report

## Locked-Route Reference System
Reference pages preserved: `/chat`, public profile route, `/account`, `/admin`.

### Extracted System
- Palette: white surfaces, `#fafafa` / `#F5F5F7` page backgrounds, slate text, restrained blue/emerald status accents
- Borders: thin `border-slate-100` / `border-slate-200`
- Shadows: light only, mostly `shadow-sm`
- Radius: `rounded-lg`, `rounded-xl`, `rounded-2xl`
- Typography: dense SaaS hierarchy, `tracking-tight` headings, small uppercase utility labels around `10px` to `11px`
- Layout density: compact sidebars, sticky headers, max-width content shells, no oversized marketing gaps
- Buttons: solid dark primary, bordered white secondary, low-noise ghost actions
- Inputs: light filled backgrounds, visible borders, minimal chrome
- Interaction: subtle hover shifts, no glassmorphism, no decorative gradients driving the layout

## Inconsistencies Found Outside Locked Routes
- Oversized hero sections and large decorative cards
- Gradients and glow treatments unrelated to the locked app surfaces
- Rounded `3rem+` cards and browser-window mockups
- Badge clutter and decorative labels
- Search, FAQ, docs, product detail, and features pages using a more marketing-heavy pattern language
- Copy and CTAs using hype language instead of plain SaaS language

## Fixes Applied
- Rebuilt public navbar and footer into the same white/slate/border system
- Standardized public shell classes in `index.css`:
  - `ds-page`
  - `ds-shell`
  - `ds-card`
  - `ds-panel`
  - `ds-input`
  - `ds-button-*`
- Aligned public route surfaces:
  - home shared sections
  - templates listing
  - product detail
  - pricing
  - auth
  - checkout
  - docs list and docs reader
  - testimonials
  - FAQ
  - wishlist
  - cart
  - search palette

## Before → After Logic
- Before: decorative layouts, heavy visual treatments, mixed button patterns, oversized sections
- After: white cards, restrained spacing, simpler headings, consistent controls, quieter page transitions

- Before: product detail and docs used floating controls, glossy frames, and non-system visual chrome
- After: both use the same enterprise-minimal shell, bordered panels, and predictable action rows

- Before: templates/features/testimonials used marketing-style copy and visual emphasis
- After: those routes now use the same component density and language as the locked pages

## Locked Routes
- No locked route was visually redesigned.
- Changes inside locked routes were limited to bug, API, and state alignment work:
  - admin identity request normalization
  - admin order data fix
  - admin reset-password wiring
  - analytics service normalization for routed admin overview

## Confirmation
The public site now aligns to the design language extracted from the locked app pages instead of carrying a separate landing-page aesthetic.

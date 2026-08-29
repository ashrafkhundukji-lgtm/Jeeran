# Handoff: Jeeran Landing Page Redesign

## Overview
Visual redesign of the Jeeran Network landing page (`/`) — the marketing page that pitches shop owners on hosting a QR stand, and shows the customer-facing wallet-offer flow. Same copy structure and CTA as the current Next.js page (`src/components/LandingPage.tsx`); this is a **visual** redesign only.

## About the Design Files
The bundled HTML file (`jeeran-landing-redesign.dc.html` / its standalone export) is a **design reference built in HTML**, not production code to copy verbatim. Recreate this design inside the existing Next.js + Tailwind v4 + React codebase, using the app's existing component structure, i18n system (`LANDING_COPY`, `getDir`), and `LanguageSwitcher`/`MapBackground` conventions — replacing or extending `LandingPage.tsx` rather than pasting raw HTML in.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and layout are final. Implement pixel-close using Tailwind v4 arbitrary values / inline styles as needed — the source file uses inline styles throughout, which map directly to Tailwind's arbitrary-value syntax or plain CSS.

## Screens / Views
Single page, three stacked sections:

### 1. Header
- Flex row, `max-width:1240px` centered, `padding:32px 48px 0`, `justify-content:space-between`.
- Left: Jeeran logo, `height:64px`.
- Right: `Browse` / `Log in` text links (`14px`, `#6b6b6b`), plus an EN/AR pill toggle (`1px solid #e5e5e5`, `border-radius:999px`, `12px` text) that flips `dir` and swaps `LANDING_COPY` locale.

### 2. Hero
- Two-column grid, `grid-template-columns:1.15fr 0.85fr`, `gap:40px`, `max-width:1240px`, `padding:88px 48px 140px`.
- **Left column:**
  - Small coral accent bar: `56×6px`, `border-radius:3px`, `#FF6B4A`.
  - H1: `font-family:'Archivo'`, weight 900, `76px/0.98`, `letter-spacing:-0.01em`. Two lines — first line `#1a1a1a` ("Your offers,"), second line `#1E3A8A` ("everywhere they go.").
  - Subheadline: `19px/1.6`, `#5a5a5a`, `max-width:460px`.
  - CTA button ("I'm a business owner"): `background:#FF6B4A`, white text, `border-radius:10px`, `padding:16px 32px`, `15px` weight 600, `box-shadow:0 12px 24px -8px rgba(255,107,74,0.5)`.
- **Right column — wallet card stack** (hero visual):
  - Headline above the stack: `"A variety of offers, only for Jeeran subscribers"`, `Archivo` weight 800, `16px`, `#1E3A8A`, centered, `max-width` matches card width (250px).
  - Thin circular ring outline behind the stack (`300×300px`, `1.5px solid rgba(30,58,138,0.25)`, `border-radius:50%`) suggesting a network node.
  - Three fanned "wallet pass" cards, each `250×150px`, `border-radius:20px`:
    1. Back card (rotate -9deg): white bg, `#ececec` border, faint business offer ("CAFÉ AROMA — Buy 3, Get 1 Free").
    2. Front/center card (rotate 3deg, on top): blue gradient (`linear-gradient(155deg,#1E3A8A,#2a4fb8)`), Jeeran logo top-left in a white rounded chip (`22px` logo height), orange "SUBSCRIBER" badge top-right (`#FF6B4A`-ish, `rgba(255,107,74,0.9)`), "ACTIVE OFFER" label + "Exclusive Member Deal" title, "JEERAN NETWORK" small caption bottom-left, a small 4×4 QR-dot grid bottom-right (white bg, blue dots).
    3. Third card (rotate 11deg, furthest back): white, faint business offer ("GLOW SPA — Free Add-On Service").
  - Small solid coral circle (`60×60px`) bottom-right of the stack as a decorative accent.

### 3. Steps section (3-step flow)
- Full-bleed section, `background:#1E3A8A`, diagonal `clip-path:polygon(0 3%, 100% 0, 100% 97%, 0 100%)`, `padding:96px 48px`.
- 3-column grid inside `max-width:1240px`, `gap:56px`.
- Each step: giant ghost numeral (`Archivo` 900, `110px`, `rgba(255,255,255,0.14)`, negative margin-bottom to bleed behind the title) → small accent bar (`36×4px`, alternating `#FF6B4A`/`#FFFFFF`) → title (`Archivo` 700, `22px`, white) → body copy (`15px/1.6`, `rgba(255,255,255,0.72)`, `max-width:280px`).
- Content (unchanged from current copy): 01 Host a QR stand → 02 Offer travels with them → 03 Redeem anywhere.

### Footer
- Centered, `padding:36px 48px`, small coral dot + "Jeeran Network" in `12px` `#9a9a9a`.

## Background treatment (full page)
- Base `background:#FBFCFD`.
- An SVG "community network" graphic behind all content: scattered nodes (circles, alternating `#FF6B4A`/`#1E3A8A` at ~0.45–0.55 opacity) connected by thin lines (`#1E3A8A`, `1.4px`, `opacity:0.16`) — evokes a connected local network rather than a plain grid.
- Two large blurred color blobs for depth: coral circle top-right (`520px`, `opacity:0.16`, `blur(60px)`), blue circle bottom-left (`460px`, `opacity:0.14`, `blur(70px)`).

## Interactions & Behavior
- EN/AR toggle: click swaps `state.locale`, flips `dir` attribute (`ltr`/`rtl`) on the root, and re-renders all copy from the locale map (mirrors existing `getDir`/`LANDING_COPY` pattern).
- No other interactive states in this pass (CTA is a plain link to `/signup`).

## State Management
- Single `locale` state (`'en' | 'ar'`), sourced from existing app locale logic — don't reinvent, wire to `getDir`/`LANDING_COPY`.

## Design Tokens
- **Colors:** coral `#FF6B4A`, deep blue `#1E3A8A`, blue gradient end `#2a4fb8`, background `#FBFCFD`, body text `#1a1a1a`, muted text `#5a5a5a` / `#6b6b6b` / `#9a9a9a`, borders `#e5e5e5` / `#ececec`.
- **Typography:** Display — `Archivo` (weights 500/700/900). Body — `Work Sans` (weights 400/500/600). Both loaded via Google Fonts; replace Arial/Helvetica fallback in `globals.css`.
- **Radii:** buttons/cards `10–22px`, pills `999px`.
- **Shadows:** CTA `0 12px 24px -8px rgba(255,107,74,0.5)`; wallet card `0 26px 50px -18px rgba(30,58,138,0.5)`.

## Assets
- `jeeran-logo.svg` — provided by user, used at header (`64px` height) and inside the wallet card chip (`22px` height on white background).
- No other external images; card graphics and background network are built from CSS/SVG shapes, no illustration assets needed.

## Files
- `jeeran-landing-redesign.dc.html` — full design source (template + logic) in this bundle.
- Reference against current implementation: `src/app/page.tsx`, `src/components/LandingPage.tsx`, `src/app/globals.css` (not modified here, listed for context only).

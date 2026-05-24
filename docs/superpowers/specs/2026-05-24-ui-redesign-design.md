# UI Redesign — Design Spec

**Date:** 2026-05-24
**Scope:** Visualize page (NavBar, ContextBar, chart panels, empty/loading states) + placeholder Classify and Benchmark pages

---

## Design Direction

Minimal Terminal. Keep the existing Cortex Purple dark palette. The app should feel like a research instrument built on a terminal, not a dashboard. No gradients, no glow effects except one deliberate exception on the Load button. Typography-forward. Monospace throughout.

---

## Font

**Fira Code** loaded via `next/font/google`. Replaces the current unloaded Geist Mono/Geist Sans setup (which falls back to Times New Roman because the CSS variables are declared but the fonts are never fetched).

- Primary font: `Fira_Code` weights 400 and 700
- Applied to `<html>` via a CSS variable `--font-mono`
- Tailwind `fontFamily.mono` updated to `['var(--font-mono)', 'monospace']`
- No separate sans font — lean fully into mono throughout the UI

---

## Tailwind Color Palette

No changes. Existing tokens are correct:

| Token | Value |
|---|---|
| `base` | `#09090f` |
| `surface` | `#100f1a` |
| `raised` | `#141226` |
| `border` | `#1e1a30` |
| `accent` | `#a78bfa` |
| `accent-muted` | `#c4b5fd` |
| `text-primary` | `#e2e8f0` |
| `text-muted` | `#64748b` |
| `text-dim` | `#3a3650` |

---

## Background Texture

Add a subtle noise grain texture to the `base` background in `globals.css`. Achieved with an SVG `feTurbulence` filter applied via a pseudo-element on `body`, at ~3% opacity. Imperceptible unless you look directly at it, but eliminates the flat plastic feel of pure `#09090f`.

---

## NavBar

Minor polish only. No structural changes.

- Logo text `eeg-mi-benchmark`: monospace, accent color, bold, letter-spacing `0.1em`
- Active nav link: accent color + `border-bottom: 1px solid accent` + `padding-bottom: 2px`
- Inactive nav link: `text-dim`, transitions to `text-muted` on hover
- Background: `surface`, bottom border `border`

---

## ContextBar

Full redesign. Three visual zones left to right:

### Zone 1: Fused selector group

One bordered box (`background: raised`, `border: 1px solid border`, `border-radius: 3px`, `overflow: hidden`) containing three internal cells divided by `1px solid border` vertical separators.

Each cell:
- Stacked layout: dim label on top, value below
- Label: `text-dim`, `font-size: 9px`, `letter-spacing: 0.15em`, uppercase
- Value: `text-primary`, `font-size: 11px`, `▾` arrow in `text-dim`
- Padding: `5px 10px`
- Implemented as a native `<select>` with custom CSS appearance (or a styled wrapper — see implementation notes)

Cells: DATASET, SUBJECT, RUN

### Zone 2: Explain toggle

Sits outside the selector group with a `margin-left: 16px` gap. Not inside any bordered box.

- Small pill toggle (`width: 28px`, `height: 15px`, `border-radius: 99px`)
  - Off state: background `border`, knob `text-dim`
  - On state: background `accent`, knob white
- `EXPLAIN` label to the right of the pill: `text-dim`, `font-size: 9px`, `letter-spacing: 0.15em`, uppercase
- `flex-1` gap after this zone pushes Load to the far right

### Zone 3: Load button

Flush to the right edge. Stretches full toolbar height (`align-self: stretch`). No margin.

- Background: `accent`
- Text: `base` (dark), `font-size: 9px`, `font-weight: 700`, `letter-spacing: 0.15em`, uppercase
- Padding: `0 28px`
- On hover: `box-shadow: 0 0 12px rgba(167, 139, 250, 0.4)` — the one intentional glow in the UI
- Transition: `box-shadow 0.2s ease`

---

## Empty State

Replaces the current two-line centered text. Shows the app's structure before data is loaded.

Three ghost panels in the exact positions the real charts will occupy:

1. Full-width TIME SERIES ghost panel
2. Two-column grid: PSD ghost panel (left) + TOPOGRAPHY ghost panel (right)

Each ghost panel:
- `border: 1px dashed border`
- `border-radius: 6px`
- `background: surface`
- Minimum heights matching the real panels (TIME SERIES: ~200px, PSD/TOPO: ~180px)
- Centered dim monospace label inside: `text-dim`, `font-size: 9px`, `letter-spacing: 0.2em`, uppercase
- Slow pulse animation: `opacity` oscillates between 0.4 and 0.7 over 2.5s (`ease-in-out`, `infinite`, `alternate`)

Below the two ghost rows, centered dim text:
```
── select a dataset, subject, and run -- then load ──
```
`text-dim`, `font-size: 10px`, `letter-spacing: 0.1em`, `margin-top: 16px`

---

## Loading State

Replace the current plain text line. The ghost skeleton remains visible. Inside the TIME SERIES ghost panel, the label changes from the panel name to a dim cycling message:

```
── loading ──
```

No spinner. No progress bar. The ghost panels stay in place; when data resolves the real charts fade in over them.

---

## Chart Panels

Light polish. No changes to chart internals (Nivo config stays as-is).

- Panel wrapper: `background: surface`, `border: 1px solid border`, `border-radius: 6px`, `padding: 16px`
- Panel header row: `display: flex`, `align-items: center`, `gap: 8px`, `margin-bottom: 12px`
- Section label (e.g. `EEG TIME SERIES`): `accent` color, `font-size: 9px`, `letter-spacing: 0.18em`, uppercase, with a `1px solid accent` left border and `padding-left: 8px` — editorial rule
- Channel toggle buttons (C3/C4/Cz): match selector cell style — `font-size: 9px`, `border: 1px solid border`, `padding: 2px 7px`, `border-radius: 2px`; active state: `border-color: accent`, `color: accent`, `background: rgba(accent, 0.08)`

### Chart fade-in animation

When charts render after load, each panel fades in with a short stagger:
- TIME SERIES: `animation-delay: 0ms`
- PSD: `animation-delay: 80ms`
- TOPOGRAPHY: `animation-delay: 160ms`
- Keyframes: `opacity 0 → 1`, `transform: translateY(4px) → 0`, duration `300ms`, easing `ease-out`

---

## Explain Annotation

When Explain is on, the annotation beneath each chart:
- `margin-top: 10px`
- `padding-left: 10px`
- `border-left: 1px solid rgba(accent, 0.25)`
- `color: text-muted`
- `font-size: 10px`
- `line-height: 1.65`

---

## Placeholder Pages (Classify, Benchmark)

Replace raw centered text with a structured layout using consistent design language:

```
[dim monospace section label, e.g. "── WEEK 2 ──"]

[accent, large] CSP + LDA Classification

[text-dim] Coming soon

[citation block]
```

Citation block:
- `border-left: 1px solid border`
- `padding-left: 12px`
- `margin-top: 16px`
- Each citation on its own line in `text-dim`, `font-size: 10px`, `font-style: italic`

Centered vertically in `min-h-[60vh]`, `gap: 8px` between elements.

---

## Implementation Notes

### Font loading (prerequisite)

In `layout.tsx`, import `Fira_Code` from `next/font/google` and apply the CSS variable to `<html>`. Update `tailwind.config.ts` to use the variable. Remove the current dead CSS variable declarations in `globals.css`.

### Native `<select>` styling

Custom-styled `<select>` elements require `-webkit-appearance: none` and a custom `▾` indicator. The wrapper div approach (div that visually wraps the select with `pointer-events: none` arrow overlay) is more cross-browser reliable. Either approach is acceptable.

### Ghost panel animation

Use a single `@keyframes ghost-pulse` in `globals.css`. Apply via a utility class. The animation should feel slow and calm — not a loading spinner in disguise.

### No new dependencies

All changes are CSS and Tailwind. Fira Code is loaded from Google Fonts via `next/font`. No new npm packages needed.

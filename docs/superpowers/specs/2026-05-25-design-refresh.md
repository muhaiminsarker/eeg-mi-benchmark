# Design Refresh — MI·Bench Visualize Page

**Date:** 2026-05-25
**Scope:** Visualize page only. Classify and Benchmark pages are in progress and untouched.

---

## Summary

Four concerns are addressed in one cohesive pass:

1. Color palette: replace purple accent with sky blue
2. Layout: collapse navbar + context bar into a single compact top bar
3. Toggle label: rename "hints on/off" to "Annotate"
4. PSD explanation density: replace dense paragraph with progressive disclosure

All chart content (waveforms, PSD data, topoplot, epoch strip) is unchanged. Only colors, fonts, and layout structure change.

---

## 1. Color Tokens

Replace CSS custom property values in `frontend/app/globals.css`. Direct token replacement — no new theme classes.

| Token | Old value | New value |
|---|---|---|
| `--accent` | `#a78bfa` | `#38bdf8` |
| `--bg` | `#09090f` | `#040b15` |
| `--bg-card` | (add) | `#060e1c` |
| `--bg-surface` | (add) | `#060c18` |
| `--bg-topbar` | (add) | `#030a13` |

All borders stay `rgba(accent, 0.06–0.20)` — semi-transparent alpha so they adapt to any background variation. No hardcoded hex border colors.

Card shadows use three layered values (wiki: `visual-layered-shadows`):
```css
box-shadow:
  0 1px 2px rgba(0, 4, 16, 0.50),
  0 4px 8px rgba(0, 4, 16, 0.28),
  0 12px 24px rgba(0, 4, 16, 0.13);
```

The Annotate button uses the full 6-layer shadow anatomy (wiki: `visual-button-shadow-anatomy`):
```css
box-shadow:
  0 0 0 1px rgba(56, 189, 248, 0.24),
  inset 0 0 0 1px rgba(255, 255, 255, 0.04),
  inset 0 1px 0 rgba(255, 255, 255, 0.07),
  0 1px 2px rgba(0, 0, 0, 0.35),
  0 2px 4px rgba(0, 0, 0, 0.20),
  0 4px 8px rgba(0, 0, 0, 0.10);
```

---

## 2. Typography

Fonts change from Manrope + JetBrains Mono to system-ui sans-serif for all chrome. Monospace is retained only for numeric data values.

- **UI chrome** (labels, nav, button text, card titles): `system-ui, -apple-system, 'Segoe UI', sans-serif`
- **Numeric data** (PSD values, epoch count, accuracy scores): `font-variant-numeric: tabular-nums; font-feature-settings: 'zero' 1;` (wiki: `type-tabular-nums-for-data`, `type-slashed-zero`)
- Font smoothing: `-webkit-font-smoothing: antialiased` on body (wiki: `type-antialiased-on-retina`)
- Uppercase labels: `letter-spacing: 0.08–0.10em` (wiki: `type-letter-spacing-uppercase`)

The `@fontsource/manrope` and `@fontsource/jetbrains-mono` imports in `globals.css` are removed. Font variables (`--font-sans`, `--font-mono`) are updated to the system stack.

---

## 3. Layout — Compact Top Bar (Layout B)

The current two-element header (NavBar + ContextBar as a separate row below) collapses into a single 40px top bar containing everything inline.

**Current structure:**
```
[ NavBar: wordmark | nav links | annotate toggle ]
[ ContextBar: dataset | subject | run | class | speed ]
```

**New structure:**
```
[ 40px bar: wordmark | divider | nav | divider | dataset | subject | run | class | speed | annotate button ]
```

Nav order: **Visualize → Classify → Benchmark**

The `ContextBar` component is removed. Its fields (dataset, subject, run, class, speed control) are rendered directly inside `NavBar`. The `explain` toggle moves from `ContextBar` into the top bar as the `Annotate` button.

Context fields use a vertically stacked label/value pattern (two-line micro-layout per field), separated by 1px alpha dividers. Fields are: Dataset, Subject, Run, Class.

---

## 4. Toggle Label — "Annotate"

**Current:** A checkbox toggle with the label "Explain charts" and a floating sub-label below that reads "hints on" / "hints off".

**New:** A button-style element labeled "Annotate" with a glowing dot indicator (dot is lit when annotations are on).

```tsx
<button className="btn-annotate" onClick={() => onExplainChange(!explain)}>
  <span className={`ann-dot ${explain ? 'on' : ''}`} />
  Annotate
</button>
```

The floating "hints on/off" sub-label is removed entirely. The dot state communicates on/off.

---

## 5. PSD Explanation — Progressive Disclosure

**Current:** A single dense 5-sentence paragraph inside the `.explain` panel.

**New:** One short sentence visible by default when Annotate is on, with a "more ↓" inline link that expands the full explanation.

Each chart gets its own single-sentence summary:

- **Time Series:** varies by `class_label` — e.g. "C3 shows ERD in the mu band, expected for right-hand motor imagery."
- **PSD:** "Suppressed μ and β at C3 confirm contralateral motor cortex activation."
- **Topoplot:** varies by `freqBand` — e.g. "Focal ERD at C3, contralateral to imagined right-hand movement."

The full original explanation text moves behind the "more ↓" link, controlled by a local `useState` bool per chart card (toggled div, not `<details>`, so animation can be added later). The `.explain` panel border changes from `1px dashed var(--border-hi)` to `1px dashed rgba(56, 189, 248, 0.10)` to match the new palette.

Wiki rules applied: `ux-progressive-disclosure`, `ux-cognitive-load-reduce`, `ux-millers-chunking`.

---

## 6. What Does Not Change

- All chart rendering: waveform SVGs, PSD bar chart, topoplot grid, epoch strip
- All data: `psdExplain`, `tsExplain`, `topoExplain` text content (just restructured into short + long)
- Channel selection (C3, C4, Cz)
- Subject / run / class / dataset selectors and their logic
- Speed control
- Epoch strip behavior and trial count
- Classify page — untouched
- Benchmark page — untouched
- All FastAPI backend and data preprocessing pipeline

---

## Files Changed

| File | Change |
|---|---|
| `frontend/app/globals.css` | Token values, font stack, shadow variables, border alpha values |
| `frontend/app/visualize/page.tsx` | Explain text restructured to short + expandable; `explain` state wiring stays the same |
| `frontend/components/layout/NavBar.tsx` | Absorbs context fields + annotate button; becomes the single top bar |
| `frontend/components/layout/ContextBar.tsx` | Removed or gutted — its fields move into NavBar |

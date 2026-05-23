# eeg-mi-benchmark Phase 1 — Design Spec

**Date:** 2026-05-23
**Deadline:** June 17, 2026 (CNEW Munich)
**Status:** Approved for implementation

---

## Context

eeg-mi-benchmark is a browser-based EEG motor imagery analysis and visualization tool. It differentiates from Python-only tools like NeuralBench by being accessible to non-programmers — no local setup required, runs entirely in the browser against a deployed backend.

Phase 1 spans three weeks: signal visualizer (Week 1), CSP+LDA classifier (Week 2), and Riemannian geometry benchmark (Week 3). This spec covers the full Phase 1 architectural shell and the complete Week 1 visualizer. Week 2 and Week 3 panel content are intentionally left as named placeholders — their designs will be finalized after reading the relevant papers (Blankertz 2008 for CSP, Lotte 2018 for Riemannian), preserving the LEARN → BUILD sequence.

The `loader.py` MNE pipeline (PhysioNet data) already exists and is the starting point for the backend. The primary dataset switches to BNCI2014001 via MOABB.

---

## Architecture Overview

```
frontend/          Next.js 14+ App Router + TypeScript
  app/
    page.tsx       → redirects to /visualize
    visualize/     → Week 1: EEG signal viewer
    classify/      → Week 2 placeholder
    benchmark/     → Week 3 placeholder
  components/
    layout/        NavBar, ContextBar
    visualize/     TimeSeriesChart, PSDChart, TopoplotImage, ExplainToggle
    ui/            shared primitives (Button, Dropdown, Badge)
  lib/
    api.ts         typed fetch wrappers for FastAPI

backend/           FastAPI + MNE + MOABB + PyRiemann + Braindecode
  main.py          app entry, CORS config
  routers/
    data.py        /data endpoints (load, list subjects/runs)
    visualize.py   /visualize endpoints (timeseries, psd, topoplot)
    classify.py    /classify endpoints (Week 2)
    benchmark.py   /benchmark endpoints (Week 3)
  pipeline/
    loader.py      adapted from existing loader.py — BNCI2014001 via MOABB
    preprocessing.py  bandpass filter, epoch extraction
    topoplot.py    MNE topoplot → SVG renderer
```

**Data flow (Week 1):**
1. User selects dataset / subject / run in context bar, clicks Load
2. `GET /data/load?dataset=BNCI2014001&subject=1&run=4` → FastAPI loads via MOABB, epochs, returns metadata
3. `GET /visualize/timeseries?...` → returns C3/C4/Cz channel arrays + time axis as JSON
4. `GET /visualize/psd?...` → returns frequency + power arrays for PSD
5. `GET /visualize/topoplot?...` → returns MNE-rendered SVG string
6. Frontend renders Nivo charts + embeds SVG topoplot

---

## Visual Design

**Color palette (Cortex Purple):**
| Token | Value | Usage |
|-------|-------|-------|
| `bg-base` | `#09090f` | Page background |
| `bg-surface` | `#100f1a` | Card/panel backgrounds |
| `bg-raised` | `#141226` | Dropdown, input backgrounds |
| `border` | `#1e1a30` | All borders |
| `accent` | `#a78bfa` | Active nav, buttons, chart labels, signal highlights |
| `accent-muted` | `#c4b5fd` | Secondary channels, softer accents |
| `text-primary` | `#e2e8f0` | Body text |
| `text-muted` | `#64748b` | Labels, secondary text |
| `text-dim` | `#3a3650` | Inactive nav items, placeholder text |

**Typography direction:** Two-layer system — monospace for all data labels, channel names, frequency values, and axis ticks; clean sans-serif (Inter or Geist) for concept explainer prose. Exact font pairing, sizing scale, and Tailwind config to be finalized during the frontend-design skill session.

**EEG signal colors (Nivo theme):**
- C3: `#e2d9ff` (near-white lavender, primary)
- C4: `#c4b5fd` (accent-muted, secondary)
- Cz: `#7c6fff` (mid-purple, tertiary)
- Mu band shading: `#a78bfa1a` (accent at 10% opacity)
- Beta band shading: `#7c6fff1a`

---

## Layout

**Top navigation bar** (`NavBar`):
- Left: `eeg-mi-benchmark` wordmark in accent color, monospace
- Right: three nav links — Visualize | Classify | Benchmark
- Active link: accent color + 1px underline
- Inactive: `text-dim`, no underline

**Context bar** (`ContextBar`, below NavBar, full width):
- Inline dropdowns: Dataset ▾ | Subject ▾ | Run ▾
- Right side: Explain toggle (off by default) + Load button (accent fill)
- Dropdowns sourced from `GET /data/options` on mount
- Run dropdown shows descriptive label ("Imagined Left/Right Fist") not just run number

**Main content area**: full-width panels, no sidebar.

---

## Week 1 — Visualize Page

### Components

**TimeSeriesChart** (`components/visualize/TimeSeriesChart.tsx`):
- Library: Nivo `ResponsiveLine`
- Data: C3, C4, Cz channels over time (−0.5s → 2.0s)
- Channel toggle: C3/C4/Cz pill buttons above chart, click to show/hide a series
- Task shading: shaded background region marking imagery period (0–2s) vs baseline (−0.5–0s). Baseline = `#ffffff08`, task = `#a78bfa0d`
- Hover tooltip: exact µV value + timestamp, styled to match theme
- Explain caption (when toggle ON): "C3 and C4 sit over left and right motor cortex. When you imagine moving your right hand, C3 desynchronizes — mu/beta power drops. That drop is the motor imagery signal."

**PSDChart** (`components/visualize/PSDChart.tsx`):
- Library: Nivo `ResponsiveLine`
- Data: frequency (Hz) vs power (dB) for selected channel
- Band highlighting: shaded regions for Mu (8–12 Hz, `#a78bfa1a`) and Beta (13–30 Hz, `#7c6fff1a`), always visible
- Band labels: small `μ` and `β` annotations at top of shaded regions
- Hover tooltip: exact Hz + dB values
- Explain caption (when toggle ON): "The Mu rhythm (8–12 Hz) suppresses during motor imagery — that's event-related desynchronization (ERD). Beta (13–30 Hz) follows the same pattern."

**TopoplotImage** (`components/visualize/TopoplotImage.tsx`):
- Source: SVG string from `GET /visualize/topoplot`
- Rendered via `dangerouslySetInnerHTML` (SVG is server-controlled, no user input)
- MNE renders with custom matplotlib style: `#09090f` background, `#a78bfa` colormap highlight, white electrode labels
- Explain caption (when toggle ON): "Spatial distribution of EEG power across the scalp at the selected frequency. Brighter = more power at that location."

**ExplainToggle** (`components/layout/ContextBar.tsx`):
- Single toggle in context bar, off by default
- State lifted to page level, passed as prop to all three chart components
- When ON: each chart card reveals its caption strip below the visualization

### Backend endpoints (Week 1)

```
GET /data/options
  → { datasets: [...], subjects: [...], runs: [...] }

GET /data/load?dataset&subject&run
  → { n_epochs: int, sfreq: float, tmin: float, tmax: float, channels: [...] }

GET /visualize/timeseries?dataset&subject&run&epoch_idx
  → { times: [...], channels: { C3: [...], C4: [...], Cz: [...] } }

GET /visualize/psd?dataset&subject&run&channel
  → { freqs: [...], power: [...] }

GET /visualize/topoplot?dataset&subject&run&freq_band
  freq_band: "mu" (8–12 Hz) | "beta" (13–30 Hz)
  → { svg: "<svg>...</svg>" }
```

All endpoints return JSON. Topoplot endpoint generates SVG via MNE, styled with a custom rcParams dict defined in `pipeline/topoplot.py`.

---

## Week 2 — Classify Page (Placeholder)

Tab exists in nav. Page body:
- Title: "CSP + LDA Classification"
- Subtitle: "Coming in Week 2 — after reading Blankertz et al. 2008 (CSP) and Ang et al. 2008 (FBCSP)"
- No components, no backend wiring

Design of this page is intentionally deferred until the CSP papers are read. The architecture (how results are displayed, what the accuracy panel looks like) will be informed by understanding what CSP actually produces.

---

## Week 3 — Benchmark Page (Placeholder)

Tab exists in nav. Page body:
- Title: "Pipeline Benchmark"
- Subtitle: "Coming in Week 3 — after reading Lotte et al. 2018 (Riemannian geometry section)"
- No components, no backend wiring

---

## Chart Library

- **Nivo** (`@nivo/line`, `@nivo/bar`, `@nivo/heatmap`) for all standard charts
- **MNE server-side SVG** for topoplots — rendered in Python, served as SVG string, embedded in Next.js
- No Plotly dependency

---

## Deployment

- Frontend: Vercel (Next.js, automatic from GitHub push)
- Backend: Railway or Render (FastAPI via `uvicorn`)
- MOABB auto-downloads BNCI2014001 on first API call (~500MB); cached to `~/.moabb/` on the server. On Railway/Render, this means the first cold start after deploy will be slow — acceptable for a demo deployment
- CORS: backend allows Vercel deployment URL + localhost:3000

---

## Out of Scope for Phase 1

- Epoch navigation (prev/next trial) — deferred to Week 2 backend work
- Authentication or user accounts
- Real-time EEG streaming (Phase 3)
- Mobile responsiveness (desktop-first for CNEW demo)
- Dark/light theme toggle (dark only)

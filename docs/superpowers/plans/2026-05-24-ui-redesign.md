# UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the EEG MI benchmark frontend from bare unstyled HTML to a polished "Minimal Terminal" research instrument aesthetic using the existing Cortex Purple palette, Fira Code font, and frontend-design principles.

**Architecture:** All changes are CSS/Tailwind and React component edits. No new dependencies — Fira Code loads via `next/font/google`. Animations live in `globals.css` as named keyframes applied via utility classes. The ContextBar gets a full rewrite; all other components receive targeted polish.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4 (`@tailwindcss/postcss`), Fira Code (Google Fonts via `next/font`), Nivo charts (unchanged)

---

## File Map

| File | Change |
|---|---|
| `frontend/app/layout.tsx` | Import and apply Fira Code via `next/font/google` |
| `frontend/app/globals.css` | Remove dead font vars, add noise texture, ghost-pulse keyframes, chart-fade-in keyframes |
| `frontend/tailwind.config.ts` | Update `fontFamily.mono`, add `boxShadow.load` |
| `frontend/components/layout/NavBar.tsx` | Tighten font size to `text-xs` throughout |
| `frontend/components/layout/ContextBar.tsx` | Full rewrite: fused selector group, pill toggle, full-height Load |
| `frontend/app/visualize/page.tsx` | Replace empty/loading states with ghost skeleton panels |
| `frontend/components/visualize/TimeSeriesChart.tsx` | Editorial header rule, channel btn polish, fade-in class |
| `frontend/components/visualize/PSDChart.tsx` | Editorial header rule, explain annotation polish, fade-in class |
| `frontend/components/visualize/TopoplotImage.tsx` | Editorial header rule, band btn polish, fade-in class |
| `frontend/app/classify/page.tsx` | Structured placeholder layout |
| `frontend/app/benchmark/page.tsx` | Structured placeholder layout |

---

## Task 1: Load Fira Code font

**Files:**
- Modify: `frontend/app/layout.tsx`
- Modify: `frontend/app/globals.css`
- Modify: `frontend/tailwind.config.ts`

- [ ] **Step 1: Update `layout.tsx` to import and apply Fira Code**

Replace the entire file:

```tsx
import type { Metadata } from 'next'
import { Fira_Code } from 'next/font/google'
import './globals.css'
import NavBar from '@/components/layout/NavBar'

const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'eeg-mi-benchmark',
  description: 'EEG Motor Imagery Analysis and Visualization',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={firaCode.variable} suppressHydrationWarning>
      <body className="bg-base text-text-primary min-h-screen">
        <NavBar />
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Remove dead font variable declarations from `globals.css`**

The current `:root` block declares `--font-geist-sans` and `--font-geist-mono` as string values (not loaded fonts), causing Times New Roman fallback. Remove it. Replace the entire file with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #09090f;
  color: #e2e8f0;
}

* {
  box-sizing: border-box;
}
```

- [ ] **Step 3: Update `tailwind.config.ts` to use the CSS variable**

Replace the `fontFamily` block inside `theme.extend` and add `boxShadow`:

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        base: '#09090f',
        surface: '#100f1a',
        raised: '#141226',
        border: '#1e1a30',
        accent: '#a78bfa',
        'accent-muted': '#c4b5fd',
        'text-primary': '#e2e8f0',
        'text-muted': '#64748b',
        'text-dim': '#3a3650',
      },
      fontFamily: {
        mono: ['var(--font-mono)', 'monospace'],
        sans: ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        load: '0 0 12px rgba(167, 139, 250, 0.4)',
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 4: Start the dev server and verify Fira Code loads**

```bash
cd frontend && npm run dev
```

Open http://localhost:3000. The NavBar text, dropdown labels, and all monospace text should render in Fira Code — recognizable by its slightly rounded terminals and programmer-style letterforms. If you still see Times New Roman, check that `firaCode.variable` is on `<html>` and that `--font-mono` is referenced in `tailwind.config.ts`.

- [ ] **Step 5: Commit**

```bash
git add frontend/app/layout.tsx frontend/app/globals.css frontend/tailwind.config.ts
git commit -m "feat: load Fira Code via next/font, fix Times New Roman fallback"
```

---

## Task 2: Background noise texture

**Files:**
- Modify: `frontend/app/globals.css`

- [ ] **Step 1: Add noise grain texture to `globals.css`**

Append after the existing rules:

```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-size: 200px 200px;
}
```

- [ ] **Step 2: Verify the texture doesn't visually dominate**

Reload http://localhost:3000. The background should still look like `#09090f` at a glance. The grain is only noticeable when you deliberately look for it — it should not read as a pattern or checkerboard. If it's too visible, reduce opacity to `0.02`.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/globals.css
git commit -m "feat: add subtle noise grain texture to base background"
```

---

## Task 3: NavBar polish

**Files:**
- Modify: `frontend/components/layout/NavBar.tsx`

- [ ] **Step 1: Tighten font size and letter-spacing on NavBar**

Replace the entire file:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/visualize', label: 'Visualize' },
  { href: '/classify', label: 'Classify' },
  { href: '/benchmark', label: 'Benchmark' },
]

export default function NavBar() {
  const pathname = usePathname()
  return (
    <nav className="bg-surface border-b border-border px-6 py-3 flex justify-between items-center">
      <span className="font-mono font-bold text-accent tracking-widest text-xs uppercase">
        eeg-mi-benchmark
      </span>
      <div className="flex gap-6">
        {NAV_LINKS.map(({ href, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`text-xs font-mono tracking-wider transition-colors ${
                active
                  ? 'text-accent border-b border-accent pb-0.5'
                  : 'text-text-dim hover:text-text-muted'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Verify NavBar visually**

Navigate between /visualize, /classify, /benchmark. Active link should have a bottom accent border. Inactive links should be dim and brighten on hover. All text in Fira Code.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/layout/NavBar.tsx
git commit -m "feat: polish NavBar typography and active link indicator"
```

---

## Task 4: ContextBar redesign

**Files:**
- Modify: `frontend/components/layout/ContextBar.tsx`

- [ ] **Step 1: Rewrite `ContextBar.tsx`**

Replace the entire file:

```tsx
'use client'

import { useState } from 'react'
import type { DataOptions } from '@/lib/types'

interface Props {
  options: DataOptions
  explain: boolean
  onExplainChange: (v: boolean) => void
  onLoad: (dataset: string, subject: number, run: string) => void
}

function SelectorCell({
  label,
  children,
  hasBorderRight = true,
}: {
  label: string
  children: React.ReactNode
  hasBorderRight?: boolean
}) {
  return (
    <div
      className={`flex flex-col justify-center ${hasBorderRight ? 'border-r border-border' : ''}`}
      style={{ padding: '4px 10px' }}
    >
      <span
        className="text-text-dim font-mono uppercase block"
        style={{ fontSize: '7px', letterSpacing: '0.15em', marginBottom: '2px' }}
      >
        {label}
      </span>
      {children}
    </div>
  )
}

function SelectValue({
  value,
  onChange,
  children,
}: {
  value: string | number
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <div className="relative flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-text-primary font-mono appearance-none pr-4 focus:outline-none cursor-pointer"
        style={{ fontSize: '11px' }}
      >
        {children}
      </select>
      <span
        className="absolute right-0 text-text-dim pointer-events-none"
        style={{ fontSize: '9px' }}
      >
        ▾
      </span>
    </div>
  )
}

export default function ContextBar({ options, explain, onExplainChange, onLoad }: Props) {
  const [dataset, setDataset] = useState(options.datasets[0]?.value ?? '')
  const [subject, setSubject] = useState(String(options.subjects[0] ?? 1))
  const [run, setRun] = useState(options.runs[0]?.value ?? '')

  return (
    <div className="bg-surface border-b border-border px-4 flex items-stretch" style={{ minHeight: '44px' }}>
      {/* Zone 1: Fused selector group */}
      <div
        className="flex items-stretch my-2 bg-raised border border-border overflow-hidden"
        style={{ borderRadius: '3px' }}
      >
        <SelectorCell label="Dataset">
          <SelectValue value={dataset} onChange={setDataset}>
            {options.datasets.map((d) => (
              <option key={d.value} value={d.value} className="bg-raised">
                {d.label}
              </option>
            ))}
          </SelectValue>
        </SelectorCell>

        <SelectorCell label="Subject">
          <SelectValue value={subject} onChange={setSubject}>
            {options.subjects.map((s) => (
              <option key={s} value={String(s)} className="bg-raised">
                0{s}
              </option>
            ))}
          </SelectValue>
        </SelectorCell>

        <SelectorCell label="Run" hasBorderRight={false}>
          <SelectValue value={run} onChange={setRun}>
            {options.runs.map((r) => (
              <option key={r.value} value={r.value} className="bg-raised">
                {r.label}
              </option>
            ))}
          </SelectValue>
        </SelectorCell>
      </div>

      {/* Zone 2: Explain toggle */}
      <div className="flex items-center gap-2 ml-4">
        <button
          role="switch"
          aria-label="explain"
          aria-checked={explain}
          onClick={() => onExplainChange(!explain)}
          className={`relative flex-shrink-0 transition-colors ${explain ? 'bg-accent' : 'bg-border'}`}
          style={{ width: '28px', height: '15px', borderRadius: '99px' }}
        >
          <span
            className="absolute rounded-full bg-white transition-transform"
            style={{
              width: '11px',
              height: '11px',
              top: '2px',
              transform: explain ? 'translateX(15px)' : 'translateX(2px)',
            }}
          />
        </button>
        <span
          className="text-text-dim font-mono uppercase"
          style={{ fontSize: '9px', letterSpacing: '0.15em' }}
        >
          Explain
        </span>
      </div>

      {/* Flex spacer */}
      <div className="flex-1" />

      {/* Zone 3: Load button — full height, flush right */}
      <button
        onClick={() => onLoad(dataset, Number(subject), run)}
        className="bg-accent text-base font-mono font-bold uppercase self-stretch transition-shadow hover:shadow-load"
        style={{ fontSize: '9px', letterSpacing: '0.15em', padding: '0 28px' }}
      >
        Load
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Verify ContextBar at http://localhost:3000/visualize**

Check that:
- Three selector cells are visible as one fused group with internal dividers
- Each cell has a dim label above and the value below with `▾`
- Pill toggle is left of EXPLAIN label
- Large gap separates the toggle from the Load button
- Load button spans full toolbar height and glows on hover

- [ ] **Step 3: Commit**

```bash
git add frontend/components/layout/ContextBar.tsx
git commit -m "feat: redesign ContextBar with fused selector group and full-height Load button"
```

---

## Task 5: Ghost skeleton empty and loading states

**Files:**
- Modify: `frontend/app/globals.css`
- Modify: `frontend/app/visualize/page.tsx`

- [ ] **Step 1: Add ghost-pulse keyframes to `globals.css`**

Append to `globals.css`:

```css
@keyframes ghost-pulse {
  from { opacity: 0.4; }
  to   { opacity: 0.7; }
}

.ghost-panel {
  animation: ghost-pulse 2.5s ease-in-out infinite alternate;
}
```

- [ ] **Step 2: Replace the empty and loading states in `visualize/page.tsx`**

Find the block that renders when `!timeseries && !loading && !error` and the `loading &&` block. Replace both with a unified ghost skeleton that handles both states. The diff to the relevant JSX section (inside the `<div className="px-6 py-5 flex flex-col gap-4">`):

Remove:
```tsx
{loading && (
  <div className="font-mono text-text-dim text-xs text-center py-8">
    Loading EEG data...
  </div>
)}
```

And remove:
```tsx
{!timeseries && !loading && !error && (
  <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
    <p className="font-mono text-text-dim text-sm">Select a dataset, subject, and run -- then click Load.</p>
    <p className="font-mono text-text-dim text-xs">BNCI2014001 downloads ~500MB on first load. Subsequent loads are instant.</p>
  </div>
)}
```

Add in their place (positioned before the `{timeseries && ...}` block):

```tsx
{!timeseries && !error && (
  <div className="flex flex-col gap-4">
    <div
      className="ghost-panel border border-dashed border-border bg-surface rounded flex items-center justify-center"
      style={{ minHeight: '200px' }}
    >
      <span
        className="text-text-dim font-mono uppercase"
        style={{ fontSize: '9px', letterSpacing: '0.2em' }}
      >
        {loading ? '── loading ──' : 'Time Series'}
      </span>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div
        className="ghost-panel border border-dashed border-border bg-surface rounded flex items-center justify-center"
        style={{ minHeight: '180px' }}
      >
        <span
          className="text-text-dim font-mono uppercase"
          style={{ fontSize: '9px', letterSpacing: '0.2em' }}
        >
          {loading ? '── loading ──' : 'PSD'}
        </span>
      </div>
      <div
        className="ghost-panel border border-dashed border-border bg-surface rounded flex items-center justify-center"
        style={{ minHeight: '180px' }}
      >
        <span
          className="text-text-dim font-mono uppercase"
          style={{ fontSize: '9px', letterSpacing: '0.2em' }}
        >
          {loading ? '── loading ──' : 'Topography'}
        </span>
      </div>
    </div>
    {!loading && (
      <p
        className="text-center text-text-dim font-mono"
        style={{ fontSize: '10px', letterSpacing: '0.1em', marginTop: '8px' }}
      >
        ── select a dataset, subject, and run -- then load ──
      </p>
    )}
  </div>
)}
```

- [ ] **Step 3: Verify ghost panels at http://localhost:3000/visualize**

The page should now show three dashed ghost panels (one full-width, two in a grid below) slowly pulsing in opacity. The hint text should appear below. When you click Load, the panels should show `── loading ──` while fetching.

- [ ] **Step 4: Commit**

```bash
git add frontend/app/globals.css frontend/app/visualize/page.tsx
git commit -m "feat: add ghost skeleton empty and loading states with pulse animation"
```

---

## Task 6: Chart panel polish and fade-in animation

**Files:**
- Modify: `frontend/app/globals.css`
- Modify: `frontend/components/visualize/TimeSeriesChart.tsx`
- Modify: `frontend/components/visualize/PSDChart.tsx`
- Modify: `frontend/components/visualize/TopoplotImage.tsx`

- [ ] **Step 1: Add chart fade-in keyframes to `globals.css`**

Append to `globals.css`:

```css
@keyframes chart-fade-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chart-panel-animate {
  animation: chart-fade-in 300ms ease-out both;
}
```

- [ ] **Step 2: Polish `TimeSeriesChart.tsx`**

Replace the entire file:

```tsx
'use client'

import { useState, useMemo } from 'react'
import { ResponsiveLine } from '@nivo/line'
import type { TimeseriesData, ChannelName } from '@/lib/types'

const CHANNEL_COLORS: Record<ChannelName, string> = {
  C3: '#e2d9ff',
  C4: '#c4b5fd',
  Cz: '#7c6fff',
}

const NIVO_THEME = {
  background: '#100f1a',
  textColor: '#64748b',
  fontSize: 10,
  fontFamily: 'monospace',
  axis: {
    domain: { line: { stroke: '#1e1a30', strokeWidth: 1 } },
    ticks: { text: { fill: '#64748b', fontSize: 9 } },
    legend: { text: { fill: '#a78bfa', fontSize: 10 } },
  },
  grid: { line: { stroke: '#1e1a30', strokeWidth: 0.5 } },
  crosshair: { line: { stroke: '#a78bfa', strokeWidth: 1, strokeOpacity: 0.4 } },
  tooltip: {
    container: {
      background: '#141226',
      color: '#e2e8f0',
      fontSize: 11,
      borderRadius: '4px',
      border: '1px solid #1e1a30',
    },
  },
}

interface Props {
  data: TimeseriesData
  explain: boolean
}

export default function TimeSeriesChart({ data, explain }: Props) {
  const [visible, setVisible] = useState<Record<ChannelName, boolean>>({
    C3: true, C4: true, Cz: true,
  })

  const nivoData = useMemo(() =>
    (Object.keys(CHANNEL_COLORS) as ChannelName[])
      .filter((ch) => visible[ch])
      .map((ch) => ({
        id: ch,
        color: CHANNEL_COLORS[ch],
        data: data.times.map((t, i) => ({ x: t, y: data.channels[ch][i] })),
      })),
    [data, visible]
  )

  const toggle = (ch: ChannelName) =>
    setVisible((prev) => ({ ...prev, [ch]: !prev[ch] }))

  return (
    <div className="chart-panel-animate bg-surface border border-border rounded p-4" style={{ animationDelay: '0ms' }}>
      <div className="flex items-center gap-3 mb-3">
        <span
          className="font-mono text-accent uppercase border-l border-accent pl-2"
          style={{ fontSize: '9px', letterSpacing: '0.18em' }}
        >
          EEG Time Series
        </span>
        <div className="flex gap-2 ml-1">
          {(Object.keys(CHANNEL_COLORS) as ChannelName[]).map((ch) => (
            <button
              key={ch}
              onClick={() => toggle(ch)}
              className={`font-mono border transition-colors ${
                visible[ch]
                  ? 'border-accent text-accent bg-accent/10'
                  : 'border-border text-text-dim'
              }`}
              style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '2px' }}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 160 }}>
        <ResponsiveLine
          data={nivoData}
          theme={NIVO_THEME}
          margin={{ top: 8, right: 16, bottom: 32, left: 48 }}
          xScale={{ type: 'linear', min: data.times[0], max: data.times[data.times.length - 1] }}
          yScale={{ type: 'linear', stacked: false }}
          axisBottom={{
            legend: 'time (s)',
            legendOffset: 28,
            legendPosition: 'middle',
            tickValues: 6,
          }}
          axisLeft={{
            legend: 'µV',
            legendOffset: -40,
            legendPosition: 'middle',
            tickValues: 4,
          }}
          colors={(d) => CHANNEL_COLORS[d.id as ChannelName]}
          lineWidth={1.5}
          enablePoints={false}
          enableGridX={false}
          crosshairType="x"
          useMesh={true}
          layers={[
            ({ xScale, innerHeight }: any) => (
              <rect
                x={xScale(0)}
                y={0}
                width={xScale(data.times[data.times.length - 1]) - xScale(0)}
                height={innerHeight}
                fill="#a78bfa"
                fillOpacity={0.04}
              />
            ),
            'grid', 'axes', 'lines', 'crosshair', 'mesh', 'legends',
          ]}
        />
      </div>

      {explain && (
        <div
          className="mt-3 font-mono text-text-muted leading-relaxed border-l border-accent/25 pl-2"
          style={{ fontSize: '10px', lineHeight: '1.65' }}
        >
          C3 and C4 sit over left and right motor cortex. When you imagine moving your right hand,
          C3 desynchronizes -- mu/beta power drops. The shaded region marks the imagery period (0-2s).
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Polish `PSDChart.tsx`**

Replace the entire file:

```tsx
'use client'

import { useMemo } from 'react'
import { ResponsiveLine } from '@nivo/line'
import type { PSDData } from '@/lib/types'

const NIVO_THEME = {
  background: '#100f1a',
  textColor: '#64748b',
  fontSize: 10,
  fontFamily: 'monospace',
  axis: {
    domain: { line: { stroke: '#1e1a30', strokeWidth: 1 } },
    ticks: { text: { fill: '#64748b', fontSize: 9 } },
    legend: { text: { fill: '#a78bfa', fontSize: 10 } },
  },
  grid: { line: { stroke: '#1e1a30', strokeWidth: 0.5 } },
  crosshair: { line: { stroke: '#a78bfa', strokeWidth: 1, strokeOpacity: 0.4 } },
  tooltip: {
    container: {
      background: '#141226',
      color: '#e2e8f0',
      fontSize: 11,
      borderRadius: '4px',
      border: '1px solid #1e1a30',
    },
  },
}

function BandLayer({ xScale, innerHeight, fmin, fmax, color, label }: any) {
  const x1 = xScale(fmin)
  const x2 = xScale(fmax)
  const w = x2 - x1
  return (
    <g>
      <rect x={x1} y={0} width={w} height={innerHeight} fill={color} fillOpacity={0.12} />
      <text x={x1 + w / 2} y={10} textAnchor="middle" fill={color} fontSize={10} fontFamily="monospace">
        {label}
      </text>
    </g>
  )
}

interface Props {
  data: PSDData
  explain: boolean
}

export default function PSDChart({ data, explain }: Props) {
  const nivoData = useMemo(() => [{
    id: 'psd',
    color: '#a78bfa',
    data: data.freqs.map((f, i) => ({ x: f, y: data.power[i] })),
  }], [data])

  return (
    <div className="chart-panel-animate bg-surface border border-border rounded p-4" style={{ animationDelay: '80ms' }}>
      <div className="flex items-center gap-3 mb-3">
        <span
          className="font-mono text-accent uppercase border-l border-accent pl-2"
          style={{ fontSize: '9px', letterSpacing: '0.18em' }}
        >
          Power Spectral Density
        </span>
        <div className="flex gap-3 ml-1 items-center" aria-label="frequency band legend">
          <span className="font-mono" style={{ color: '#a78bfa', fontSize: '9px' }}>
            μ <span className="text-text-muted">8-12 Hz</span>
          </span>
          <span className="font-mono" style={{ color: '#7c6fff', fontSize: '9px' }}>
            β <span className="text-text-muted">13-30 Hz</span>
          </span>
        </div>
      </div>

      <div style={{ height: 140 }}>
        <ResponsiveLine
          data={nivoData}
          theme={NIVO_THEME}
          margin={{ top: 16, right: 16, bottom: 32, left: 48 }}
          xScale={{ type: 'linear', min: data.freqs[0], max: data.freqs[data.freqs.length - 1] }}
          yScale={{ type: 'linear', stacked: false }}
          axisBottom={{
            legend: 'frequency (Hz)',
            legendOffset: 28,
            legendPosition: 'middle',
            tickValues: [4, 8, 13, 20, 30, 40],
          }}
          axisLeft={{
            legend: 'dB',
            legendOffset: -40,
            legendPosition: 'middle',
            tickValues: 4,
          }}
          colors={['#a78bfa']}
          lineWidth={1.5}
          enablePoints={false}
          enableGridX={false}
          crosshairType="x"
          useMesh={true}
          layers={[
            ({ xScale, innerHeight }: any) => (
              <BandLayer xScale={xScale} innerHeight={innerHeight}
                fmin={8} fmax={12} color="#a78bfa" label="μ" />
            ),
            ({ xScale, innerHeight }: any) => (
              <BandLayer xScale={xScale} innerHeight={innerHeight}
                fmin={13} fmax={30} color="#7c6fff" label="β" />
            ),
            'grid', 'axes', 'lines', 'crosshair', 'mesh',
          ]}
        />
      </div>

      {explain && (
        <div
          className="mt-3 font-mono text-text-muted border-l border-accent/25 pl-2"
          style={{ fontSize: '10px', lineHeight: '1.65' }}
        >
          The Mu rhythm (8-12 Hz) suppresses during motor imagery -- that is event-related
          desynchronization (ERD). Beta (13-30 Hz) follows the same pattern and rebounds
          after movement ends (event-related synchronization, ERS).
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Polish `TopoplotImage.tsx`**

Replace the entire file:

```tsx
'use client'

import type { FreqBand } from '@/lib/types'

interface Props {
  svg: string
  explain: boolean
  freqBand: FreqBand
  onBandChange: (band: FreqBand) => void
}

export default function TopoplotImage({ svg, explain, freqBand, onBandChange }: Props) {
  return (
    <div className="chart-panel-animate bg-surface border border-border rounded p-4" style={{ animationDelay: '160ms' }}>
      <div className="flex items-center gap-3 mb-3">
        <span
          className="font-mono text-accent uppercase border-l border-accent pl-2"
          style={{ fontSize: '9px', letterSpacing: '0.18em' }}
        >
          Topography
        </span>
        <div className="flex gap-2 ml-1">
          {(['mu', 'beta'] as FreqBand[]).map((band) => (
            <button
              key={band}
              onClick={() => onBandChange(band)}
              className={`font-mono border transition-colors ${
                freqBand === band
                  ? 'border-accent text-accent bg-accent/10'
                  : 'border-border text-text-dim'
              }`}
              style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '2px' }}
            >
              {band === 'mu' ? 'μ (8-12 Hz)' : 'β (13-30 Hz)'}
            </button>
          ))}
        </div>
      </div>

      <div
        className="flex justify-center"
        dangerouslySetInnerHTML={{ __html: svg }}
      />

      {explain && (
        <div
          className="mt-3 font-mono text-text-muted border-l border-accent/25 pl-2"
          style={{ fontSize: '10px', lineHeight: '1.65' }}
        >
          Spatial distribution of EEG power across the scalp at the selected frequency band.
          Brighter regions indicate more power. During right-hand motor imagery, you should see
          a dark patch over C3 (left motor cortex) -- that is the ERD.
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Load data and verify chart animations**

In the browser, click Load with a dataset selected. The three chart panels should fade in with a slight upward drift, staggered: TIME SERIES first (0ms), PSD second (80ms), TOPOGRAPHY third (160ms). Each panel header should have a thin left accent border rule.

- [ ] **Step 6: Commit**

```bash
git add frontend/app/globals.css frontend/components/visualize/TimeSeriesChart.tsx frontend/components/visualize/PSDChart.tsx frontend/components/visualize/TopoplotImage.tsx
git commit -m "feat: polish chart panels with editorial header rule and staggered fade-in animation"
```

---

## Task 7: Placeholder pages

**Files:**
- Modify: `frontend/app/classify/page.tsx`
- Modify: `frontend/app/benchmark/page.tsx`

- [ ] **Step 1: Rewrite `classify/page.tsx`**

Replace the entire file:

```tsx
export default function ClassifyPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[60vh] gap-2">
      <span
        className="text-text-dim font-mono uppercase"
        style={{ fontSize: '9px', letterSpacing: '0.2em' }}
      >
        -- Week 2 --
      </span>
      <h1
        className="font-mono text-accent"
        style={{ fontSize: '18px', letterSpacing: '0.05em' }}
      >
        CSP + LDA Classification
      </h1>
      <p className="text-text-dim font-mono" style={{ fontSize: '11px' }}>
        Coming soon
      </p>
      <div className="border-l border-border mt-4 pl-3 flex flex-col gap-1">
        <span className="text-text-dim font-mono" style={{ fontSize: '10px', fontStyle: 'italic' }}>
          Blankertz et al. 2008 (CSP)
        </span>
        <span className="text-text-dim font-mono" style={{ fontSize: '10px', fontStyle: 'italic' }}>
          Ang et al. 2008 (FBCSP)
        </span>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Rewrite `benchmark/page.tsx`**

Replace the entire file:

```tsx
export default function BenchmarkPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[60vh] gap-2">
      <span
        className="text-text-dim font-mono uppercase"
        style={{ fontSize: '9px', letterSpacing: '0.2em' }}
      >
        -- Week 3 --
      </span>
      <h1
        className="font-mono text-accent"
        style={{ fontSize: '18px', letterSpacing: '0.05em' }}
      >
        Pipeline Benchmark
      </h1>
      <p className="text-text-dim font-mono" style={{ fontSize: '11px' }}>
        Coming soon
      </p>
      <div className="border-l border-border mt-4 pl-3 flex flex-col gap-1">
        <span className="text-text-dim font-mono" style={{ fontSize: '10px', fontStyle: 'italic' }}>
          Lotte et al. 2018 (Riemannian geometry section)
        </span>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Verify placeholder pages**

Navigate to /classify and /benchmark. Each page should show:
- Dim uppercase week label at top
- Accent-colored page title
- Dim "Coming soon" line
- Left-bordered citation block with italic references

- [ ] **Step 4: Commit**

```bash
git add frontend/app/classify/page.tsx frontend/app/benchmark/page.tsx
git commit -m "feat: redesign placeholder pages with structured citation layout"
```

---

## Final Verification

- [ ] Navigate all three pages. No Times New Roman anywhere.
- [ ] /visualize empty state: three ghost panels pulsing slowly, hint text below.
- [ ] Load data: panels replace ghosts with staggered fade-in. Chart headers have accent left border.
- [ ] Explain toggle: pill lights up, annotation appears with left border beneath each chart.
- [ ] Load button glows on hover.
- [ ] Background grain visible if you look for it, invisible otherwise.
- [ ] /classify and /benchmark: structured placeholder with citation block.

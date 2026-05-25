# Design Refresh — MI·Bench Visualize Page

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply sky-blue palette, compact top bar layout, "Annotate" toggle, and progressive-disclosure PSD explanation to the Visualize page without touching Classify or Benchmark.

**Architecture:** CSS tokens are replaced directly in `globals.css`. NavBar absorbs the ContextBar fields via a lightweight React context (NavSlotContext) — NavBar reads a slot node from context and renders it when present; non-visualize pages leave the slot empty and NavBar renders its default form. ContextBar.tsx is deleted. The Visualize page provides the slot content (TopBar) and owns all session state.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, CSS custom properties.

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `frontend/app/globals.css` | Replace color tokens, font stack, card/shadow/border styles |
| Modify | `frontend/app/layout.tsx` | Remove @fontsource imports; wrap body in NavSlotProvider |
| Create | `frontend/lib/nav-slot-context.tsx` | Context + provider for injecting slot content into NavBar |
| Modify | `frontend/components/layout/NavBar.tsx` | Render slot when present; update wordmark + nav order + compact style |
| Create | `frontend/components/layout/TopBar.tsx` | Compact unified bar: wordmark + nav + dropdowns + Annotate button |
| Modify | `frontend/app/visualize/page.tsx` | Replace `<ContextBar>` with `<NavSlot><TopBar …/></NavSlot>`; update explain texts; update `.explain` CSS class references |
| Delete | `frontend/components/layout/ContextBar.tsx` | Replaced by TopBar |

---

## Task 1: Replace CSS Design Tokens

**Files:**
- Modify: `frontend/app/globals.css`

- [ ] **Step 1: Replace root color + font tokens**

In the `:root` block (lines 8–54), make these exact replacements:

```css
:root {
  --bg: #040b15;
  --bg-2: #060e1c;
  --card: #070d1a;
  --card-hi: #070d1a99;
  --border: rgba(56, 189, 248, 0.08);
  --border-hi: rgba(56, 189, 248, 0.16);
  --accent: #38bdf8;
  --accent-muted: #7dd3fc;
  --accent-dim: #0369a1;
  --text: #e2e8f0;
  --text-muted: #64748b;
  --text-dim: #94a3b8;
  --c3: #38bdf8;
  --c4: #7dd3fc;
  --cz: #0ea5e9;
  --mu-band: rgba(56, 189, 248, 0.10);
  --beta-band: rgba(14, 165, 233, 0.10);

  --mono: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
  --sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  --display: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;

  /* Chart tokens */
  --chart-c3: #38bdf8;
  --chart-c4: #7dd3fc;
  --chart-cz: #0ea5e9;
  --chart-axis: #334155;
  --chart-axis-label: #64748b;
  --chart-grid: rgba(56, 189, 248, 0.06);
  --chart-mu-band: var(--mu-band);
  --chart-beta-band: var(--beta-band);
  --chart-cue: var(--accent);
  --chart-zero: rgba(56, 189, 248, 0.08);
  --chart-glow: drop-shadow(0 0 2px rgba(56, 189, 248, 0.45));
  --chart-psd-line: #38bdf8;
  --chart-psd-fill: #38bdf8;

  /* Topoplot tokens */
  --topo-bg: #070d1a;
  --topo-outline: #475569;
  --topo-electrode-fill: #040b15;
  --topo-electrode-stroke: #e2e8f0;
  --topo-label: #cbd5e1;
  --topo-cb-stroke: #334155;
  --topo-cb-label: #94a3b8;
}
```

- [ ] **Step 2: Replace `body` background radial gradients**

```css
body {
  background:
    radial-gradient(1200px 600px at 80% -10%, rgba(56, 189, 248, 0.05), transparent 60%),
    radial-gradient(900px 500px at -10% 100%, rgba(14, 165, 233, 0.03), transparent 60%),
    var(--bg);
  min-height: 100vh;
}
```

- [ ] **Step 3: Update `.nav` to compact top bar style**

Replace the entire `.nav` block:

```css
.nav {
  display: flex;
  align-items: center;
  gap: 0;
  height: 40px;
  padding: 0 16px;
  background: #030a13;
  border-bottom: 1px solid rgba(56, 189, 248, 0.07);
  position: sticky;
  top: 0;
  z-index: 20;
}
```

- [ ] **Step 4: Update wordmark + nav-tab styles**

```css
.wordmark {
  font-family: var(--sans);
  display: flex;
  align-items: center;
  gap: 0;
  margin-right: 14px;
  flex-shrink: 0;
}
.wordmark-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: -0.03em;
}
/* Remove .wordmark-tag — no longer used */

.nav-tabs {
  display: flex;
  gap: 1px;
  margin-left: 8px;
}

.nav-tab {
  font-family: var(--sans);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.03em;
  color: var(--text-muted);
  padding: 5px 10px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: color 0.15s, background 0.15s;
}
.nav-tab:hover { color: var(--text-dim); background: rgba(56, 189, 248, 0.05); }
.nav-tab.active {
  color: var(--accent);
  background: rgba(56, 189, 248, 0.09);
  box-shadow: none;
}
```

- [ ] **Step 5: Update `.card` shadow and border (wiki: visual-layered-shadows, visual-border-alpha-colors)**

```css
.card {
  background: var(--card);
  border: 1px solid rgba(56, 189, 248, 0.08);
  border-radius: 10px;
  overflow: hidden;
  box-shadow:
    0 1px 2px rgba(0, 4, 16, 0.50),
    0 4px 8px rgba(0, 4, 16, 0.28),
    0 12px 24px rgba(0, 4, 16, 0.13);
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(56, 189, 248, 0.025);
  border-bottom: 1px solid rgba(56, 189, 248, 0.06);
}

.card-title {
  margin: 0;
  font-size: 9px;
  font-weight: 700;
  font-family: var(--sans);
  color: var(--text-muted);
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.card-meta {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 2px;
}

.card-body { padding: 11px 12px; }
```

- [ ] **Step 6: Update `.explain` panel (annotation style)**

```css
.explain {
  display: flex;
  gap: 10px;
  padding: 8px 12px 12px;
  border-top: 1px dashed rgba(56, 189, 248, 0.10);
  background: transparent;
  color: var(--text-dim);
  font-size: 9.5px;
  line-height: 1.55;
  animation: explainIn .2s ease-out;
}
.explain svg { color: var(--accent); flex-shrink: 0; margin-top: 2px; }
.explain p { margin: 0; }
.explain a { color: var(--accent); text-underline-offset: 2px; }
```

- [ ] **Step 7: Update `.load-btn` and `.dropdown-btn`**

```css
/* load button — wiki: visual-button-shadow-anatomy */
.load-btn {
  display: flex; align-items: center; gap: 7px;
  padding: 0 14px;
  height: 32px;
  background: linear-gradient(to bottom, rgba(56,189,248,0.16), rgba(56,189,248,0.09));
  color: var(--text);
  font-family: var(--sans);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  border-radius: 6px;
  flex-shrink: 0;
  box-shadow:
    0 0 0 1px rgba(56, 189, 248, 0.24),
    inset 0 0 0 1px rgba(255, 255, 255, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.07),
    0 1px 2px rgba(0, 0, 0, 0.35),
    0 2px 4px rgba(0, 0, 0, 0.20),
    0 4px 8px rgba(0, 0, 0, 0.10);
  text-shadow: 0 1px 1px rgba(0,0,0,0.2);
  transition: opacity 0.15s;
}
.load-btn:hover:not(:disabled) { opacity: 0.88; }
.load-btn.loading { background: var(--card); color: var(--text-dim); box-shadow: 0 0 0 1px rgba(56,189,248,0.12); }

.dropdown-btn {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 10px;
  background: rgba(56, 189, 248, 0.04);
  border: 1px solid rgba(56, 189, 248, 0.12);
  border-radius: 6px;
  font-size: 11px;
  height: 32px;
  transition: border-color .15s;
}
.dropdown-btn:hover:not(:disabled) { border-color: rgba(56, 189, 248, 0.25); }

.dropdown-menu {
  position: absolute; top: 100%; left: 0;
  margin-top: 4px;
  background: #0a1628;
  border: 1px solid rgba(56, 189, 248, 0.12);
  border-radius: 8px;
  padding: 4px;
  z-index: 100;
  max-height: 260px;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}
.dropdown-item {
  width: 100%;
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 10px;
  border-radius: 5px;
  font-family: var(--sans);
  font-size: 11px;
  color: var(--text-dim);
  text-align: left;
}
.dropdown-item:hover { background: rgba(56, 189, 248, 0.06); color: var(--text); }
.dropdown-item.active { color: var(--accent); background: rgba(56, 189, 248, 0.09); }
```

- [ ] **Step 8: Add tabular-nums + slashed-zero to numeric display classes (wiki: type-tabular-nums-for-data, type-slashed-zero)**

Add after the existing `.mono` utility:

```css
.mono {
  font-family: var(--mono);
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'zero' 1;
}
.small { font-size: 11px; }
.data-val {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'zero' 1;
}
```

- [ ] **Step 9: Add `.topbar-div` and `.topbar-ctx-field` utility classes used by TopBar**

```css
/* TopBar slot (injected into NavBar) */
.topbar-div {
  width: 1px;
  height: 20px;
  background: rgba(56, 189, 248, 0.08);
  flex-shrink: 0;
  margin: 0 2px;
}
.topbar-ctx-field {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 10px;
  border-right: 1px solid rgba(56, 189, 248, 0.07);
  border-left: 1px solid rgba(56, 189, 248, 0.07);
  margin-left: -1px;
  height: 40px;
  flex-shrink: 0;
}
.topbar-ctx-lbl {
  font-size: 7.5px;
  font-weight: 700;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  color: #2d3748;
  line-height: 1;
  margin-bottom: 2px;
}
.topbar-ctx-val {
  font-size: 11px;
  font-weight: 600;
  color: var(--text);
  line-height: 1;
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'zero' 1;
}
.topbar-ctx-val.acc { color: var(--accent); }

.speed-btns {
  display: flex;
  background: rgba(56, 189, 248, 0.04);
  border: 1px solid rgba(56, 189, 248, 0.10);
  border-radius: 5px;
  overflow: hidden;
  align-self: center;
  flex-shrink: 0;
}
.sp-btn {
  font-size: 9px; font-weight: 600; color: var(--text-muted);
  padding: 3px 7px; background: transparent; border: none; cursor: pointer;
  font-family: var(--sans);
}
.sp-btn.active { color: var(--accent); background: rgba(56, 189, 248, 0.10); }

/* Annotate button — wiki: visual-button-shadow-anatomy */
.btn-annotate {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 10px; font-weight: 600; letter-spacing: 0.04em;
  color: var(--text); padding: 5px 13px; border-radius: 6px;
  flex-shrink: 0; margin-left: 8px;
  background: linear-gradient(to bottom, rgba(56,189,248,0.16), rgba(56,189,248,0.09));
  box-shadow:
    0 0 0 1px rgba(56, 189, 248, 0.24),
    inset 0 0 0 1px rgba(255, 255, 255, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.07),
    0 1px 2px rgba(0, 0, 0, 0.35),
    0 2px 4px rgba(0, 0, 0, 0.20),
    0 4px 8px rgba(0, 0, 0, 0.10);
  text-shadow: 0 1px 1px rgba(0,0,0,0.25);
  transition: opacity 0.15s;
}
.btn-annotate:hover { opacity: 0.88; }
.ann-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--text-muted); flex-shrink: 0;
  transition: background 0.15s, box-shadow 0.15s;
}
.ann-dot.on {
  background: var(--accent);
  box-shadow: 0 0 6px rgba(56, 189, 248, 0.5);
}
```

- [ ] **Step 10: Update `.pill` active state colors**

```css
.pill.active {
  color: var(--accent);
  background: rgba(56, 189, 248, 0.10);
  border-color: rgba(56, 189, 248, 0.35);
}
```

- [ ] **Step 11: Update `.status-pill` and `.status-dot`**

```css
.status-pill {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text-dim);
  display: flex; align-items: center; gap: 6px;
  padding: 3px 9px;
  border: 1px solid rgba(56, 189, 248, 0.10);
  border-radius: 5px;
  background: rgba(56, 189, 248, 0.03);
}
```

- [ ] **Step 12: Remove alternate themes (dead code — notebook, oscilloscope, editorial, clinical)**

Delete lines 542–795 (everything from `/* THEMES */` to end of file). They reference hardcoded color values that no longer apply and are never used.

- [ ] **Step 13: Commit**

```bash
git add frontend/app/globals.css
git commit -m "Update CSS tokens to sky-blue palette and compact layout styles"
```

---

## Task 2: Remove @fontsource imports from layout.tsx

**Files:**
- Modify: `frontend/app/layout.tsx`

- [ ] **Step 1: Remove the six font import lines**

Current `layout.tsx` lines 1–7:
```tsx
import type { Metadata } from 'next'
import '@fontsource/manrope/400.css'
import '@fontsource/manrope/500.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import './globals.css'
```

Replace with:
```tsx
import type { Metadata } from 'next'
import './globals.css'
```

- [ ] **Step 2: Update page title metadata**

```tsx
export const metadata: Metadata = {
  title: 'MI·Bench',
  description: 'Motor Imagery EEG Benchmark and Visualization',
}
```

- [ ] **Step 3: Verify dev server still starts**

```bash
cd frontend && npm run dev
```

Expected: No "Cannot find module '@fontsource/manrope'" errors. Page loads at `http://localhost:3000`.

- [ ] **Step 4: Commit**

```bash
git add frontend/app/layout.tsx
git commit -m "Remove @fontsource imports, switch to system font stack"
```

---

## Task 3: Create NavSlotContext for injecting TopBar into NavBar

**Files:**
- Create: `frontend/lib/nav-slot-context.tsx`
- Modify: `frontend/app/layout.tsx`

The Visualize page owns all its session state (dataset, subject, run, explain). NavBar lives in the root layout — above the page in the React tree. To let the visualize page inject content into the NavBar's right side, a context is used: the provider wraps the whole app (in layout.tsx), the visualize page sets the slot, and NavBar renders it.

- [ ] **Step 1: Create the context file**

Create `frontend/lib/nav-slot-context.tsx`:

```tsx
'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

interface NavSlotContextType {
  slot: ReactNode
  setSlot: (node: ReactNode) => void
}

const NavSlotContext = createContext<NavSlotContextType>({
  slot: null,
  setSlot: () => {},
})

export function NavSlotProvider({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<ReactNode>(null)
  return (
    <NavSlotContext.Provider value={{ slot, setSlot }}>
      {children}
    </NavSlotContext.Provider>
  )
}

export function useNavSlot() {
  return useContext(NavSlotContext)
}
```

- [ ] **Step 2: Wrap root layout body with NavSlotProvider**

Full updated `frontend/app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import './globals.css'
import NavBar from '@/components/layout/NavBar'
import { NavSlotProvider } from '@/lib/nav-slot-context'

export const metadata: Metadata = {
  title: 'MI·Bench',
  description: 'Motor Imagery EEG Benchmark and Visualization',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <NavSlotProvider>
          <div className="page-root">
            <NavBar />
            {children}
          </div>
        </NavSlotProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/lib/nav-slot-context.tsx frontend/app/layout.tsx
git commit -m "Add NavSlotContext for injecting visualize top bar into NavBar"
```

---

## Task 4: Update NavBar to render slot + fix wordmark + nav order

**Files:**
- Modify: `frontend/components/layout/NavBar.tsx`

- [ ] **Step 1: Rewrite NavBar.tsx**

Full replacement of `frontend/components/layout/NavBar.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useNavSlot } from '@/lib/nav-slot-context'

const TABS = [
  { href: '/visualize', label: 'Visualize' },
  { href: '/classify',  label: 'Classify'  },
  { href: '/benchmark', label: 'Benchmark' },
]

export default function NavBar() {
  const pathname = usePathname()
  const { slot } = useNavSlot()

  // When the visualize page injects its TopBar, render it instead of default right side
  if (slot) {
    return (
      <header className="nav" style={{ padding: 0, overflow: 'hidden' }}>
        {slot}
      </header>
    )
  }

  return (
    <header className="nav">
      <div className="wordmark">
        <span className="wordmark-name">MI·Bench</span>
      </div>

      <div className="topbar-div" />

      <nav className="nav-tabs">
        {TABS.map(({ href, label }) => (
          <Link key={href} href={href} className={'nav-tab' + (pathname.startsWith(href) ? ' active' : '')}>
            {label}
          </Link>
        ))}
      </nav>

      <div className="nav-right">
        <div className="status-pill">
          <span className="status-dot" />
          api · localhost:8000
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Verify non-visualize pages still show NavBar**

Navigate to `http://localhost:3000/classify` and `http://localhost:3000/benchmark`. The compact NavBar (MI·Bench wordmark, Visualize → Classify → Benchmark tabs) should appear. No regression.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/layout/NavBar.tsx
git commit -m "Update NavBar: compact style, MI·Bench wordmark, slot support, nav order"
```

---

## Task 5: Create TopBar component

**Files:**
- Create: `frontend/components/layout/TopBar.tsx`

TopBar is the unified compact bar for the Visualize page. It receives the same props that ContextBar previously accepted, plus `loaded` for the live Class label display. It renders: wordmark → nav tabs → divider → context fields → speed control → Annotate button.

- [ ] **Step 1: Create `frontend/components/layout/TopBar.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import type { AppOptions, LoadedMeta } from '@/app/visualize/page'

const TABS = [
  { href: '/visualize', label: 'Visualize' },
  { href: '/classify',  label: 'Classify'  },
  { href: '/benchmark', label: 'Benchmark' },
]

// ---- Shared sub-components -----------------------------------------------

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="6 4 20 12 6 20" />
    </svg>
  )
}

function Spinner() {
  return <span className="spinner" />
}

interface DropdownOption { value: string; label: string }

function Dropdown({ label, value, options, onChange, width = 160, disabled = false }: {
  label: string; value: string; options: DropdownOption[]
  onChange: (v: string) => void; width?: number; disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const current = options.find((o) => o.value === value) ?? options[0]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className="dropdown-btn"
        style={{ width, height: 28, fontSize: 11 }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11, color: 'var(--text)' }}>
          {current?.label ?? value}
        </span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className="dropdown-menu" style={{ width: Math.max(width, 180) }}>
          {options.map((opt) => (
            <button
              key={opt.value}
              className={'dropdown-item' + (opt.value === value ? ' active' : '')}
              onClick={() => { onChange(opt.value); setOpen(false) }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt.label}</span>
              {opt.value === value && <span style={{ color: 'var(--accent)', flexShrink: 0 }}>●</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function friendlyClass(cls: string): string {
  return cls
    .replace('left_hand', 'Left Hand')
    .replace('right_hand', 'Right Hand')
    .replace('feet', 'Feet')
    .replace('tongue', 'Tongue')
}

// ---- TopBar ------------------------------------------------------------------

interface TopBarProps {
  options: AppOptions
  loaded: LoadedMeta | null
  loading: boolean
  explain: boolean
  onExplainChange: (v: boolean) => void
  onLoad: (dataset: string, subject: number, run: string) => void
}

export default function TopBar({ options, loaded, loading, explain, onExplainChange, onLoad }: TopBarProps) {
  const pathname = usePathname()
  const firstDs = options.datasets[0]?.value ?? ''
  const [dataset, setDataset] = useState(firstDs)
  const [subject, setSubject] = useState(String((options.subjects[firstDs] ?? [])[0] ?? 1))
  const [run, setRun] = useState((options.runs[firstDs] ?? [])[0]?.value ?? '')

  function handleDatasetChange(d: string) {
    setDataset(d)
    const subs = options.subjects[d] ?? []
    const runs = options.runs[d] ?? []
    if (subs.length) setSubject(String(subs[0]))
    if (runs.length) setRun(runs[0].value)
  }

  const subjectOpts = (options.subjects[dataset] ?? []).map((n) => ({
    value: String(n),
    label: `S${String(n).padStart(2, '0')}`,
  }))
  const runOpts = options.runs[dataset] ?? []

  // Class label from loaded data
  const classLabel = loaded?.classes?.length
    ? loaded.classes.map(friendlyClass).join(' / ')
    : null

  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Wordmark */}
      <div className="wordmark" style={{ marginRight: 14, flexShrink: 0 }}>
        <span className="wordmark-name">MI·Bench</span>
      </div>

      <div className="topbar-div" />

      {/* Nav tabs */}
      <nav className="nav-tabs" style={{ marginRight: 4 }}>
        {TABS.map(({ href, label }) => (
          <Link key={href} href={href} className={'nav-tab' + (pathname.startsWith(href) ? ' active' : '')}>
            {label}
          </Link>
        ))}
      </nav>

      <div className="topbar-div" />

      {/* Dataset dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="topbar-ctx-lbl">Dataset</span>
          <Dropdown label="dataset" value={dataset} options={options.datasets} onChange={handleDatasetChange} width={148} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="topbar-ctx-lbl">Subject</span>
          <Dropdown label="subject" value={subject} options={subjectOpts} onChange={setSubject} width={72} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="topbar-ctx-lbl">Task</span>
          <Dropdown label="task" value={run} options={runOpts} onChange={setRun} width={160} />
        </div>
      </div>

      {/* Load button */}
      <button
        className={'load-btn' + (loading ? ' loading' : '')}
        onClick={() => onLoad(dataset, parseInt(subject), run)}
        disabled={loading}
        style={{ height: 30, fontSize: 11, padding: '0 12px' }}
      >
        {loading ? <><Spinner /> Loading…</> : <><PlayIcon /> Load</>}
      </button>

      {/* Loaded class indicator */}
      {classLabel && (
        <>
          <div className="topbar-div" style={{ margin: '0 8px' }} />
          <div className="topbar-ctx-field" style={{ borderLeft: 'none', paddingLeft: 0 }}>
            <span className="topbar-ctx-lbl">Class</span>
            <span className="topbar-ctx-val acc">{classLabel}</span>
          </div>
        </>
      )}

      <div style={{ flex: 1 }} />

      {/* Speed buttons (shown when data is loaded) */}
      {loaded && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
          <span className="topbar-ctx-lbl" style={{ marginBottom: 0 }}>Speed</span>
          <div className="speed-btns">
            <button className="sp-btn">0.5×</button>
            <button className="sp-btn active">1×</button>
            <button className="sp-btn">2×</button>
          </div>
        </div>
      )}

      {/* Annotate button */}
      <button className="btn-annotate" onClick={() => onExplainChange(!explain)}>
        <span className={`ann-dot${explain ? ' on' : ''}`} />
        Annotate
      </button>
    </div>
  )
}
```

> **Note on speed control:** The TopBar renders speed buttons as visual placeholders here. Wiring them to `playSpeed`/`setPlaySpeed` (currently in `visualize/page.tsx`) is handled in Task 6 by lifting that state and passing it as props.

- [ ] **Step 2: Commit**

```bash
git add frontend/components/layout/TopBar.tsx
git commit -m "Add TopBar component: unified compact bar for visualize page"
```

---

## Task 6: Wire TopBar into visualize page + update explain texts

**Files:**
- Modify: `frontend/app/visualize/page.tsx`

- [ ] **Step 1: Replace ContextBar import with TopBar + NavSlot imports**

At the top of `frontend/app/visualize/page.tsx`, replace:

```tsx
import ContextBar from '@/components/layout/ContextBar'
```

With:

```tsx
import TopBar from '@/components/layout/TopBar'
import { useNavSlot } from '@/lib/nav-slot-context'
```

- [ ] **Step 2: Inject TopBar into NavBar slot on mount**

Inside the `VisualizePage` component, add at the top of the component body (after all state declarations):

```tsx
const { setSlot } = useNavSlot()

useEffect(() => {
  if (!appOptions) return
  setSlot(
    <TopBar
      options={appOptions}
      loaded={loaded}
      loading={loading}
      explain={explain}
      onExplainChange={setExplain}
      onLoad={handleLoad}
    />
  )
  return () => setSlot(null)
}, [appOptions, loaded, loading, explain, setExplain, handleLoad, setSlot])
```

- [ ] **Step 3: Remove `<ContextBar ...>` from the return JSX**

Remove these lines from the return statement (approximately lines 476–483 in the original file):

```tsx
<ContextBar
  options={appOptions}
  loaded={loaded}
  loading={loading}
  explain={explain}
  onExplainChange={setExplain}
  onLoad={handleLoad}
/>
```

- [ ] **Step 4: Update `tsExplain` to short + expandable form**

Replace the entire `tsExplain` declaration with:

```tsx
const tsExplainShort =
  tsData?.class_label === 'right_hand'
    ? 'C3 shows mu-band ERD (0.5–2 s) — the desynchronization the classifier detects.'
    : tsData?.class_label === 'left_hand'
    ? 'C4 shows mu-band ERD; C3/C4 lateralization is the key discriminative feature.'
    : tsData?.class_label === 'feet'
    ? 'ERD concentrates at Cz — foot motor cortex sits on the medial wall.'
    : 'Baseline: −0.5 s pre-cue. Imagery window: 0–4 s. C3/C4 = contralateral motor cortex.'

const tsExplainFull =
  tsData?.class_label === 'right_hand'
    ? 'Right-hand motor imagery cue at t = 0. C3 (contralateral) shows mu-band desynchronization (ERD) between 0.5–2 s — the drop in oscillatory amplitude the classifier detects.'
    : tsData?.class_label === 'left_hand'
    ? 'Left-hand motor imagery cue at t = 0. C4 (contralateral right hemisphere) shows mu-band ERD. C3 stays relatively suppressed — the lateralization between C3 and C4 is the key discriminative feature.'
    : tsData?.class_label === 'feet'
    ? 'Feet motor imagery cue at t = 0. ERD concentrates around Cz — foot motor cortex sits on the medial wall, so the central midline channel shows the strongest mu suppression.'
    : 'Motor imagery epoch. Baseline from −0.5 s pre-cue to cue onset. Imagery window runs 0–4 s. C3 and C4 cover contralateral motor cortex for right and left hand; Cz is the midline reference for feet.'
```

- [ ] **Step 5: Update `psdExplain` to short + expandable form**

Replace the `psdExplain` declaration with:

```tsx
const psdExplainShort = `Suppressed μ (8–13 Hz) and β (13–30 Hz) confirm motor cortex activation — these rhythms dip when you imagine movement.`

const psdExplainFull = `This chart shows how much signal power exists at each frequency, averaged across all ${loaded?.n_epochs ?? ''} trials. The μ band (8–13 Hz) is the brain's natural "idle" motor rhythm: it dips when you imagine movement (that dip is the ERD this benchmark detects). The β band (13–30 Hz) is a faster motor rhythm that rebounds strongly after imagery. Compare C3 vs C4: if one dips more than the other, the brain is showing lateralized motor activity — the key feature classifiers exploit.`
```

- [ ] **Step 6: Update `topoExplain` to short + expandable form**

Replace the `topoExplain` declaration with:

```tsx
const topoExplainShort =
  freqBand === 'mu'
    ? 'Mu-band ERD over C3/C4 marks bilateral motor-cortex desynchronization.'
    : freqBand === 'beta'
    ? 'Beta-band suppression in sensorimotor regions; smaller spatial footprint than mu.'
    : freqBand === 'alpha'
    ? 'Occipital alpha (hot over POz/Pz) is unrelated to motor imagery — a sanity check.'
    : 'Broadband topography averages all frequencies, washing out motor-cortex specificity.'

const topoExplainFull =
  freqBand === 'mu'
    ? 'Mu-band (8–13 Hz) topography. Cool colors (desynchronization) over C3 and C4 indicate bilateral motor-cortex ERD — exactly where MI activity concentrates. CSP and Riemannian methods encode this spatial pattern.'
    : freqBand === 'beta'
    ? 'Beta-band (13–30 Hz) topography. Sensorimotor regions show suppression with a smaller spatial footprint than mu. Post-movement beta rebound after the imagery window is a reliable contralateral signature.'
    : freqBand === 'alpha'
    ? 'Alpha-band topography. Occipital alpha (hot over POz/Pz) is unrelated to motor imagery — it serves as a sanity check that non-motor regions show the expected resting rhythm.'
    : 'Broadband (1–40 Hz) topography. Averaging all frequencies washes out motor-cortex specificity — you see overall signal magnitude rather than task-specific patterns.'
```

- [ ] **Step 7: Update ChartCard calls to pass short + full explain texts**

Find the three `<ChartCard` usages in the return JSX. Update the `explainText` prop on each to use the short form, and add an `explainTextFull` prop:

For the Time Series ChartCard:
```tsx
explain={explain}
explainText={tsExplainShort}
explainTextFull={tsExplainFull}
```

For the PSD ChartCard:
```tsx
explain={explain}
explainText={psdExplainShort}
explainTextFull={psdExplainFull}
```

For the Topo ChartCard:
```tsx
explain={explain}
explainText={topoExplainShort}
explainTextFull={topoExplainFull}
```

- [ ] **Step 8: Update ChartCard component to render short + expandable text**

Locate the `ChartCard` function definition inside `page.tsx` (it's defined locally). Find where it renders the `.explain` panel. It currently does something like:

```tsx
{explain && explainText && (
  <div className="explain">
    <InfoIcon />
    <p>{explainText}</p>
  </div>
)}
```

Update it to accept `explainTextFull` and render a "more ↓" toggle:

```tsx
// Add to ChartCard props interface:
explainTextFull?: string

// Replace the explain panel render:
{explain && explainText && (
  <ExplainPanel short={explainText} full={explainTextFull} />
)}
```

Add `ExplainPanel` as a local component just above `ChartCard`:

```tsx
function ExplainPanel({ short, full }: { short: string; full?: string }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="explain">
      <InfoIcon />
      <p>
        {expanded && full ? full : short}
        {full && !expanded && (
          <>
            {' '}
            <a
              href="#"
              style={{ color: 'var(--accent)', textUnderlineOffset: '2px' }}
              onClick={(e) => { e.preventDefault(); setExpanded(true) }}
            >
              more ↓
            </a>
          </>
        )}
        {expanded && (
          <>
            {' '}
            <a
              href="#"
              style={{ color: 'var(--text-muted)', textUnderlineOffset: '2px', fontSize: '9px' }}
              onClick={(e) => { e.preventDefault(); setExpanded(false) }}
            >
              less ↑
            </a>
          </>
        )}
      </p>
    </div>
  )
}
```

- [ ] **Step 9: Verify visualize page in browser**

Start the dev server and load `http://localhost:3000/visualize`.

Expected:
- Single compact 40px top bar with wordmark, nav tabs, dropdowns, Load button, Annotate button
- No separate context bar card below the nav
- Charts render correctly
- Clicking Annotate shows one short sentence below each chart with "more ↓" link
- Clicking "more ↓" expands the full explanation

- [ ] **Step 10: Commit**

```bash
git add frontend/app/visualize/page.tsx
git commit -m "Replace ContextBar with TopBar slot, progressive disclosure on explain texts"
```

---

## Task 7: Delete ContextBar.tsx

**Files:**
- Delete: `frontend/components/layout/ContextBar.tsx`

- [ ] **Step 1: Verify no other file imports ContextBar**

```bash
grep -r "ContextBar" frontend/
```

Expected: No matches (only the line you just removed from page.tsx).

- [ ] **Step 2: Delete the file**

```bash
rm frontend/components/layout/ContextBar.tsx
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Delete ContextBar — replaced by TopBar"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered by |
|---|---|
| `--accent` → `#38bdf8` | Task 1 Step 1 |
| `--bg` → `#040b15` | Task 1 Step 1 |
| System-ui font stack | Task 1 Step 1, Task 2 |
| Remove @fontsource imports | Task 2 |
| Compact 40px top bar (Layout B) | Tasks 3–6 |
| Nav order: Visualize → Classify → Benchmark | Task 4, Task 5 |
| Wordmark → "MI·Bench" | Task 4, Task 5 |
| Toggle → "Annotate" button with dot indicator | Task 5, Task 1 Step 9 |
| Remove "hints on/off" sub-label | Task 5 (not in TopBar) |
| PSD short sentence + "more ↓" | Task 6 Steps 5, 8 |
| TS short sentence + "more ↓" | Task 6 Steps 4, 8 |
| Topo short sentence + "more ↓" | Task 6 Steps 6, 8 |
| ContextBar removed | Task 7 |
| Classify/Benchmark untouched | No task touches them |
| Alpha borders (rgba) | Task 1 Steps 3–8 |
| Layered shadows on cards | Task 1 Step 5 |
| 6-layer button shadow anatomy | Task 1 Steps 7, 9 |
| tabular-nums + slashed-zero | Task 1 Step 8 |

All spec requirements covered. No gaps found.

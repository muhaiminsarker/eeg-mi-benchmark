'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import type { AppOptions, LoadedMeta } from '@/app/visualize/page'

function VisualizeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="2 12 6 4 10 18 14 8 18 14 22 12" />
    </svg>
  )
}
function ClassifyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="4" r="2" /><circle cx="4" cy="20" r="2" /><circle cx="20" cy="20" r="2" />
      <line x1="12" y1="6" x2="4" y2="18" /><line x1="12" y1="6" x2="20" y2="18" />
    </svg>
  )
}
function BenchmarkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  )
}

const TABS = [
  { href: '/visualize', label: 'Visualize', icon: <VisualizeIcon /> },
  { href: '/classify',  label: 'Classify',  icon: <ClassifyIcon />  },
  { href: '/benchmark', label: 'Benchmark', icon: <BenchmarkIcon /> },
]

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
        style={{ width, fontSize: 11 }}
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

  const classLabel = loaded?.classes?.length
    ? loaded.classes.map(friendlyClass).join(' / ')
    : null

  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: '100%', overflow: 'visible' }}>
      <div className="wordmark" style={{ marginRight: 14, flexShrink: 0 }}>
        <span className="wordmark-name">MI·Bench</span>
      </div>

      <div className="topbar-div" />

      <nav className="nav-tabs" style={{ marginRight: 4 }}>
        {TABS.map(({ href, label, icon }) => (
          <Link key={href} href={href} className={'nav-tab' + (pathname.startsWith(href) ? ' active' : '')}>
            {icon}{label}
          </Link>
        ))}
      </nav>

      <div className="topbar-div" />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="topbar-ctx-lbl">Dataset</span>
          <Dropdown label="dataset" value={dataset} options={options.datasets} onChange={handleDatasetChange} width={148} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="topbar-ctx-lbl">Subject</span>
          <Dropdown label="subject" value={subject} options={subjectOpts} onChange={setSubject} width={72} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="topbar-ctx-lbl">Task</span>
          <Dropdown label="task" value={run} options={runOpts} onChange={setRun} width={160} />
        </div>
      </div>

      <button
        className={'load-btn' + (loading ? ' loading' : '')}
        onClick={() => onLoad(dataset, parseInt(subject), run)}
        disabled={loading}
        style={{ fontSize: 11, padding: '0 14px' }}
      >
        {loading ? <><Spinner /> Loading…</> : <><PlayIcon /> Load</>}
      </button>

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

      <button className="btn-annotate" onClick={() => onExplainChange(!explain)}>
        <span className={`ann-dot${explain ? ' on' : ''}`} />
        Explain
      </button>
    </div>
  )
}

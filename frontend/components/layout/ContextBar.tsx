'use client'

import { useState, useRef, useEffect } from 'react'
import type { AppOptions, LoadedMeta } from '@/app/visualize/page'

// ---- Icons ---------------------------------------------------------------
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="6 4 20 12 6 20" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="8.01" />
      <line x1="12" y1="11" x2="12" y2="16" />
    </svg>
  )
}

function Spinner() {
  return <span className="spinner" />
}

// ---- Generic Dropdown -------------------------------------------------------
interface DropdownOption { value: string; label: string }

interface DropdownProps {
  label: string
  value: string
  options: DropdownOption[]
  onChange: (v: string) => void
  width?: number
  disabled?: boolean
}

function Dropdown({ label, value, options, onChange, width = 168, disabled = false }: DropdownProps) {
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
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
        {label}
      </div>
      <button
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className="dropdown-btn"
        style={{ width }}
      >
        <span style={{ fontFamily: 'var(--mono)', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {current?.label ?? value}
        </span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className="dropdown-menu" style={{ width: Math.max(width, 200) }}>
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

// ---- Props ---------------------------------------------------------------
interface Props {
  options: AppOptions
  loaded: LoadedMeta | null
  loading: boolean
  explain: boolean
  onExplainChange: (v: boolean) => void
  onLoad: (dataset: string, subject: number, run: string) => void
}

export default function ContextBar({ options, loaded, loading, explain, onExplainChange, onLoad }: Props) {
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

  const subjectOpts = (options.subjects[dataset] ?? []).map((n) => ({ value: String(n), label: String(n).padStart(2, '0') }))
  const runOpts = options.runs[dataset] ?? []

  return (
    <div className="ctxbar">
      <div className="ctxbar-inner">
        <Dropdown
          label="dataset"
          value={dataset}
          options={options.datasets}
          onChange={handleDatasetChange}
          width={220}
        />
        <Dropdown
          label="subject"
          value={subject}
          options={subjectOpts}
          onChange={setSubject}
          width={90}
        />
        <Dropdown
          label="run"
          value={run}
          options={runOpts}
          onChange={setRun}
          width={200}
        />

        <button
          className={'load-btn' + (loading ? ' loading' : '')}
          onClick={() => onLoad(dataset, parseInt(subject), run)}
          disabled={loading}
        >
          {loading ? <><Spinner /> loading</> : <><PlayIcon /> load</>}
        </button>

        <div style={{ flex: 1 }} />

        <label className="toggle">
          <input type="checkbox" checked={explain} onChange={(e) => onExplainChange(e.target.checked)} />
          <span className="toggle-slider" />
          <span className="toggle-label"><InfoIcon /> Explain</span>
        </label>
      </div>

      {loaded && (
        <div className="ctxbar-meta">
          <span>n_epochs <b>{loaded.n_epochs}</b></span>
          <span className="sep">·</span>
          <span>sfreq <b>{loaded.sfreq} Hz</b></span>
          <span className="sep">·</span>
          <span>window <b>[{loaded.tmin.toFixed(1)}, {loaded.tmax.toFixed(1)}]s</b></span>
          <span className="sep">·</span>
          <span>channels <b>{loaded.channels.length}</b></span>
          {loaded.classes.length > 0 && (
            <>
              <span className="sep">·</span>
              <span>classes <b>{loaded.classes.join(' / ')}</b></span>
            </>
          )}
        </div>
      )}
    </div>
  )
}

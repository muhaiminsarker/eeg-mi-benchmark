'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

const TABS = [
  { href: '/visualize', label: 'Visualize' },
  { href: '/classify', label: 'Classify' },
  { href: '/benchmark', label: 'Benchmark' },
]

const THEMES = [
  { id: '', label: 'Default', dot: '#a78bfa' },
  { id: 'theme-notebook', label: 'Notebook', dot: '#2d4f7c' },
  { id: 'theme-oscilloscope', label: 'Oscilloscope', dot: '#00ff88' },
  { id: 'theme-editorial', label: 'Editorial', dot: '#ff4d12' },
  { id: 'theme-clinical', label: 'Clinical', dot: '#1769aa' },
]

function ThemeSwitcher() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function applyTheme(id: string) {
    const body = document.body
    THEMES.forEach((t) => { if (t.id) body.classList.remove(t.id) })
    if (id) body.classList.add(id)
    setCurrent(id)
    setOpen(false)
  }

  const active = THEMES.find((t) => t.id === current) ?? THEMES[0]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="status-pill"
        style={{ cursor: 'pointer', gap: 6 }}
        title="Switch theme"
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: active.dot, display: 'inline-block', flexShrink: 0 }} />
        <span style={{ fontSize: 10 }}>{active.label}</span>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="dropdown-menu" style={{ right: 0, left: 'auto', width: 148, top: 'calc(100% + 6px)' }}>
          {THEMES.map((t) => (
            <button
              key={t.id}
              className={'dropdown-item' + (t.id === current ? ' active' : '')}
              onClick={() => applyTheme(t.id)}
              style={{ gap: 8 }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.dot, display: 'inline-block', flexShrink: 0 }} />
              {t.label}
              {t.id === current && <span style={{ color: 'var(--accent)', marginLeft: 'auto' }}>●</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function NavBar() {
  const pathname = usePathname()
  return (
    <header className="nav">
      <div className="wordmark">
        <span className="mark-serif"><em>Cortex</em></span>
        <span>
          <span style={{ color: 'var(--accent)' }}>~/</span>
          eeg
          <span style={{ color: 'var(--text-muted)' }}>·</span>
          mi
        </span>
        <span className="nav-badge">v0.1.0</span>
      </div>

      <nav className="nav-tabs">
        {TABS.map(({ href, label }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={'nav-tab' + (isActive ? ' active' : '')}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="nav-right">
        <ThemeSwitcher />
        <div className="status-pill">
          <span className="status-dot" />
          api · localhost:8000
        </div>
        <div className="kbd">⌘K</div>
      </div>
    </header>
  )
}

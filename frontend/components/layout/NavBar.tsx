'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useNavSlot } from '@/lib/nav-slot-context'

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

export default function NavBar() {
  const pathname = usePathname()
  const { slot } = useNavSlot()

  if (slot) {
    return (
      <header className="nav" style={{ padding: 0, overflow: 'visible' }}>
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
        {TABS.map(({ href, label, icon }) => (
          <Link key={href} href={href} className={'nav-tab' + (pathname.startsWith(href) ? ' active' : '')}>
            {icon}{label}
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

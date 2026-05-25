'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  {
    href: '/visualize',
    label: 'Visualize',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="2 12 6 5 10 15 14 8 18 14 22 10" />
      </svg>
    ),
  },
  {
    href: '/classify',
    label: 'Classify',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4" />
        <line x1="12" y1="2" x2="12" y2="4" />
        <line x1="12" y1="20" x2="12" y2="22" />
        <line x1="2" y1="12" x2="4" y2="12" />
        <line x1="20" y1="12" x2="22" y2="12" />
      </svg>
    ),
  },
  {
    href: '/benchmark',
    label: 'Benchmark',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
        <line x1="2" y1="20" x2="22" y2="20" />
      </svg>
    ),
  },
]

export default function NavBar() {
  const pathname = usePathname()
  return (
    <header className="nav">
      <div className="wordmark">
        <span className="wordmark-name">eeg·mi</span>
        <span className="wordmark-tag">Motor Imagery Benchmark</span>
      </div>

      <nav className="nav-tabs">
        {TABS.map(({ href, label, icon }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link key={href} href={href} className={'nav-tab' + (isActive ? ' active' : '')}>
              {icon}
              {label}
            </Link>
          )
        })}
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

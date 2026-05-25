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

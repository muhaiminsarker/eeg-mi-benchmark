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
      <span className="font-mono font-bold text-accent tracking-wide text-sm">
        eeg-mi-benchmark
      </span>
      <div className="flex gap-6">
        {NAV_LINKS.map(({ href, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`text-sm font-mono transition-colors ${
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

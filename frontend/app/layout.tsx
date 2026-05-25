import type { Metadata } from 'next'
import './globals.css'
import NavBar from '@/components/layout/NavBar'

export const metadata: Metadata = {
  title: 'MI·Bench',
  description: 'Motor Imagery EEG Benchmark and Visualization',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <div className="page-root">
          <NavBar />
          {children}
        </div>
      </body>
    </html>
  )
}

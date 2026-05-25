import type { Metadata } from 'next'
import '@fontsource/manrope/400.css'
import '@fontsource/manrope/500.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import './globals.css'
import NavBar from '@/components/layout/NavBar'

export const metadata: Metadata = {
  title: 'eeg-mi-benchmark',
  description: 'EEG Motor Imagery Analysis and Visualization',
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

import type { Metadata } from 'next'
import './globals.css'
import NavBar from '@/components/layout/NavBar'

export const metadata: Metadata = {
  title: 'eeg-mi-benchmark',
  description: 'EEG Motor Imagery Analysis and Visualization',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-base text-text-primary min-h-screen">
        <NavBar />
        {children}
      </body>
    </html>
  )
}

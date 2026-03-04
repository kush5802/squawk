import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Squawk — Flash News Terminal',
  description: 'Internal squawk box for flash news broadcasting',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

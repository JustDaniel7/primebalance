import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'FinBook | Next-Gen Accounting Platform',
  description: 'AI-powered accounting software with blockchain integration for modern businesses',
  keywords: ['accounting', 'bookkeeping', 'fintech', 'blockchain', 'crypto', 'AI', 'automation'],
  authors: [{ name: 'FinBook Team' }],
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'FinBook | Next-Gen Accounting Platform',
    description: 'AI-powered accounting software with blockchain integration',
    url: 'https://finbook.app',
    siteName: 'FinBook',
    locale: 'en_US',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f1115',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="noise-overlay">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(52, 58, 70, 0.95)',
              color: '#f6f7f9',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
            },
            success: {
              iconTheme: {
                primary: '#14d47a',
                secondary: '#0f1115',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#0f1115',
              },
            },
          }}
        />
        {children}
      </body>
    </html>
  )
}

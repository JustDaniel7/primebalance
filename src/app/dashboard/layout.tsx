'use client'
// src/app/layout.tsx
import { DM_Sans, Space_Grotesk, JetBrains_Mono } from 'next/font/google'

const dmSans = DM_Sans({ 
  subsets: ['latin'],
  variable: '--font-dm-sans'
})

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk'
})

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-jetbrains-mono'
})
import { DashboardLayout } from '@/components/layout'

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayout>{children}</DashboardLayout>
}
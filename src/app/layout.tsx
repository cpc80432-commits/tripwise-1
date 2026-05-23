import type { Metadata, Viewport } from 'next'
import { Noto_Sans_TC } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { LoginModal } from '@/components/auth/LoginModal'
import { CreateTripFlow } from '@/components/trip/CreateTripFlow'
import { BottomNav } from '@/components/layout/BottomNav'
import { Toaster } from 'react-hot-toast'

const noto = Noto_Sans_TC({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-noto',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '旅智 — AI 旅遊規劃助手',
  description: '讓 AI 幫你規劃完美旅程，管理行程、預算與景點推薦',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: '旅智' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#4F9B7F',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className={noto.variable}>
      <body className="bg-gray-50 font-sans antialiased">
        <AuthProvider>
          <div className="min-h-screen pb-20">
            {children}
          </div>
          <BottomNav />
          <LoginModal />
          <CreateTripFlow />
          <Toaster position="top-center" toastOptions={{ style: { fontFamily: 'var(--font-noto)', fontWeight: 600 } }} />
        </AuthProvider>
      </body>
    </html>
  )
}

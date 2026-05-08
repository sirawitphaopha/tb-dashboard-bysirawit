import type { Metadata } from 'next'
import { Inter, Noto_Sans_Thai } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const notoSansThai = Noto_Sans_Thai({
  subsets: ['thai'],
  variable: '--font-noto-sans-thai',
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'TB-CARE LINK | ระบบติดตามผู้ป่วยวัณโรค',
  description: 'ระบบติดตามและจัดการผู้ป่วยวัณโรคสำหรับโรงพยาบาล',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" className={`${inter.variable} ${notoSansThai.variable} bg-background`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}

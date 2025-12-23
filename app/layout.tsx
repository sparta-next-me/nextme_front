import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import logo from "@/lib/images/image copy.png"
const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Next Me - AI 미래 설계 서비스",
  description: "AI가 내 소비·저축 데이터를 분석해 미래의 재무 상태를 예측하고, 현실적인 플랜을 제안해주는 서비스",
  generator: "v0.app",
  icons: {
    icon: [

      {
        url: "/image copy.png",
        type: "image/svg+xml",
      },
    ],
    
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className="dark">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}

import type { Metadata } from "next"
import { DM_Sans, Fraunces } from "next/font/google"
import "./globals.css"

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" })
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-display" })

export const metadata: Metadata = {
  title: "Round Analysis Platform",
  description: "AI-powered analysis of deliberation rounds using Gemini AI",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png"
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${fraunces.variable} antialiased`}>{children}</body>
    </html>
  )
}

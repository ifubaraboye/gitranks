import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
})

export const metadata = {
  title: 'GitRanks',
  description: 'Discover the most influential developers by followers, contributions & project impact.',
  openGraph: {
    title: 'GitRanks',
    description: 'Discover the most influential developers by followers, contributions & project impact.',
    url: 'https://gitranks.vercel.app/',
    siteName: 'GitRanks',
    images: [
      {
        url: 'https://gitranks.vercel.app/post.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@0ribi',
    title: 'GitRanks',
    description: 'Discover the most influential developers by followers, contributions & project impact.',
    images: ['https://gitranks.vercel.app/post.png'],
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <body className="font-sans antialiased bg-background">
        <div className="min-h-screen">
          {/* Navigation */}
          <nav className="sticky top-0 z-50 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <a href="/" className="text-xl font-semibold text-neutral-900 dark:text-white">
                  GitRanks
                </a>
                <div className="flex items-center gap-8">
                  <a
                    href="/"
                    className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                  >
                    Compare
                  </a>
                  <a
                    href="/leaderboard"
                    className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                  >
                    Leaderboard
                  </a>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                  >
                    GitHub ↗
                  </a>
                </div>
              </div>
            </div>
          </nav>
          

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">{children}</main>

          {/* Footer */}
          <footer className="border-t border-neutral-200 dark:border-neutral-800 mt-24">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Data from GitHub API.
              </p>
            </div>
          </footer>
        </div>
        <Analytics />
      </body>
    </html>
  )
}

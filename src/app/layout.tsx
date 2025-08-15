import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { Analytics } from "@vercel/analytics/next"
import Navbar from "./components/Navbar" // 1. Import your Navbar component (adjust path if needed)

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
        
        {/* 2. Place the Navbar here, outside the main content wrapper */}
        <Navbar />

        {/* This div is great for layout, like creating a sticky footer */}
        <div className="min-h-screen">
          {/* 
            3. Main Content Wrapper:
            - Add `pt-16` to push content below the 4rem (h-16) fixed navbar.
            - The centering (`max-w-7xl mx-auto`) and padding are correct here.
          */}
          <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12 pt-16">{children}</main>

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
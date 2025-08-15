"use client"

import { useState } from "react"
import { Menu, X, Github, BarChart3, Users } from "lucide-react"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  return (
    <>
      {/* 
        Outer Navigation Container:
        - `fixed top-0`: Fixes it to the top of the viewport.
        - `w-full`: Makes the background and border span the entire screen width.
        - `z-50`: Ensures it stays on top of other content.
      */}
      <nav className="fixed top-0 w-full  z-50 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl">
        {/* 
          Inner Content Container:
          - `max-w-7xl`: Sets a maximum width for the content.
          - `mx-auto`: THIS IS THE FIX. It centers the container horizontally.
          - `px-6 lg:px-8`: Adds padding on the sides.
        */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="text-xl font-semibold text-neutral-900 dark:text-white">
              GitRanks
            </a>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
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

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="lg:hidden p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
              ) : (
                <Menu className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMenu}
        />
      )}

      {/* Mobile Menu Panel (No changes needed here) */}
      <div className={`
        fixed top-0 right-0 h-full w-64 bg-white dark:bg-neutral-950 border-l border-neutral-200 dark:border-neutral-800 z-50 transform transition-transform duration-300 ease-in-out lg:hidden
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
          <span className="text-xl font-semibold text-neutral-900 dark:text-white">
            Menu
          </span>
          <button
            onClick={closeMenu}
            className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
          </button>
        </div>

        <nav className="p-6">
          <div className="space-y-4">
            <a
              href="/"
              onClick={closeMenu}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <BarChart3 className="h-5 w-5" />
              Compare Profiles
            </a>
            <a
              href="/leaderboard"
              onClick={closeMenu}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <Users className="h-5 w-5" />
              Leaderboard
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              onClick={closeMenu}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <Github className="h-5 w-5" />
              GitHub
            </a>
          </div>
        </nav>
      </div>
    </>
  )
}
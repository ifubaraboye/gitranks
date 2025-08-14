"use client"

import { useMemo, useState } from "react"
import { Star, GitFork, GitPullRequest, AlertCircle, Zap, ArrowRight, Github } from "lucide-react"
import SEO from "@/app/components/SEO"

type RankedUser = {
  username: string
  name?: string | null
  avatarUrl?: string | null
  publicRepos: number
  followers: number
  totalStars: number
  totalForks: number
  prCount: number
  issueCount: number
  score: number
  rank: number
}

export default function Home() {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<RankedUser[] | null>(null)

  const usernames = useMemo(
    () =>
      Array.from(
        new Set(
          input
            .split(/[\s,]+/)
            .map((s) => s.trim())
            .filter(Boolean),
        ),
      ),
    [input],
  )

  async function rank() {
    setLoading(true)
    setError(null)
    setResults(null)
    try {
      const res = await fetch("/api/rank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Request failed")
      setResults(data.results as RankedUser[])
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <SEO title="GitRanks" description="Compare and rank GitHub profiles by contributions, stars, and community impact" image="https://gitranks.vercel.app/post.png" url="https://gitranks.vercel.app/" />
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-6">
          <Github className="h-4 w-4" />
          GitHub Profile Analytics
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-white mb-4 tracking-tight">
          Compare GitHub Profiles
        </h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          Analyze and rank GitHub profiles by stars, forks, contributions, and community impact. Get insights into
          developer influence and project success.
        </p>
      </div>

      {/* Input Section - minimal */}
      <div className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 h-11 px-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
            placeholder="Enter usernames (comma or space separated)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="button"
            className="h-11 px-4 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm disabled:opacity-50"
            onClick={rank}
            disabled={loading || usernames.length === 0}
          >
            {loading ? "Ranking..." : "Rank"}
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-red-900 dark:text-red-100 mb-1">Error</h3>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {results && results.length > 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Ranking Results</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Sorted by calculated influence score</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-neutral-900 dark:text-white">Rank</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-neutral-900 dark:text-white">
                    Developer
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-neutral-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Stars
                    </div>
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-neutral-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <GitFork className="h-4 w-4" />
                      Forks
                    </div>
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-neutral-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <GitPullRequest className="h-4 w-4" />
                      PRs
                    </div>
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-neutral-900 dark:text-white">Issues</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-neutral-900 dark:text-white">Repos</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-neutral-900 dark:text-white">
                    Followers
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-neutral-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Score
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((user, idx) => (
                  <tr
                    key={user.username}
                    className="border-t border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 text-sm font-bold text-neutral-900 dark:text-white">
                        {user.rank}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl && (
                          <img
                            src={user.avatarUrl || "/placeholder.svg"}
                            alt={user.username}
                            className="w-10 h-10 rounded-full border-2 border-neutral-200 dark:border-neutral-700"
                          />
                        )}
                        <div>
                          <div className="font-semibold text-neutral-900 dark:text-white">
                            {user.name || user.username}
                          </div>
                          <div className="text-sm text-neutral-500 dark:text-neutral-400">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-sm text-neutral-900 dark:text-white">
                      {user.totalStars.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 font-mono text-sm text-neutral-900 dark:text-white">
                      {user.totalForks.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 font-mono text-sm text-neutral-900 dark:text-white">
                      {user.prCount.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 font-mono text-sm text-neutral-900 dark:text-white">
                      {user.issueCount.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 font-mono text-sm text-neutral-900 dark:text-white">
                      {user.publicRepos.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 font-mono text-sm text-neutral-900 dark:text-white">
                      {user.followers.toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-mono text-lg font-bold text-neutral-900 dark:text-white">
                        {user.score.toFixed(2)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        !loading && (
          <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
              <Github className="h-8 w-8 text-neutral-500 dark:text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">Ready to Compare</h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              Enter GitHub usernames above and click "Rank Profiles" to see detailed analytics and comparisons.
            </p>
          </div>
        )
      )}
    </div>
  )
}

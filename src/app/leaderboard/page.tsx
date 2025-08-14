"use client"

import { useEffect, useMemo, useState } from "react"
import SEO from "@/app/components/SEO"
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Filter,
  TrendingUp,
  Users,
  Star,
  GitFork,
  Search,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type LeaderboardUser = {
  username: string
  name: string | null
  avatarUrl: string | null
  followers: number
  publicRepos: number
  contributions?: number
  totalStars?: number
  totalForks?: number
  htmlUrl: string
  rank: number
}

export default function LeaderboardPage() {
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [total, setTotal] = useState(0)
  const [perPage, setPerPage] = useState(100)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrev, setHasPrev] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Filters
  const [sortBy, setSortBy] = useState<"followers" | "publicRepos" | "contribs" | "stars" | "forks">("followers")
  const [order, setOrder] = useState<"asc" | "desc">("desc")
  const [minRepos, setMinRepos] = useState<number>(0)
  const [minFollowers, setMinFollowers] = useState<number>(0)
  const [minContribs, setMinContribs] = useState<number>(0)
  const [minStars, setMinStars] = useState<number>(0)
  const [minForks, setMinForks] = useState<number>(0)
  const [includeRepoTotals, setIncludeRepoTotals] = useState<boolean>(false)

  useEffect(() => {
    let aborted = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.set("page", String(page))
        params.set("sortBy", sortBy)
        params.set("order", order)
        params.set("minRepos", String(minRepos || 0))
        params.set("minFollowers", String(minFollowers || 0))
        params.set("minContribs", String(minContribs || 0))
        if (includeRepoTotals) {
          params.set("includeRepoTotals", "1")
          params.set("minStars", String(minStars || 0))
          params.set("minForks", String(minForks || 0))
        }
        const res = await fetch(`/api/leaderboard?${params.toString()}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || "Failed to load leaderboard")
        if (!aborted) {
          setUsers(data.users as LeaderboardUser[])
          setTotal(Number(data.total || 0))
          setPerPage(Number(data.perPage || 100))
          setHasNext(Boolean(data.hasNext))
          setHasPrev(Boolean(data.hasPrev))
        }
      } catch (e: any) {
        if (!aborted) setError(String(e?.message || e))
      } finally {
        if (!aborted) setLoading(false)
      }
    }
    load()
    return () => {
      aborted = true
    }
  }, [page, sortBy, order, minRepos, minFollowers, minContribs, minStars, minForks, includeRepoTotals])

  const pageCount = useMemo(() => Math.ceil(Math.min(1000, total) / perPage) || 10, [total, perPage])

  return (
    <div className="min-h-screen">
      <SEO title="GitRanks" description="Compare and rank GitHub profiles by contributions, stars, and community impact" image="https://gitranks.vercel.app/post.png" url="https://gitranks.vercel.app/leaderboard" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-sm font-medium text-muted-foreground mb-6">
            <TrendingUp className="h-4 w-4" />
            Global Rankings
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">GitHub Leaderboard</h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Discover the most influential developers on GitHub. Rankings based on followers, contributions, and project
            impact across the platform.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-xl border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-card-foreground">Total Profiles</h3>
            </div>
            <p className="text-2xl font-bold text-card-foreground">{Math.min(1000, total).toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Top developers tracked</p>
          </div>

          <div className="bg-card rounded-xl border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="font-semibold text-card-foreground">Current Page</h3>
            </div>
            <p className="text-2xl font-bold text-card-foreground">
              {page} / {pageCount}
            </p>
            <p className="text-sm text-muted-foreground">Showing {perPage} per page</p>
          </div>

          <div className="bg-card rounded-xl border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                <GitFork className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-card-foreground">Sort Order</h3>
            </div>
            <p className="text-2xl font-bold text-card-foreground capitalize">{sortBy}</p>
            <p className="text-sm text-muted-foreground">{order === "desc" ? "Highest first" : "Lowest first"}</p>
          </div>
        </div>

        {/* Search and Filter Section */}
        <Card className="mb-8">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Search className="h-5 w-5" />
                Search & Filter
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? "Hide Filters" : "Show Filters"}
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Primary Controls - Always Visible */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="sortBy">Sort By</Label>
                <Select
                  value={sortBy}
                  onValueChange={(value) => {
                    setSortBy(value as any)
                    setPage(1)
                  }}
                >
                  <SelectTrigger id="sortBy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="followers">Followers</SelectItem>
                    <SelectItem value="publicRepos">Repositories</SelectItem>
                    <SelectItem value="contribs">Contributions</SelectItem>
                    <SelectItem value="stars" disabled={!includeRepoTotals}>
                      Stars
                    </SelectItem>
                    <SelectItem value="forks" disabled={!includeRepoTotals}>
                      Forks
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Order</Label>
                <Select
                  value={order}
                  onValueChange={(value) => {
                    setOrder(value as any)
                    setPage(1)
                  }}
                >
                  <SelectTrigger id="order">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Highest First</SelectItem>
                    <SelectItem value="asc">Lowest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Advanced Filters - Collapsible */}
            {showFilters && (
              <div className="border-t pt-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="minRepos">Min Repositories</Label>
                    <Input
                      id="minRepos"
                      type="number"
                      min={0}
                      placeholder="0"
                      value={minRepos || ""}
                      onChange={(e) => {
                        setMinRepos(Number(e.target.value || 0))
                        setPage(1)
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minFollowers">Min Followers</Label>
                    <Input
                      id="minFollowers"
                      type="number"
                      min={0}
                      placeholder="0"
                      value={minFollowers || ""}
                      onChange={(e) => {
                        setMinFollowers(Number(e.target.value || 0))
                        setPage(1)
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minContribs">Min Contributions</Label>
                    <Input
                      id="minContribs"
                      type="number"
                      min={0}
                      placeholder="0"
                      value={minContribs || ""}
                      onChange={(e) => {
                        setMinContribs(Number(e.target.value || 0))
                        setPage(1)
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="includeRepoTotals"
                      checked={includeRepoTotals}
                      onCheckedChange={(checked) => {
                        setIncludeRepoTotals(checked as boolean)
                        setPage(1)
                      }}
                    />
                    <Label htmlFor="includeRepoTotals" className="text-sm font-medium">
                      Include repository stars & forks data
                    </Label>
                  </div>

                  {includeRepoTotals && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 ml-6">
                      <div className="space-y-2">
                        <Label htmlFor="minStars">Min Stars</Label>
                        <Input
                          id="minStars"
                          type="number"
                          min={0}
                          placeholder="0"
                          value={minStars || ""}
                          onChange={(e) => {
                            setMinStars(Number(e.target.value || 0))
                            setPage(1)
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="minForks">Min Forks</Label>
                        <Input
                          id="minForks"
                          type="number"
                          min={0}
                          placeholder="0"
                          value={minForks || ""}
                          onChange={(e) => {
                            setMinForks(Number(e.target.value || 0))
                            setPage(1)
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-8">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {/* Results Table */}
        <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-card-foreground">Rank</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-card-foreground">Developer</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-card-foreground">Followers</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-card-foreground">Repos</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-card-foreground">Contributions</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-card-foreground">Stars</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-card-foreground">Forks</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-card-foreground">Profile</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="py-12 px-6 text-center text-muted-foreground" colSpan={8}>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-muted-foreground border-t-foreground rounded-full animate-spin" />
                        Loading leaderboard...
                      </div>
                    </td>
                  </tr>
                ) : users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.username} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold text-card-foreground">
                          {user.rank}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {user.avatarUrl && (
                            <img
                              src={user.avatarUrl || "/placeholder.svg"}
                              alt={user.username}
                              className="w-10 h-10 rounded-full border-2 border-border"
                            />
                          )}
                          <div>
                            <div className="font-semibold text-card-foreground">{user.name || user.username}</div>
                            <div className="text-sm text-muted-foreground">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-sm text-card-foreground">
                        {user.followers.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 font-mono text-sm text-card-foreground">
                        {user.publicRepos.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 font-mono text-sm text-card-foreground">
                        {(user.contributions ?? 0).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 font-mono text-sm text-card-foreground">
                        {includeRepoTotals ? (user.totalStars ?? 0).toLocaleString() : "—"}
                      </td>
                      <td className="py-4 px-6 font-mono text-sm text-card-foreground">
                        {includeRepoTotals ? (user.totalForks ?? 0).toLocaleString() : "—"}
                      </td>
                      <td className="py-4 px-6">
                        <a
                          href={user.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          View
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-12 px-6 text-center text-muted-foreground" colSpan={8}>
                      No results found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!hasPrev || loading}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, Math.min(1000, total))} of{" "}
            {Math.min(1000, total).toLocaleString()}
          </div>

          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNext || loading}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

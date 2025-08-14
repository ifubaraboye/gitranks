import { NextRequest, NextResponse } from "next/server";
import { cacheGetOrSet } from "@/lib/cache";

type LeaderboardUser = {
  username: string;
  name: string | null;
  avatarUrl: string | null;
  followers: number;
  publicRepos: number;
  contributions?: number;
  totalStars?: number;
  totalForks?: number;
  htmlUrl: string;
  rank: number;
};

const GITHUB_API = "https://api.github.com";

function getAuthHeaders() {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "gitranks-app",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: getAuthHeaders(), cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const msg = `${res.status} ${res.statusText} for ${url}${text ? `: ${text}` : ""}`;
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

async function fetchUsersGraphQL(logins: string[]) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "gitranks-app",
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  // Build a single query with aliases per login to batch details
  const fields = logins
    .map((login, i) => `u${i}: user(login: \"${login.replace(/"/g, "")}\") { login name avatarUrl url followers { totalCount } repositories(privacy: PUBLIC) { totalCount } contributionsCollection { contributionCalendar { totalContributions } } }`)
    .join(" ");
  const query = `{ ${fields} }`;
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers,
    body: JSON.stringify({ query }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null) as any;
  if (!data || data.errors) return null;
  const out: Array<{
    login: string;
    name: string | null;
    avatar_url: string | null;
    followers: number;
    public_repos: number;
    contributions: number;
    html_url: string;
  }> = [];
  for (let i = 0; i < logins.length; i += 1) {
    const node = data?.data?.[`u${i}`];
    if (node && node.login) {
      out.push({
        login: node.login,
        name: node.name ?? null,
        avatar_url: node.avatarUrl ?? null,
        followers: Number(node.followers?.totalCount ?? 0),
        public_repos: Number(node.repositories?.totalCount ?? 0),
        contributions: Number(node.contributionsCollection?.contributionCalendar?.totalContributions ?? 0),
        html_url: node.url,
      });
    } else {
      out.push({
        login: logins[i],
        name: null,
        avatar_url: null,
        followers: 0,
        public_repos: 0,
        contributions: 0,
        html_url: `https://github.com/${logins[i]}`,
      });
    }
  }
  return out;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const perPage = 100; // fixed to 100 for consistent pagination to 1000
    const sortBy = String(searchParams.get("sortBy") || "followers") as "followers" | "publicRepos" | "contribs" | "stars" | "forks";
    const order = (String(searchParams.get("order") || "desc").toLowerCase() === "asc" ? "asc" : "desc") as "asc" | "desc";
    const includeRepoTotals = searchParams.get("includeRepoTotals") === "1";
    const minRepos = Number(searchParams.get("minRepos") || "0");
    const minFollowers = Number(searchParams.get("minFollowers") || "0");
    const minContribs = Number(searchParams.get("minContribs") || "0");
    const minStars = Number(searchParams.get("minStars") || "0");
    const minForks = Number(searchParams.get("minForks") || "0");

    // GitHub Search API returns up to 1000 results accessible via pagination
    const searchUrl = `${GITHUB_API}/search/users?q=${encodeURIComponent(
      "followers:>0"
    )}&sort=followers&order=desc&per_page=${perPage}&page=${page}`;

    const search = await cacheGetOrSet(
      `search:followers:page:${page}`,
      2 * 60 * 60 * 1000,
      () => fetchJson<{ total_count: number; items: Array<{ login: string; avatar_url: string; html_url: string }>; }>(searchUrl)
    );

    const totalAvailable = Math.min(1000, Number(search.total_count || 0));

    // Limit concurrency by batching user detail fetches
    const logins = search.items.map((i) => i.login);
    const batchSize = 5;
    const details: Array<{
      login: string;
      name: string | null;
      avatar_url: string | null;
      followers: number;
      public_repos: number;
      contributions?: number;
      html_url: string;
    }> = [];

    // Prefer GraphQL batching when a token is provided to avoid REST rate limits
    const gqlDetails = await fetchUsersGraphQL(logins);
    if (gqlDetails) {
      details.push(...gqlDetails);
    } else {
      for (let i = 0; i < logins.length; i += batchSize) {
        const slice = logins.slice(i, i + batchSize);
        const results = await Promise.all(
          slice.map(async (login) => {
            const url = `${GITHUB_API}/users/${encodeURIComponent(login)}`;
            const res = await fetch(url, { headers: getAuthHeaders(), cache: "no-store" });
            if (res.status === 403 || res.status === 429) {
              const reset = res.headers.get("x-ratelimit-reset");
              const remaining = res.headers.get("x-ratelimit-remaining");
              throw new Error(
                `GitHub rate limit reached. Remaining=${remaining}. Set GITHUB_TOKEN and reload. Reset=${reset}`
              );
            }
            if (!res.ok) {
              return {
                login,
                name: null,
                avatar_url: null,
                followers: 0,
                public_repos: 0,
                html_url: `https://github.com/${login}`,
              };
            }
            const u = await res.json();
            return {
              login: u.login,
              name: u.name ?? null,
              avatar_url: u.avatar_url ?? null,
              followers: Number(u.followers || 0),
              public_repos: Number(u.public_repos || 0),
              contributions: 0,
              html_url: u.html_url,
            };
          })
        );
        details.push(...results);
      }
    }

    // Optionally compute repo totals for stars/forks for the current page
    let starsForks: Record<string, { stars: number; forks: number }> = {};
    if (includeRepoTotals) {
      const perUserConcurrency = 3;
      async function fetchRepoTotals(login: string) {
        const perPageRepos = 100;
        let pageRepos = 1;
        let stars = 0;
        let forks = 0;
        while (true) {
          const url = `${GITHUB_API}/users/${encodeURIComponent(login)}/repos?per_page=${perPageRepos}&page=${pageRepos}&type=owner&sort=updated`;
          const res = await fetch(url, { headers: getAuthHeaders(), cache: "no-store" });
          if (!res.ok) break;
          const batch = (await res.json()) as Array<{ stargazers_count: number; forks_count: number }>;
          for (const r of batch) {
            stars += Number(r?.stargazers_count || 0);
            forks += Number(r?.forks_count || 0);
          }
          if (batch.length < perPageRepos) break;
          pageRepos += 1;
          if (pageRepos > 5) break; // safety cap
        }
        starsForks[login] = { stars, forks };
      }
      // Run with limited concurrency
      const queue = [...logins];
      const workers: Promise<void>[] = [];
      for (let i = 0; i < perUserConcurrency; i += 1) {
        workers.push((async () => {
          while (queue.length) {
            const login = queue.shift();
            if (!login) break;
            await fetchRepoTotals(login);
          }
        })());
      }
      await Promise.all(workers);
    }

    const offset = (page - 1) * perPage;
    let users: LeaderboardUser[] = details.map((u, idx) => ({
      username: u.login,
      name: u.name,
      avatarUrl: u.avatar_url,
      followers: u.followers,
      publicRepos: u.public_repos,
      contributions: u.contributions,
      totalStars: starsForks[u.login]?.stars,
      totalForks: starsForks[u.login]?.forks,
      htmlUrl: u.html_url,
      rank: offset + idx + 1,
    }));

    // Filtering
    users = users.filter((u) =>
      u.publicRepos >= minRepos &&
      u.followers >= minFollowers &&
      (u.contributions ?? 0) >= minContribs &&
      (!includeRepoTotals || (u.totalStars ?? 0) >= minStars) &&
      (!includeRepoTotals || (u.totalForks ?? 0) >= minForks)
    );

    // Sorting
    users.sort((a, b) => {
      const dir = order === "asc" ? 1 : -1;
      const by = {
        followers: () => (a.followers - b.followers) * dir,
        publicRepos: () => (a.publicRepos - b.publicRepos) * dir,
        contribs: () => ((a.contributions ?? 0) - (b.contributions ?? 0)) * dir,
        stars: () => (((a.totalStars ?? -Infinity) - (b.totalStars ?? -Infinity)) || 0) * dir,
        forks: () => (((a.totalForks ?? -Infinity) - (b.totalForks ?? -Infinity)) || 0) * dir,
      } as const;
      return (by[sortBy] || by.followers)();
    });

    const hasNext = page * perPage < totalAvailable;
    const hasPrev = page > 1;

    return NextResponse.json({ page, perPage, total: totalAvailable, hasNext, hasPrev, users });
  } catch (error: any) {
    const message = String(error?.message || error);
    const isRate = /rate limit/i.test(message);
    return NextResponse.json({ error: message, rateLimited: isRate }, { status: isRate ? 429 : 500 });
  }
}



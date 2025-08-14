import { NextRequest, NextResponse } from "next/server";
import { cacheGetOrSet } from "@/lib/cache";

type RankRequest = {
	usernames: string[];
};

type UserRepo = {
	stargazers_count: number;
	forks_count: number;
};

type RankedUser = {
	username: string;
	name?: string | null;
	avatarUrl?: string | null;
	publicRepos: number;
	followers: number;
	totalStars: number;
	totalForks: number;
	prCount: number;
	issueCount: number;
	score: number;
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
		throw new Error(`${res.status} ${res.statusText} for ${url}`);
	}
	return res.json() as Promise<T>;
}

async function fetchUserCore(username: string) {
	const url = `${GITHUB_API}/users/${encodeURIComponent(username)}`;
	return fetchJson<{
		login: string;
		name: string | null;
		avatar_url: string | null;
		public_repos: number;
		followers: number;
	}>(url);
}

async function fetchAllRepos(username: string): Promise<UserRepo[]> {
	const perPage = 100;
	let page = 1;
	const repos: UserRepo[] = [];
	// Fetch owned public repos, paginated
	while (true) {
		const url = `${GITHUB_API}/users/${encodeURIComponent(
			username
		)}/repos?per_page=${perPage}&page=${page}&type=owner&sort=updated`;
		const batch = await fetchJson<any[]>(url);
		repos.push(
			...batch.map((r) => ({
				stargazers_count: Number(r?.stargazers_count || 0),
				forks_count: Number(r?.forks_count || 0),
			}))
		);
		if (batch.length < perPage) break;
		page += 1;
		// Safety cap to avoid excessive pagination in worst-case users
		if (page > 10) break;
	}
	return repos;
}

async function fetchSearchCount(q: string): Promise<number> {
	// Using per_page=1 reduces payload; we only need total_count
	const url = `${GITHUB_API}/search/issues?q=${encodeURIComponent(q)}&per_page=1`;
	try {
		const data = await fetchJson<{ total_count: number }>(url);
		return Number(data?.total_count || 0);
	} catch {
		return 0;
	}
}

function log2(x: number): number {
	return Math.log(x) / Math.log(2);
}

function sqrt(x: number): number {
	return Math.sqrt(x);
}

function computeScore(metrics: {
	totalStars: number;
	totalForks: number;
	prCount: number;
	issueCount: number;
	publicRepos: number;
	followers: number;
}): number {
	const starsScore = sqrt(metrics.totalStars) * 5;
	const forksScore = sqrt(metrics.totalForks) * 4;
	const prsScore = log2(metrics.prCount + 1) * 3;
    const issuesScore = log2(metrics.issueCount + 1) * 2;
	const reposScore = log2(metrics.publicRepos + 1) * 1.5;
	const followersScore = log2(metrics.followers + 1) * 2;
	return (
		starsScore + forksScore + prsScore + issuesScore + reposScore + followersScore
	);
}

export async function POST(req: NextRequest) {
	try {
		const body = (await req.json()) as RankRequest;
		const usernames = Array.from(
			new Set((body?.usernames || []).map((u) => String(u || "").trim()).filter(Boolean))
		);
		if (usernames.length === 0) {
			return NextResponse.json(
				{ error: "Provide usernames: string[]" },
				{ status: 400 }
			);
		}

		const ranked: RankedUser[] = [];

    for (const username of usernames) {
			try {
        // Cache expensive requests per-username for 6 hours
        const [user, repos, prCount, issueCount] = await Promise.all([
          cacheGetOrSet(`user:${username}`, 6 * 60 * 60 * 1000, () => fetchUserCore(username)),
          cacheGetOrSet(`repos:${username}`, 6 * 60 * 60 * 1000, () => fetchAllRepos(username)),
          cacheGetOrSet(
            `prCount:${username}`,
            6 * 60 * 60 * 1000,
            () => fetchSearchCount(`type:pr+author:${username}+is:public`)
          ),
          cacheGetOrSet(
            `issueCount:${username}`,
            6 * 60 * 60 * 1000,
            () => fetchSearchCount(`type:issue+author:${username}+is:public`)
          ),
        ]);

				const totals = repos.reduce(
					(acc, r) => {
						acc.totalStars += r.stargazers_count;
						acc.totalForks += r.forks_count;
						return acc;
					},
					{ totalStars: 0, totalForks: 0 }
				);

				const score = computeScore({
					totalStars: totals.totalStars,
					totalForks: totals.totalForks,
          prCount,
          issueCount: issueCount,
					publicRepos: user.public_repos,
					followers: user.followers,
				});

				ranked.push({
					username: user.login,
					name: user.name,
					avatarUrl: user.avatar_url,
					publicRepos: user.public_repos,
					followers: user.followers,
					totalStars: totals.totalStars,
					totalForks: totals.totalForks,
					prCount,
					issueCount: issueCount,
					score: Number(score.toFixed(2)),
					rank: 0,
				});
			} catch (e) {
				// Skip failed users but include a stub with zero score
				ranked.push({
					username,
					name: null,
					avatarUrl: null,
					publicRepos: 0,
					followers: 0,
					totalStars: 0,
					totalForks: 0,
					prCount: 0,
          issueCount: 0,
					score: 0,
					rank: 0,
				});
			}
		}

		ranked.sort((a, b) => b.score - a.score);
		ranked.forEach((u, i) => (u.rank = i + 1));

    return NextResponse.json({ results: ranked });
	} catch (error: any) {
		return NextResponse.json({ error: String(error?.message || error) }, { status: 500 });
	}
}



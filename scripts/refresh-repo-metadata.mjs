import { RESEARCH_PATH } from "../src/lib/constants.mjs";
import { readJson, writeJson } from "../src/lib/io.mjs";

const args = new Set(process.argv.slice(2));
const write = args.has("--write");
const force = args.has("--force");
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const today = new Date().toISOString().slice(0, 10);

function githubRepo(item) {
  if (item?.sourceType !== "github_repo" || !item?.url) return null;
  const url = new URL(item.url);
  if (url.hostname !== "github.com" && url.hostname !== "www.github.com") return null;
  const [owner, repo] = url.pathname.split("/").filter(Boolean);
  return owner && repo ? { owner, repo: repo.replace(/\.git$/i, "") } : null;
}

async function fetchRepoMetadata(owner, repo) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "Repo-Foundry-Metadata-Refresh",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers,
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    const remaining = response.headers.get("x-ratelimit-remaining");
    throw new Error(`${response.status} ${response.statusText}; rate-limit remaining ${remaining ?? "unknown"}`);
  }
  return response.json();
}

async function mapConcurrent(items, limit, mapper) {
  const results = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

const research = await readJson(RESEARCH_PATH, null);
if (!research || !Array.isArray(research.items)) {
  throw new Error(`Repo Foundry research source is missing or invalid: ${RESEARCH_PATH}`);
}

const targets = research.items
  .map((item, index) => ({ item, index, repo: githubRepo(item) }))
  .filter((entry) => entry.repo);

if (!targets.length) {
  throw new Error(`No GitHub repository records found in ${RESEARCH_PATH}`);
}

if (write && !force && targets.every(({ item }) => item.verifiedDate === today)) {
  console.log(JSON.stringify({
    mode: "write",
    source: RESEARCH_PATH,
    checked: 0,
    changed: 0,
    skipped: "all tracked GitHub repositories were already verified today",
  }, null, 2));
  process.exit(0);
}

const refreshed = await mapConcurrent(targets, 4, async ({ item, index, repo }) => {
  const metadata = await fetchRepoMetadata(repo.owner, repo.repo);
  if (metadata.full_name.toLowerCase() !== `${repo.owner}/${repo.repo}`.toLowerCase()) {
    throw new Error(`GitHub returned ${metadata.full_name} for ${repo.owner}/${repo.repo}`);
  }
  return {
    index,
    starsBefore: Number(item.stars || 0),
    starsAfter: Number(metadata.stargazers_count || 0),
    metadata,
  };
});

for (const result of refreshed) {
  const item = research.items[result.index];
  item.name = result.metadata.full_name;
  item.id = result.metadata.full_name;
  item.url = result.metadata.html_url;
  item.stars = result.starsAfter;
  item.source = "GitHub verified";
  item.verifiedDate = today;
  item.verifiedSource = "GitHub REST API repository endpoint";
}

research.generatedAt = new Date().toISOString();
research.summary = {
  ...(research.summary || {}),
  metadataRefresh: `Verified ${refreshed.length} tracked GitHub repositories on ${today}.`,
};

const changed = refreshed.filter((entry) => entry.starsBefore !== entry.starsAfter);
const result = {
  mode: write ? "write" : "dry-run",
  source: RESEARCH_PATH,
  checked: refreshed.length,
  changed: changed.length,
  totalStarsBefore: refreshed.reduce((sum, entry) => sum + entry.starsBefore, 0),
  totalStarsAfter: refreshed.reduce((sum, entry) => sum + entry.starsAfter, 0),
  sampleChanges: changed
    .sort((left, right) => Math.abs(right.starsAfter - right.starsBefore) - Math.abs(left.starsAfter - left.starsBefore))
    .slice(0, 10)
    .map((entry) => ({
      repo: entry.metadata.full_name,
      before: entry.starsBefore,
      after: entry.starsAfter,
      delta: entry.starsAfter - entry.starsBefore,
    })),
};

if (write) {
  await writeJson(RESEARCH_PATH, research);
}

console.log(JSON.stringify(result, null, 2));

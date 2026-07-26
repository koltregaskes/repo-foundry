import { buildVisualisations, compileMetrics, repoPreviewImage } from "./compile.mjs";

function githubRepo(repoUrl) {
  if (!repoUrl) return null;
  const url = new URL(repoUrl);
  if (url.hostname !== "github.com" && url.hostname !== "www.github.com") return null;
  const [owner, repo] = url.pathname.split("/").filter(Boolean);
  return owner && repo ? { owner, repo: repo.replace(/\.git$/i, "") } : null;
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

export async function refreshPublicRepoMetadata(siteData, fetchMetadata, options = {}) {
  if (!siteData || !Array.isArray(siteData.repos) || !siteData.repos.length) {
    throw new Error("Repo Foundry public site data has no repository records");
  }
  if (typeof fetchMetadata !== "function") {
    throw new Error("A repository metadata fetcher is required");
  }

  const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now());
  if (Number.isNaN(now.getTime())) {
    throw new Error("Invalid refresh timestamp");
  }
  const generatedAt = now.toISOString();
  const today = generatedAt.slice(0, 10);
  const force = Boolean(options.force);
  const concurrency = Math.max(1, Math.min(Number(options.concurrency || 4), 8));
  const targets = siteData.repos
    .map((repo, index) => ({ repo, index, github: githubRepo(repo.repoUrl) }))
    .filter((entry) => entry.github);

  if (!targets.length) {
    throw new Error("Repo Foundry public site data has no GitHub repository records");
  }

  if (!force && targets.every(({ repo }) => String(repo.refreshedAt || "").slice(0, 10) === today)) {
    return {
      siteData,
      result: {
        mode: "write",
        checked: 0,
        changed: 0,
        skipped: "all tracked GitHub repositories were already refreshed today",
      },
    };
  }

  const refreshed = await mapConcurrent(targets, concurrency, async ({ repo, index, github }) => {
    const metadata = await fetchMetadata(github.owner, github.repo);
    const requested = `${github.owner}/${github.repo}`.toLowerCase();
    if (!metadata?.full_name || metadata.full_name.toLowerCase() !== requested) {
      throw new Error(`GitHub returned ${metadata?.full_name || "an invalid record"} for ${github.owner}/${github.repo}`);
    }

    const updated = {
      ...repo,
      name: metadata.full_name,
      repoUrl: metadata.html_url,
      stars: Number(metadata.stargazers_count || 0),
      source: "GitHub verified",
      sourcePlatform: "GitHub",
      refreshedAt: generatedAt,
    };
    updated.imageUrl = repoPreviewImage({
      ...updated,
      url: updated.repoUrl,
    });

    return {
      index,
      before: Number(repo.stars || 0),
      after: updated.stars,
      updated,
    };
  });

  const repos = siteData.repos.map((repo) => ({ ...repo }));
  for (const entry of refreshed) {
    repos[entry.index] = entry.updated;
  }

  const visualisations = buildVisualisations(repos);
  const next = {
    ...siteData,
    generatedAt,
    repos,
    featured: repos.filter((repo) => repo.featured).slice(0, 6),
    visualisations,
    metrics: compileMetrics(repos, visualisations, generatedAt),
    sourceProvenance: {
      ...(siteData.sourceProvenance || {}),
      repositoryMetadata: {
        consumerPath: "content/public/generated/site-data.json",
        generatedAt,
        itemCount: refreshed.length,
        source: "GitHub REST API repository endpoint",
      },
    },
  };

  const changed = refreshed.filter((entry) => entry.before !== entry.after);
  return {
    siteData: next,
    result: {
      mode: "write",
      checked: refreshed.length,
      changed: changed.length,
      totalStarsBefore: refreshed.reduce((sum, entry) => sum + entry.before, 0),
      totalStarsAfter: refreshed.reduce((sum, entry) => sum + entry.after, 0),
      sampleChanges: changed
        .sort((left, right) => Math.abs(right.after - right.before) - Math.abs(left.after - left.before))
        .slice(0, 10)
        .map((entry) => ({
          repo: entry.updated.name,
          before: entry.before,
          after: entry.after,
          delta: entry.after - entry.before,
        })),
    },
  };
}

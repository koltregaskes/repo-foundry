import { NEWS_PATH, RESEARCH_PATH } from "../src/lib/constants.mjs";
import { readJson, slugify, writeJson } from "../src/lib/io.mjs";

function cleanText(value) {
  return String(value || "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*_>#]/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sourcePlatformFromUrl(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("github.com")) return "GitHub";
    if (host.includes("gitlab.com")) return "GitLab";
    if (host.includes("huggingface.co")) return "Hugging Face";
    if (host.includes("codeberg.org")) return "Codeberg";
    return host;
  } catch {
    return "Unknown";
  }
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Repo-Foundry-News-Sync",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.json();
}

function parseGitHubPath(url) {
  const { pathname } = new URL(url);
  const [owner, repo] = pathname.split("/").filter(Boolean);
  return owner && repo ? { owner, repo } : null;
}

function parseGitLabProjectPath(url) {
  const { pathname } = new URL(url);
  const pathParts = pathname
    .split("/")
    .filter(Boolean)
    .filter((part) => part !== "-" && part !== "tree");

  return pathParts.length >= 2 ? pathParts.join("/") : null;
}

function githubHighlights(body) {
  const lines = String(body || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const bulletHighlights = lines
    .filter((line) => /^[-*]\s+/.test(line))
    .map((line) => cleanText(line.replace(/^[-*]\s+/, "")))
    .filter(Boolean);

  if (bulletHighlights.length) {
    return bulletHighlights.slice(0, 3);
  }

  return lines
    .filter((line) => !/^#+\s*/.test(line))
    .map((line) => cleanText(line))
    .filter(Boolean)
    .slice(0, 3);
}

function gitlabHighlights(body) {
  const summaryMatches = [...String(body || "").matchAll(/<summary>([\s\S]*?)<\/summary>/g)];
  const summaryHighlights = summaryMatches
    .map((match) => cleanText(match[1].replace(/:\s*\w+$/g, "")))
    .filter(Boolean);

  if (summaryHighlights.length) {
    return summaryHighlights.slice(0, 3);
  }

  const quoteLines = String(body || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith(">"))
    .map((line) => cleanText(line.replace(/^>\s*/, "")))
    .filter(Boolean);

  return quoteLines.slice(0, 3);
}

function buildSummary(projectName, releaseName, highlights) {
  if (!highlights.length) {
    return `${projectName} published ${releaseName}, adding a fresh tracked release to the Repo Foundry update feed.`;
  }

  const joined = highlights.slice(0, 2).join("; ");
  return `${projectName} published ${releaseName}. Highlights include ${joined}.`;
}

async function latestGitHubRelease(item) {
  const parsed = parseGitHubPath(item.url);
  if (!parsed) return null;

  const release = await fetchJson(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/releases/latest`);
  const highlights = githubHighlights(release.body);
  const projectName = item.name || `${parsed.owner}/${parsed.repo}`;

  return {
    id: `release-${slugify(projectName)}-${slugify(release.tag_name || release.name || "latest")}`,
    title: `${projectName} released ${release.name || release.tag_name}`,
    projectName,
    url: release.html_url,
    source: item.source || "GitHub verified",
    sourcePlatform: "GitHub",
    releaseTag: release.tag_name || "",
    summary: buildSummary(projectName, release.name || release.tag_name || "a new release", highlights),
    highlights,
    relatedRepoSlugs: [slugify(projectName)],
    publishedAt: release.published_at || release.created_at || new Date().toISOString(),
    kind: "release",
    tags: [...new Set(["release", ...(item.tags || [])])],
  };
}

async function latestGitLabRelease(item) {
  const projectPath = parseGitLabProjectPath(item.url);
  if (!projectPath) return null;

  const release = await fetchJson(`https://gitlab.com/api/v4/projects/${encodeURIComponent(projectPath)}/releases/permalink/latest`);
  const highlights = gitlabHighlights(release.description);
  const releasePost = release.assets?.links?.find((link) => /release post/i.test(link.name || ""))?.url;
  const projectName = item.name || projectPath;

  return {
    id: `release-${slugify(projectName)}-${slugify(release.tag_name || release.name || "latest")}`,
    title: `${projectName} released ${release.name || release.tag_name}`,
    projectName,
    url: releasePost || `${item.url}/-/releases/${release.tag_name}`,
    source: item.source || "GitLab verified",
    sourcePlatform: "GitLab",
    releaseTag: release.tag_name || "",
    summary: buildSummary(projectName, release.name || release.tag_name || "a new release", highlights),
    highlights,
    relatedRepoSlugs: [slugify(projectName)],
    publishedAt: release.released_at || release.created_at || new Date().toISOString(),
    kind: "release",
    tags: [...new Set(["release", ...(item.tags || [])])],
  };
}

async function fetchLatestRelease(item) {
  const platform = item.sourcePlatform || sourcePlatformFromUrl(item.url || "");
  if (platform === "GitHub") return latestGitHubRelease(item);
  if (platform === "GitLab") return latestGitLabRelease(item);
  return null;
}

const research = await readJson(RESEARCH_PATH, { items: [] });
const newsItems = [];

for (const item of research.items || []) {
  if (!item?.url) continue;

  try {
    const release = await fetchLatestRelease(item);
    if (release) {
      newsItems.push(release);
    }
  } catch (error) {
    console.warn(`Skipping release sync for ${item.name || item.id}: ${error.message}`);
  }
}

newsItems.sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime());

await writeJson(NEWS_PATH, {
  generatedAt: new Date().toISOString(),
  items: newsItems.slice(0, 12),
});

console.log(`Synced release news to ${NEWS_PATH}`);

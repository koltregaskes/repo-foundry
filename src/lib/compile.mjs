import { readJson, slugify } from "./io.mjs";
import {
  ACTIVE_INTERNAL_DATA_ROOT,
  ACTIVE_INTERNAL_ROOT,
  BACKLOG_PATH,
  KNOWLEDGE_INDEX_PATH,
  NEWS_PATH,
  REPO_INVENTORY_PATH,
  RESEARCH_PATH,
  SESSION_INDEX_PATH,
  UPDATE_SCHEDULE_PATH,
} from "./constants.mjs";
import { categoryCopy, codexResources, editorialNotes, namingTrack, siteMeta } from "./manual-content.mjs";

function isoNow() {
  return new Date().toISOString();
}

function safeDate(value, fallback) {
  const parsed = new Date(value || "");
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
}

function starBand(stars) {
  if (stars >= 100000) return "100k+";
  if (stars >= 20000) return "20k-100k";
  if (stars >= 5000) return "5k-20k";
  return "0-5k";
}

function freshnessBucket(addedAt, now) {
  const parsed = new Date(addedAt || "");
  if (Number.isNaN(parsed.getTime())) return "archive";
  const ageDays = Math.max((now.getTime() - parsed.getTime()) / 86400000, 0);
  if (ageDays <= 1) return "today";
  if (ageDays <= 7) return "this-week";
  return "archive";
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

function categoryMeta(items) {
  return Object.entries(categoryCopy)
    .map(([name, copy]) => ({
      id: slugify(name),
      name,
      shortLabel: copy.shortLabel,
      description: copy.description,
      count: items.filter((item) => item.category === name).length,
    }));
}

function repoRecord(item, generatedAt) {
  const repoName = item.name || item.id || "Unknown repo";
  return {
    slug: slugify(repoName),
    name: repoName,
    repoUrl: item.url || null,
    stars: Number(item.stars || 0),
    source: item.source || "Unknown",
    sourcePlatform: item.sourcePlatform || sourcePlatformFromUrl(item.url || ""),
    category: item.category || "Productivity",
    tags: Array.isArray(item.tags) ? item.tags.map((entry) => String(entry)) : [],
    summary: item.summary || "",
    whyRelevant: item.whyRelevant || "",
    potentialUse: item.potentialUse || "",
    addedAt: safeDate(item.addedAt, generatedAt),
    refreshedAt: generatedAt,
    featured: item.extractionStatus === "shortlisted" || Number(item.stars || 0) >= 100000,
  };
}

function compileNewsItem(item, repoLookup, generatedAt) {
  const relatedRepoSlugs = Array.isArray(item.relatedRepoSlugs)
    ? item.relatedRepoSlugs.filter(Boolean)
    : item.relatedRepoSlug
      ? [item.relatedRepoSlug]
      : [];
  const derivedTags = relatedRepoSlugs.flatMap((slug) => repoLookup.get(slug)?.tags || []);
  const tags = Array.isArray(item.tags) && item.tags.length ? item.tags : [...new Set(derivedTags)];

  return {
    id: item.id || `news-${slugify(item.title || item.projectName || item.url || generatedAt)}`,
    title: item.title || item.projectName || "Release update",
    url: item.url || item.releaseUrl || null,
    source: item.source || item.sourcePlatform || sourcePlatformFromUrl(item.url || ""),
    sourcePlatform: item.sourcePlatform || sourcePlatformFromUrl(item.url || ""),
    projectName: item.projectName || relatedRepoSlugs.map((slug) => repoLookup.get(slug)?.name).find(Boolean) || "",
    releaseTag: item.releaseTag || "",
    kind: item.kind || "release",
    summary: item.summary || "",
    highlights: Array.isArray(item.highlights) ? item.highlights.slice(0, 3) : [],
    relatedRepoSlugs,
    publishedAt: safeDate(item.publishedAt, generatedAt),
    tags,
  };
}

function compileNewsFeed(newsInput, records, generatedAt) {
  const repoLookup = new Map(records.map((record) => [record.slug, record]));
  return (newsInput || [])
    .map((item) => compileNewsItem(item, repoLookup, generatedAt))
    .filter((item) => item.url && item.summary)
    .sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime())
    .slice(0, 12);
}

function buildVisualisations(records) {
  const now = new Date();
  const buildSeries = (keyFn) =>
    Object.entries(
      records.reduce((acc, record) => {
        const key = keyFn(record);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    )
      .map(([label, value]) => ({ label, value }))
      .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label));

  return {
    categoryMix: buildSeries((record) => record.category),
    sourceMix: buildSeries((record) => record.source),
    starBands: buildSeries((record) => starBand(record.stars)),
    freshness: buildSeries((record) => freshnessBucket(record.addedAt, now)),
  };
}

function compileMetrics(records, visualisations, generatedAt) {
  const todayCount = visualisations.freshness.find((entry) => entry.label === "today")?.value || 0;
  const thisWeekCount = visualisations.freshness.find((entry) => entry.label === "this-week")?.value || 0;
  return {
    totalRepos: records.length,
    featuredCount: records.filter((record) => record.featured).length,
    categories: visualisations.categoryMix.length,
    sources: visualisations.sourceMix.length,
    refreshedAt: generatedAt,
    newThisWeek: todayCount + thisWeekCount,
  };
}

function compileWatchlist(schedule) {
  return (schedule.items || []).map((item) => ({
    id: item.id,
    name: item.name,
    repoUrl: item.repoUrl,
    cadence: item.cadence,
    notes: item.notes,
  }));
}

export async function loadInternalInputs() {
  const [research, repoNews, backlog, schedule, knowledgeIndex, sessionIndex, repoInventory] = await Promise.all([
    readJson(RESEARCH_PATH, { generatedAt: null, items: [], summary: {}, sources: [] }),
    readJson(NEWS_PATH, { generatedAt: null, items: [] }),
    readJson(BACKLOG_PATH, { generatedAt: null, items: [] }),
    readJson(UPDATE_SCHEDULE_PATH, { generatedAt: null, items: [] }),
    readJson(KNOWLEDGE_INDEX_PATH, []),
    readJson(SESSION_INDEX_PATH, { sessions: [] }),
    readJson(REPO_INVENTORY_PATH, { generatedAt: null, counts: {}, zones: {} }),
  ]);

  return { research, repoNews, backlog, schedule, knowledgeIndex, sessionIndex, repoInventory };
}

export async function compilePublicSiteData() {
  const { research, repoNews, schedule } = await loadInternalInputs();
  const generatedAt = safeDate(research.generatedAt, isoNow());
  const records = (research.items || [])
    .map((item) => repoRecord(item, generatedAt))
    .sort((left, right) => new Date(right.addedAt).getTime() - new Date(left.addedAt).getTime());

  const visualisations = buildVisualisations(records);
  const categories = categoryMeta(records);
  const featured = records.filter((item) => item.featured).slice(0, 6);
  const news = compileNewsFeed(repoNews.items, records, generatedAt);
  const metrics = compileMetrics(records, visualisations, generatedAt);

  return {
    generatedAt,
    workingTitle: siteMeta.workingTitle,
    strapline: siteMeta.strapline,
    description: siteMeta.description,
    publicBoundary: siteMeta.publicBoundary,
    repos: records,
    featured,
    categories,
    news,
    watchlist: compileWatchlist(schedule),
    visualisations,
    metrics,
    codexResources,
    editorialNotes,
  };
}

export async function compileInternalSeed() {
  const { backlog, knowledgeIndex, repoInventory, research, schedule, sessionIndex } = await loadInternalInputs();

  return {
    generatedAt: isoNow(),
    canonicalRepoPath: "W:\\Repos\\_My Open Source\\repo-foundry",
    internalRuntimePath: "W:\\Repos\\_local\\surfaces\\repo-foundry-internal",
    activeInternalPath: ACTIVE_INTERNAL_ROOT,
    activeDataPath: ACTIVE_INTERNAL_DATA_ROOT,
    legacyRuntimePath: "W:\\Repos\\_local\\surfaces\\repos-hub\\local-hub",
    publicBoundary: siteMeta.publicBoundary,
    namingTrack,
    counts: repoInventory.counts || {},
    researchSummary: research.summary || {},
    backlogCount: Array.isArray(backlog.items) ? backlog.items.length : 0,
    knowledgeSections: Array.isArray(knowledgeIndex) ? knowledgeIndex.length : 0,
    watchlistCount: Array.isArray(schedule.items) ? schedule.items.length : 0,
    sessionCount: Array.isArray(sessionIndex.sessions) ? sessionIndex.sessions.length : 0,
  };
}

import { slugify } from "./io.mjs";

export const ROUTED_NEWS_PUBLIC_PATH = "content/public/generated/news-feed-latest.json";
export const DEFAULT_MAX_ROUTED_NEWS_AGE_DAYS = 3;

const NAMED_HTML_ENTITIES = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

function decodeHtmlEntities(value) {
  return String(value || "").replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    const lowerEntity = entity.toLowerCase();
    if (lowerEntity.startsWith("#x")) {
      const codePoint = Number.parseInt(lowerEntity.slice(2), 16);
      return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint);
    }
    if (lowerEntity.startsWith("#")) {
      const codePoint = Number.parseInt(lowerEntity.slice(1), 10);
      return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint);
    }
    return NAMED_HTML_ENTITIES[lowerEntity] ?? match;
  });
}

function cleanPublicText(value) {
  return decodeHtmlEntities(
    String(value || "")
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/(?:p|li|h[1-6])>/gi, ". ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .replace(/(?:\.\s*){2,}/g, ". ")
    .trim();
}

function truncate(value, maxLength = 420) {
  const text = String(value || "").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function parseDate(value, label) {
  const parsed = new Date(value || "");
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Routed news ${label} is missing or invalid.`);
  }
  return parsed;
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

function relatedRepoSlugs(url) {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("github.com") && !parsed.hostname.includes("gitlab.com")) return [];
    const [owner, repo] = parsed.pathname.split("/").filter(Boolean);
    return owner && repo ? [slugify(`${owner}/${repo}`)] : [];
  } catch {
    return [];
  }
}

function projectName(article) {
  const source = cleanPublicText(article.source);
  const namedSource = source.split("·").at(-1)?.trim();
  return namedSource || source || sourcePlatformFromUrl(article.url);
}

export function assertRoutedNewsFeed(
  feed,
  {
    now = new Date(),
    maxAgeDays = DEFAULT_MAX_ROUTED_NEWS_AGE_DAYS,
    expectedSite = "Repo Foundry",
  } = {},
) {
  if (!feed || typeof feed !== "object" || Array.isArray(feed)) {
    throw new Error("Routed news feed is missing.");
  }
  if (feed.site !== expectedSite) {
    throw new Error(`Routed news feed site must be "${expectedSite}", received "${feed.site || "missing"}".`);
  }
  if (!Array.isArray(feed.articles) || feed.articles.length === 0) {
    throw new Error("Routed news feed has no articles.");
  }
  if (Number(feed.article_count) !== feed.articles.length) {
    throw new Error(
      `Routed news article_count is ${feed.article_count}; expected ${feed.articles.length}.`,
    );
  }

  const nowDate = parseDate(now, "verification clock");
  const generatedAt = parseDate(feed.generated, "generated timestamp");
  const maxAgeMs = Number(maxAgeDays) * 86_400_000;
  const futureToleranceMs = 5 * 60_000;
  const generatedAgeMs = nowDate.getTime() - generatedAt.getTime();

  if (!Number.isFinite(maxAgeMs) || maxAgeMs <= 0) {
    throw new Error("Routed news maximum age must be a positive number of days.");
  }
  if (generatedAgeMs < -futureToleranceMs) {
    throw new Error("Routed news generated timestamp is in the future.");
  }
  if (generatedAgeMs > maxAgeMs) {
    throw new Error(
      `Routed news feed is ${(generatedAgeMs / 86_400_000).toFixed(1)} days old; maximum is ${maxAgeDays}.`,
    );
  }

  const itemDates = feed.articles.map((article, index) => {
    if (!article?.title || !article?.url) {
      throw new Error(`Routed news article ${index + 1} is missing title or URL.`);
    }
    let parsedUrl;
    try {
      parsedUrl = new URL(article.url);
    } catch {
      throw new Error(`Routed news article ${index + 1} has an invalid URL.`);
    }
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error(`Routed news article ${index + 1} URL must use HTTP or HTTPS.`);
    }
    return parseDate(article.date, `article ${index + 1} date`);
  });
  const newestItemAt = new Date(Math.max(...itemDates.map((date) => date.getTime())));
  const newestItemAgeMs = nowDate.getTime() - newestItemAt.getTime();

  if (newestItemAgeMs < -futureToleranceMs) {
    throw new Error("Routed news newest article timestamp is in the future.");
  }
  if (newestItemAgeMs > maxAgeMs) {
    throw new Error(
      `Routed news newest article is ${(newestItemAgeMs / 86_400_000).toFixed(1)} days old; maximum is ${maxAgeDays}.`,
    );
  }

  return {
    consumerPath: ROUTED_NEWS_PUBLIC_PATH,
    generatedAt: generatedAt.toISOString(),
    newestItemAt: newestItemAt.toISOString(),
    itemCount: feed.articles.length,
  };
}

export function compileRoutedNewsFeed(feed, options = {}) {
  const provenance = assertRoutedNewsFeed(feed, options);
  const news = feed.articles
    .map((article) => {
      const publishedAt = parseDate(article.date, "article date").toISOString();
      const tags = [...new Set([...(article.tags || []), ...(article.matching_tags || [])])]
        .map((tag) => cleanPublicText(tag))
        .filter(Boolean);
      const summary = truncate(cleanPublicText(article.summary || article.title));
      const source = cleanPublicText(article.source) || sourcePlatformFromUrl(article.url);

      return {
        id: `routed-${slugify(`${source}-${article.title}-${publishedAt}`)}`,
        title: cleanPublicText(article.title),
        url: article.url,
        source,
        sourcePlatform: sourcePlatformFromUrl(article.url),
        projectName: projectName(article),
        releaseTag: "",
        kind: /\/releases?\//i.test(article.url) ? "release" : "news",
        summary,
        highlights: [],
        relatedRepoSlugs: relatedRepoSlugs(article.url),
        publishedAt,
        tags,
      };
    })
    .filter((article) => article.title && article.url && article.summary)
    .sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime())
    .slice(0, 12);

  if (news.length === 0) {
    throw new Error("Routed news feed produced no public-safe articles.");
  }

  return { news, provenance: { ...provenance, consumedItems: news.length } };
}

export function applyRoutedNewsFeed(siteData, feed, options = {}) {
  if (!siteData || typeof siteData !== "object" || !Array.isArray(siteData.repos)) {
    throw new Error("Compiled site data is missing or invalid.");
  }
  const { news, provenance } = compileRoutedNewsFeed(feed, options);
  return {
    ...siteData,
    news,
    sourceProvenance: {
      ...(siteData.sourceProvenance || {}),
      news: provenance,
    },
  };
}

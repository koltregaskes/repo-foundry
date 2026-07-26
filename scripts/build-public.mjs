import path from "node:path";

import {
  buildAboutPage,
  buildContactPage,
  buildCodexPage,
  buildLaneDetailPage,
  buildLanesPage,
  buildNewsPage,
  buildPublicHome,
  buildRepoDetailPage,
  buildRepoDirectoryPage,
  buildTrendingPage,
  buildVisualisationsPage,
} from "../src/templates/public.mjs";
import { compilePublicSiteData } from "../src/lib/compile.mjs";
import { PUBLIC_DIST_ROOT, PUBLIC_GENERATED_ROOT, ROUTED_NEWS_PATH } from "../src/lib/constants.mjs";
import { copyFile, ensureDir, readJson, removeDir, writeJson, writeText } from "../src/lib/io.mjs";
import { applyRoutedNewsFeed } from "../src/lib/routed-news.mjs";

async function writePage(relativePath, html) {
  const targetPath = path.join(PUBLIC_DIST_ROOT, relativePath);
  await writeText(targetPath, html);
}

const generatedPath = path.join(PUBLIC_GENERATED_ROOT, "site-data.json");
const generatedSiteData = await readJson(generatedPath, { repos: [] });
const routedNews = await readJson(ROUTED_NEWS_PATH, {
  generated: null,
  site: null,
  article_count: 0,
  articles: [],
});
const siteData = generatedSiteData.repos?.length
  ? applyRoutedNewsFeed(generatedSiteData, routedNews)
  : await compilePublicSiteData();

await removeDir(PUBLIC_DIST_ROOT);
await ensureDir(PUBLIC_DIST_ROOT);
await ensureDir(path.join(PUBLIC_DIST_ROOT, "assets"));
await ensureDir(path.join(PUBLIC_DIST_ROOT, "data"));

await copyFile(path.join(process.cwd(), "src", "assets", "shared.css"), path.join(PUBLIC_DIST_ROOT, "assets", "shared.css"));
await copyFile(path.join(process.cwd(), "src", "assets", "tokens.css"), path.join(PUBLIC_DIST_ROOT, "assets", "tokens.css"));
await copyFile(path.join(process.cwd(), "src", "assets", "shell.js"), path.join(PUBLIC_DIST_ROOT, "assets", "shell.js"));
await copyFile(path.join(process.cwd(), "src", "assets", "favicon.svg"), path.join(PUBLIC_DIST_ROOT, "assets", "favicon.svg"));
await copyFile(path.join(process.cwd(), "src", "assets", "public-app.js"), path.join(PUBLIC_DIST_ROOT, "assets", "public-app.js"));
await writeText(path.join(PUBLIC_DIST_ROOT, ".nojekyll"), "");
await writeJson(path.join(PUBLIC_DIST_ROOT, "data", "source-provenance.json"), siteData.sourceProvenance);

await writePage("index.html", buildPublicHome(siteData, "./"));
await writePage(path.join("trending", "index.html"), buildTrendingPage(siteData, false, "../"));
await writePage(path.join("trending", "archive", "index.html"), buildTrendingPage(siteData, true, "../../"));
await writePage(path.join("repos", "index.html"), buildRepoDirectoryPage(siteData, false, "../"));
await writePage(path.join("repos", "archive", "index.html"), buildRepoDirectoryPage(siteData, true, "../../"));
await writePage(path.join("lanes", "index.html"), buildLanesPage(siteData, "../"));
await writePage(path.join("news", "index.html"), buildNewsPage(siteData, "../"));
await writePage(path.join("visualisations", "index.html"), buildVisualisationsPage(siteData, "../"));
await writePage(path.join("resources", "codex", "index.html"), buildCodexPage(siteData, "../../"));
await writePage(path.join("about", "index.html"), buildAboutPage(siteData, "../"));
await writePage(path.join("contact", "index.html"), buildContactPage(siteData, "../"));

for (const repo of siteData.repos) {
  await writePage(path.join("repos", repo.slug, "index.html"), buildRepoDetailPage(siteData, repo, "../../"));
}

for (const category of siteData.categories) {
  await writePage(path.join("lanes", category.id, "index.html"), buildLaneDetailPage(siteData, category, "../../"));
}

await writePage("404.html", buildPublicHome(siteData, "./"));

const publicRoutes = [
  "",
  "trending/",
  "trending/archive/",
  "repos/",
  "repos/archive/",
  "lanes/",
  "news/",
  "visualisations/",
  "resources/codex/",
  "about/",
  "contact/",
  ...siteData.repos.map((repo) => `repos/${repo.slug}/`),
  ...siteData.categories.map((category) => `lanes/${category.id}/`),
];

const siteUrl = "https://koltregaskes.github.io/repo-foundry";
const lastmod = new Date(siteData.generatedAt || Date.now()).toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${publicRoutes
  .map((route) => `  <url><loc>${siteUrl}/${route}</loc><lastmod>${lastmod}</lastmod></url>`)
  .join("\n")}
</urlset>
`;

await writeText(path.join(PUBLIC_DIST_ROOT, "sitemap.xml"), sitemap);
await writeText(
  path.join(PUBLIC_DIST_ROOT, "robots.txt"),
  `User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: anthropic-ai
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`,
);
await writeText(
  path.join(PUBLIC_DIST_ROOT, "llms.txt"),
  `# Repo Foundry

Repo Foundry is a public-safe discovery surface for high-signal open-source repositories, release updates, lane maps, snapshots, and Codex-adjacent resources.

## Start Here
- [Home](${siteUrl}/): public front door and current signal summary.
- [Trending](${siteUrl}/trending/): current high-signal repository movement.
- [Repository directory](${siteUrl}/repos/): public repo dossiers and archive routes.

## Main Sections
- [Lanes](${siteUrl}/lanes/): topic and category maps.
- [News](${siteUrl}/news/): release and ecosystem update feed.
- [Visualisations](${siteUrl}/visualisations/): public-safe charts and snapshots.
- [Codex resources](${siteUrl}/resources/codex/): Codex-adjacent references and public resources.
- [About](${siteUrl}/about/): scope, public/private boundary, and editorial posture.

## Agent Notes
- Private operational records and coordination material are excluded from this public build.
- Treat repository scores, ranks, stars, and release rows as snapshot data tied to the public build timestamp.
- Prefer links on individual dossiers before repeating repository claims.
`,
);

console.log(`Built public site into ${PUBLIC_DIST_ROOT}`);

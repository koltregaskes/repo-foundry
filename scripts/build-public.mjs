import path from "node:path";

import {
  buildAboutPage,
  buildCodexPage,
  buildNewsPage,
  buildPublicHome,
  buildRepoDetailPage,
  buildRepoDirectoryPage,
  buildTrendingPage,
  buildVisualisationsPage,
} from "../src/templates/public.mjs";
import { compilePublicSiteData } from "../src/lib/compile.mjs";
import { PUBLIC_DIST_ROOT, PUBLIC_GENERATED_ROOT } from "../src/lib/constants.mjs";
import { copyFile, ensureDir, readJson, removeDir, writeText } from "../src/lib/io.mjs";

async function writePage(relativePath, html) {
  const targetPath = path.join(PUBLIC_DIST_ROOT, relativePath);
  await writeText(targetPath, html);
}

const generatedPath = path.join(PUBLIC_GENERATED_ROOT, "site-data.json");
const siteData = (await readJson(generatedPath, null)) ?? (await compilePublicSiteData());

await removeDir(PUBLIC_DIST_ROOT);
await ensureDir(PUBLIC_DIST_ROOT);
await ensureDir(path.join(PUBLIC_DIST_ROOT, "assets"));

await copyFile(path.join(process.cwd(), "src", "assets", "shared.css"), path.join(PUBLIC_DIST_ROOT, "assets", "shared.css"));
await copyFile(path.join(process.cwd(), "src", "assets", "public-app.js"), path.join(PUBLIC_DIST_ROOT, "assets", "public-app.js"));
await writeText(path.join(PUBLIC_DIST_ROOT, ".nojekyll"), "");

await writePage("index.html", buildPublicHome(siteData, "./"));
await writePage(path.join("trending", "index.html"), buildTrendingPage(siteData, false, "../"));
await writePage(path.join("trending", "archive", "index.html"), buildTrendingPage(siteData, true, "../../"));
await writePage(path.join("repos", "index.html"), buildRepoDirectoryPage(siteData, false, "../"));
await writePage(path.join("repos", "archive", "index.html"), buildRepoDirectoryPage(siteData, true, "../../"));
await writePage(path.join("news", "index.html"), buildNewsPage(siteData, "../"));
await writePage(path.join("visualisations", "index.html"), buildVisualisationsPage(siteData, "../"));
await writePage(path.join("resources", "codex", "index.html"), buildCodexPage(siteData, "../../"));
await writePage(path.join("about", "index.html"), buildAboutPage(siteData, "../"));

for (const repo of siteData.repos) {
  await writePage(path.join("repos", repo.slug, "index.html"), buildRepoDetailPage(siteData, repo, "../../"));
}

await writePage("404.html", buildPublicHome(siteData, "./"));

console.log(`Built public site into ${PUBLIC_DIST_ROOT}`);

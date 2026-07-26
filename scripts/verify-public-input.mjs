import { PUBLIC_GENERATED_ROOT, ROUTED_NEWS_PATH } from "../src/lib/constants.mjs";
import { readJson } from "../src/lib/io.mjs";
import { applyRoutedNewsFeed, ROUTED_NEWS_PUBLIC_PATH } from "../src/lib/routed-news.mjs";
import path from "node:path";

const siteDataPath = path.join(PUBLIC_GENERATED_ROOT, "site-data.json");
const siteData = await readJson(siteDataPath, { repos: [] });
const routedNews = await readJson(ROUTED_NEWS_PATH, {});
const compiled = applyRoutedNewsFeed(siteData, routedNews);
const provenance = compiled.sourceProvenance?.news;

if (provenance?.consumerPath !== ROUTED_NEWS_PUBLIC_PATH) {
  throw new Error(`Public build did not record the routed news consumer path: ${ROUTED_NEWS_PUBLIC_PATH}`);
}
if (compiled.news[0]?.url !== routedNews.articles
  .toSorted((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())[0]?.url) {
  throw new Error("Public build did not consume the newest routed news item.");
}

console.log(JSON.stringify({
  result: "pass",
  consumerPath: provenance.consumerPath,
  sourceGeneratedAt: provenance.generatedAt,
  newestItemAt: provenance.newestItemAt,
  consumedItems: provenance.consumedItems,
}, null, 2));

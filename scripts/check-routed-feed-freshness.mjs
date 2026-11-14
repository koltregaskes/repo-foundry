import {assertRoutedNewsFeed} from '../src/lib/routed-news.mjs';
/**
 * Fails once the committed routed feed is a day old.
 *
 * The public build still refuses the feed at three days. This check runs on
 * a schedule so a missed refresh is visible before that gate. The refresh
 * workflow is what fetches sources and commits the feed.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const FEED_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "content",
  "public",
  "generated",
  "news-feed-latest.json",
);
export const WARN_AFTER_DAYS = 1;
export const HARD_MAX_DAYS = 3;
export const MISSING_SOURCE =
  "The 05:15 UTC refresh fetches every source in the shared news sources.json and commits this file after a successful fetch, including an empty article list when nothing matches. Failed sources are reported by name while healthy sources still refresh the feed; if every source fails, the file stays unchanged. This check means the committed feed was not replaced. Shared routing lists Repo Foundry as a destination (sites/repo-foundry/content/public/generated).";

export function assessRoutedFeedFreshness(feed, now = new Date()) {
  const provenance=assertRoutedNewsFeed(feed,{now,maxAgeDays:HARD_MAX_DAYS,allowStale:true});
  const generatedMs=new Date(provenance.generatedAt).getTime();
  const newestMs=provenance.newestItemAt?new Date(provenance.newestItemAt).getTime():generatedMs;
  const ageDays=Math.max(new Date(now)-generatedMs,new Date(now)-newestMs)/86400000;
  return {...provenance,ageDays,warn:ageDays>=WARN_AFTER_DAYS,hardFail:ageDays>HARD_MAX_DAYS};
}

export function formatReport(assessment) {
  return [
    `Routed feed is ${assessment.ageDays.toFixed(1)} days old (generated ${assessment.generatedAt}, newest item ${assessment.newestItemAt ?? 'none (empty source)'}).`,
    `This check fails at ${WARN_AFTER_DAYS} day so a missed refresh is visible before the ${HARD_MAX_DAYS}-day build gate.`,
    `Missing source: ${MISSING_SOURCE}`,
  ].join(" ");
}

function main() {
  const feed = JSON.parse(fs.readFileSync(FEED_PATH, "utf8"));
  const assessment = assessRoutedFeedFreshness(feed);
  const report = formatReport(assessment);
  if (assessment.warn) {
    console.error(`::error title=Routed feed is going stale::${report}`);
    process.exitCode = 1;
    return;
  }
  console.log(report);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  try {
    main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`::error title=Routed feed check failed::${message}`);
    process.exitCode = 1;
  }
}

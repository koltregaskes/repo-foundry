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
  "The 05:15 UTC refresh fetches every source in the shared news sources.json and commits this file only when that fetch returns items. A source that cannot be fetched fails that run by name. This check means the committed feed was not replaced. Shared routing lists Repo Foundry as a destination (sites/repo-foundry/content/public/generated).";

export function assessRoutedFeedFreshness(feed, now = new Date()) {
  if (!feed || typeof feed !== "object" || !Array.isArray(feed.articles) || feed.articles.length === 0) {
    throw new Error("Routed feed is missing articles.");
  }

  const nowMs = new Date(now).getTime();
  if (!Number.isFinite(nowMs)) {
    throw new Error("Routed feed freshness clock is invalid.");
  }

  const generatedMs = new Date(feed.generated).getTime();
  if (!Number.isFinite(generatedMs)) {
    throw new Error("Routed feed generated timestamp is missing or invalid.");
  }

  const itemTimes = feed.articles.map((article, index) => {
    const time = new Date(article?.date).getTime();
    if (!Number.isFinite(time)) {
      throw new Error(`Routed feed article ${index + 1} date is missing or invalid.`);
    }
    return time;
  });
  const newestMs = Math.max(...itemTimes);
  const ageDays = Math.max(nowMs - generatedMs, nowMs - newestMs) / 86_400_000;

  return {
    ageDays,
    generatedAt: new Date(generatedMs).toISOString(),
    newestItemAt: new Date(newestMs).toISOString(),
    warn: ageDays >= WARN_AFTER_DAYS,
    hardFail: ageDays > HARD_MAX_DAYS,
  };
}

export function formatReport(assessment) {
  return [
    `Routed feed is ${assessment.ageDays.toFixed(1)} days old (generated ${assessment.generatedAt}, newest item ${assessment.newestItemAt}).`,
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

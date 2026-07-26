import assert from "node:assert/strict";
import test from "node:test";

import {
  applyRoutedNewsFeed,
  assertRoutedNewsFeed,
  ROUTED_NEWS_PUBLIC_PATH,
} from "../src/lib/routed-news.mjs";

const now = new Date("2026-07-26T12:00:00.000Z");
const baseSiteData = {
  generatedAt: "2026-04-21T17:05:00.000Z",
  repos: [],
  news: [{ title: "Stale internal item", url: "https://example.com/stale" }],
};
const routedFeed = {
  generated: "2026-07-25T17:47:27.635Z",
  site: "Repo Foundry",
  article_count: 2,
  articles: [
    {
      title: "Older update",
      url: "https://github.com/example/tool/releases/tag/v1.0.0",
      source: "GitHub Releases · Example Tool",
      tags: ["repo_update"],
      matching_tags: ["tool_update"],
      date: "2026-07-24T19:57:10.000Z",
      summary: "<p>A useful <strong>release</strong>.</p>",
    },
    {
      title: "Newest update",
      url: "https://github.com/example/tool/releases/tag/v1.1.0",
      source: "GitHub Releases · Example Tool",
      tags: ["repo_update"],
      matching_tags: ["tool_update"],
      date: "2026-07-25T01:56:18.000Z",
      summary: "<script>alert('no')</script><p>Fresh public detail.</p>",
    },
  ],
};

test("public data consumes the routed feed and records its exact consumer path", () => {
  const compiled = applyRoutedNewsFeed(baseSiteData, routedFeed, { now });

  assert.equal(compiled.sourceProvenance.news.consumerPath, ROUTED_NEWS_PUBLIC_PATH);
  assert.equal(compiled.sourceProvenance.news.generatedAt, "2026-07-25T17:47:27.635Z");
  assert.equal(compiled.sourceProvenance.news.newestItemAt, "2026-07-25T01:56:18.000Z");
  assert.equal(compiled.news[0].title, "Newest update");
  assert.equal(compiled.news[0].url, routedFeed.articles[1].url);
  assert.equal(compiled.news[0].summary, "Fresh public detail.");
  assert.ok(!compiled.news.some((item) => item.title === "Stale internal item"));
});

test("source-age gate rejects a stale routed feed", () => {
  const staleFeed = { ...routedFeed, generated: "2026-07-20T00:00:00.000Z" };

  assert.throws(
    () => assertRoutedNewsFeed(staleFeed, { now, maxAgeDays: 3 }),
    /feed is 6\.5 days old/,
  );
});

test("source-age gate rejects a feed with stale articles", () => {
  const staleArticles = {
    ...routedFeed,
    articles: routedFeed.articles.map((article) => ({ ...article, date: "2026-07-20T00:00:00.000Z" })),
  };

  assert.throws(
    () => assertRoutedNewsFeed(staleArticles, { now, maxAgeDays: 3 }),
    /newest article is 6\.5 days old/,
  );
});

test("feed contract rejects mismatched article counts", () => {
  assert.throws(
    () => assertRoutedNewsFeed({ ...routedFeed, article_count: 3 }, { now }),
    /article_count is 3; expected 2/,
  );
});

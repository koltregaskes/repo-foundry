import assert from "node:assert/strict";
import test from "node:test";

import { refreshPublicRepoMetadata } from "../src/lib/public-repo-refresh.mjs";

function fixture() {
  return {
    generatedAt: "2026-07-25T18:00:00.000Z",
    repos: [
      {
        slug: "owner-project",
        name: "owner/project",
        repoUrl: "https://github.com/owner/project",
        stars: 10,
        category: "Workflow automation",
        source: "GitHub verified",
        sourcePlatform: "GitHub",
        addedAt: "2026-07-20T10:00:00.000Z",
        refreshedAt: "2026-07-25T18:00:00.000Z",
        featured: true,
      },
    ],
    featured: [],
    visualisations: {},
    metrics: {},
    sourceProvenance: {
      news: { itemCount: 2 },
    },
  };
}

test("refreshPublicRepoMetadata updates public records and derived views", async () => {
  const source = fixture();
  const refreshed = await refreshPublicRepoMetadata(
    source,
    async () => ({
      full_name: "owner/project",
      html_url: "https://github.com/owner/project",
      stargazers_count: 42,
    }),
    { now: "2026-07-26T18:07:00.000Z" },
  );

  assert.equal(refreshed.result.checked, 1);
  assert.equal(refreshed.result.changed, 1);
  assert.equal(refreshed.siteData.repos[0].stars, 42);
  assert.equal(refreshed.siteData.repos[0].refreshedAt, "2026-07-26T18:07:00.000Z");
  assert.match(refreshed.siteData.repos[0].imageUrl, /^data:image\/svg\+xml/);
  assert.equal(refreshed.siteData.featured[0].stars, 42);
  assert.equal(refreshed.siteData.metrics.totalRepos, 1);
  assert.equal(refreshed.siteData.metrics.refreshedAt, "2026-07-26T18:07:00.000Z");
  assert.equal(refreshed.siteData.sourceProvenance.news.itemCount, 2);
  assert.equal(refreshed.siteData.sourceProvenance.repositoryMetadata.itemCount, 1);
});

test("refreshPublicRepoMetadata skips a duplicate same-day refresh", async () => {
  const source = fixture();
  source.repos[0].refreshedAt = "2026-07-26T08:00:00.000Z";
  let calls = 0;
  const refreshed = await refreshPublicRepoMetadata(
    source,
    async () => {
      calls += 1;
      return {};
    },
    { now: "2026-07-26T18:07:00.000Z" },
  );

  assert.equal(calls, 0);
  assert.equal(refreshed.result.checked, 0);
  assert.match(refreshed.result.skipped, /already refreshed today/);
  assert.strictEqual(refreshed.siteData, source);
});

test("refreshPublicRepoMetadata rejects mismatched GitHub identity", async () => {
  await assert.rejects(
    refreshPublicRepoMetadata(
      fixture(),
      async () => ({
        full_name: "someone-else/project",
        html_url: "https://github.com/someone-else/project",
        stargazers_count: 42,
      }),
      { now: "2026-07-26T18:07:00.000Z" },
    ),
    /GitHub returned someone-else\/project/,
  );
});

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

test("an unverified identity change is reported and previous metadata retained", async () => {
 const source=fixture();const result=await refreshPublicRepoMetadata(source,async()=>({full_name:'someone-else/project',html_url:'https://github.com/someone-else/project',stargazers_count:42}),{now:'2026-07-26T18:07:00Z'});
 assert.strictEqual(result.siteData,source);assert.equal(result.result.failed,1);assert.match(result.result.failures[0].reason,/GitHub returned/);
});
test("verified rename updates canonical identity without changing the dossier slug", async () => {
 const result=await refreshPublicRepoMetadata(fixture(),async()=>({id:123,full_name:'new-owner/renamed',html_url:'https://github.com/new-owner/renamed',redirectedFrom:'owner/project',stargazers_count:42}),{now:'2026-07-26T18:07:00Z'});
 assert.equal(result.siteData.repos[0].name,'new-owner/renamed');assert.equal(result.siteData.repos[0].repoUrl,'https://github.com/new-owner/renamed');assert.equal(result.siteData.repos[0].slug,'owner-project');assert.deepEqual(result.result.renamed,['new-owner/renamed']);
});
test("one failed repository cannot block healthy records and retains its old timestamp", async () => {
 const source=fixture();source.repos.push({...source.repos[0],slug:'offline',repoUrl:'https://github.com/owner/offline',name:'owner/offline'});
 const result=await refreshPublicRepoMetadata(source,async(owner,repo)=>{if(repo==='offline')throw Error('GitHub HTTP 404');return {full_name:'owner/project',html_url:'https://github.com/owner/project',stargazers_count:42};},{now:'2026-07-26T18:07:00Z'});
 assert.equal(result.result.updated,1);assert.equal(result.result.failed,1);assert.equal(result.siteData.repos[0].stars,42);assert.deepEqual(result.siteData.repos[1],source.repos[1]);assert.equal(result.siteData.sourceProvenance.repositoryMetadata.itemCount,1);
});

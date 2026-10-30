import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  applySiteFilter,
  parseHtml,
  parseRss,
  refreshRoutedFeed,
} from "../scripts/refresh-routed-feed.mjs";

const repoFoundryFilter = {
  name: "Repo Foundry",
  include_tags: ["open_source", "github_release"],
  exclude_tags: ["crypto"],
  min_importance_score: 0.35,
  max_articles_per_run: 15,
};

function pipeline(dir, sources) {
  fs.mkdirSync(path.join(dir, "config"), { recursive: true });
  fs.writeFileSync(path.join(dir, "site-filters.json"), JSON.stringify({
    sites: { "repo-foundry": repoFoundryFilter },
  }));
  fs.writeFileSync(path.join(dir, "config", "sources.json"), JSON.stringify({ sources }));
}

test("rss entries keep the source tags and the site filter", () => {
  const rss = `<?xml version="1.0"?><rss version="2.0"><channel>
    <item><title>Open model release</title><link>https://example.com/model</link><pubDate>Sat, 24 Oct 2026 16:15:50 GMT</pubDate><description>Fetched summary.</description></item>
    </channel></rss>`;
  const entries = parseRss(rss, { maxItems: 5 });
  const kept = applySiteFilter([
    {
      ...entries[0],
      source: "Hugging Face Blog",
      tags: ["open_source"],
      importance: 0.35,
      category: "open-source",
    },
    {
      title: "Funding round",
      url: "https://example.com/funding",
      date: "2026-10-25T12:00:00.000Z",
      source: "TechCrunch AI",
      tags: ["funding"],
      importance: 0.35,
      summary: "Funding",
      category: "industry-media",
    },
  ], repoFoundryFilter, new Date("2026-10-26T00:00:00.000Z"));

  assert.deepEqual(kept.map((item) => item.url), ["https://example.com/model"]);
  assert.deepEqual(kept[0].matching_tags, ["open_source"]);
});

test("html listings use dates that are on the page", () => {
  const html = `<!DOCTYPE html><html><body>
    <a href="https://arstechnica.com/ai/2026/10/openai-cloud/">OpenAI models reach Google Cloud</a>
    <time datetime="2026-10-23T16:19:55-04:00">10/23/2026</time>
    <a href="https://www.digg.com/ai/bpr7gowe"><h3>T3 Code work list</h3></a>
    "clusterUrlId":"bpr7gowe","createdAt":"2026-10-25T20:01:22.038587+00:00"
    </body></html>`;
  const dated = parseHtml(html, {
    url: "https://arstechnica.com/tag/artificial-intelligence/",
    articleLinkPattern: "https://(?:arstechnica\\.com/ai/2026/10/openai-cloud/|www\\.digg\\.com/ai/bpr7gowe)/?$",
    maxItems: 5,
  });
  const byUrl = Object.fromEntries(dated.map((entry) => [entry.url, entry.date]));
  assert.equal(byUrl["https://arstechnica.com/ai/2026/10/openai-cloud/"], "2026-10-23T20:19:55.000Z");
  assert.equal(byUrl["https://www.digg.com/ai/bpr7gowe"], "2026-10-25T20:01:22.038Z");
});

test("html summaries stop at the enclosing card", () => {
  const html = `<!DOCTYPE html><html><body>
    <article>
      <a href="https://example.com/first-story">First story headline</a>
      <time datetime="2026-10-25T12:00:00Z">Oct 25, 2026</time>
    </article>
    <article>
      <a href="https://example.com/second-story">Second story headline</a>
      <time datetime="2026-10-25T11:00:00Z">Oct 25, 2026</time>
      <p>Second card paragraph.</p>
    </article>
    <div class="post-card">
      <a href="https://example.com/own-card">Own card headline</a>
      <time datetime="2026-10-25T10:00:00Z">Oct 25, 2026</time>
      <div class="card-body"><p>Own card paragraph.</p></div>
    </div>
    <div class="post-card">
      <a href="https://example.com/next-card">Next card headline</a>
      <time datetime="2026-10-25T09:00:00Z">Oct 25, 2026</time>
      <p>Next card paragraph.</p>
    </div>
    <a href="https://example.com/bare-story">Bare story headline</a>
    <time datetime="2026-10-25T08:00:00Z">Oct 25, 2026</time>
    <article>
      <a href="https://example.com/wrapped-story">Wrapped story headline</a>
      <time datetime="2026-10-25T07:00:00Z">Oct 25, 2026</time>
      <p>Wrapped paragraph.</p>
    </article>
    <article>
      <a href="https://example.com/unclosed-story">Unclosed story headline</a>
      <time datetime="2026-10-25T06:00:00Z">Oct 25, 2026</time>
    <article>
      <a href="https://example.com/after-unclosed">After unclosed headline</a>
      <time datetime="2026-10-25T05:00:00Z">Oct 25, 2026</time>
      <p>After unclosed paragraph.</p>
    </article>
    <a href="https://example.com/loose-story">Loose story headline</a>
    <time datetime="2026-10-25T04:00:00Z">Oct 25, 2026</time>
    <p class="card-excerpt">Loose paragraph.</p>
    <ul>
      <li>
        <a href="https://example.com/first-item">First item headline</a>
        <time datetime="2026-10-25T03:00:00Z">Oct 25, 2026</time>
      </li>
      <li>
        <a href="https://example.com/second-item">Second item headline</a>
        <time datetime="2026-10-25T02:00:00Z">Oct 25, 2026</time>
        <p>Second item paragraph.</p>
      </li>
    </ul>
    </body></html>`;
  const entries = parseHtml(html, {
    url: "https://example.com/news",
    articleLinkPattern: "^https://example\\.com/",
    maxItems: 20,
  });
  const byUrl = Object.fromEntries(entries.map((entry) => [entry.url, entry.summary]));
  assert.equal(byUrl["https://example.com/first-story"], "");
  assert.equal(byUrl["https://example.com/second-story"], "Second card paragraph.");
  assert.equal(byUrl["https://example.com/own-card"], "Own card paragraph.");
  assert.equal(byUrl["https://example.com/next-card"], "Next card paragraph.");
  assert.equal(byUrl["https://example.com/bare-story"], "");
  assert.equal(byUrl["https://example.com/wrapped-story"], "Wrapped paragraph.");
  assert.equal(byUrl["https://example.com/unclosed-story"], "");
  assert.equal(byUrl["https://example.com/after-unclosed"], "After unclosed paragraph.");
  assert.equal(byUrl["https://example.com/loose-story"], "Loose paragraph.");
  assert.equal(byUrl["https://example.com/first-item"], "");
  assert.equal(byUrl["https://example.com/second-item"], "Second item paragraph.");
});

test("a source that cannot be fetched fails by name and does not write", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "routed-feed-"));
  const outputPath = path.join(dir, "news-feed-latest.json");
  pipeline(dir, [{
    id: "venturebeat-ai",
    name: "VentureBeat AI",
    adapter: "rss",
    url: "https://venturebeat.com/category/ai/feed/",
    tags: ["open_source"],
  }]);

  const result = await refreshRoutedFeed({
    pipelineDir: dir,
    outputPath,
    retries: 1,
    fetchImpl: async () => ({ ok: false, status: 429, text: async () => "nope" }),
  });

  assert.equal(result.wrote, false);
  assert.equal(result.feed, null);
  assert.match(result.failures[0], /^venturebeat-ai \(VentureBeat AI\) could not be fetched: HTTP 429$/);
  assert.equal(fs.existsSync(outputPath), false);
});

test("an empty feed document is a successful fetch and a matched item is written", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "routed-feed-"));
  const outputPath = path.join(dir, "news-feed-latest.json");
  pipeline(dir, [
    {
      id: "arxiv-cs-ai",
      name: "arXiv cs.AI",
      adapter: "rss",
      url: "https://export.arxiv.org/rss/cs.AI",
      tags: ["research_paper"],
    },
    {
      id: "hugging-face-blog",
      name: "Hugging Face Blog",
      adapter: "rss",
      url: "https://huggingface.co/blog/feed.xml",
      tags: ["open_source", "agentic_framework"],
      categories: ["open-source"],
    },
  ]);
  const bodies = {
    "https://export.arxiv.org/rss/cs.AI": "<rss version=\"2.0\"><channel><title>cs.AI</title></channel></rss>",
    "https://huggingface.co/blog/feed.xml": "<rss version=\"2.0\"><channel><item><title>LitPivot</title><link>https://huggingface.co/blog/allenai/litpivot</link><pubDate>Fri, 23 Oct 2026 16:15:50 GMT</pubDate><description>Fetched from the feed.</description></item></channel></rss>",
  };
  const result = await refreshRoutedFeed({
    pipelineDir: dir,
    outputPath,
    now: new Date("2026-10-26T00:10:00.000Z"),
    retries: 1,
    fetchImpl: async (url) => ({ ok: true, status: 200, text: async () => bodies[url] }),
  });

  assert.deepEqual(result.failures, []);
  assert.equal(result.wrote, true);
  const feed = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  assert.equal(feed.site, "Repo Foundry");
  assert.equal(feed.article_count, 1);
  assert.equal(feed.articles[0].title, "LitPivot");
  assert.equal(feed.articles[0].source, "Hugging Face Blog");
  assert.deepEqual(feed.articles[0].matching_tags, ["open_source"]);
});


test('html dates come from the enclosing card when the time is before the link', () => {
  const html = `<!DOCTYPE html><html><body>
    <article><time datetime="2026-10-25T12:00:00Z">Oct 25, 2026</time><a href="https://example.com/first-story-headline">First story headline</a></article>
    <article><time datetime="2026-10-24T12:00:00Z">Oct 24, 2026</time><a href="https://example.com/second-story-headline">Second story headline</a></article>
    <div class="card"><time datetime="2026-10-23T08:00:00Z"></time><a href="https://example.com/card-story-headline">Card story headline</a></div>
    <div class="card"><time datetime="2026-10-22T08:00:00Z"></time><a href="https://example.com/other-card-headline">Other card headline</a></div>
    </body></html>`
  const dated = parseHtml(html, {
    url: 'https://example.com/news',
    articleLinkPattern: 'https://example\\.com/(?:first-story-headline|second-story-headline|card-story-headline|other-card-headline)/?$',
    maxItems: 10,
  })
  const byUrl = Object.fromEntries(dated.map((entry) => [entry.url, entry.date]))
  assert.equal(byUrl['https://example.com/first-story-headline'], '2026-10-25T12:00:00.000Z')
  assert.equal(byUrl['https://example.com/second-story-headline'], '2026-10-24T12:00:00.000Z')
  assert.equal(byUrl['https://example.com/card-story-headline'], '2026-10-23T08:00:00.000Z')
  assert.equal(byUrl['https://example.com/other-card-headline'], '2026-10-22T08:00:00.000Z')
  assert.equal(dated.length, 4)
})

test('a thrown timeout uses the remaining retries', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'routed-feed-'))
  const outputPath = path.join(dir, 'news-feed-latest.json')
  pipeline(dir, [{
    id: 'venturebeat-ai',
    name: 'VentureBeat AI',
    adapter: 'rss',
    url: 'https://venturebeat.com/category/ai/feed/',
    tags: ['product_launch'],
  }])
  let calls = 0
  const result = await refreshRoutedFeed({
    pipelineDir: dir,
    outputPath,
    now: new Date('2026-10-26T00:10:00.000Z'),
    retries: 3,
    fetchImpl: async () => {
      calls += 1
      if (calls === 1) throw new Error('The operation was aborted due to timeout')
      return { ok: true, status: 200, text: async () => '<rss version="2.0"><channel></channel></rss>' }
    },
  })
  assert.ok(calls >= 2)
  assert.deepEqual(result.failures, [])
  assert.equal(result.wrote, true)
  const feed = JSON.parse(fs.readFileSync(outputPath, 'utf8'))
  assert.equal(feed.article_count, 0)
  assert.equal(feed.generated, '2026-10-26T00:10:00.000Z')
})

test('a non-retryable HTTP response fails immediately and names the source', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'routed-feed-'))
  const outputPath = path.join(dir, 'news-feed-latest.json')
  pipeline(dir, [{
    id: 'venturebeat-ai',
    name: 'VentureBeat AI',
    adapter: 'rss',
    url: 'https://venturebeat.com/category/ai/feed/',
    tags: ['product_launch'],
  }])
  let calls = 0
  const result = await refreshRoutedFeed({
    pipelineDir: dir,
    outputPath,
    retries: 3,
    fetchImpl: async () => {
      calls += 1
      return { ok: false, status: 404, text: async () => 'missing' }
    },
  })
  assert.equal(calls, 1)
  assert.equal(result.wrote, false)
  assert.equal(result.feed, null)
  assert.match(result.failures[0], /^venturebeat-ai \(VentureBeat AI\) could not be fetched: HTTP 404$/)
  assert.equal(fs.existsSync(outputPath), false)
})

test("the refresh workflow fetches the shared config and commits the feed", () => {
  const workflow = fs.readFileSync(
    new URL("../.github/workflows/refresh-routed-feed.yml", import.meta.url),
    "utf8",
  );
  assert.match(workflow, /cron: '15 5 \* \* \*'/);
  assert.match(workflow, /repository: koltregaskes\/ai-resource-hub/);
  assert.match(workflow, /shared\/website-tools\/pipelines\/news/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /node scripts\/refresh-routed-feed\.mjs --pipeline/);
  assert.match(workflow, /git add -- content\/public\/generated\/news-feed-latest\.json/);
  assert.doesNotMatch(workflow, /git add -A|git add \./);
  assert.match(workflow, /actions\/deploy-pages@/);
  assert.match(workflow, /pages: write/);
  assert.match(workflow, /id-token: write/);
  assert.doesNotMatch(workflow, /secrets\.[A-Z0-9_]*(?:PAT|TOKEN)/);
});

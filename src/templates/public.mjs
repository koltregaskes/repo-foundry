import { buildDocument } from "./layout.mjs";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(value) {
  const parsed = new Date(value || "");
  return Number.isNaN(parsed.getTime()) ? "Unknown date" : parsed.toLocaleDateString();
}

function metricCard(label, value, detail = "") {
  return `<article class="metric-card">
    <p class="metric-card__label">${escapeHtml(label)}</p>
    <p class="metric-card__value">${escapeHtml(value)}</p>
    <p class="metric-card__detail">${escapeHtml(detail)}</p>
  </article>`;
}

function laneHref(category) {
  return `lanes/${category.id}/`;
}

function reposForCategory(siteData, categoryName) {
  return siteData.repos.filter((item) => item.category === categoryName);
}

function topTags(items, limit = 4) {
  const counts = new Map();
  for (const item of items) {
    for (const tag of item.tags || []) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}

function imageMarkup(record, className = "repo-card__media") {
  if (!record.imageUrl) return "";
  return `<div class="${className}"><img src="${escapeHtml(record.imageUrl)}" alt="" loading="lazy" /></div>`;
}

function repoCard(record) {
  return `<article class="repo-card" data-category="${escapeHtml(record.category)}" data-source="${escapeHtml(record.source)}" data-tags="${escapeHtml(record.tags.join("|"))}">
    ${imageMarkup(record)}
    <div class="repo-card__topline">
      <span class="pill">${escapeHtml(record.category)}</span>
      <span class="pill pill--soft">${escapeHtml(record.stars.toLocaleString())} stars</span>
    </div>
    <h3 class="repo-card__title"><a href="repos/${escapeHtml(record.slug)}/">${escapeHtml(record.name)}</a></h3>
    <p class="repo-card__summary">${escapeHtml(record.summary)}</p>
    <p class="repo-card__detail"><strong>Why it matters:</strong> ${escapeHtml(record.whyRelevant)}</p>
    <p class="repo-card__detail"><strong>Potential use:</strong> ${escapeHtml(record.potentialUse)}</p>
    <div class="tag-row">${record.tags.map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join("")}</div>
    <div class="repo-card__footer">
      <span>Added ${escapeHtml(formatDate(record.addedAt))}</span>
      <a class="text-link" href="${escapeHtml(record.repoUrl || "#")}">Open repo</a>
    </div>
  </article>`;
}

function launchBoard(siteData) {
  const lead = siteData.featured[0] || siteData.repos[0];
  const latestRelease = siteData.news[0];
  const sourceLabels = [...new Set(siteData.repos.map((item) => item.sourcePlatform || item.source).filter(Boolean))];

  const metrics = [
    ["Tracked", siteData.metrics.totalRepos],
    ["Featured", siteData.metrics.featuredCount],
    ["Sources", sourceLabels.length],
    ["Updates", siteData.news.length],
  ];

  return `<section class="launch-board" aria-label="Repo Foundry launch board">
    <article class="lead-feature">
      ${lead ? imageMarkup(lead, "lead-feature__media") : ""}
      <div class="lead-feature__body">
        <p class="section-heading__eyebrow">Featured now</p>
        <h2 class="lead-feature__title">${lead ? escapeHtml(lead.name) : "Repo Foundry"}</h2>
        <p class="lead-feature__summary">${lead ? escapeHtml(lead.summary) : escapeHtml(siteData.description)}</p>
        <div class="action-row">
          ${lead ? `<a class="button-link" href="repos/${escapeHtml(lead.slug)}/">Read dossier</a>` : ""}
          <a class="button-link button-link--ghost" href="repos/">Browse library</a>
        </div>
      </div>
    </article>
    <aside class="launch-rail" aria-label="Current signal summary">
      <div class="launch-metrics">
        ${metrics
          .map(
            ([label, value]) => `<article class="metric-card metric-card--compact">
              <p class="metric-card__label">${escapeHtml(label)}</p>
              <p class="metric-card__value">${escapeHtml(value)}</p>
            </article>`,
          )
          .join("")}
      </div>
      <article class="release-note">
        <p class="section-heading__eyebrow">Latest update</p>
        <h3 class="release-note__title">${latestRelease ? escapeHtml(latestRelease.title) : "Release feed warming up"}</h3>
        <p class="release-note__summary">${latestRelease ? escapeHtml(latestRelease.summary) : "Release notes appear here after the sync pipeline finds official source-host updates."}</p>
        ${latestRelease ? `<a class="text-link" href="news/">Open updates</a>` : ""}
      </article>
      <div class="source-strip" aria-label="Tracked source hosts">
        ${sourceLabels.map((label) => `<span>${escapeHtml(label)}</span>`).join("")}
      </div>
    </aside>
  </section>`;
}

function categoryCard(siteData, category, options = {}) {
  const items = reposForCategory(siteData, category.name);
  const lead = items[0];
  const chips = topTags(items, 3)
    .map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`)
    .join("");
  const cardBody = `
    <p class="category-card__count">${escapeHtml(category.count)}</p>
    <h3 class="category-card__title">${escapeHtml(category.name)}</h3>
    <p class="category-card__summary">${escapeHtml(category.description)}</p>
    ${lead ? `<p class="category-card__meta">Lead signal: ${escapeHtml(lead.name)}</p>` : ""}
    ${chips ? `<div class="tag-row">${chips}</div>` : ""}
  `;

  if (options.linked === false) {
    return `<article class="category-card">${cardBody}</article>`;
  }

  return `<a class="category-card category-card--link" href="${escapeHtml(laneHref(category))}">${cardBody}</a>`;
}

function newsCard(item) {
  const highlights = Array.isArray(item.highlights) && item.highlights.length
    ? `<div class="news-card__highlights">${item.highlights
        .map((entry) => `<p class="news-card__highlight">${escapeHtml(entry)}</p>`)
        .join("")}</div>`
    : "";

  return `<article class="news-card">
    <div class="news-card__meta">
      <span class="pill">${escapeHtml(item.projectName || item.sourcePlatform || item.source)}</span>
      <span class="pill pill--soft">${escapeHtml(item.releaseTag || item.source)}</span>
      <span>${escapeHtml(formatDate(item.publishedAt))}</span>
    </div>
    <h3 class="news-card__title"><a href="${escapeHtml(item.url || "#")}">${escapeHtml(item.title)}</a></h3>
    <p class="news-card__summary">${escapeHtml(item.summary)}</p>
    ${highlights}
  </article>`;
}

function resourceCard(item) {
  return `<article class="resource-card">
    <h3 class="resource-card__title"><a href="${escapeHtml(item.url || "#")}">${escapeHtml(item.title)}</a></h3>
    <p class="resource-card__summary">${escapeHtml(item.summary)}</p>
    <div class="tag-row">${item.tags.map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join("")}</div>
  </article>`;
}

function sectionFrame(title, description, content, actions = "") {
  return `<section class="content-section">
    <div class="section-heading">
      <div>
        <p class="section-heading__eyebrow">${escapeHtml(title)}</p>
        <h2 class="section-heading__title">${escapeHtml(description)}</h2>
      </div>
      ${actions}
    </div>
    ${content}
  </section>`;
}

function lanePanel(siteData, category) {
  const items = reposForCategory(siteData, category.name);
  const lead = items[0];
  const sourceCount = new Set(items.map((item) => item.source)).size;
  const featuredCount = items.filter((item) => item.featured).length;
  const listMarkup = items.length
    ? items
        .slice(0, 3)
        .map(
          (item) => `<a class="lane-panel__item" href="repos/${escapeHtml(item.slug)}/">
            <span>${escapeHtml(item.name)}</span>
            <span>${escapeHtml(item.stars.toLocaleString())} stars</span>
          </a>`,
        )
        .join("")
    : `<p class="empty-state">This lane is mapped, but no public-safe repos are currently pinned to it.</p>`;

  return `<article class="lane-panel">
    <div class="lane-panel__header">
      <div>
        <p class="section-heading__eyebrow">${escapeHtml(category.shortLabel)}</p>
        <h3 class="repo-card__title"><a href="${escapeHtml(laneHref(category))}">${escapeHtml(category.name)}</a></h3>
      </div>
      <span class="pill pill--soft">${escapeHtml(category.count)} tracked</span>
    </div>
    <p class="lane-panel__summary">${escapeHtml(category.description)}</p>
    <div class="lane-panel__meta">
      <span>${escapeHtml(sourceCount)} sources</span>
      <span>${escapeHtml(featuredCount)} featured</span>
      ${lead ? `<span>Lead: ${escapeHtml(lead.name)}</span>` : ""}
    </div>
    <div class="lane-panel__list">
      ${listMarkup}
    </div>
  </article>`;
}

function publicNav() {
  return [
    { id: "home", href: "./", label: "Home" },
    { id: "repos", href: "repos/", label: "Library" },
    { id: "news", href: "news/", label: "Updates" },
    { id: "visualisations", href: "visualisations/", label: "Snapshots" },
    { id: "codex", href: "resources/codex/", label: "CLI & Agents" },
    { id: "about", href: "about/", label: "About" },
  ];
}

export function buildPublicHome(siteData, baseHref = "./") {
  const featuredCards = siteData.featured.slice(0, 4).map(repoCard).join("");
  const newsCards = siteData.news.length
    ? siteData.news.slice(0, 4).map(newsCard).join("")
    : `<p class="empty-state">Release updates will appear here once the tracked source hosts publish new versions.</p>`;
  const categoryCards = siteData.categories.map((category) => categoryCard(siteData, category)).join("");
  const watchlistItems = siteData.watchlist
    .slice(0, 6)
    .map(
      (item) => `<article class="stack-item">
        <div>
          <p class="stack-item__title">${escapeHtml(item.name)}</p>
          <p class="stack-item__summary">${escapeHtml(item.notes)}</p>
        </div>
        <span class="pill pill--soft">${escapeHtml(item.cadence)}</span>
      </article>`,
    )
    .join("");

  const content = `
    ${launchBoard(siteData)}
    ${sectionFrame(
      "Featured dossiers",
      "The first shelf: high-signal repos with enough traction and relevance to deserve immediate attention.",
      `<div class="card-grid card-grid--feature">${featuredCards}</div>`,
      `<a class="button-link" href="repos/">Open the library</a>`,
    )}
    ${sectionFrame(
      "Browse by lane",
      "The fastest way to scan the site's major shelves, then jump into the filtered library instead of bouncing across duplicate pages.",
      `<div class="card-grid card-grid--category">${categoryCards}</div>`,
      `<a class="button-link button-link--ghost" href="repos/">Open the filtered library</a>`,
    )}
    ${sectionFrame(
      "Watchlist rhythm",
      "A smaller monitoring rail for repos we expect to keep changing fast, especially around coding agents, automation, and orchestration.",
      `<div class="stack-list">${watchlistItems}</div>`,
      `<a class="button-link button-link--ghost" href="resources/codex/">Open CLI & Agents</a>`,
    )}
    ${sectionFrame(
      "Release radar",
      "Actual release and project update notes pulled from official source hosts, so this feed reads like news instead of recycled repo cards.",
      `<div class="card-grid">${newsCards}</div>`,
      `<a class="button-link button-link--ghost" href="news/">Open release updates</a>`,
    )}
    ${sectionFrame(
      "CLI & Agents",
      "A tighter shelf for Codex, coding CLIs, agent consoles, and workflow tools closest to hands-on agentic development.",
      `<div class="card-grid">${siteData.codexResources.slice(0, 3).map(resourceCard).join("")}</div>`,
      `<a class="button-link button-link--ghost" href="resources/codex/">Open CLI & agent resources</a>`,
    )}
  `;

  return buildDocument({
    audience: "public",
    title: `${siteData.workingTitle} | Public hub`,
    description: siteData.description,
    currentKey: "home",
    baseHref,
    navItems: publicNav(),
    eyebrow: "Public-facing repo intelligence surface",
    heroTitle: siteData.workingTitle,
    heroBody: siteData.strapline,
    utilityLinks: [{ href: "about/", label: "Methodology" }],
    content,
    scriptPath: "assets/public-app.js",
  });
}

export function buildTrendingPage(siteData, archiveOnly = false, baseHref = "../") {
  const items = archiveOnly ? siteData.repos.slice(12) : siteData.repos.slice(0, 12);
  const content = `
    <section class="content-section">
      <div class="section-heading">
        <div>
          <p class="section-heading__eyebrow">${archiveOnly ? "Archive" : "Recent additions"}</p>
          <h2 class="section-heading__title">This is the library in a freshness-first view, kept as a focused route for people who only want the newest additions.</h2>
        </div>
        <div class="action-row">
          ${archiveOnly ? `<a class="button-link button-link--ghost" href="trending/">Back to latest</a>` : `<a class="button-link button-link--ghost" href="trending/archive/">Open archive</a>`}
          <a class="button-link button-link--ghost" href="repos/">Open full library</a>
        </div>
      </div>
      <div id="publicFilters" class="filter-bar"></div>
      <div id="publicList" class="card-grid">${items.map(repoCard).join("")}</div>
    </section>
  `;
  return buildDocument({
    audience: "public",
    title: `${siteData.workingTitle} | Trending`,
    description: "Recent additions across the public-safe research feed.",
    currentKey: "repos",
    baseHref,
    navItems: publicNav(),
    eyebrow: "Public signal feed",
    heroTitle: archiveOnly ? "Signals archive" : "Live signals",
    heroBody: "A tighter freshness-first view of the library for people who care about new arrivals more than the full archive.",
    content,
    pageData: {
      page: archiveOnly ? "trending-archive" : "trending",
      items: siteData.repos,
      defaults: { freshness: archiveOnly ? "archive" : "fresh", featuredOnly: false },
    },
    scriptPath: "assets/public-app.js",
  });
}

export function buildRepoDirectoryPage(siteData, archiveOnly = false, baseHref = "../") {
  const items = archiveOnly ? siteData.repos.slice(12) : siteData.repos.slice(0, 12);
  const content = `
    <section class="content-section">
      <div class="section-heading">
        <div>
          <p class="section-heading__eyebrow">Library</p>
          <h2 class="section-heading__title">The main browse surface: category, source, freshness, and featured filters all live here so the site feels like one product instead of several near-duplicates.</h2>
        </div>
        <div class="action-row">
          ${archiveOnly ? `<a class="button-link button-link--ghost" href="repos/">Back to latest</a>` : `<a class="button-link button-link--ghost" href="repos/archive/">Open archive</a>`}
          <a class="button-link button-link--ghost" href="trending/">Recent additions only</a>
        </div>
      </div>
      <div id="publicFilters" class="filter-bar"></div>
      <div id="publicList" class="card-grid">${items.map(repoCard).join("")}</div>
    </section>
  `;
  return buildDocument({
    audience: "public",
    title: `${siteData.workingTitle} | Repo directory`,
    description: "Curated repository library.",
    currentKey: "repos",
    baseHref,
    navItems: publicNav(),
    eyebrow: "Public foundry library",
    heroTitle: "Repository library",
    heroBody: "Curated entries with practical summaries, why they matter, where they might fit in a real workflow, and enough filtering to replace several thinner browse pages.",
    content,
    pageData: {
      page: archiveOnly ? "repos-archive" : "repos",
      items: siteData.repos,
      defaults: { freshness: archiveOnly ? "archive" : "all", featuredOnly: false },
    },
    scriptPath: "assets/public-app.js",
  });
}

export function buildLanesPage(siteData, baseHref = "../") {
  const cards = siteData.categories.map((category) => categoryCard(siteData, category)).join("");
  const panels = siteData.categories.map((category) => lanePanel(siteData, category)).join("");
  const content = `
    ${sectionFrame(
      "Lane map",
      "The main shelves of Repo Foundry, grouped around the kinds of systems we expect to matter in real work.",
      `<div class="card-grid card-grid--category">${cards}</div>`,
    )}
    ${sectionFrame(
      "Shelf briefings",
      "A slightly deeper skim of each lane so the site feels like a navigable magazine instead of a flat list.",
      `<div class="lane-grid">${panels}</div>`,
    )}
  `;

  return buildDocument({
    audience: "public",
    title: `${siteData.workingTitle} | Lanes`,
    description: "Browse Repo Foundry by category and workflow lane.",
    currentKey: "repos",
    baseHref,
    navItems: publicNav(),
    eyebrow: "Public lane index",
    heroTitle: "Foundry lanes",
    heroBody: "The site is organised into warm shelves: AI command centres, workflow automation, agent builders, media tooling, and practical productivity systems.",
    content,
    scriptPath: "assets/public-app.js",
  });
}

export function buildLaneDetailPage(siteData, category, baseHref = "../../") {
  const items = reposForCategory(siteData, category.name);
  const lead = items[0];
  const sources = [...new Set(items.map((item) => item.source))];
  const featured = items.filter((item) => item.featured).slice(0, 4);
  const tags = topTags(items, 5);
  const relatedLanes = siteData.categories.filter((item) => item.id !== category.id).slice(0, 3);
  const laneCardItems = [...items].sort((left, right) => {
    if (left.featured !== right.featured) {
      return left.featured ? -1 : 1;
    }

    return new Date(right.addedAt).getTime() - new Date(left.addedAt).getTime();
  });
  const laneCards = laneCardItems.length
    ? laneCardItems.map(repoCard).join("")
    : `<p class="empty-state">No public-safe repos are currently pinned to this lane, but the shelf stays live for future additions.</p>`;

  const content = `
    <section class="detail-hero">
      <div class="detail-hero__meta">
        <span class="pill">${escapeHtml(category.name)}</span>
        <span class="pill pill--soft">${escapeHtml(items.length)} repos</span>
      </div>
      <h2 class="detail-hero__title">${escapeHtml(category.name)}</h2>
      <p class="detail-hero__summary">${escapeHtml(category.description)}</p>
      <div class="tag-row">
        ${tags.map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join("")}
      </div>
      <div class="action-row">
        <a class="button-link" href="repos/">Open full library</a>
        <a class="button-link button-link--ghost" href="lanes/">Back to all lanes</a>
      </div>
    </section>
    <section class="detail-grid">
      <article class="detail-card">
        <p class="detail-card__eyebrow">Lead signal</p>
        <p>${lead ? `${escapeHtml(lead.name)} is currently the strongest public signal in this lane.` : "This lane is currently waiting for its first lead signal."}</p>
      </article>
      <article class="detail-card">
        <p class="detail-card__eyebrow">Source spread</p>
        <p>${escapeHtml(sources.length)} source${sources.length === 1 ? "" : "s"} currently feed this shelf: ${escapeHtml(sources.join(", ") || "No sources yet")}.</p>
      </article>
      <article class="detail-card">
        <p class="detail-card__eyebrow">What to watch</p>
        <p>${featured.length ? `${featured.length} featured pick${featured.length === 1 ? "" : "s"} lead this lane, but the full shelf stays visible below for broader comparison.` : "We care most about practical reuse here: interfaces, flows, and patterns that can become real operator tooling instead of passive inspiration."}</p>
      </article>
    </section>
    ${sectionFrame(
      "Lane shortlist",
      "Every current public-safe repo in this lane, with featured picks floated first and the rest kept visible for proper comparison.",
      `<div class="card-grid">${laneCards}</div>`,
    )}
    ${sectionFrame(
      "Related lanes",
      "Adjacent shelves worth checking next if you are mapping the broader ecosystem.",
      `<div class="card-grid card-grid--category">${relatedLanes.map((item) => categoryCard(siteData, item)).join("")}</div>`,
    )}
  `;

  return buildDocument({
    audience: "public",
    title: `${category.name} | ${siteData.workingTitle}`,
    description: category.description,
    currentKey: "repos",
    baseHref,
    navItems: publicNav(),
    eyebrow: "Public lane dossier",
    heroTitle: category.name,
    heroBody: "A category-level shelf inside Repo Foundry, built for browsing patterns instead of one-off repo hunting.",
    content,
    scriptPath: "assets/public-app.js",
  });
}

export function buildRepoDetailPage(siteData, repo, baseHref = "../../") {
  const related = siteData.repos.filter((item) => item.slug !== repo.slug && item.category === repo.category).slice(0, 3);
  const currentLane = siteData.categories.find((item) => item.name === repo.category);
  const content = `
    <section class="detail-hero">
      <div class="detail-hero__meta">
        <span class="pill">${escapeHtml(repo.category)}</span>
        <span class="pill pill--soft">${escapeHtml(repo.stars.toLocaleString())} stars</span>
      </div>
      <h2 class="detail-hero__title">${escapeHtml(repo.name)}</h2>
      <p class="detail-hero__summary">${escapeHtml(repo.summary)}</p>
      <div class="tag-row">${repo.tags.map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join("")}</div>
      <div class="action-row">
        <a class="button-link" href="${escapeHtml(repo.repoUrl || "#")}">Open repository</a>
        <a class="button-link button-link--ghost" href="repos/">Back to directory</a>
        ${currentLane ? `<a class="button-link button-link--ghost" href="${escapeHtml(laneHref(currentLane))}">Open this lane</a>` : ""}
      </div>
    </section>
    <section class="detail-grid">
      <article class="detail-card">
        <p class="detail-card__eyebrow">Why it matters</p>
        <p>${escapeHtml(repo.whyRelevant)}</p>
      </article>
      <article class="detail-card">
        <p class="detail-card__eyebrow">Potential use</p>
        <p>${escapeHtml(repo.potentialUse)}</p>
      </article>
      <article class="detail-card">
        <p class="detail-card__eyebrow">Freshness</p>
        <p>Added ${escapeHtml(formatDate(repo.addedAt))} and refreshed ${escapeHtml(formatDate(repo.refreshedAt))}.</p>
      </article>
    </section>
    ${sectionFrame(
      "Related",
      "More repos from the same shelf.",
      `<div class="card-grid">${related.map(repoCard).join("")}</div>`,
    )}
  `;

  return buildDocument({
    audience: "public",
    title: `${repo.name} | ${siteData.workingTitle}`,
    description: repo.summary,
    currentKey: "repos",
    baseHref,
    navItems: publicNav(),
    eyebrow: "Public repo dossier",
    heroTitle: repo.name,
    heroBody: "A public-safe dossier generated from the current Repo Foundry research record.",
    content,
    scriptPath: "assets/public-app.js",
  });
}

export function buildNewsPage(siteData, baseHref = "../") {
  const newsMarkup = siteData.news.length
    ? siteData.news.map(newsCard).join("")
    : `<p class="empty-state">No public release items are available yet. Run the release sync and rebuild the site to repopulate this page.</p>`;
  const content = sectionFrame(
    "Release updates",
    "Actual release notes and project updates from official source hosts, kept separate from the repo directory so this page reads like news.",
    `<div class="card-grid">${newsMarkup}</div>`,
  );
  return buildDocument({
    audience: "public",
    title: `${siteData.workingTitle} | Updates`,
    description: "Latest tracked releases and project updates from the public repo feed.",
    currentKey: "news",
    baseHref,
    navItems: publicNav(),
    eyebrow: "Public release radar",
    heroTitle: "Release updates",
    heroBody: "A sharper news layer for Repo Foundry: real version drops, release notes, and project updates from GitHub, GitLab, and other source hosts.",
    content,
    pageData: { page: "news", items: siteData.news },
    scriptPath: "assets/public-app.js",
  });
}

export function buildVisualisationsPage(siteData, baseHref = "../") {
  const content = `
    <section class="content-section">
      <div class="section-heading">
        <div>
          <p class="section-heading__eyebrow">Snapshots</p>
          <h2 class="section-heading__title">A lightweight view of what the public feed is currently biased towards.</h2>
        </div>
      </div>
      <div id="visualisationSummary" class="visual-summary-grid"></div>
      <div id="visualisationRoot" class="visualisation-grid"></div>
    </section>
    ${sectionFrame(
      "Method",
      "These snapshots are generated from the current public-safe dataset, not from internal manager notes or private workspace telemetry.",
      `<div class="stack-list">
        <article class="stack-item stack-item--long">
          <div>
            <p class="stack-item__title">What is counted</p>
            <p class="stack-item__summary">Repo Foundry tracks curated public-safe repo records, then groups them by lane, source, star band, and freshness so the public site can show bias and movement without leaking internal state.</p>
          </div>
        </article>
        <article class="stack-item stack-item--long">
          <div>
            <p class="stack-item__title">Why this matters</p>
            <p class="stack-item__summary">The point is not just pretty charts. It is to show where the current attention is going, whether the shelves are balanced, and whether the feed is actually fresh enough to be trusted.</p>
          </div>
        </article>
      </div>`,
    )}
  `;
  return buildDocument({
    audience: "public",
    title: `${siteData.workingTitle} | Visualisations`,
    description: "Category mix, source mix, star bands, and freshness across the public feed.",
    currentKey: "visualisations",
    baseHref,
    navItems: publicNav(),
    eyebrow: "Public snapshots",
    heroTitle: "Visualisations",
    heroBody: "A quick look at category balance, popularity bands, and how fresh the current watchlist really is.",
    content,
    pageData: {
      page: "visualisations",
      visualisations: siteData.visualisations,
      metrics: siteData.metrics,
      categories: siteData.categories,
    },
    scriptPath: "assets/public-app.js",
  });
}

export function buildCodexPage(siteData, baseHref = "../../") {
  const content = `
    ${sectionFrame(
      "CLI & Agents",
      "A public-safe shortlist of Codex-style CLIs, coding-agent workflows, orchestration patterns, and operator-grade command surfaces.",
      `<div class="card-grid">${siteData.codexResources.map(resourceCard).join("")}</div>`,
    )}
    ${sectionFrame(
      "Watchlist",
      "The higher-frequency repos we keep an eye on because the workflows change fast.",
      `<div class="stack-list">${siteData.watchlist
        .map(
          (item) => `<article class="stack-item">
            <div>
              <p class="stack-item__title">${escapeHtml(item.name)}</p>
              <p class="stack-item__summary">${escapeHtml(item.notes)}</p>
            </div>
            <span class="pill pill--soft">${escapeHtml(item.cadence)}</span>
          </article>`,
        )
        .join("")}</div>`,
    )}
  `;
  return buildDocument({
    audience: "public",
    title: `${siteData.workingTitle} | CLI & agent resources`,
    description: "Coding-agent CLIs, command surfaces, and workflow resources.",
    currentKey: "codex",
    baseHref,
    navItems: publicNav(),
    eyebrow: "Public resource shelf",
    heroTitle: "CLI & agent resources",
    heroBody: "This is the CLI and command-surface shelf: Codex-style tools, coding-agent repos, workflow references, and comparators worth watching closely.",
    content,
    scriptPath: "assets/public-app.js",
  });
}

export function buildAboutPage(siteData, baseHref = "../") {
  const content = `
    <section class="content-section">
      <div class="stack-list">
        ${siteData.editorialNotes
          .map(
            (item) => `<article class="stack-item stack-item--long">
              <div>
                <p class="stack-item__title">${escapeHtml(item.title)}</p>
                <p class="stack-item__summary">${escapeHtml(item.body)}</p>
              </div>
            </article>`,
          )
          .join("")}
        <article class="stack-item stack-item--long">
          <div>
            <p class="stack-item__title">Public boundary</p>
            <p class="stack-item__summary">${escapeHtml(siteData.publicBoundary)}</p>
          </div>
        </article>
      </div>
    </section>
  `;
  return buildDocument({
    audience: "public",
    title: `${siteData.workingTitle} | About`,
    description: "How Repo Foundry is curated.",
    currentKey: "about",
    baseHref,
    navItems: publicNav(),
    eyebrow: "Public methodology",
    heroTitle: "About this hub",
    heroBody: "A public-safe discovery surface built from a stricter internal research programme.",
    content,
    scriptPath: "assets/public-app.js",
  });
}

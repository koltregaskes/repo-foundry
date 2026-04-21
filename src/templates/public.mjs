import { buildDocument } from "./layout.mjs";

function metricCard(label, value, detail = "") {
  return `<article class="metric-card">
    <p class="metric-card__label">${label}</p>
    <p class="metric-card__value">${value}</p>
    <p class="metric-card__detail">${detail}</p>
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

function repoCard(record) {
  return `<article class="repo-card" data-category="${record.category}" data-source="${record.source}" data-tags="${record.tags.join("|")}">
    <div class="repo-card__topline">
      <span class="pill">${record.category}</span>
      <span class="pill pill--soft">${record.stars.toLocaleString()} stars</span>
    </div>
    <h3 class="repo-card__title"><a href="repos/${record.slug}/">${record.name}</a></h3>
    <p class="repo-card__summary">${record.summary}</p>
    <p class="repo-card__detail"><strong>Why it matters:</strong> ${record.whyRelevant}</p>
    <p class="repo-card__detail"><strong>Potential use:</strong> ${record.potentialUse}</p>
    <div class="tag-row">${record.tags.map((tag) => `<span class="tag-chip">${tag}</span>`).join("")}</div>
    <div class="repo-card__footer">
      <span>Added ${new Date(record.addedAt).toLocaleDateString()}</span>
      <a class="text-link" href="${record.repoUrl}">Open repo</a>
    </div>
  </article>`;
}

function categoryCard(siteData, category, options = {}) {
  const items = reposForCategory(siteData, category.name);
  const lead = items[0];
  const chips = topTags(items, 3)
    .map((tag) => `<span class="tag-chip">${tag}</span>`)
    .join("");
  const cardBody = `
    <p class="category-card__count">${category.count}</p>
    <h3 class="category-card__title">${category.name}</h3>
    <p class="category-card__summary">${category.description}</p>
    ${lead ? `<p class="category-card__meta">Lead signal: ${lead.name}</p>` : ""}
    ${chips ? `<div class="tag-row">${chips}</div>` : ""}
  `;

  if (options.linked === false) {
    return `<article class="category-card">${cardBody}</article>`;
  }

  return `<a class="category-card category-card--link" href="${laneHref(category)}">${cardBody}</a>`;
}

function newsCard(item) {
  return `<article class="news-card">
    <div class="news-card__meta">
      <span class="pill pill--soft">${item.source}</span>
      <span>${new Date(item.publishedAt).toLocaleDateString()}</span>
    </div>
    <h3 class="news-card__title"><a href="${item.url}">${item.title}</a></h3>
    <p class="news-card__summary">${item.summary}</p>
  </article>`;
}

function resourceCard(item) {
  return `<article class="resource-card">
    <h3 class="resource-card__title"><a href="${item.url}">${item.title}</a></h3>
    <p class="resource-card__summary">${item.summary}</p>
    <div class="tag-row">${item.tags.map((tag) => `<span class="tag-chip">${tag}</span>`).join("")}</div>
  </article>`;
}

function sectionFrame(title, description, content, actions = "") {
  return `<section class="content-section">
    <div class="section-heading">
      <div>
        <p class="section-heading__eyebrow">${title}</p>
        <h2 class="section-heading__title">${description}</h2>
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
          (item) => `<a class="lane-panel__item" href="repos/${item.slug}/">
            <span>${item.name}</span>
            <span>${item.stars.toLocaleString()} stars</span>
          </a>`,
        )
        .join("")
    : `<p class="empty-state">This lane is mapped, but no public-safe repos are currently pinned to it.</p>`;

  return `<article class="lane-panel">
    <div class="lane-panel__header">
      <div>
        <p class="section-heading__eyebrow">${category.shortLabel}</p>
        <h3 class="repo-card__title"><a href="${laneHref(category)}">${category.name}</a></h3>
      </div>
      <span class="pill pill--soft">${category.count} tracked</span>
    </div>
    <p class="lane-panel__summary">${category.description}</p>
    <div class="lane-panel__meta">
      <span>${sourceCount} sources</span>
      <span>${featuredCount} featured</span>
      ${lead ? `<span>Lead: ${lead.name}</span>` : ""}
    </div>
    <div class="lane-panel__list">
      ${listMarkup}
    </div>
  </article>`;
}

function publicNav() {
  return [
    { id: "home", href: "./", label: "Home" },
    { id: "trending", href: "trending/", label: "Signals" },
    { id: "repos", href: "repos/", label: "Library" },
    { id: "lanes", href: "lanes/", label: "Lanes" },
    { id: "news", href: "news/", label: "News" },
    { id: "visualisations", href: "visualisations/", label: "Snapshots" },
    { id: "codex", href: "resources/codex/", label: "Codex lane" },
    { id: "about", href: "about/", label: "About" },
  ];
}

export function buildPublicHome(siteData, baseHref = "./") {
  const featuredCards = siteData.featured.slice(0, 4).map(repoCard).join("");
  const newsCards = siteData.news.slice(0, 4).map(newsCard).join("");
  const categoryCards = siteData.categories.map((category) => categoryCard(siteData, category)).join("");
  const watchlistItems = siteData.watchlist
    .slice(0, 6)
    .map(
      (item) => `<article class="stack-item">
        <div>
          <p class="stack-item__title">${item.name}</p>
          <p class="stack-item__summary">${item.notes}</p>
        </div>
        <span class="pill pill--soft">${item.cadence}</span>
      </article>`,
    )
    .join("");

  const content = `
    <section class="hero-grid">
      ${metricCard("Tracked signals", siteData.metrics.totalRepos, "Curated, public-safe shortlist")}
      ${metricCard("Featured now", siteData.metrics.featuredCount, "First-pass dossiers worth opening")}
      ${metricCard("Active lanes", siteData.metrics.categories, "AI, automation, media, creator systems")}
      ${metricCard("Fresh this week", siteData.metrics.newThisWeek, "Recent additions kept hot")}
    </section>
    ${sectionFrame(
      "Featured dossiers",
      "The first shelf: high-signal repos with enough traction and relevance to deserve immediate attention.",
      `<div class="card-grid card-grid--feature">${featuredCards}</div>`,
      `<a class="button-link" href="repos/">Open the library</a>`,
    )}
    ${sectionFrame(
      "Foundry lanes",
      "The shelves we keep warm: control planes, workflow systems, builder tooling, media graphs, and practical operator infrastructure.",
      `<div class="card-grid card-grid--category">${categoryCards}</div>`,
      `<a class="button-link button-link--ghost" href="lanes/">Browse all lanes</a>`,
    )}
    ${sectionFrame(
      "Watchlist rhythm",
      "A smaller monitoring rail for repos we expect to keep changing fast, especially around coding agents, automation, and orchestration.",
      `<div class="stack-list">${watchlistItems}</div>`,
      `<a class="button-link button-link--ghost" href="resources/codex/">Open Codex lane</a>`,
    )}
    ${sectionFrame(
      "Latest notes",
      "Short public-safe updates generated from the newest repositories entering the current feed.",
      `<div class="card-grid">${newsCards}</div>`,
      `<a class="button-link button-link--ghost" href="news/">See all news</a>`,
    )}
    ${sectionFrame(
      "Codex lane",
      "A tighter shelf for repos, references, and comparator tools closest to coding-agent workflows.",
      `<div class="card-grid">${siteData.codexResources.slice(0, 3).map(resourceCard).join("")}</div>`,
      `<a class="button-link button-link--ghost" href="resources/codex/">Open Codex resources</a>`,
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
          <p class="section-heading__eyebrow">${archiveOnly ? "Archive" : "Trending now"}</p>
          <h2 class="section-heading__title">Newest additions first, with category and source filters for quicker scanning.</h2>
        </div>
        <div class="action-row">
          ${archiveOnly ? `<a class="button-link button-link--ghost" href="trending/">Back to latest</a>` : `<a class="button-link button-link--ghost" href="trending/archive/">Open archive</a>`}
        </div>
      </div>
      <div id="publicFilters" class="filter-bar"></div>
      <div id="publicList" class="card-grid">${items.map(repoCard).join("")}</div>
    </section>
  `;
  return buildDocument({
    audience: "public",
    title: `${siteData.workingTitle} | Trending`,
    description: "Newest repository additions across the public-safe research feed.",
    currentKey: "trending",
    baseHref,
    navItems: publicNav(),
    eyebrow: "Public signal feed",
    heroTitle: archiveOnly ? "Signals archive" : "Live signals",
    heroBody: "Fresh findings land at the top. Older items move into the archive instead of bloating one endless page.",
    content,
    pageData: { page: archiveOnly ? "trending-archive" : "trending", items: siteData.repos },
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
          <h2 class="section-heading__title">A public-safe directory of the repositories we think are worth your time.</h2>
        </div>
        <div class="action-row">
          ${archiveOnly ? `<a class="button-link button-link--ghost" href="repos/">Back to latest</a>` : `<a class="button-link button-link--ghost" href="repos/archive/">Open archive</a>`}
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
    heroBody: "Curated entries with practical summaries, why they matter, and where they might actually fit in a real workflow.",
    content,
    pageData: { page: archiveOnly ? "repos-archive" : "repos", items: siteData.repos },
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
    currentKey: "lanes",
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
        <span class="pill">${category.name}</span>
        <span class="pill pill--soft">${items.length} repos</span>
      </div>
      <h2 class="detail-hero__title">${category.name}</h2>
      <p class="detail-hero__summary">${category.description}</p>
      <div class="tag-row">
        ${tags.map((tag) => `<span class="tag-chip">${tag}</span>`).join("")}
      </div>
      <div class="action-row">
        <a class="button-link" href="repos/">Open full library</a>
        <a class="button-link button-link--ghost" href="lanes/">Back to all lanes</a>
      </div>
    </section>
    <section class="detail-grid">
      <article class="detail-card">
        <p class="detail-card__eyebrow">Lead signal</p>
        <p>${lead ? `${lead.name} is currently the strongest public signal in this lane.` : "This lane is currently waiting for its first lead signal."}</p>
      </article>
      <article class="detail-card">
        <p class="detail-card__eyebrow">Source spread</p>
        <p>${sources.length} source${sources.length === 1 ? "" : "s"} currently feed this shelf: ${sources.join(", ") || "No sources yet"}.</p>
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
    currentKey: "lanes",
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
        <span class="pill">${repo.category}</span>
        <span class="pill pill--soft">${repo.stars.toLocaleString()} stars</span>
      </div>
      <h2 class="detail-hero__title">${repo.name}</h2>
      <p class="detail-hero__summary">${repo.summary}</p>
      <div class="tag-row">${repo.tags.map((tag) => `<span class="tag-chip">${tag}</span>`).join("")}</div>
      <div class="action-row">
        <a class="button-link" href="${repo.repoUrl}">Open repository</a>
        <a class="button-link button-link--ghost" href="repos/">Back to directory</a>
        ${currentLane ? `<a class="button-link button-link--ghost" href="${laneHref(currentLane)}">Open this lane</a>` : ""}
      </div>
    </section>
    <section class="detail-grid">
      <article class="detail-card">
        <p class="detail-card__eyebrow">Why it matters</p>
        <p>${repo.whyRelevant}</p>
      </article>
      <article class="detail-card">
        <p class="detail-card__eyebrow">Potential use</p>
        <p>${repo.potentialUse}</p>
      </article>
      <article class="detail-card">
        <p class="detail-card__eyebrow">Freshness</p>
        <p>Added ${new Date(repo.addedAt).toLocaleDateString()} and refreshed ${new Date(repo.refreshedAt).toLocaleDateString()}.</p>
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
  const content = sectionFrame(
    "News feed",
    "Editorial notes generated from the current public-safe research stream.",
    `<div class="card-grid">${siteData.news.map(newsCard).join("")}</div>`,
  );
  return buildDocument({
    audience: "public",
    title: `${siteData.workingTitle} | News`,
    description: "Latest notes from the public repo feed.",
    currentKey: "news",
    baseHref,
    navItems: publicNav(),
    eyebrow: "Public news feed",
    heroTitle: "News and fresh notes",
    heroBody: "A lighter editorial layer on top of the curated repo stream, built for quick scanning instead of endless backlog reading.",
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
      "Codex lane",
      "A public-safe shortlist of repos closest to coding-agent workflows, orchestration patterns, and operator-grade command surfaces.",
      `<div class="card-grid">${siteData.codexResources.map(resourceCard).join("")}</div>`,
    )}
    ${sectionFrame(
      "Watchlist",
      "The higher-frequency repos we keep an eye on because the workflows change fast.",
      `<div class="stack-list">${siteData.watchlist
        .map(
          (item) => `<article class="stack-item">
            <div>
              <p class="stack-item__title">${item.name}</p>
              <p class="stack-item__summary">${item.notes}</p>
            </div>
            <span class="pill pill--soft">${item.cadence}</span>
          </article>`,
        )
        .join("")}</div>`,
    )}
  `;
  return buildDocument({
    audience: "public",
    title: `${siteData.workingTitle} | Codex resources`,
    description: "Codex-adjacent repositories and resources.",
    currentKey: "codex",
    baseHref,
    navItems: publicNav(),
    eyebrow: "Public resource shelf",
    heroTitle: "Codex resources",
    heroBody: "The tighter shelf: coding-agent repos, workflow references, and command-surface comparators worth watching closely.",
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
                <p class="stack-item__title">${item.title}</p>
                <p class="stack-item__summary">${item.body}</p>
              </div>
            </article>`,
          )
          .join("")}
        <article class="stack-item stack-item--long">
          <div>
            <p class="stack-item__title">Public boundary</p>
            <p class="stack-item__summary">${siteData.publicBoundary}</p>
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

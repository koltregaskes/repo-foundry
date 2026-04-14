import { buildDocument } from "./layout.mjs";

function metricCard(label, value, detail = "") {
  return `<article class="metric-card">
    <p class="metric-card__label">${label}</p>
    <p class="metric-card__value">${value}</p>
    <p class="metric-card__detail">${detail}</p>
  </article>`;
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

function publicNav() {
  return [
    { id: "home", href: "./", label: "Home" },
    { id: "trending", href: "trending/", label: "Trending" },
    { id: "repos", href: "repos/", label: "Repos" },
    { id: "news", href: "news/", label: "News" },
    { id: "visualisations", href: "visualisations/", label: "Visualisations" },
    { id: "codex", href: "resources/codex/", label: "Codex" },
    { id: "about", href: "about/", label: "About" },
  ];
}

export function buildPublicHome(siteData, baseHref = "./") {
  const featuredCards = siteData.featured.slice(0, 4).map(repoCard).join("");
  const newsCards = siteData.news.slice(0, 4).map(newsCard).join("");
  const categoryCards = siteData.categories
    .map(
      (category) => `<article class="category-card">
        <p class="category-card__count">${category.count}</p>
        <h3 class="category-card__title">${category.name}</h3>
        <p class="category-card__summary">${category.description}</p>
      </article>`,
    )
    .join("");

  const content = `
    <section class="hero-grid">
      ${metricCard("Tracked public repos", siteData.metrics.totalRepos, "High-signal watchlist only")}
      ${metricCard("Featured this cycle", siteData.metrics.featuredCount, "Editorially prioritised")}
      ${metricCard("Live categories", siteData.metrics.categories, "AI, automation, productivity, media")}
      ${metricCard("Fresh this week", siteData.metrics.newThisWeek, "Newest additions stay on top")}
    </section>
    ${sectionFrame(
      "Featured dossiers",
      "The strongest open-source references worth watching first.",
      `<div class="card-grid card-grid--feature">${featuredCards}</div>`,
      `<a class="button-link" href="repos/">Browse all repos</a>`,
    )}
    ${sectionFrame(
      "Categories",
      "The shelves we keep warm: command centres, workflows, productivity, and creator tooling.",
      `<div class="card-grid card-grid--category">${categoryCards}</div>`,
      `<a class="button-link button-link--ghost" href="trending/">Open trending feed</a>`,
    )}
    ${sectionFrame(
      "Latest notes",
      "Short editorial updates generated from the newest repos entering the public-safe feed.",
      `<div class="card-grid">${newsCards}</div>`,
      `<a class="button-link button-link--ghost" href="news/">See all news</a>`,
    )}
    ${sectionFrame(
      "Codex lane",
      "A smaller shelf for the repos and resources closest to coding-agent workflows.",
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
    eyebrow: "Public-facing discovery surface",
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
          <h2 class="section-heading__title">Newest additions first, with category and source filters.</h2>
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
    eyebrow: "Public trending feed",
    heroTitle: archiveOnly ? "Trending archive" : "Trending repos",
    heroBody: "New findings land at the top. Older items move into the archive instead of stretching one endless page.",
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
          <p class="section-heading__eyebrow">Directory</p>
          <h2 class="section-heading__title">A public-safe directory of the repos we think are worth your time.</h2>
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
    description: "Curated repository directory.",
    currentKey: "repos",
    baseHref,
    navItems: publicNav(),
    eyebrow: "Public repo directory",
    heroTitle: "Repo directory",
    heroBody: "Curated entries with practical summaries, why they matter, and what we think they are good for.",
    content,
    pageData: { page: archiveOnly ? "repos-archive" : "repos", items: siteData.repos },
    scriptPath: "assets/public-app.js",
  });
}

export function buildRepoDetailPage(siteData, repo, baseHref = "../../") {
  const related = siteData.repos.filter((item) => item.slug !== repo.slug && item.category === repo.category).slice(0, 3);
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
    heroBody: "A public-safe dossier generated from our curated research record.",
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
    heroBody: "A lighter editorial layer on top of the curated repo stream.",
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
          <p class="section-heading__eyebrow">Visualisations</p>
          <h2 class="section-heading__title">A lightweight view of what the public feed is currently biased towards.</h2>
        </div>
      </div>
      <div id="visualisationRoot" class="visualisation-grid"></div>
    </section>
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
    pageData: { page: "visualisations", visualisations: siteData.visualisations },
    scriptPath: "assets/public-app.js",
  });
}

export function buildCodexPage(siteData, baseHref = "../../") {
  const content = `
    ${sectionFrame(
      "Codex lane",
      "A public-safe shortlist of repos closest to coding-agent workflows and adjacent orchestration patterns.",
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
    heroBody: "The smaller shelf: coding-agent repos, workflow references, and command-centre comparators worth watching.",
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
    description: "How the public repos hub is curated.",
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

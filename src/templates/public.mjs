import { absoluteUrl, buildDocument, escapeAttribute, escapeHtml, siteGraph } from "./layout.mjs";

function formatDate(value) {
  const parsed = new Date(value || "");
  return Number.isNaN(parsed.getTime())
    ? "Unknown date"
    : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(parsed);
}

function formatShortDate(value) {
  const parsed = new Date(value || "");
  return Number.isNaN(parsed.getTime())
    ? "unknown"
    : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(parsed);
}

function number(value) {
  return Number(value || 0).toLocaleString("en-GB");
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
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([tag]) => tag);
}

function publicNav() {
  return [
    { id: "home", href: "./", label: "Home" },
    { id: "repos", href: "repos/", label: "Library" },
    { id: "news", href: "news/", label: "Feed" },
    { id: "visualisations", href: "visualisations/", label: "Snapshots" },
    { id: "codex", href: "resources/codex/", label: "CLI and agents" },
    { id: "about", href: "about/", label: "About" },
    { id: "contact", href: "contact/", label: "Contact" },
  ];
}

function pageSchema(type, name, description, path) {
  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${absoluteUrl(path)}#page`,
    name,
    description,
    url: absoluteUrl(path),
    isPartOf: { "@id": `${absoluteUrl("")}#website` },
  };
}

function repoSchema(repo) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    "@id": `${absoluteUrl(`repos/${repo.slug}/`)}#source-code`,
    name: repo.name,
    url: absoluteUrl(`repos/${repo.slug}/`),
    codeRepository: repo.repoUrl || undefined,
    programmingLanguage: repo.tags?.find((tag) => /python|typescript|javascript|rust|go|ruby/i.test(tag)) || undefined,
    description: repo.summary,
    dateModified: repo.refreshedAt,
    keywords: repo.tags || [],
  };
}

function itemListSchema(name, items, path, itemMapper) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${absoluteUrl(path)}#item-list`,
    name,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: itemMapper(item),
    })),
  };
}

function tagsMarkup(tags = []) {
  return tags.map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join("");
}

function stat(label, value, detail = "") {
  return `<article class="stat-card">
    <p class="eyebrow">${escapeHtml(label)}</p>
    <p class="stat-card__value">${escapeHtml(value)}</p>
    ${detail ? `<p class="stat-card__detail">${escapeHtml(detail)}</p>` : ""}
  </article>`;
}

function liveDotLabel(label) {
  return `<span class="inline-live"><span class="livedot" aria-hidden="true"></span>${escapeHtml(label)}</span>`;
}

function repoPoster(record) {
  return `<div class="repo-poster" aria-hidden="true">
    <span>${escapeHtml(record.category || "Repository")}</span>
    <strong>${escapeHtml(record.name.split("/").pop() || record.name)}</strong>
  </div>`;
}

function repoCard(record, options = {}) {
  const compact = options.compact ? " repo-card--compact" : "";
  const action = options.action || "Open dossier";
  return `<article class="repo-card${compact}" data-category="${escapeAttribute(record.category)}" data-source="${escapeAttribute(record.source)}" data-tags="${escapeAttribute((record.tags || []).join("|"))}">
    ${repoPoster(record)}
    <div class="repo-card__body">
      <div class="repo-card__topline">
        <span class="pill">${escapeHtml(record.category)}</span>
        <span class="pill pill--soft">${number(record.stars)} stars</span>
      </div>
      <h3 class="repo-card__title"><a href="repos/${escapeAttribute(record.slug)}/">${escapeHtml(record.name)}</a></h3>
      <p class="repo-card__summary">${escapeHtml(record.summary)}</p>
      <p class="repo-card__detail"><strong>Why it matters:</strong> ${escapeHtml(record.whyRelevant)}</p>
      <div class="tag-row">${tagsMarkup(record.tags)}</div>
      <div class="repo-card__footer">
        <span>Checked ${escapeHtml(formatShortDate(record.refreshedAt))}</span>
        <a class="text-link" href="repos/${escapeAttribute(record.slug)}/">${escapeHtml(action)}</a>
      </div>
    </div>
  </article>`;
}

function agentCard(record, index, selected = false) {
  const role = record.category?.replace(/\b(and|for|the)\b/gi, "").trim() || "Repository";
  return `<article class="agent-card ${selected ? "is-selected" : ""}" data-repo-card>
    <a class="agent-card__link" href="repos/${escapeAttribute(record.slug)}/">
      <span class="agent-card__id">A${String(index + 1).padStart(2, "0")}</span>
      ${selected ? `<span class="brk brk--tl"></span><span class="brk brk--tr"></span><span class="brk brk--bl"></span><span class="brk brk--br"></span>` : ""}
      <span class="agent-card__name">${escapeHtml(record.name.split("/").pop() || record.name)}</span>
      <span class="agent-card__role">${escapeHtml(role)}</span>
      <span class="agent-card__stars">${number(record.stars)} stars</span>
    </a>
  </article>`;
}

function telemetry(siteData, label = "Foundry feed") {
  const sources = new Set(siteData.repos.map((item) => item.sourcePlatform || item.source).filter(Boolean));
  return `<section class="telemetry-bar" aria-label="${escapeAttribute(label)} telemetry">
    <div class="telemetry-bar__label">${liveDotLabel(label)}</div>
    ${stat("Repos tracked", number(siteData.metrics.totalRepos), "Public-safe records")}
    ${stat("Featured", number(siteData.metrics.featuredCount), "Curated shortlist")}
    ${stat("Sources", number(sources.size), "Source hosts")}
    ${stat("New this week", number(siteData.metrics.newThisWeek), "Not a live counter")}
  </section>`;
}

function scoreboard(siteData) {
  const items = siteData.repos
    .slice(0, 10)
    .map((repo) => `${repo.name} star signal ${number(repo.stars)}`);
  const text = [...items, ...items]
    .map((item) => `<span>${escapeHtml(item)}</span>`)
    .join("");

  return `<aside class="scoreboard" aria-label="Repo Foundry scoreboard">
    <span class="scoreboard__label">Scoreboard</span>
    <div class="scoreboard__window">
      <div class="ticker-track">${text}</div>
    </div>
  </aside>`;
}

function sectionFrame(title, description, content, actions = "") {
  return `<section class="content-section" data-reveal>
    <div class="section-heading">
      <div>
        <p class="eyebrow">${escapeHtml(title)}</p>
        <h2>${escapeHtml(description)}</h2>
      </div>
      ${actions}
    </div>
    ${content}
  </section>`;
}

function lanePanel(siteData, category) {
  const items = reposForCategory(siteData, category.name);
  const lead = items[0];
  const chips = topTags(items, 3);

  return `<a class="lane-panel" href="${escapeAttribute(laneHref(category))}">
    <span class="lane-panel__count">${escapeHtml(category.count)}</span>
    <span class="lane-panel__label">${escapeHtml(category.shortLabel)}</span>
    <strong>${escapeHtml(category.name)}</strong>
    <span>${escapeHtml(category.description)}</span>
    ${lead ? `<span class="lane-panel__lead">Lead signal: ${escapeHtml(lead.name)}</span>` : ""}
    <span class="tag-row">${tagsMarkup(chips)}</span>
  </a>`;
}

function newsCard(item) {
  const source = item.projectName || item.sourcePlatform || item.source || "Source";
  const highlights = Array.isArray(item.highlights) && item.highlights.length
    ? `<div class="news-card__highlights">${item.highlights
        .map((entry) => `<p>${escapeHtml(entry)}</p>`)
        .join("")}</div>`
    : "";

  return `<article class="news-card" data-news-item>
    <div class="news-card__meta">
      <span class="pill">${escapeHtml(source)}</span>
      <span class="pill pill--soft">${escapeHtml(formatDate(item.publishedAt))}</span>
    </div>
    <h3><a href="${escapeAttribute(item.url || "news/")}">${escapeHtml(item.title)}</a></h3>
    <p>${escapeHtml(item.summary)}</p>
    ${highlights}
  </article>`;
}

function resourceCard(item) {
  return `<article class="resource-card">
    <p class="eyebrow">Resource</p>
    <h3><a href="${escapeAttribute(item.url)}">${escapeHtml(item.title)}</a></h3>
    <p>${escapeHtml(item.summary)}</p>
    <div class="tag-row">${tagsMarkup(item.tags)}</div>
  </article>`;
}

function buildHomeContent(siteData) {
  const selected = siteData.featured[0] || siteData.repos[0];
  const agents = [
    selected,
    ...siteData.repos.filter((repo) => repo.slug !== selected?.slug),
  ].filter(Boolean).slice(0, 8);
  const history = siteData.news.slice(0, 4);
  const lanes = siteData.categories.map((category) => lanePanel(siteData, category)).join("");

  return `
    ${telemetry(siteData, "Loadout online")}
    <section class="home-loadout" data-reveal>
      <div class="loadout-copy">
        <p class="eyebrow">// loadout</p>
        <h2>Select your weapon.</h2>
        <p>Repo Foundry tracks public open-source signals for operators who care about coding agents, automation, command surfaces, and reusable infrastructure.</p>
        <div class="action-row">
          <a class="button-link" href="repos/">Lock in agent</a>
          <a class="button-link button-link--ghost" href="news/">Open feed</a>
        </div>
      </div>
      <div class="agent-grid" aria-label="Featured repository agents">
        ${agents.map((repo, index) => agentCard(repo, index, index === 0)).join("")}
      </div>
      <aside class="detail-panel" aria-label="Selected repository detail">
        <span class="brk brk--tl"></span><span class="brk brk--br"></span>
        <p class="eyebrow">Selected A01</p>
        <h2>${selected ? escapeHtml(selected.name) : "Repo Foundry"}</h2>
        <p>${selected ? escapeHtml(selected.summary) : escapeHtml(siteData.description)}</p>
        <div class="stat-lines">
          <span><b>HP</b><i style="--bar:92%"></i></span>
          <span><b>DMG</b><i style="--bar:88%"></i></span>
          <span><b>SPD</b><i style="--bar:70%"></i></span>
          <span><b>DEF</b><i style="--bar:54%"></i></span>
        </div>
        <p class="eyebrow">Match history</p>
        <div class="mini-feed">
          ${history.length
            ? history.map((item) => `<a href="${escapeAttribute(item.url || "news/")}"><span>${escapeHtml(formatShortDate(item.publishedAt))}</span>${escapeHtml(item.title)}</a>`).join("")
            : `<p>No public release notes are currently available.</p>`}
        </div>
      </aside>
    </section>
    ${scoreboard(siteData)}
    ${sectionFrame(
      "Browse by lane",
      "Shelves for the public repo library, grouped by operator concern rather than alphabetical hoarding.",
      `<div class="lane-grid">${lanes}</div>`,
      `<a class="button-link button-link--ghost" href="repos/">Open library</a>`,
    )}
    ${sectionFrame(
      "Featured dossiers",
      "The first shelf: high-signal repos with enough traction and relevance to deserve immediate attention.",
      `<div class="card-grid card-grid--feature">${siteData.featured.slice(0, 4).map((repo) => repoCard(repo)).join("")}</div>`,
      `<a class="button-link button-link--ghost" href="trending/">Recent additions</a>`,
    )}
    ${sectionFrame(
      "CLI and agents",
      "Codex-style CLIs, command surfaces, and agent workflow references closest to hands-on development.",
      `<div class="card-grid">${siteData.codexResources.slice(0, 3).map(resourceCard).join("")}</div>`,
      `<a class="button-link button-link--ghost" href="resources/codex/">Open shelf</a>`,
    )}
  `;
}

function buildFeedContent(siteData) {
  const highlights = siteData.repos.slice(0, 3).map((repo) => repoCard(repo, { compact: true, action: "Read dossier" })).join("");
  const stories = siteData.news.length
    ? siteData.news.map(newsCard).join("")
    : `<p class="empty-state">No public release items are available yet. Run the release sync and rebuild the site to repopulate this page.</p>`;

  return `
    ${telemetry(siteData, "Broadcast on-air")}
    <section class="feed-grid" data-reveal>
      <div class="story-stack">
        <p class="eyebrow">// story drops</p>
        ${stories}
      </div>
      <aside class="source-panel">
        <p class="eyebrow">Highlight reel</p>
        ${highlights}
        <div class="source-panel__note">
          <p class="eyebrow">Sources</p>
          <p>Feed items use public-safe release and project update records. Unknowns stay out of the public build.</p>
        </div>
      </aside>
    </section>
    ${scoreboard(siteData)}
  `;
}

function buildAboutContent(siteData) {
  return `
    <section class="about-grid" data-reveal>
      <article class="operator-card">
        <p class="eyebrow">// whoami</p>
        <h2>The Operator.</h2>
        <p>Repo Foundry is Kol Tregaskes' public repo-intelligence surface: a slower, curated layer over fast-moving open-source infrastructure.</p>
        <p class="operator-card__status">${liveDotLabel("Company in formation")}</p>
      </article>
      <div class="rules-stack">
        ${siteData.editorialNotes
          .map(
            (item) => `<article class="rule-card">
              <p class="eyebrow">${escapeHtml(item.id)}</p>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.body)}</p>
            </article>`,
          )
          .join("")}
        <article class="rule-card">
          <p class="eyebrow">Public boundary</p>
          <h3>What never ships.</h3>
          <p>${escapeHtml(siteData.publicBoundary)}</p>
        </article>
      </div>
    </section>
    ${sectionFrame(
      "Lanes patrolled",
      "The current public shelves are deliberately practical and biased towards systems worth studying.",
      `<div class="lane-grid">${siteData.categories.map((category) => lanePanel(siteData, category)).join("")}</div>`,
    )}
  `;
}

function buildContactContent() {
  return `
    <section class="contact-grid" data-reveal>
      <form class="contact-form" data-contact-form>
        <p class="eyebrow">// comms.transmit</p>
        <h2>Incoming.</h2>
        <p>Send a repo signal, correction, source note, or cross-link suggestion. This static form prepares a local draft in v1; it does not send to a backend.</p>
        <div class="form-grid">
          <label for="contact-name">Name</label>
          <input id="contact-name" name="name" autocomplete="name" required />
          <label for="contact-email">Email</label>
          <input id="contact-email" name="email" type="email" autocomplete="email" required />
          <label for="contact-topic">Signal type</label>
          <select id="contact-topic" name="topic">
            <option>Repo suggestion</option>
            <option>Correction</option>
            <option>Source note</option>
            <option>Estate cross-link</option>
          </select>
          <label for="contact-message">Message</label>
          <textarea id="contact-message" name="message" rows="6" required></textarea>
        </div>
        <button type="submit" class="button-link">Transmit draft</button>
        <p class="form-status" data-contact-status aria-live="polite"></p>
      </form>
      <aside class="channel-stack">
        <article class="channel-card">
          <p class="eyebrow">Channel</p>
          <h3>GitHub</h3>
          <p>Open public issues or pull requests for repository data, build output, and public site fixes.</p>
          <a class="text-link" href="https://github.com/koltregaskes/repo-foundry">Open repo</a>
        </article>
        <article class="channel-card">
          <p class="eyebrow">Ops status</p>
          <h3>Static-first.</h3>
          <p>No backend endpoint, no paid services, and no credentialed contact pipeline in v1.</p>
        </article>
        <article class="channel-card">
          <p class="eyebrow">Transmission log</p>
          <h3>Public-safe only.</h3>
          <p>Please do not send secrets, credentials, private repo links, or local workspace paths.</p>
        </article>
      </aside>
    </section>
  `;
}

function buildListingContent(siteData, items, page, archiveOnly = false) {
  const cards = items.map((repo) => repoCard(repo)).join("");
  return `
    <section class="content-section" data-reveal>
      <div class="section-heading">
        <div>
          <p class="eyebrow">${archiveOnly ? "Archive" : "Library"}</p>
          <h2>${page === "trending" ? "A freshness-first view of the public-safe research feed." : "The main browse surface for curated repositories."}</h2>
        </div>
        <div class="action-row">
          ${archiveOnly ? `<a class="button-link button-link--ghost" href="${page === "trending" ? "trending/" : "repos/"}">Back to latest</a>` : `<a class="button-link button-link--ghost" href="${page === "trending" ? "trending/archive/" : "repos/archive/"}">Open archive</a>`}
          <a class="button-link button-link--ghost" href="${page === "trending" ? "repos/" : "trending/"}">${page === "trending" ? "Open full library" : "Recent additions"}</a>
        </div>
      </div>
      <div id="publicFilters" class="filter-bar"></div>
      <div id="publicList" class="card-grid">${cards}</div>
    </section>
  `;
}

export function buildPublicHome(siteData, baseHref = "./") {
  return buildDocument({
    audience: "public",
    title: `${siteData.workingTitle} | Public repo intelligence`,
    description: siteData.description,
    currentKey: "home",
    baseHref,
    canonicalPath: "",
    navItems: publicNav(),
    eyebrow: "Public surface",
    heroKicker: "Broadcast on-air",
    heroTitle: "Select your weapon.",
    heroBody: siteData.strapline,
    utilityLinks: [{ href: "about/", label: "Method" }],
    content: buildHomeContent(siteData),
    scriptPath: "assets/public-app.js",
    jsonLd: [
      ...siteGraph(siteData),
      pageSchema("WebPage", "Repo Foundry home", siteData.description, ""),
      itemListSchema("Featured Repo Foundry dossiers", siteData.featured.slice(0, 6), "", (repo) => ({ "@id": `${absoluteUrl(`repos/${repo.slug}/`)}#source-code` })),
    ],
  });
}

export function buildTrendingPage(siteData, archiveOnly = false, baseHref = "../") {
  const items = archiveOnly ? siteData.repos.slice(12) : siteData.repos.slice(0, 12);
  const path = archiveOnly ? "trending/archive/" : "trending/";
  return buildDocument({
    audience: "public",
    title: `${siteData.workingTitle} | ${archiveOnly ? "Signals archive" : "Live signals"}`,
    description: "Recent additions across the public-safe research feed.",
    currentKey: "repos",
    baseHref,
    canonicalPath: path,
    navItems: publicNav(),
    eyebrow: "Signal feed",
    heroKicker: "Repository radar",
    heroTitle: archiveOnly ? "Signals archive." : "Live signals.",
    heroBody: "A freshness-first view of the library for people who care about new arrivals more than the full archive.",
    content: buildListingContent(siteData, items, "trending", archiveOnly),
    pageData: {
      page: archiveOnly ? "trending-archive" : "trending",
      items: siteData.repos,
      defaults: { freshness: archiveOnly ? "archive" : "fresh", featuredOnly: false },
    },
    scriptPath: "assets/public-app.js",
    jsonLd: [
      pageSchema("CollectionPage", archiveOnly ? "Repo Foundry signals archive" : "Repo Foundry live signals", "Recent additions across the public-safe research feed.", path),
      itemListSchema("Repo Foundry signals", items, path, (repo) => ({ "@id": `${absoluteUrl(`repos/${repo.slug}/`)}#source-code` })),
    ],
    breadcrumbs: [
      { name: "Home", path: "" },
      { name: archiveOnly ? "Signals archive" : "Live signals", path },
    ],
  });
}

export function buildRepoDirectoryPage(siteData, archiveOnly = false, baseHref = "../") {
  const items = archiveOnly ? siteData.repos.slice(12) : siteData.repos.slice(0, 12);
  const path = archiveOnly ? "repos/archive/" : "repos/";
  return buildDocument({
    audience: "public",
    title: `${siteData.workingTitle} | Repository library`,
    description: "Curated repository library.",
    currentKey: "repos",
    baseHref,
    canonicalPath: path,
    navItems: publicNav(),
    eyebrow: "Foundry library",
    heroKicker: "Library online",
    heroTitle: archiveOnly ? "Library archive." : "Repository library.",
    heroBody: "Curated entries with practical summaries, why they matter, where they fit, and filters that keep the surface useful.",
    content: buildListingContent(siteData, items, "repos", archiveOnly),
    pageData: {
      page: archiveOnly ? "repos-archive" : "repos",
      items: siteData.repos,
      defaults: { freshness: archiveOnly ? "archive" : "all", featuredOnly: false },
    },
    scriptPath: "assets/public-app.js",
    jsonLd: [
      pageSchema("CollectionPage", "Repo Foundry repository library", "Curated repository library.", path),
      itemListSchema("Repo Foundry repository library", items, path, (repo) => ({ "@id": `${absoluteUrl(`repos/${repo.slug}/`)}#source-code` })),
    ],
    breadcrumbs: [
      { name: "Home", path: "" },
      { name: "Repository library", path },
    ],
  });
}

export function buildLanesPage(siteData, baseHref = "../") {
  const content = sectionFrame(
    "Lane map",
    "The main shelves of Repo Foundry, grouped around the kinds of systems we expect to matter in real work.",
    `<div class="lane-grid">${siteData.categories.map((category) => lanePanel(siteData, category)).join("")}</div>`,
  );

  return buildDocument({
    audience: "public",
    title: `${siteData.workingTitle} | Lanes`,
    description: "Browse Repo Foundry by category and workflow lane.",
    currentKey: "repos",
    baseHref,
    canonicalPath: "lanes/",
    navItems: publicNav(),
    eyebrow: "Lane index",
    heroKicker: "Lanes patrolled",
    heroTitle: "Foundry lanes.",
    heroBody: "The site is organised into shelves for AI command centres, workflow automation, agent builders, media tooling, and productivity systems.",
    content,
    scriptPath: "assets/public-app.js",
    jsonLd: [
      pageSchema("CollectionPage", "Repo Foundry lanes", "Browse Repo Foundry by category and workflow lane.", "lanes/"),
      itemListSchema("Repo Foundry lanes", siteData.categories, "lanes/", (category) => ({ "@id": `${absoluteUrl(laneHref(category))}#page` })),
    ],
    breadcrumbs: [
      { name: "Home", path: "" },
      { name: "Lanes", path: "lanes/" },
    ],
  });
}

export function buildLaneDetailPage(siteData, category, baseHref = "../../") {
  const items = reposForCategory(siteData, category.name);
  const path = laneHref(category);
  const content = `
    <section class="detail-hero" data-reveal>
      <div class="detail-hero__meta">
        <span class="pill">${escapeHtml(category.name)}</span>
        <span class="pill pill--soft">${escapeHtml(items.length)} repos</span>
      </div>
      <h2>${escapeHtml(category.name)}</h2>
      <p>${escapeHtml(category.description)}</p>
      <div class="tag-row">${tagsMarkup(topTags(items, 5))}</div>
      <div class="action-row">
        <a class="button-link" href="repos/">Open full library</a>
        <a class="button-link button-link--ghost" href="lanes/">Back to lanes</a>
      </div>
    </section>
    ${sectionFrame(
      "Lane shortlist",
      "Every current public-safe repo in this lane, with featured picks floated first.",
      `<div class="card-grid">${items.length ? items.map((repo) => repoCard(repo)).join("") : `<p class="empty-state">No public-safe repos are currently pinned to this lane.</p>`}</div>`,
    )}
  `;

  return buildDocument({
    audience: "public",
    title: `${category.name} | ${siteData.workingTitle}`,
    description: category.description,
    currentKey: "repos",
    baseHref,
    canonicalPath: path,
    navItems: publicNav(),
    eyebrow: "Lane dossier",
    heroKicker: "Lane selected",
    heroTitle: `${category.name}.`,
    heroBody: "A category-level shelf inside Repo Foundry, built for browsing patterns instead of one-off repo hunting.",
    content,
    scriptPath: "assets/public-app.js",
    jsonLd: [
      pageSchema("CollectionPage", `${category.name} | Repo Foundry`, category.description, path),
      itemListSchema(`${category.name} repos`, items, path, (repo) => ({ "@id": `${absoluteUrl(`repos/${repo.slug}/`)}#source-code` })),
    ],
    breadcrumbs: [
      { name: "Home", path: "" },
      { name: "Lanes", path: "lanes/" },
      { name: category.name, path },
    ],
  });
}

export function buildRepoDetailPage(siteData, repo, baseHref = "../../") {
  const related = siteData.repos.filter((item) => item.slug !== repo.slug && item.category === repo.category).slice(0, 3);
  const currentLane = siteData.categories.find((item) => item.name === repo.category);
  const path = `repos/${repo.slug}/`;
  const content = `
    <section class="detail-hero dossier-hero" data-reveal>
      <div class="detail-hero__meta">
        <span class="pill">${escapeHtml(repo.category)}</span>
        <span class="pill pill--soft">${number(repo.stars)} stars</span>
      </div>
      <h2>${escapeHtml(repo.name)}</h2>
      <p>${escapeHtml(repo.summary)}</p>
      <div class="tag-row">${tagsMarkup(repo.tags)}</div>
      <div class="action-row">
        ${repo.repoUrl ? `<a class="button-link" href="${escapeAttribute(repo.repoUrl)}">Open repository</a>` : ""}
        <a class="button-link button-link--ghost" href="repos/">Back to library</a>
        ${currentLane ? `<a class="button-link button-link--ghost" href="${escapeAttribute(laneHref(currentLane))}">Open lane</a>` : ""}
      </div>
    </section>
    <section class="detail-grid" data-reveal>
      <article class="detail-card">
        <p class="eyebrow">Why it matters</p>
        <p>${escapeHtml(repo.whyRelevant)}</p>
      </article>
      <article class="detail-card">
        <p class="eyebrow">Potential use</p>
        <p>${escapeHtml(repo.potentialUse)}</p>
      </article>
      <article class="detail-card">
        <p class="eyebrow">Freshness</p>
        <p>Added ${escapeHtml(formatDate(repo.addedAt))} and refreshed ${escapeHtml(formatDate(repo.refreshedAt))}.</p>
      </article>
    </section>
    ${sectionFrame("Related", "More repos from the same shelf.", `<div class="card-grid">${related.map((item) => repoCard(item)).join("")}</div>`)}
  `;

  return buildDocument({
    audience: "public",
    title: `${repo.name} | ${siteData.workingTitle}`,
    description: repo.summary,
    currentKey: "repos",
    baseHref,
    canonicalPath: path,
    navItems: publicNav(),
    eyebrow: "Repo dossier",
    heroKicker: "Dossier loaded",
    heroTitle: repo.name,
    heroBody: "A public-safe dossier generated from the current Repo Foundry research record.",
    content,
    scriptPath: "assets/public-app.js",
    jsonLd: [
      pageSchema("ProfilePage", `${repo.name} dossier`, repo.summary, path),
      repoSchema(repo),
    ],
    breadcrumbs: [
      { name: "Home", path: "" },
      { name: "Repository library", path: "repos/" },
      { name: repo.name, path },
    ],
  });
}

export function buildNewsPage(siteData, baseHref = "../") {
  return buildDocument({
    audience: "public",
    title: `${siteData.workingTitle} | Feed`,
    description: "Latest tracked releases and project updates from the public repo feed.",
    currentKey: "news",
    baseHref,
    canonicalPath: "news/",
    navItems: publicNav(),
    eyebrow: "Public release radar",
    heroKicker: "Broadcast on-air",
    heroTitle: "Foundry Feed.",
    heroBody: "A sharper news layer: release notes, project updates, and public repo signals kept separate from the directory.",
    content: buildFeedContent(siteData),
    pageData: { page: "news", items: siteData.news },
    scriptPath: "assets/public-app.js",
    jsonLd: [
      pageSchema("CollectionPage", "Repo Foundry feed", "Latest tracked releases and project updates from the public repo feed.", "news/"),
      itemListSchema("Repo Foundry feed items", siteData.news, "news/", (item) => ({
        "@type": "CreativeWork",
        name: item.title,
        url: item.url || absoluteUrl("news/"),
        datePublished: item.publishedAt,
      })),
    ],
    breadcrumbs: [
      { name: "Home", path: "" },
      { name: "Feed", path: "news/" },
    ],
  });
}

export function buildVisualisationsPage(siteData, baseHref = "../") {
  const content = `
    <section class="content-section" data-reveal>
      <div class="section-heading">
        <div>
          <p class="eyebrow">Snapshots</p>
          <h2>A lightweight view of what the public feed is currently biased towards.</h2>
        </div>
      </div>
      <div id="visualisationSummary" class="visual-summary-grid"></div>
      <div id="visualisationRoot" class="visualisation-grid"></div>
    </section>
    ${sectionFrame(
      "Method",
      "These snapshots are generated from the current public-safe dataset, not from private operational material.",
      `<div class="stack-list">
        <article class="stack-item stack-item--long">
          <h3>What is counted</h3>
          <p>Repo Foundry tracks curated public-safe repo records, then groups them by lane, source, star band, and freshness.</p>
        </article>
        <article class="stack-item stack-item--long">
          <h3>Why this matters</h3>
            <p>The point is not just pretty charts. It shows where attention is going and whether the feed is fresh enough to trust.</p>
        </article>
      </div>`,
    )}
  `;

  return buildDocument({
    audience: "public",
    title: `${siteData.workingTitle} | Snapshots`,
    description: "Category mix, source mix, star bands, and freshness across the public feed.",
    currentKey: "visualisations",
    baseHref,
    canonicalPath: "visualisations/",
    navItems: publicNav(),
    eyebrow: "Public snapshots",
    heroKicker: "Snapshot deck",
    heroTitle: "Visualisations.",
    heroBody: "A quick look at category balance, popularity bands, and how fresh the current watchlist really is.",
    content,
    pageData: {
      page: "visualisations",
      visualisations: siteData.visualisations,
      metrics: siteData.metrics,
      categories: siteData.categories,
    },
    scriptPath: "assets/public-app.js",
    jsonLd: [
      pageSchema("CollectionPage", "Repo Foundry snapshots", "Category mix, source mix, star bands, and freshness across the public feed.", "visualisations/"),
      {
        "@context": "https://schema.org",
        "@type": "Dataset",
        "@id": `${absoluteUrl("visualisations/")}#dataset`,
        name: "Repo Foundry public-safe repository snapshot",
        description: "Generated category, source, star-band, and freshness summaries for the public Repo Foundry dataset.",
        url: absoluteUrl("visualisations/"),
        dateModified: siteData.generatedAt,
      },
    ],
    breadcrumbs: [
      { name: "Home", path: "" },
      { name: "Snapshots", path: "visualisations/" },
    ],
  });
}

export function buildCodexPage(siteData, baseHref = "../../") {
  const content = `
    ${sectionFrame(
      "CLI and agents",
      "A public-safe shortlist of Codex-style CLIs, coding-agent workflows, orchestration patterns, and operator-grade command surfaces.",
      `<div class="card-grid">${siteData.codexResources.map(resourceCard).join("")}</div>`,
    )}
    ${sectionFrame(
      "Watchlist",
      "Higher-frequency repos we keep an eye on because the workflows change fast.",
      `<div class="stack-list">${siteData.watchlist
        .map(
          (item) => `<article class="stack-item">
            <div>
              <h3>${escapeHtml(item.name)}</h3>
              <p>${escapeHtml(item.notes)}</p>
            </div>
            <span class="pill pill--soft">${escapeHtml(item.cadence)}</span>
          </article>`,
        )
        .join("")}</div>`,
    )}
  `;

  return buildDocument({
    audience: "public",
    title: `${siteData.workingTitle} | CLI and agent resources`,
    description: "Coding-agent CLIs, command surfaces, and workflow resources.",
    currentKey: "codex",
    baseHref,
    canonicalPath: "resources/codex/",
    navItems: publicNav(),
    eyebrow: "Resource shelf",
    heroKicker: "Agent shelf",
    heroTitle: "CLI and agents.",
    heroBody: "Codex-style tools, coding-agent repos, workflow references, and comparators worth watching closely.",
    content,
    scriptPath: "assets/public-app.js",
    jsonLd: [
      pageSchema("CollectionPage", "Repo Foundry CLI and agent resources", "Coding-agent CLIs, command surfaces, and workflow resources.", "resources/codex/"),
      itemListSchema("CLI and agent resources", siteData.codexResources, "resources/codex/", (item) => ({
        "@type": "CreativeWork",
        name: item.title,
        url: item.url,
        description: item.summary,
      })),
    ],
    breadcrumbs: [
      { name: "Home", path: "" },
      { name: "CLI and agents", path: "resources/codex/" },
    ],
  });
}

export function buildAboutPage(siteData, baseHref = "../") {
  return buildDocument({
    audience: "public",
    title: `${siteData.workingTitle} | About`,
    description: "How Repo Foundry is curated.",
    currentKey: "about",
    baseHref,
    canonicalPath: "about/",
    navItems: publicNav(),
    eyebrow: "Public methodology",
    heroKicker: "Operator dossier",
    heroTitle: "The Operator.",
    heroBody: "A public-safe discovery surface built from a stricter internal research programme.",
    content: buildAboutContent(siteData),
    scriptPath: "assets/public-app.js",
    jsonLd: [
      pageSchema("AboutPage", "About Repo Foundry", "How Repo Foundry is curated.", "about/"),
    ],
    breadcrumbs: [
      { name: "Home", path: "" },
      { name: "About", path: "about/" },
    ],
  });
}

export function buildContactPage(siteData, baseHref = "../") {
  return buildDocument({
    audience: "public",
    title: `${siteData.workingTitle} | Contact`,
    description: "Send public-safe Repo Foundry source notes, repo suggestions, and corrections.",
    currentKey: "contact",
    baseHref,
    canonicalPath: "contact/",
    navItems: publicNav(),
    eyebrow: "Open comms",
    heroKicker: "Incoming channel",
    heroTitle: "Incoming.",
    heroBody: "A static contact surface for public-safe source notes, repo suggestions, corrections, and estate cross-links.",
    content: buildContactContent(),
    scriptPath: "assets/public-app.js",
    jsonLd: [
      pageSchema("ContactPage", "Contact Repo Foundry", "Send public-safe Repo Foundry source notes, repo suggestions, and corrections.", "contact/"),
    ],
    breadcrumbs: [
      { name: "Home", path: "" },
      { name: "Contact", path: "contact/" },
    ],
  });
}

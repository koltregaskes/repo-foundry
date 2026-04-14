import { buildDocument } from "./layout.mjs";

function internalNav() {
  return [
    { id: "dashboard", href: "./", label: "Dashboard" },
    { id: "trackedRepos", href: "tracked-repos/", label: "Tracked repos" },
    { id: "backlog", href: "backlog/", label: "Backlog" },
    { id: "sessions", href: "sessions/", label: "Sessions" },
    { id: "ops", href: "ops/", label: "Ops" },
    { id: "knowledge", href: "knowledge/", label: "Knowledge" },
    { id: "cadence", href: "cadence/", label: "Cadence" },
  ];
}

function placeholderCard(title, body) {
  return `<article class="detail-card detail-card--placeholder">
    <p class="detail-card__eyebrow">${title}</p>
    <p>${body}</p>
  </article>`;
}

export function buildInternalPage({
  title,
  intro,
  viewId,
  seed,
  baseHref = "./",
  utilityLinks = [],
}) {
  const content = `
    <section class="content-section">
      <div class="section-heading">
        <div>
          <p class="section-heading__eyebrow">Internal view</p>
          <h2 class="section-heading__title">${title}</h2>
        </div>
      </div>
      <p class="section-intro">${intro}</p>
      <div id="internalRoot" class="internal-root">
        ${placeholderCard("Loading", "Fetching the latest manager-facing data for this route.")}
      </div>
    </section>
  `;

  return buildDocument({
    audience: "internal",
    title: `${title} | Repos Hub internal`,
    description: intro,
    currentKey: viewId,
    baseHref,
    navItems: internalNav(),
    eyebrow: "Private runtime",
    heroTitle: "Repos Hub",
    heroBody: "Workspace-specific repo intelligence, session state, backlog, and operational health.",
    utilityLinks,
    content,
    pageData: { viewId, seed },
    scriptPath: "assets/internal-app.js",
    bodyClass: "body--internal",
  });
}

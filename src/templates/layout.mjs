export const SITE_URL = "https://koltregaskes.github.io/repo-foundry";

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function escapeAttribute(value) {
  return escapeHtml(value);
}

function serializeData(value) {
  return JSON.stringify(value)
    .replaceAll("&", "\\u0026")
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e");
}

function absoluteUrl(path = "/") {
  const clean = String(path || "/").replace(/^\.?\//, "");
  return `${SITE_URL}/${clean}`.replace(/\/$/, "/");
}

function navMarkup(items, currentKey) {
  return items
    .map((item) => {
      const active = item.id === currentKey ? "is-active" : "";
      return `<a class="hub-nav__link ${active}" href="${escapeAttribute(item.href)}">${escapeHtml(item.label)}</a>`;
    })
    .join("");
}

function controlMarkup() {
  const accents = [
    ["magenta", "Hot magenta"],
    ["blue", "Electric blue"],
    ["green", "Phosphor green"],
    ["amber", "Amber"],
    ["violet", "Iris violet"],
  ];

  return `<div class="foundry-controls" aria-label="Display controls">
    <div class="skin-toggle" role="group" aria-label="Choose site skin">
      <button type="button" data-skin-set="hud" aria-pressed="true">HUD</button>
      <button type="button" data-skin-set="term" aria-pressed="false">Terminal</button>
    </div>
    <div class="accent-picker" role="group" aria-label="Choose accent colour">
      ${accents
        .map(
          ([key, label], index) =>
            `<button type="button" class="accent-picker__dot accent-picker__dot--${escapeAttribute(key)}" data-accent-set="${escapeAttribute(key)}" aria-label="${escapeAttribute(label)} accent" aria-pressed="${index === 0 ? "true" : "false"}"></button>`,
        )
        .join("")}
    </div>
  </div>`;
}

function buildJsonLd(jsonLd) {
  const blocks = Array.isArray(jsonLd) ? jsonLd.filter(Boolean) : jsonLd ? [jsonLd] : [];
  return blocks
    .map((block) => `<script type="application/ld+json">${serializeData(block)}</script>`)
    .join("\n");
}

function breadcrumbsJsonLd(items = []) {
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path || ""),
    })),
  };
}

export function buildDocument({
  audience,
  title,
  description,
  currentKey,
  navItems,
  baseHref = "./",
  canonicalPath = "",
  eyebrow,
  heroTitle,
  heroBody,
  heroKicker = "Broadcast on-air",
  utilityLinks = [],
  content,
  pageData = null,
  scriptPath,
  bodyClass = "",
  jsonLd = [],
  breadcrumbs = [],
}) {
  const utilityMarkup = utilityLinks.length
    ? `<div class="hub-utility">${utilityLinks
        .map((item) => `<a class="hub-utility__link" href="${escapeAttribute(item.href)}">${escapeHtml(item.label)}</a>`)
        .join("")}</div>`
    : "";
  const dataScript = pageData ? `<script id="page-data" type="application/json">${serializeData(pageData)}</script>` : "";
  const canonicalUrl = absoluteUrl(canonicalPath);
  const schemaBlocks = buildJsonLd([...jsonLd, breadcrumbsJsonLd(breadcrumbs)]);

  return `<!DOCTYPE html>
<html lang="en-GB" data-skin="hud" data-accent="magenta">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeAttribute(description)}" />
    <meta name="theme-color" content="#0e0c10" />
    <meta name="robots" content="index,follow" />
    <link rel="canonical" href="${escapeAttribute(canonicalUrl)}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeAttribute(title)}" />
    <meta property="og:description" content="${escapeAttribute(description)}" />
    <meta property="og:url" content="${escapeAttribute(canonicalUrl)}" />
    <meta name="twitter:card" content="summary" />
    <base href="${escapeAttribute(baseHref)}" />
    <link rel="icon" type="image/svg+xml" href="assets/favicon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="assets/tokens.css" />
    <link rel="stylesheet" href="assets/shared.css" />
    ${schemaBlocks}
  </head>
  <body class="${escapeAttribute(bodyClass)}" data-surface="${escapeAttribute(audience)}">
    <a class="skip-link" href="#main">Skip to content</a>
    <div class="site-backdrop" aria-hidden="true"></div>
    <div class="site-shell">
      <header class="site-header" data-reveal>
        <div class="site-header__band">
          <a class="wordmark" href="./" aria-label="Repo Foundry home">repo<span>.</span>foundry</a>
          <nav class="hub-nav" aria-label="Primary">
            ${navMarkup(navItems, currentKey)}
          </nav>
          <div class="site-header__actions">
            ${utilityMarkup}
            ${controlMarkup()}
          </div>
        </div>
        <section class="site-header__hero" aria-labelledby="page-title">
          <div class="site-header__copy">
            <p class="site-header__eyebrow"><span class="livedot" aria-hidden="true"></span>${escapeHtml(heroKicker)}</p>
            <p class="site-header__audience">${escapeHtml(eyebrow)}</p>
            <h1 id="page-title" class="site-header__title">${escapeHtml(heroTitle)}</h1>
          </div>
          <div class="site-header__body-wrap">
            <p class="site-header__body">${escapeHtml(heroBody)}</p>
            <p class="term-prompt" aria-hidden="true">kol@foundry:${escapeHtml(currentKey || "home")} $ ${escapeHtml(heroTitle.toLowerCase())}</p>
          </div>
        </section>
      </header>
      <main id="main" class="site-main">
        ${content}
      </main>
      <footer class="site-footer">
        <div class="footer-primary">
          <a class="footer-wordmark" href="./">repo<span>.</span>foundry</a>
          <p>Public-safe discovery for high-signal open-source repositories, coding-agent tools, and operator-grade workflow infrastructure.</p>
        </div>
        <section class="footer-estate-panel" aria-label="Elusion Works umbrella">
          <div>
            <p class="footer-estate-kicker">Umbrella home</p>
            <a class="footer-estate-title" href="https://elusionworks.com/">Elusion Works</a>
          </div>
          <p>The showcase for Kol's websites, tools, games, and web experiments. Not a formal company; more like the public front door for the estate.</p>
          <a class="footer-estate-cta" href="https://elusionworks.com/">Visit Elusion Works -&gt;</a>
        </section>
        <div class="footer-directory">
          <nav class="footer-links" aria-label="Repo Foundry pages">
            <p>Repo Foundry</p>
            <a href="./">Home</a>
            <a href="repos/">Library</a>
            <a href="news/">Feed</a>
            <a href="visualisations/">Snapshots</a>
            <a href="resources/codex/">CLI and agents</a>
            <a href="about/">About</a>
            <a href="contact/">Contact</a>
          </nav>
          <nav class="footer-links" aria-label="Other Kol projects">
            <p>Projects</p>
            <a href="https://koltregaskes.com/">Kol's Korner</a>
            <a href="https://theairesourcehub.com/">AI Resource Hub</a>
            <a href="https://axylusion.com/">Axy Lusion</a>
            <a href="https://ghostinthemodels.com/">Ghost in the Models</a>
            <a href="https://koltregaskesphotography.com/">Photography</a>
          </nav>
          <nav class="footer-links" aria-label="Contact and source links">
            <p>Contact</p>
            <a href="https://github.com/koltregaskes/repo-foundry">GitHub</a>
            <a href="https://github.com/koltregaskes">Kol on GitHub</a>
            <a href="https://x.com/koltregaskes">X / Twitter</a>
            <a href="https://koltregaskes.com/contact/">Contact Kol</a>
          </nav>
        </div>
        <p class="footer-copyright">Repo Foundry &copy; 2026 Kol Tregaskes. Public build only; private operational material stays out of this site.</p>
      </footer>
    </div>
    <aside class="shortcut-help" hidden data-shortcut-help aria-label="Keyboard shortcuts">
      <div class="shortcut-help__panel" role="dialog" aria-modal="false" aria-labelledby="shortcut-title">
        <button type="button" class="shortcut-help__close" data-shortcut-close aria-label="Close keyboard shortcut help">Close</button>
        <p class="eyebrow">Operator shortcuts</p>
        <h2 id="shortcut-title">Move fast without losing the thread.</h2>
        <dl>
          <div><dt>T</dt><dd>Toggle HUD and Terminal skins.</dd></div>
          <div><dt>1-5</dt><dd>Switch accent colour.</dd></div>
          <div><dt>J/K</dt><dd>Move through focusable cards and links.</dd></div>
          <div><dt>?</dt><dd>Open or close this help panel.</dd></div>
        </dl>
      </div>
    </aside>
    ${dataScript}
    <script src="assets/shell.js"></script>
    <script type="module" src="${escapeAttribute(scriptPath)}"></script>
  </body>
</html>`;
}

export function siteGraph(siteData) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Repo Foundry",
      url: SITE_URL,
      founder: { "@id": "https://koltregaskes.com/#person-kol" },
      parentOrganization: { "@id": "https://koltregaskes.com/#organization" },
      sameAs: ["https://github.com/koltregaskes/repo-foundry"],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "Repo Foundry",
      url: SITE_URL,
      description: siteData.description,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en-GB",
    },
  ];
}

export { absoluteUrl };

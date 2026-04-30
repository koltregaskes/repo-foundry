function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function serializePageData(value) {
  return JSON.stringify(value)
    .replaceAll("&", "\\u0026")
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e");
}

function navMarkup(items, currentKey) {
  return items
    .map((item) => {
      const active = item.id === currentKey ? "is-active" : "";
      return `<a class="hub-nav__link ${active}" href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`;
    })
    .join("");
}

export function buildDocument({
  audience,
  title,
  description,
  currentKey,
  navItems,
  baseHref = "./",
  eyebrow,
  heroTitle,
  heroBody,
  utilityLinks = [],
  content,
  pageData = null,
  scriptPath,
  bodyClass = "",
}) {
  const utilityMarkup = utilityLinks.length
    ? `<div class="hub-utility">${utilityLinks
        .map((item) => `<a class="hub-utility__link" href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`)
        .join("")}</div>`
    : "";
  const dataScript = pageData
    ? `<script id="page-data" type="application/json">${serializePageData(pageData)}</script>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="theme-color" content="#070a12" />
    <base href="${escapeHtml(baseHref)}" />
    <link rel="icon" type="image/svg+xml" href="assets/favicon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Manrope:wght@400;500;600;700;800&family=Sora:wght@500;600;700;800&display=swap"
      rel="stylesheet"
    />
    <script>
      (function () {
        var stored = null;
        try {
          stored = window.localStorage.getItem("repo-foundry-theme");
        } catch (error) {}
        document.documentElement.dataset.theme = stored === "light" ? "light" : "dark";
      })();
    </script>
    <link rel="stylesheet" href="assets/shared.css" />
  </head>
  <body class="${escapeHtml(bodyClass)}" data-surface="${escapeHtml(audience)}">
    <a class="skip-link" href="#main">Skip to content</a>
    <div class="site-backdrop" aria-hidden="true"></div>
    <div class="site-shell">
      <header class="site-header" data-reveal>
        <div class="site-header__band">
          <p class="site-header__eyebrow">${escapeHtml(eyebrow)}</p>
          <div class="site-header__actions">
            ${utilityMarkup}
            <button class="theme-toggle" type="button" data-theme-toggle aria-label="Switch colour theme">Dark mode</button>
          </div>
        </div>
        <div class="site-header__hero">
          <div>
            <p class="site-header__audience">${escapeHtml(audience === "public" ? "Public surface" : "Internal surface")}</p>
            <h1 class="site-header__title">${escapeHtml(heroTitle)}</h1>
          </div>
          <p class="site-header__body">${escapeHtml(heroBody)}</p>
        </div>
        <nav class="hub-nav" aria-label="Primary">
          ${navMarkup(navItems, currentKey)}
        </nav>
      </header>
      <main id="main" class="site-main">
        ${content}
      </main>
    </div>
    ${dataScript}
    <script src="assets/shell.js"></script>
    <script type="module" src="${escapeHtml(scriptPath)}"></script>
  </body>
</html>`;
}

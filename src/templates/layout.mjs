function navMarkup(items, currentKey) {
  return items
    .map((item) => {
      const active = item.id === currentKey ? "is-active" : "";
      return `<a class="hub-nav__link ${active}" href="${item.href}">${item.label}</a>`;
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
        .map((item) => `<a class="hub-utility__link" href="${item.href}">${item.label}</a>`)
        .join("")}</div>`
    : "";
  const dataScript = pageData
    ? `<script id="page-data" type="application/json">${JSON.stringify(pageData)}</script>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="theme-color" content="#08101d" />
    <base href="${baseHref}" />
    <link rel="icon" type="image/svg+xml" href="assets/favicon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Fraunces:opsz,wght@9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="assets/shared.css" />
  </head>
  <body class="${bodyClass}" data-surface="${audience}">
    <div class="atmosphere" aria-hidden="true">
      <div class="atmosphere__orb atmosphere__orb--primary"></div>
      <div class="atmosphere__orb atmosphere__orb--secondary"></div>
      <div class="atmosphere__orb atmosphere__orb--tertiary"></div>
      <div class="atmosphere__grid"></div>
    </div>
    <div class="site-shell">
      <header class="site-header" data-reveal>
        <div class="site-header__band">
          <p class="site-header__eyebrow">${eyebrow}</p>
          ${utilityMarkup}
        </div>
        <div class="site-header__hero">
          <div>
            <p class="site-header__audience">${audience === "public" ? "Public surface" : "Internal surface"}</p>
            <h1 class="site-header__title">${heroTitle}</h1>
          </div>
          <p class="site-header__body">${heroBody}</p>
        </div>
        <nav class="hub-nav" aria-label="Primary">
          ${navMarkup(navItems, currentKey)}
        </nav>
      </header>
      <main class="site-main">
        ${content}
      </main>
    </div>
    ${dataScript}
    <script src="assets/shell.js"></script>
    <script type="module" src="${scriptPath}"></script>
  </body>
</html>`;
}

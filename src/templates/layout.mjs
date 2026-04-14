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
    <base href="${baseHref}" />
    <link rel="stylesheet" href="assets/shared.css" />
  </head>
  <body class="${bodyClass}" data-surface="${audience}">
    <div class="site-shell">
      <header class="site-header">
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
    <script type="module" src="${scriptPath}"></script>
  </body>
</html>`;
}

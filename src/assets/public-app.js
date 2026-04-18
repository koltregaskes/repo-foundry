function readPageData() {
  const node = document.getElementById("page-data");
  if (!node?.textContent) return null;
  try {
    return JSON.parse(node.textContent);
  } catch {
    return null;
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function withBase(path) {
  return new URL(path, document.baseURI).toString();
}

function repoCard(record) {
  return `<article class="repo-card">
    <div class="repo-card__topline">
      <span class="pill">${escapeHtml(record.category)}</span>
      <span class="pill pill--soft">${Number(record.stars || 0).toLocaleString()} stars</span>
    </div>
    <h3 class="repo-card__title"><a href="${withBase(`repos/${record.slug}/`)}">${escapeHtml(record.name)}</a></h3>
    <p class="repo-card__summary">${escapeHtml(record.summary)}</p>
    <p class="repo-card__detail"><strong>Why it matters:</strong> ${escapeHtml(record.whyRelevant)}</p>
    <p class="repo-card__detail"><strong>Potential use:</strong> ${escapeHtml(record.potentialUse)}</p>
    <div class="tag-row">${(record.tags || []).map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join("")}</div>
    <div class="repo-card__footer">
      <span>Added ${new Date(record.addedAt).toLocaleDateString()}</span>
      <a class="text-link" href="${record.repoUrl}">Open repo</a>
    </div>
  </article>`;
}

function renderFilters(items) {
  const container = document.getElementById("publicFilters");
  if (!container) return null;

  const categories = ["all", ...new Set(items.map((item) => item.category))];
  const sources = ["all", ...new Set(items.map((item) => item.source))];

  container.innerHTML = `
    <input id="publicSearch" class="filter-control" type="search" placeholder="Search repos" />
    <select id="publicCategory" class="filter-control">
      ${categories.map((value) => `<option value="${value}">${value === "all" ? "All categories" : value}</option>`).join("")}
    </select>
    <select id="publicSource" class="filter-control">
      ${sources.map((value) => `<option value="${value}">${value === "all" ? "All sources" : value}</option>`).join("")}
    </select>
  `;

  return {
    search: document.getElementById("publicSearch"),
    category: document.getElementById("publicCategory"),
    source: document.getElementById("publicSource"),
  };
}

function initRepoListing(data) {
  const root = document.getElementById("publicList");
  if (!root || !Array.isArray(data.items)) return;

  const controls = renderFilters(data.items);
  const latestPage = data.page === "trending" || data.page === "repos";
  const state = {
    search: "",
    category: "all",
    source: "all",
    visibleCount: latestPage ? 8 : data.items.length,
  };

  function filteredItems() {
    return data.items.filter((item) => {
      const haystack = [item.name, item.summary, item.whyRelevant, item.potentialUse, ...(item.tags || [])]
        .join(" ")
        .toLowerCase();
      return (!state.search || haystack.includes(state.search)) &&
        (state.category === "all" || item.category === state.category) &&
        (state.source === "all" || item.source === state.source);
    });
  }

  function render() {
    const items = filteredItems();
    const visible = items.slice(0, state.visibleCount);
    root.innerHTML = visible.length ? visible.map(repoCard).join("") : `<p class="empty-state">No repos match the current filter.</p>`;

    document.getElementById("loadMoreButton")?.remove();
    if (latestPage && items.length > state.visibleCount) {
      const button = document.createElement("button");
      button.id = "loadMoreButton";
      button.className = "load-more-button";
      button.textContent = "Show more";
      button.addEventListener("click", () => {
        state.visibleCount += 4;
        render();
      });
      root.after(button);
    }
  }

  if (controls) {
    controls.search?.addEventListener("input", (event) => {
      state.search = event.target.value.trim().toLowerCase();
      state.visibleCount = latestPage ? 8 : data.items.length;
      render();
    });
    controls.category?.addEventListener("change", (event) => {
      state.category = event.target.value;
      state.visibleCount = latestPage ? 8 : data.items.length;
      render();
    });
    controls.source?.addEventListener("change", (event) => {
      state.source = event.target.value;
      state.visibleCount = latestPage ? 8 : data.items.length;
      render();
    });
  }

  render();
}

function initVisualisations(data) {
  const root = document.getElementById("visualisationRoot");
  if (!root || !data.visualisations) return;

  const seriesCard = (title, items) => {
    const max = Math.max(...items.map((item) => item.value), 1);
    return `<article class="visual-card">
      <h3 class="repo-card__title">${title}</h3>
      <div class="visual-bar">
        ${items
          .map(
            (item) => `<div class="visual-bar__row">
              <span>${escapeHtml(item.label)}</span>
              <div class="visual-bar__meter"><div class="visual-bar__fill" style="width:${(item.value / max) * 100}%"></div></div>
              <strong>${item.value}</strong>
            </div>`,
          )
          .join("")}
      </div>
    </article>`;
  };

  root.innerHTML = [
    seriesCard("Category mix", data.visualisations.categoryMix || []),
    seriesCard("Source mix", data.visualisations.sourceMix || []),
    seriesCard("Star bands", data.visualisations.starBands || []),
    seriesCard("Freshness", data.visualisations.freshness || []),
  ].join("");
}

const data = readPageData();
if (data?.page === "trending" || data?.page === "trending-archive" || data?.page === "repos" || data?.page === "repos-archive") {
  initRepoListing(data);
}
if (data?.page === "visualisations") {
  initVisualisations(data);
}

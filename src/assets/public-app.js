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

function freshnessBucket(addedAt) {
  const parsed = new Date(addedAt || "");
  if (Number.isNaN(parsed.getTime())) return "archive";
  const ageDays = Math.max((Date.now() - parsed.getTime()) / 86400000, 0);
  if (ageDays <= 1) return "today";
  if (ageDays <= 7) return "this-week";
  return "archive";
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
  const freshnessOptions = [
    { value: "all", label: "All freshness" },
    { value: "fresh", label: "Fresh this week" },
    { value: "today", label: "Today only" },
    { value: "archive", label: "Archive only" },
  ];

  container.innerHTML = `
    <input id="publicSearch" class="filter-control" type="search" placeholder="Search repos" />
    <select id="publicCategory" class="filter-control">
      ${categories.map((value) => `<option value="${value}">${value === "all" ? "All categories" : value}</option>`).join("")}
    </select>
    <select id="publicSource" class="filter-control">
      ${sources.map((value) => `<option value="${value}">${value === "all" ? "All sources" : value}</option>`).join("")}
    </select>
    <select id="publicFreshness" class="filter-control">
      ${freshnessOptions.map((item) => `<option value="${item.value}">${item.label}</option>`).join("")}
    </select>
    <label class="filter-toggle">
      <input id="publicFeatured" type="checkbox" />
      <span>Featured only</span>
    </label>
  `;

  return {
    search: document.getElementById("publicSearch"),
    category: document.getElementById("publicCategory"),
    source: document.getElementById("publicSource"),
    freshness: document.getElementById("publicFreshness"),
    featured: document.getElementById("publicFeatured"),
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
    freshness: data.defaults?.freshness || "all",
    featuredOnly: Boolean(data.defaults?.featuredOnly),
    visibleCount: latestPage ? 8 : data.items.length,
  };

  if (controls?.freshness) {
    controls.freshness.value = state.freshness;
  }

  if (controls?.featured) {
    controls.featured.checked = state.featuredOnly;
  }

  function filteredItems() {
    return data.items.filter((item) => {
      const haystack = [item.name, item.summary, item.whyRelevant, item.potentialUse, ...(item.tags || [])]
        .join(" ")
        .toLowerCase();
      const freshness = freshnessBucket(item.addedAt);
      const freshnessMatch = state.freshness === "all" ||
        (state.freshness === "fresh" && (freshness === "today" || freshness === "this-week")) ||
        freshness === state.freshness;

      return (!state.search || haystack.includes(state.search)) &&
        (state.category === "all" || item.category === state.category) &&
        (state.source === "all" || item.source === state.source) &&
        freshnessMatch &&
        (!state.featuredOnly || Boolean(item.featured));
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
    controls.freshness?.addEventListener("change", (event) => {
      state.freshness = event.target.value;
      state.visibleCount = latestPage ? 8 : data.items.length;
      render();
    });
    controls.featured?.addEventListener("change", (event) => {
      state.featuredOnly = event.target.checked;
      state.visibleCount = latestPage ? 8 : data.items.length;
      render();
    });
  }

  render();
}

function initVisualisations(data) {
  const root = document.getElementById("visualisationRoot");
  if (!root || !data.visualisations) return;
  const summaryRoot = document.getElementById("visualisationSummary");

  if (summaryRoot) {
    const topCategory = [...(data.visualisations.categoryMix || [])].sort((left, right) => right.value - left.value)[0];
    const topSource = [...(data.visualisations.sourceMix || [])].sort((left, right) => right.value - left.value)[0];
    const freshest = [...(data.visualisations.freshness || [])].sort((left, right) => right.value - left.value)[0];
    const summaryItems = [
      {
        label: "Tracked repos",
        value: Number(data.metrics?.totalRepos || 0).toLocaleString(),
        detail: "Current public-safe library size",
      },
      {
        label: "Most active lane",
        value: topCategory?.label || "Unknown",
        detail: topCategory ? `${topCategory.value} repos on the warmest shelf` : "Waiting for category data",
      },
      {
        label: "Primary source",
        value: topSource?.label || "Unknown",
        detail: topSource ? `${topSource.value} repos from the strongest input source` : "Waiting for source data",
      },
      {
        label: "Freshness bias",
        value: freshest?.label || "Unknown",
        detail: freshest ? `${freshest.value} repos in the dominant freshness bucket` : "Waiting for freshness data",
      },
    ];

    summaryRoot.innerHTML = summaryItems
      .map(
        (item) => `<article class="status-card">
          <p class="metric-card__label">${escapeHtml(item.label)}</p>
          <p class="status-card__value">${escapeHtml(item.value)}</p>
          <p class="metric-card__detail">${escapeHtml(item.detail)}</p>
        </article>`,
      )
      .join("");
  }

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

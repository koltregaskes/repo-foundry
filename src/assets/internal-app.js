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

function statusTone(status) {
  return ({
    "ready-for-review": "is-green",
    blocked: "is-red",
    "needs-manager": "is-yellow",
    done: "is-green",
    idle: "is-grey",
    missing: "is-grey",
    invalid: "is-red",
    working: "is-yellow",
    clean: "is-green",
    dirty: "is-yellow",
    unavailable: "is-grey",
  }[status] || "is-grey");
}

function inlineMarkdown(markdown) {
  return escapeHtml(markdown || "")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="text-link" href="$2">$1</a>')
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function markdownToHtml(markdown) {
  const lines = String(markdown || "").replace(/\r/g, "").split("\n");
  const html = [];
  let paragraph = [];
  let bullets = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  };

  const flushBullets = () => {
    if (!bullets.length) return;
    html.push(`<ul class="bullet-list">${bullets.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
    bullets = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushBullets();
      continue;
    }
    if (line.startsWith("- ")) {
      flushParagraph();
      bullets.push(line.slice(2));
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      flushBullets();
      const level = Math.min(heading[1].length + 1, 4);
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }
    paragraph.push(line);
  }

  flushParagraph();
  flushBullets();
  return html.join("");
}

async function fetchJsonWithFallback(paths) {
  for (const path of paths) {
    try {
      const response = await fetch(path, { cache: "no-store" });
      if (!response.ok) continue;
      return await response.json();
    } catch {
      continue;
    }
  }
  throw new Error(`Could not load any of: ${paths.join(", ")}`);
}

async function fetchText(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.text();
}

function statusCard(label, value, detail) {
  return `<article class="status-card">
    <p class="metric-card__label">${label}</p>
    <p class="status-card__value">${escapeHtml(value)}</p>
    <p class="metric-card__detail">${escapeHtml(detail)}</p>
  </article>`;
}

function repoCard(repo) {
  const git = repo.git || {};
  return `<article class="repo-card">
    <div class="repo-card__topline">
      <span class="pill">${escapeHtml(repo.zoneLabel || repo.zone || "Repo")}</span>
      <span class="status-chip ${statusTone(git.dirty ? "dirty" : "clean")}">${git.dirty ? "Dirty" : "Clean"}</span>
    </div>
    <h3 class="repo-card__title">${escapeHtml(repo.name)}</h3>
    <p class="repo-card__summary">${escapeHtml(repo.summary || "No summary available.")}</p>
    <p class="repo-card__detail"><strong>Branch:</strong> ${escapeHtml(git.branch || "Unknown")}</p>
    <p class="repo-card__detail"><strong>Ahead / behind:</strong> ${Number(git.ahead || 0)} / ${Number(git.behind || 0)}</p>
    <p class="repo-card__detail"><strong>Path:</strong> ${escapeHtml(repo.path || "")}</p>
  </article>`;
}

function backlogCard(item) {
  return `<article class="repo-card">
    <div class="repo-card__topline">
      <span class="pill">${escapeHtml(item.category || "Backlog")}</span>
      <span class="status-chip ${statusTone(item.status)}">${escapeHtml(item.status || "queued")}</span>
    </div>
    <h3 class="repo-card__title">${escapeHtml(item.title || item.repoName || "Work item")}</h3>
    <p class="repo-card__summary">${escapeHtml(item.summary || "")}</p>
    <p class="repo-card__detail"><strong>Value:</strong> ${escapeHtml(item.value || "")}</p>
    <p class="repo-card__detail"><strong>Next action:</strong> ${escapeHtml(item.nextAction || "")}</p>
  </article>`;
}

function researchCard(item) {
  return `<article class="repo-card">
    <div class="repo-card__topline">
      <span class="pill">${escapeHtml(item.category || "Research")}</span>
      <span class="pill pill--soft">${Number(item.stars || 0).toLocaleString()} stars</span>
    </div>
    <h3 class="repo-card__title">${escapeHtml(item.name || "Repo")}</h3>
    <p class="repo-card__summary">${escapeHtml(item.summary || "")}</p>
    <p class="repo-card__detail"><strong>Why relevant:</strong> ${escapeHtml(item.whyRelevant || "")}</p>
    <p class="repo-card__detail"><strong>Potential use:</strong> ${escapeHtml(item.potentialUse || "")}</p>
  </article>`;
}

function sessionCard(session) {
  const update = session.update || {};
  return `<article class="session-card">
    <div class="session-card__header">
      <div>
        <p class="session-card__title">${escapeHtml(session.title || session.id || "Session")}</p>
        <p class="session-meta">${escapeHtml(session.phase || "Phase")} | ${escapeHtml(update.owner || "No owner")}</p>
      </div>
      <span class="status-chip ${statusTone(update.status)}">${escapeHtml(update.status || "missing")}</span>
    </div>
    <p class="repo-card__summary">${escapeHtml(update.summary || "No summary yet.")}</p>
    <p class="repo-card__detail"><strong>Current focus:</strong> ${escapeHtml(update.currentFocus || "None recorded")}</p>
    <p class="repo-card__detail"><strong>Updated:</strong> ${escapeHtml(update.updatedAt || "Unknown")}</p>
    <p class="repo-card__detail"><strong>Attention:</strong> ${update.needsAttention ? "Yes" : "No"}${update.staleReason ? ` - ${escapeHtml(update.staleReason)}` : ""}</p>
    ${Array.isArray(update.blockers) && update.blockers.length ? `<ul class="bullet-list">${update.blockers.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}</ul>` : ""}
  </article>`;
}

function opsPanel(title, body) {
  return `<article class="ops-panel">
    <div class="ops-panel__header"><h3 class="ops-panel__title">${escapeHtml(title)}</h3></div>
    ${body}
  </article>`;
}

async function renderDashboard(root, seed) {
  const [meta, repos, research, backlog, sessions] = await Promise.all([
    fetchJsonWithFallback(["/api/internal/meta", "/api/meta"]),
    fetchJsonWithFallback(["/api/internal/repos", "/api/repos"]),
    fetchJsonWithFallback(["/api/internal/research", "/api/research"]),
    fetchJsonWithFallback(["/api/internal/backlog", "/api/backlog"]),
    fetchJsonWithFallback(["/api/internal/sessions", "/api/sessions"]),
  ]);

  root.innerHTML = `
    <div class="dashboard-grid">
      <div class="dashboard-main">
        <div class="status-grid">
          ${statusCard("Tracked repos", repos.repos?.length || 0, "Approved root-level clones and owned repos")}
          ${statusCard("Research items", research.items?.length || 0, "Public-safe scout entries")}
          ${statusCard("Backlog packets", backlog.items?.length || 0, "Assignable extraction work")}
          ${statusCard("Needs attention", sessions.updateSummary?.managerAttentionCount || 0, "Sessions needing a look")}
        </div>
        ${opsPanel("Latest research", `<div class="card-grid">${(research.items || []).slice(0, 3).map(researchCard).join("") || `<p class="empty-state">No research items found.</p>`}</div>`)}
        ${opsPanel("Backlog", `<div class="card-grid">${(backlog.items || []).slice(0, 3).map(backlogCard).join("") || `<p class="empty-state">No backlog items found.</p>`}</div>`)}
      </div>
      <div class="dashboard-side">
        ${opsPanel("Runtime", `<div class="ops-list">
          <p class="ops-list__item"><strong>Canonical repo:</strong> ${escapeHtml(seed.canonicalRepoPath)}</p>
          <p class="ops-list__item"><strong>Internal runtime:</strong> ${escapeHtml(seed.internalRuntimePath)}</p>
          <p class="ops-list__item"><strong>Legacy path:</strong> ${escapeHtml(seed.legacyRuntimePath)}</p>
          <p class="ops-list__item"><strong>Generated:</strong> ${escapeHtml(meta.generatedAt || seed.generatedAt)}</p>
        </div>`)}
        ${opsPanel("Storage", `<div class="ops-list">
          <p class="ops-list__item"><strong>Configured:</strong> ${sessions.storage?.database?.configured ? "Yes" : "No"}</p>
          <p class="ops-list__item"><strong>Reachable:</strong> ${sessions.storage?.database?.ready ? "Yes" : "No"}</p>
          <p class="ops-list__item"><strong>Active source:</strong> ${escapeHtml(sessions.storage?.activeSource || "file")}</p>
          <p class="ops-list__item"><strong>Detail:</strong> ${escapeHtml(sessions.storage?.detail || "No detail")}</p>
        </div>`)}
      </div>
    </div>
  `;
}

async function renderTrackedRepos(root) {
  const repos = await fetchJsonWithFallback(["/api/internal/repos", "/api/repos"]);
  root.innerHTML = `<div class="card-grid">${(repos.repos || []).map(repoCard).join("") || `<p class="empty-state">No tracked repos found.</p>`}</div>`;
}

async function renderBacklog(root) {
  const [backlog, research] = await Promise.all([
    fetchJsonWithFallback(["/api/internal/backlog", "/api/backlog"]),
    fetchJsonWithFallback(["/api/internal/research", "/api/research"]),
  ]);

  root.innerHTML = `
    <div class="dashboard-grid">
      <div class="dashboard-main">
        ${opsPanel("Extraction backlog", `<div class="card-grid">${(backlog.items || []).map(backlogCard).join("")}</div>`)}
      </div>
      <div class="dashboard-side">
        ${opsPanel("Newest scout items", `<div class="stack-list">${(research.items || []).slice(0, 6).map((item) => `<article class="stack-item stack-item--long"><div><p class="stack-item__title">${escapeHtml(item.name)}</p><p class="stack-item__summary">${escapeHtml(item.nextAction || item.summary || "")}</p></div></article>`).join("")}</div>`)}
      </div>
    </div>
  `;
}

async function renderSessions(root) {
  const sessions = await fetchJsonWithFallback(["/api/internal/sessions", "/api/sessions"]);
  root.innerHTML = `
    <div class="status-grid">
      ${statusCard("Working", sessions.updateSummary?.counts?.working || 0, "Active session check-ins")}
      ${statusCard("Ready", sessions.updateSummary?.counts?.["ready-for-review"] || 0, "Ready for review")}
      ${statusCard("Blocked", sessions.updateSummary?.counts?.blocked || 0, "Blocked lanes")}
      ${statusCard("Stale", sessions.updateSummary?.staleCount || 0, "Check-ins older than the freshness window")}
    </div>
    <div class="session-layout">${(sessions.sessions || []).map(sessionCard).join("")}</div>
  `;
}

async function renderOps(root, seed) {
  const [sessions, meta] = await Promise.all([
    fetchJsonWithFallback(["/api/internal/sessions", "/api/sessions"]),
    fetchJsonWithFallback(["/api/internal/meta", "/api/meta"]),
  ]);

  root.innerHTML = `
    <div class="ops-layout">
      ${opsPanel("Backend and storage", `<div class="ops-list">
        <p class="ops-list__item"><strong>PostgreSQL configured:</strong> ${sessions.storage?.database?.configured ? "Yes" : "No"}</p>
        <p class="ops-list__item"><strong>PostgreSQL reachable:</strong> ${sessions.storage?.database?.ready ? "Yes" : "No"}</p>
        <p class="ops-list__item"><strong>Current source:</strong> ${escapeHtml(sessions.storage?.activeSource || "file")}</p>
        <p class="ops-list__item"><strong>Driver:</strong> ${escapeHtml(sessions.storage?.database?.driver || "unknown")}</p>
        <p class="ops-list__item"><strong>Detail:</strong> ${escapeHtml(sessions.storage?.database?.detail || "")}</p>
      </div>`)}
      ${opsPanel("Runtime map", `<div class="ops-list">
        <p class="ops-list__item"><strong>Canonical repo:</strong> ${escapeHtml(seed.canonicalRepoPath)}</p>
        <p class="ops-list__item"><strong>Internal runtime:</strong> ${escapeHtml(seed.internalRuntimePath)}</p>
        <p class="ops-list__item"><strong>Legacy compatibility:</strong> ${escapeHtml(seed.legacyRuntimePath)}</p>
        <p class="ops-list__item"><strong>Meta generated:</strong> ${escapeHtml(meta.generatedAt || seed.generatedAt)}</p>
      </div>`)}
    </div>
  `;
}

async function renderKnowledge(root) {
  const knowledge = await fetchJsonWithFallback(["/api/internal/knowledge", "/api/knowledge"]);
  if (!Array.isArray(knowledge) || !knowledge.length) {
    root.innerHTML = `<p class="empty-state">No knowledge sections found.</p>`;
    return;
  }

  root.innerHTML = `
    <div class="knowledge-layout">
      <div class="knowledge-panel">
        <div class="knowledge-nav">
          ${knowledge.flatMap((section) => section.items || []).map((item) => `<button class="button-link button-link--ghost knowledge-link" data-path="${item.path}">${escapeHtml(item.title)}</button>`).join("")}
        </div>
      </div>
      <article class="knowledge-panel"><div id="knowledgePreview" class="knowledge-preview">Loading document...</div></article>
    </div>
  `;

  const buttons = Array.from(document.querySelectorAll(".knowledge-link"));
  const preview = document.getElementById("knowledgePreview");

  async function load(path) {
    preview.innerHTML = "Loading document...";
    try {
      const markdown = await fetchText(path);
      preview.innerHTML = markdownToHtml(markdown);
    } catch (error) {
      preview.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
    }
  }

  for (const button of buttons) {
    button.addEventListener("click", async () => load(button.dataset.path));
  }

  if (buttons[0]?.dataset.path) {
    await load(buttons[0].dataset.path);
  }
}

async function renderCadence(root, seed) {
  const updates = await fetchJsonWithFallback(["/api/internal/updates", "/api/updates"]);
  root.innerHTML = `
    <div class="ops-layout">
      ${opsPanel("Major repo cadence", `<div class="stack-list">${(updates.items || []).map((item) => `<article class="stack-item"><div><p class="stack-item__title">${escapeHtml(item.name)}</p><p class="stack-item__summary">${escapeHtml(item.notes || "")}</p></div><span class="pill pill--soft">${escapeHtml(item.cadence || "Watching")}</span></article>`).join("")}</div>`)}
      ${opsPanel("Naming workstream", `<div class="ops-list">
        <p class="ops-list__item"><strong>Status:</strong> ${escapeHtml(seed.namingTrack?.status || "pending")}</p>
        <p class="ops-list__item">${escapeHtml(seed.namingTrack?.summary || "No summary yet.")}</p>
        <ul class="bullet-list">${(seed.namingTrack?.nextActions || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>`)}
    </div>
  `;
}

async function main() {
  const payload = readPageData();
  const root = document.getElementById("internalRoot");
  if (!payload || !root) return;

  const seed = payload.seed || {};
  const renderers = {
    dashboard: () => renderDashboard(root, seed),
    trackedRepos: () => renderTrackedRepos(root),
    backlog: () => renderBacklog(root),
    sessions: () => renderSessions(root),
    ops: () => renderOps(root, seed),
    knowledge: () => renderKnowledge(root),
    cadence: () => renderCadence(root, seed),
  };

  try {
    const renderer = renderers[payload.viewId];
    if (!renderer) {
      root.innerHTML = `<p class="empty-state">No renderer registered for ${escapeHtml(payload.viewId)}.</p>`;
      return;
    }
    await renderer();
  } catch (error) {
    root.innerHTML = `<p class="empty-state">${escapeHtml(error.message || "Something went wrong loading this view.")}</p>`;
  }
}

main();

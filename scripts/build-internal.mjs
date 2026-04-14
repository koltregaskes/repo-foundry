import fs from "node:fs/promises";
import path from "node:path";

import { buildInternalPage } from "../src/templates/internal.mjs";
import { compileInternalSeed } from "../src/lib/compile.mjs";
import {
  INTERNAL_RUNTIME_PUBLIC_PREVIEW,
  INTERNAL_RUNTIME_ROOT,
  LEGACY_INTERNAL_ROOT,
  LEGACY_KNOWLEDGE_ROOT,
  PUBLIC_DIST_ROOT,
} from "../src/lib/constants.mjs";
import { copyDirectory, copyFile, ensureDir, writeText } from "../src/lib/io.mjs";

async function copyIfExists(sourcePath, destinationPath) {
  try {
    const stat = await fs.stat(sourcePath);
    if (stat.isDirectory()) {
      await copyDirectory(sourcePath, destinationPath);
      return;
    }
    await copyFile(sourcePath, destinationPath);
  } catch {
    return;
  }
}

const seed = await compileInternalSeed();

await ensureDir(INTERNAL_RUNTIME_ROOT);
await ensureDir(path.join(INTERNAL_RUNTIME_ROOT, "assets"));
await ensureDir(path.join(INTERNAL_RUNTIME_ROOT, "data"));
await ensureDir(path.join(INTERNAL_RUNTIME_ROOT, "knowledge"));
await ensureDir(path.join(INTERNAL_RUNTIME_ROOT, "logs"));

await copyFile(path.join(process.cwd(), "src", "assets", "shared.css"), path.join(INTERNAL_RUNTIME_ROOT, "assets", "shared.css"));
await copyFile(path.join(process.cwd(), "src", "assets", "internal-app.js"), path.join(INTERNAL_RUNTIME_ROOT, "assets", "internal-app.js"));
await copyFile(path.join(process.cwd(), "src", "internal-runtime", "hub_server.py"), path.join(INTERNAL_RUNTIME_ROOT, "hub_server.py"));
await copyFile(path.join(process.cwd(), "src", "internal-runtime", "inbox_postgres.py"), path.join(INTERNAL_RUNTIME_ROOT, "inbox_postgres.py"));
await copyFile(path.join(process.cwd(), "src", "internal-runtime", "sync_session_updates_to_postgres.py"), path.join(INTERNAL_RUNTIME_ROOT, "sync_session_updates_to_postgres.py"));
await copyFile(path.join(process.cwd(), "src", "internal-runtime", "start-repos-hub.ps1"), path.join(INTERNAL_RUNTIME_ROOT, "start-repos-hub.ps1"));

await copyDirectory(path.join(LEGACY_INTERNAL_ROOT, "data"), path.join(INTERNAL_RUNTIME_ROOT, "data"));
await copyDirectory(LEGACY_KNOWLEDGE_ROOT, path.join(INTERNAL_RUNTIME_ROOT, "knowledge"));
await copyIfExists(PUBLIC_DIST_ROOT, INTERNAL_RUNTIME_PUBLIC_PREVIEW);

const utilityLinks = [
  { href: "/preview/index.html", label: "Public preview" },
  { href: "https://github.com/koltregaskes/repos-hub", label: "GitHub repo" },
];

const pages = [
  { relative: "index.html", title: "Dashboard", intro: "High-signal overview of the repo estate, fresh scouting, backlog work, and backend state.", viewId: "dashboard", baseHref: "./" },
  { relative: path.join("tracked-repos", "index.html"), title: "Tracked repos", intro: "Approved root-level repos and owned entries, with branch and cleanliness signals.", viewId: "trackedRepos", baseHref: "../" },
  { relative: path.join("backlog", "index.html"), title: "Backlog", intro: "Where interesting research becomes concrete extraction work and assignable packets.", viewId: "backlog", baseHref: "../" },
  { relative: path.join("sessions", "index.html"), title: "Sessions", intro: "Manager-facing session cards, blockers, stale updates, and review states.", viewId: "sessions", baseHref: "../" },
  { relative: path.join("ops", "index.html"), title: "Ops", intro: "Backend mode, PostgreSQL status, runtime mapping, and the current privacy boundary.", viewId: "ops", baseHref: "../" },
  { relative: path.join("knowledge", "index.html"), title: "Knowledge", intro: "Operational docs, playbooks, and research guidance that sit behind the internal hub.", viewId: "knowledge", baseHref: "../" },
  { relative: path.join("cadence", "index.html"), title: "Cadence", intro: "Major repo monitoring cadence, daily scout rhythm, and the naming workstream.", viewId: "cadence", baseHref: "../" },
];

for (const page of pages) {
  await writeText(
    path.join(INTERNAL_RUNTIME_ROOT, page.relative),
    buildInternalPage({
      title: page.title,
      intro: page.intro,
      viewId: page.viewId,
      seed,
      baseHref: page.baseHref,
      utilityLinks,
    }),
  );
}

await writeText(
  path.join(INTERNAL_RUNTIME_ROOT, "README.md"),
  `# Repo Hub Internal Runtime

Generated from the canonical shared codebase at:

\`W:\\Repos\\_My Open Source\\repos-hub\`

Primary route:

\`http://127.0.0.1:4789/internal/\`
`,
);

console.log(`Built internal runtime into ${INTERNAL_RUNTIME_ROOT}`);

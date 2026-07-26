import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const REPO_ROOT = path.resolve(__dirname, "..", "..");
const fallbackWorkspaceRoot = path.resolve(REPO_ROOT, "..", "..");
const estateReposRoot = path.join(path.parse(REPO_ROOT).root, "Repos");
export const WORKSPACE_ROOT = process.env.REPO_FOUNDRY_WORKSPACE_ROOT
  ? path.resolve(process.env.REPO_FOUNDRY_WORKSPACE_ROOT)
  : fs.existsSync(path.join(estateReposRoot, "_local", "surfaces"))
    ? estateReposRoot
    : fallbackWorkspaceRoot;
export const LEGACY_INTERNAL_ROOT = path.join(WORKSPACE_ROOT, "_local", "surfaces", "repos-hub", "local-hub");
export const INTERNAL_RUNTIME_ROOT = path.join(WORKSPACE_ROOT, "_local", "surfaces", "repo-foundry-internal");
export const INTERNAL_RUNTIME_DATA_ROOT = path.join(INTERNAL_RUNTIME_ROOT, "data");
export const LEGACY_INTERNAL_DATA_ROOT = path.join(LEGACY_INTERNAL_ROOT, "data");
export const INTERNAL_RUNTIME_LOGS = path.join(INTERNAL_RUNTIME_ROOT, "logs");
export const INTERNAL_RUNTIME_PUBLIC_PREVIEW = path.join(INTERNAL_RUNTIME_ROOT, "public-preview");
export const ACTIVE_INTERNAL_ROOT = fs.existsSync(INTERNAL_RUNTIME_DATA_ROOT) ? INTERNAL_RUNTIME_ROOT : LEGACY_INTERNAL_ROOT;
export const ACTIVE_INTERNAL_DATA_ROOT = fs.existsSync(INTERNAL_RUNTIME_DATA_ROOT)
  ? INTERNAL_RUNTIME_DATA_ROOT
  : LEGACY_INTERNAL_DATA_ROOT;
export const SESSION_UPDATE_ROOT = path.join(WORKSPACE_ROOT, "_local", "LOCAL-ONLY", "session-updates", "repos");
export const REPO_INVENTORY_PATH = path.join(WORKSPACE_ROOT, ".llatos", "data", "repo-estate-inventory.json");
export const RESEARCH_PATH = path.join(ACTIVE_INTERNAL_DATA_ROOT, "repo-research.json");
export const NEWS_PATH = path.join(ACTIVE_INTERNAL_DATA_ROOT, "repo-news.json");
export const BACKLOG_PATH = path.join(ACTIVE_INTERNAL_DATA_ROOT, "extraction-backlog.json");
export const UPDATE_SCHEDULE_PATH = path.join(ACTIVE_INTERNAL_DATA_ROOT, "repo-update-schedule.json");
export const KNOWLEDGE_INDEX_PATH = path.join(ACTIVE_INTERNAL_DATA_ROOT, "knowledge-index.json");
export const SESSION_INDEX_PATH = path.join(ACTIVE_INTERNAL_DATA_ROOT, "session-index.json");
export const LEGACY_KNOWLEDGE_ROOT = path.join(LEGACY_INTERNAL_ROOT, "knowledge");
export const INTERNAL_RUNTIME_KNOWLEDGE_ROOT = path.join(INTERNAL_RUNTIME_ROOT, "knowledge");
export const ACTIVE_KNOWLEDGE_ROOT = fs.existsSync(INTERNAL_RUNTIME_KNOWLEDGE_ROOT)
  ? INTERNAL_RUNTIME_KNOWLEDGE_ROOT
  : LEGACY_KNOWLEDGE_ROOT;
export const PUBLIC_CONTENT_ROOT = path.join(REPO_ROOT, "content", "public");
export const PUBLIC_GENERATED_ROOT = path.join(PUBLIC_CONTENT_ROOT, "generated");
export const PUBLIC_MANUAL_ROOT = path.join(PUBLIC_CONTENT_ROOT, "manual");
export const ROUTED_NEWS_PATH = path.join(PUBLIC_GENERATED_ROOT, "news-feed-latest.json");
export const DIST_ROOT = path.join(REPO_ROOT, "dist");
export const PUBLIC_DIST_ROOT = path.join(DIST_ROOT, "public");
export const INTERNAL_CANONICAL_REPO = path.join(WORKSPACE_ROOT, "_My Open Source", "repo-foundry");

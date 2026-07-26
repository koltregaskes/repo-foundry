import path from "node:path";

import { PUBLIC_GENERATED_ROOT } from "../src/lib/constants.mjs";
import { readJson, writeJson } from "../src/lib/io.mjs";
import { refreshPublicRepoMetadata } from "../src/lib/public-repo-refresh.mjs";

const args = new Set(process.argv.slice(2));
const write = args.has("--write");
const force = args.has("--force");
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const siteDataPath = path.join(PUBLIC_GENERATED_ROOT, "site-data.json");

async function fetchMetadata(owner, repo) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "Repo-Foundry-Public-Metadata-Refresh",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers,
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    const remaining = response.headers.get("x-ratelimit-remaining");
    throw new Error(`${response.status} ${response.statusText}; rate-limit remaining ${remaining ?? "unknown"}`);
  }
  return response.json();
}

const siteData = await readJson(siteDataPath, null);
const refreshed = await refreshPublicRepoMetadata(siteData, fetchMetadata, { force });

if (write && !refreshed.result.skipped) {
  await writeJson(siteDataPath, refreshed.siteData);
}

console.log(JSON.stringify({
  ...refreshed.result,
  mode: write ? "write" : "dry-run",
  source: siteDataPath,
}, null, 2));

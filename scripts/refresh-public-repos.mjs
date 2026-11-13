import path from "node:path";
import {fetchGithubRepositoryMetadata} from "../src/lib/github-repository-metadata.mjs";

import { PUBLIC_GENERATED_ROOT } from "../src/lib/constants.mjs";
import { readJson, writeJson } from "../src/lib/io.mjs";
import { refreshPublicRepoMetadata } from "../src/lib/public-repo-refresh.mjs";

const args = new Set(process.argv.slice(2));
const write = args.has("--write");
const force = args.has("--force");
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const siteDataPath = path.join(PUBLIC_GENERATED_ROOT, "site-data.json");

const fetchMetadata=(owner,repo)=>fetchGithubRepositoryMetadata(owner,repo,{token});

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

for(const failure of refreshed.result.failures || []) console.warn(`::warning title=Repository refresh skipped::${failure.repo}: ${failure.reason}`);
if(refreshed.result.updated === 0 && refreshed.result.failed > 0) process.exitCode=1;

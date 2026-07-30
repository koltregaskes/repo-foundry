import fs from "node:fs/promises";
import path from "node:path";

import { PUBLIC_DIST_ROOT } from "../src/lib/constants.mjs";
import { findPublicBoundaryFindings } from "../src/lib/public-boundary.mjs";
import { CONTENT_SECURITY_POLICY, REFERRER_POLICY } from "../src/templates/layout.mjs";

async function filesUnder(root) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...await filesUnder(target));
    } else {
      files.push(target);
    }
  }
  return files;
}

const publicFiles = await filesUnder(PUBLIC_DIST_ROOT);
const entries = await Promise.all(publicFiles.map(async (filePath) => ({
  relativePath: path.relative(PUBLIC_DIST_ROOT, filePath),
  content: await fs.readFile(filePath, "utf8"),
})));
const findings = findPublicBoundaryFindings(entries);

if (findings.length) {
  throw new Error(`Public/private boundary scan failed:\n${findings.join("\n")}`);
}

const htmlEntries = entries.filter(({ relativePath }) => relativePath.endsWith(".html"));
const expectedCsp = `<meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}" />`;
const expectedReferrer = `<meta name="referrer" content="${REFERRER_POLICY}" />`;

for (const { relativePath, content } of htmlEntries) {
  if (content.split(expectedCsp).length !== 2) {
    throw new Error(`${relativePath} must contain exactly one canonical Content-Security-Policy meta tag.`);
  }
  if (content.split(expectedReferrer).length !== 2) {
    throw new Error(`${relativePath} must contain exactly one canonical referrer policy meta tag.`);
  }
  if (content.indexOf(expectedCsp) > content.indexOf("<title>")) {
    throw new Error(`${relativePath} declares its Content-Security-Policy after controlled resources.`);
  }
}

const provenance = JSON.parse(await fs.readFile(path.join(PUBLIC_DIST_ROOT, "data", "source-provenance.json"), "utf8"));
const expectedNewsLastmod = provenance.news?.generatedAt?.slice(0, 10);
const sitemap = await fs.readFile(path.join(PUBLIC_DIST_ROOT, "sitemap.xml"), "utf8");
const newsSitemapEntry = `<loc>https://koltregaskes.github.io/repo-foundry/news/</loc><lastmod>${expectedNewsLastmod}</lastmod>`;
if (!expectedNewsLastmod || !sitemap.includes(newsSitemapEntry)) {
  throw new Error("Public sitemap does not use the routed-news source date for /news/.");
}

console.log(`Public/private boundary and security metadata scan passed for ${htmlEntries.length} HTML files in ${PUBLIC_DIST_ROOT}`);

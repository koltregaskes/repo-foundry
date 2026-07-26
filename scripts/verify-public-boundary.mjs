import fs from "node:fs/promises";
import path from "node:path";

import { PUBLIC_DIST_ROOT } from "../src/lib/constants.mjs";

const forbiddenPatterns = [
  { label: "Windows workspace path", pattern: /[A-Z]:\\(?:Users|Repos|Websites|hub|rooms-os-core)\\/i },
  { label: "NAS workspace path", pattern: /\\\\NAS_[^\\\s]+\\/i },
  { label: "local-only marker", pattern: /\bLOCAL-ONLY\b/i },
  { label: "session update path", pattern: /\bsession-updates\b/i },
  { label: "workspace checkout metadata", pattern: /\bworkspace_checkouts\b/i },
  { label: "database connection string", pattern: /\bpostgres(?:ql)?:\/\//i },
  { label: "database environment variable", pattern: /\bDATABASE_URL\b/i },
];

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

const findings = [];
for (const filePath of await filesUnder(PUBLIC_DIST_ROOT)) {
  const content = await fs.readFile(filePath, "utf8");
  for (const rule of forbiddenPatterns) {
    if (rule.pattern.test(content)) {
      findings.push(`${path.relative(PUBLIC_DIST_ROOT, filePath)}: ${rule.label}`);
    }
  }
}

if (findings.length) {
  throw new Error(`Public/private boundary scan failed:\n${findings.join("\n")}`);
}

console.log(`Public/private boundary scan passed for ${PUBLIC_DIST_ROOT}`);

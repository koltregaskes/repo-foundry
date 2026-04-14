import path from "node:path";

import { compilePublicSiteData } from "../src/lib/compile.mjs";
import { PUBLIC_GENERATED_ROOT } from "../src/lib/constants.mjs";
import { ensureDir, writeJson } from "../src/lib/io.mjs";

const siteData = await compilePublicSiteData();

await ensureDir(PUBLIC_GENERATED_ROOT);
await writeJson(path.join(PUBLIC_GENERATED_ROOT, "site-data.json"), siteData);

console.log(`Compiled public-safe site data to ${path.join(PUBLIC_GENERATED_ROOT, "site-data.json")}`);

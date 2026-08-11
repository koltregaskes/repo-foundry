import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

const workflowPath = new URL(
  "../.github/workflows/refresh-repository-metadata.yml",
  import.meta.url,
);
const workflow = await fs.readFile(workflowPath, "utf8");
const packageJson = JSON.parse(
  await fs.readFile(new URL("../package.json", import.meta.url), "utf8"),
);
const boundaryVerifier = await fs.readFile(
  new URL("../scripts/verify-public-boundary.mjs", import.meta.url),
  "utf8",
);
const publicBuilder = await fs.readFile(
  new URL("../scripts/build-public.mjs", import.meta.url),
  "utf8",
);

test("metadata refresh validates the public boundary before pushing", () => {
  const prepareStep = workflow.indexOf("- name: Prepare refreshed public data commit");
  const boundaryValidation = workflow.indexOf(
    "npm test && npm run build:public-boundary && npm run verify:public-boundary",
  );
  const pushStep = workflow.indexOf("- name: Push refreshed repository metadata");

  assert.notEqual(prepareStep, -1);
  assert.notEqual(boundaryValidation, -1);
  assert.notEqual(pushStep, -1);
  assert.ok(prepareStep < boundaryValidation);
  assert.ok(boundaryValidation < pushStep);
  assert.doesNotMatch(
    workflow.slice(prepareStep, boundaryValidation),
    /git push/,
  );
  assert.equal(
    packageJson.scripts["build:public-boundary"],
    "node ./scripts/build-public.mjs --allow-stale-routed-news-for-boundary-scan",
  );
  assert.match(boundaryVerifier, /PUBLIC_GENERATED_ROOT/);
  assert.match(boundaryVerifier, /content\/public\/generated\/site-data\.json/);
  assert.match(
    publicBuilder,
    /compilePublicSiteData\(\{\s+allowStale: allowStaleRoutedNews,\s+\}\)/,
  );
});

test("stale routed news defers Pages without weakening pre-push safety", () => {
  const pushStep = workflow.indexOf("- name: Push refreshed repository metadata");
  const routedValidation = workflow.indexOf(
    "- name: Validate routed source for Pages deployment",
  );

  assert.ok(pushStep < routedValidation);
  assert.match(
    workflow.slice(routedValidation),
    /continue-on-error: true\s+run: npm run verify:public-input/,
  );
  assert.match(
    workflow,
    /- name: Upload Pages artifact\s+if: steps\.public_validation\.outcome == 'success'/,
  );
  assert.match(
    workflow,
    /- name: Deploy Pages artifact\s+if: steps\.public_validation\.outcome == 'success'/,
  );
});


test("unchanged metadata never pushes the checked-out dispatch branch", () => {
  assert.match(workflow, /id: metadata_commit/);
  assert.match(workflow, /echo "changed=false" >> "\$GITHUB_OUTPUT"/);
  assert.match(workflow, /echo "changed=true" >> "\$GITHUB_OUTPUT"/);
  assert.match(
    workflow,
    /- name: Push refreshed repository metadata\s+if: steps\.metadata_commit\.outputs\.changed == 'true'/,
  );
});

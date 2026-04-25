import { expect, test } from "@playwright/test";

const baseUrl = process.env.REPO_FOUNDRY_BASE_URL || "http://127.0.0.1:54189";

function route(path) {
  return new URL(path, baseUrl).toString();
}

async function openClean(page, path, marker) {
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  const response = await page.goto(route(path), { waitUntil: "networkidle" });
  expect(response?.ok(), `${path} should load`).toBeTruthy();
  await expect(page.locator("body")).toContainText(marker);
  expect(consoleErrors, `${path} should have no console errors`).toEqual([]);
}

test("launch homepage leads with a visual featured repo", async ({ page }) => {
  await openClean(page, "/", "Featured now");
  await expect(page.locator(".lead-feature__media img")).toHaveCount(1);
  await expect(page.locator(".launch-metrics .metric-card")).toHaveCount(4);
  await expect(page.locator(".release-note")).toContainText("released");
});

test("repo library filters and pagination work", async ({ page }) => {
  await openClean(page, "/repos/", "Repository library");
  await expect(page.locator("#publicList .repo-card")).toHaveCount(8);
  await expect(page.locator("#loadMoreButton")).toBeVisible();

  await page.selectOption("#publicSource", "GitLab verified");
  await expect(page.locator("#publicList .repo-card")).toHaveCount(1);
  await expect(page.locator("#publicList")).toContainText("gitlab-org/gitlab");

  await page.fill("#publicSearch", "open-webui");
  await expect(page.locator("#publicList")).toContainText("No repos match");

  await page.selectOption("#publicSource", "all");
  await expect(page.locator("#publicList")).toContainText("open-webui/open-webui");
});

test("updates and visualisations render real generated data", async ({ page }) => {
  await openClean(page, "/news/", "Release updates");
  expect(await page.locator(".news-card").count()).toBeGreaterThanOrEqual(8);
  await expect(page.locator(".news-card").first()).toContainText("released");

  await openClean(page, "/visualisations/", "Visualisations");
  await expect(page.locator(".visual-summary-grid .status-card")).toHaveCount(4);
  await expect(page.locator(".visualisation-grid .visual-card")).toHaveCount(4);
});

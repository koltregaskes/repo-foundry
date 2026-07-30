import { expect, test } from "@playwright/test";
import fs from "node:fs";

const routedNews = JSON.parse(
  fs.readFileSync(new URL("../../content/public/generated/news-feed-latest.json", import.meta.url), "utf8"),
);
const siteData = JSON.parse(
  fs.readFileSync(new URL("../../content/public/generated/site-data.json", import.meta.url), "utf8"),
);
const sitemap = fs.readFileSync(new URL("../../dist/public/sitemap.xml", import.meta.url), "utf8");
const newestRoutedItem = routedNews.articles
  .toSorted((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())[0];
const sourceFixture = siteData.repos[0];
const sourceFixtureCount = siteData.repos.filter((repo) => repo.source === sourceFixture.source).length;
const liveSiteUrl = "https://koltregaskes.github.io/repo-foundry";
const sitemapRoutes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((match) => new URL(match[1]).pathname.replace(/^\/repo-foundry/, "") || "/");

const baseUrl = process.env.REPO_FOUNDRY_BASE_URL || "http://127.0.0.1:54189";

function route(path) {
  const cleanPath = path.replace(/^\//, "");
  const root = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(cleanPath, root).toString();
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

test("v2 homepage exposes HUD, Terminal, accents, and estate footer", async ({ page }) => {
  await openClean(page, "/", "Select your weapon.");
  await expect(page.locator(".agent-card")).toHaveCount(8);
  await expect(page.locator(".telemetry-bar .stat-card")).toHaveCount(4);
  await expect(page.locator(".footer-estate-panel")).toContainText("Elusion Works");

  await page.click('[data-skin-set="term"]');
  await expect(page.locator("html")).toHaveAttribute("data-skin", "term");
  await expect(page.locator(".term-prompt")).toContainText("kol@foundry:home");

  await page.click('[data-accent-set="blue"]');
  await expect(page.locator("html")).toHaveAttribute("data-accent", "blue");
  await expect(page.locator('[data-accent-set="blue"]')).toHaveAttribute("aria-pressed", "true");

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("data-skin", "term");
  await expect(page.locator("html")).toHaveAttribute("data-accent", "blue");
});

test("repo library filters and pagination work", async ({ page }) => {
  await openClean(page, "/repos/", "Repository library");
  await expect(page.locator("#publicList .repo-card")).toHaveCount(8);
  await expect(page.locator("#loadMoreButton")).toBeVisible();

  await page.selectOption("#publicSource", sourceFixture.source);
  await expect(page.locator("#publicList .repo-card")).toHaveCount(Math.min(sourceFixtureCount, 8));

  await page.fill("#publicSearch", "definitely-not-a-repository");
  await expect(page.locator("#publicList")).toContainText("No repos match");

  await page.selectOption("#publicSource", "all");
  await page.fill("#publicSearch", sourceFixture.name);
  await expect(page.locator("#publicList")).toContainText(sourceFixture.name);
});

test("updates and visualisations render real generated data", async ({ page }) => {
  await openClean(page, "/news/", "Foundry Feed.");
  expect(await page.locator(".news-card").count()).toBeGreaterThanOrEqual(8);
  await expect(page.locator(".news-card").first()).toContainText(newestRoutedItem.title);
  await expect(page.locator(".news-card").first().locator("h3 a")).toHaveAttribute("href", newestRoutedItem.url);

  await openClean(page, "/visualisations/", "Visualisations.");
  await expect(page.locator(".visual-summary-grid .status-card")).toHaveCount(4);
  await expect(page.locator(".visualisation-grid .visual-card")).toHaveCount(4);
});

test("contact page form stays static and public-safe", async ({ page }) => {
  await openClean(page, "/contact/", "Incoming.");
  await page.fill("#contact-name", "Build Bot");
  await page.fill("#contact-email", "build@example.com");
  await page.fill("#contact-message", "Public-safe repo suggestion.");
  await page.click('button[type="submit"]');
  await expect(page.locator("[data-contact-status]")).toContainText("Draft prepared locally");
});

test("every public route renders cleanly at mobile and desktop widths", async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const browserErrors = [];
  let currentPath = "/";

  page.on("console", (message) => {
    if (message.type() === "error") {
      browserErrors.push(`${currentPath}: console: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => browserErrors.push(`${currentPath}: pageerror: ${error.message}`));
  page.on("requestfailed", (request) => {
    browserErrors.push(`${currentPath}: requestfailed: ${request.url()} (${request.failure()?.errorText || "unknown"})`);
  });

  for (const viewport of [
    { name: "mobile", width: 390, height: 844 },
    { name: "desktop", width: 1440, height: 900 },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    for (const path of sitemapRoutes) {
      currentPath = path;
      const response = await page.goto(route(path), { waitUntil: "networkidle" });
      expect(response?.status(), `${viewport.name} ${path} should return 200`).toBe(200);
      await expect(page.locator("main#main"), `${viewport.name} ${path} should expose the main region`).toBeVisible();
      await expect(page.locator("footer.site-footer"), `${viewport.name} ${path} should expose the shared footer`).toBeVisible();
      await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveCount(1);
      await expect(page.locator('meta[name="referrer"]')).toHaveAttribute("content", "strict-origin-when-cross-origin");

      const expectedCanonical = new URL(path.replace(/^\//, ""), `${liveSiteUrl}/`).toString();
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", expectedCanonical);

      const overflow = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
      }));
      expect(
        overflow.documentWidth,
        `${viewport.name} ${path} should not overflow horizontally`,
      ).toBeLessThanOrEqual(overflow.viewportWidth + 1);
    }

    await page.goto(route("/"), { waitUntil: "networkidle" });
    const revealNodes = page.locator("[data-reveal]");
    for (let index = 0; index < await revealNodes.count(); index += 1) {
      await revealNodes.nth(index).scrollIntoViewIfNeeded();
      await expect(revealNodes.nth(index)).toHaveClass(/is-visible/);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: testInfo.outputPath(`repo-foundry-home-${viewport.name}.png`),
      fullPage: true,
    });
  }

  expect(browserErrors, "public routes should have no console, CSP, page, or network errors").toEqual([]);
});

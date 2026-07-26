import { expect, test } from "@playwright/test";
import fs from "node:fs";

const routedNews = JSON.parse(
  fs.readFileSync(new URL("../../content/public/generated/news-feed-latest.json", import.meta.url), "utf8"),
);
const newestRoutedItem = routedNews.articles
  .toSorted((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())[0];

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

  await page.selectOption("#publicSource", "GitLab verified");
  await expect(page.locator("#publicList .repo-card")).toHaveCount(1);
  await expect(page.locator("#publicList")).toContainText("gitlab-org/gitlab");

  await page.fill("#publicSearch", "open-webui");
  await expect(page.locator("#publicList")).toContainText("No repos match");

  await page.selectOption("#publicSource", "all");
  await expect(page.locator("#publicList")).toContainText("open-webui/open-webui");
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

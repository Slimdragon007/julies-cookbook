import { test, expect, type Route } from "@playwright/test";
import { login } from "./helpers/auth";

// Deterministic recipe payload returned by the mocked /api/scrape endpoint.
// The real route invokes Anthropic + ScrapingBee + Cloudinary + Supabase,
// which is covered end-to-end by src/lib/__tests__/scraper-*.test.ts. These
// browser-level tests focus on the URL-drop UI flow.
const MOCK_RECIPE = {
  id: "00000000-0000-0000-0000-00000000e2e0",
  slug: "e2e-mock-goulash",
  name: "E2E Mock Goulash",
  servings: 4,
  ingredientCount: 9,
  hasImage: true,
  cuisineTag: "Hungarian",
};

const SAMPLE_URL = "https://cooking.nytimes.com/recipes/example-goulash";

async function stubScrape(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ success: true, recipe: MOCK_RECIPE }),
  });
}

async function submitUrl(page: import("@playwright/test").Page) {
  await login(page);
  await page.goto("/add-recipe", { waitUntil: "networkidle" });
  await page
    .getByPlaceholder(/cooking\.nytimes\.com/i)
    .fill(SAMPLE_URL);
  await page.getByRole("button", { name: /extract recipe/i }).click();
}

test.describe("Add recipe by URL", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/scrape", stubScrape);
  });

  test("paste link → success card shows the new recipe", async ({ page }) => {
    await submitUrl(page);

    await expect(
      page.getByRole("heading", { name: MOCK_RECIPE.name }),
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByText(`${MOCK_RECIPE.servings} servings`),
    ).toBeVisible();
    await expect(
      page.getByText(`${MOCK_RECIPE.ingredientCount} ingredients`),
    ).toBeVisible();
    await expect(page.getByText(/photo added/i)).toBeVisible();

    const viewLink = page.getByRole("link", { name: /view recipe/i });
    await expect(viewLink).toHaveAttribute(
      "href",
      `/recipe/${MOCK_RECIPE.slug}`,
    );
  });

  test("partial state when scrape returns hasImage: false", async ({
    page,
  }) => {
    // Override the beforeEach stub for this one test.
    await page.unroute("**/api/scrape");
    await page.route("**/api/scrape", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          recipe: { ...MOCK_RECIPE, hasImage: false },
        }),
      });
    });

    await submitUrl(page);

    await expect(
      page.getByRole("heading", { name: MOCK_RECIPE.name }),
    ).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/no photo found/i)).toBeVisible();
    await expect(
      page.getByText(/recipe saved but no photo was available/i),
    ).toBeVisible();
  });

  test("clicking View Recipe navigates to /recipe/<slug>", async ({ page }) => {
    await submitUrl(page);
    await expect(
      page.getByRole("heading", { name: MOCK_RECIPE.name }),
    ).toBeVisible({ timeout: 15000 });

    await page.getByRole("link", { name: /view recipe/i }).click();
    await page.waitForURL(`**/recipe/${MOCK_RECIPE.slug}`, { timeout: 10000 });
    expect(page.url()).toContain(`/recipe/${MOCK_RECIPE.slug}`);
    // The page body content depends on the recipe existing in Supabase, which
    // this mocked test does not set up. To assert the recipe detail renders
    // with the right name, run against a real backend with a seeded recipe.
  });

  test("blocked-site response flips to the paste-text tab", async ({
    page,
  }) => {
    await page.unroute("**/api/scrape");
    await page.route("**/api/scrape", async (route) => {
      await route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({
          blocked: true,
          url: SAMPLE_URL,
          reason: "cloudflare",
        }),
      });
    });

    await submitUrl(page);

    await expect(
      page.getByRole("heading", { name: /paste recipe text/i }),
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(`Source: ${SAMPLE_URL}`)).toBeVisible();
  });

  test("server error surfaces a retry-friendly message", async ({ page }) => {
    await page.unroute("**/api/scrape");
    await page.route("**/api/scrape", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal Server Error" }),
      });
    });

    await submitUrl(page);

    await expect(
      page.getByText(/something went wrong\. please try again/i),
    ).toBeVisible({ timeout: 10000 });
  });
});

import { test, expect, type Page, type Route } from "@playwright/test";
import { login } from "./helpers/auth";
import { seedRecipe, type SeededRecipe } from "./helpers/seed-recipe";

// Real scrape pipeline (Anthropic + ScrapingBee + Cloudinary + USDA + Supabase
// insert) is covered by src/lib/__tests__/scraper-*.test.ts. These browser-
// level tests use a mocked /api/scrape so the UI flow is deterministic and
// hermetic, while seeding a real recipe in Supabase so the post-submit
// navigation and gallery render against actual DB content.

const SAMPLE_URL = "https://cooking.nytimes.com/recipes/example-goulash";

async function submitUrl(page: Page) {
  await login(page);
  await page.goto("/add-recipe", { waitUntil: "networkidle" });
  await page.getByPlaceholder(/cooking\.nytimes\.com/i).fill(SAMPLE_URL);
  await page.getByRole("button", { name: /extract recipe/i }).click();
}

test.describe("Add recipe by URL", () => {
  let seeded: SeededRecipe;

  test.beforeAll(async () => {
    seeded = await seedRecipe();
  });

  test.afterAll(async () => {
    if (seeded) await seeded.cleanup();
  });

  test.beforeEach(async ({ page }) => {
    // Default stub: /api/scrape returns the seeded recipe's metadata, as if
    // the live scrape just produced it. Tests that need a different response
    // call page.unroute first.
    await page.route("**/api/scrape", async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          recipe: {
            id: seeded.id,
            slug: seeded.slug,
            name: seeded.name,
            servings: seeded.servings,
            ingredientCount: seeded.ingredientCount,
            hasImage: seeded.hasImage,
            cuisineTag: seeded.cuisineTag,
          },
        }),
      });
    });
  });

  test("URL drop → success card → /recipe/<slug> renders the recipe", async ({
    page,
  }) => {
    await submitUrl(page);

    // Success card on /add-recipe with the (mocked) scrape metadata.
    await expect(
      page.getByRole("heading", { name: seeded.name }),
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByText(`${seeded.servings} servings`),
    ).toBeVisible();
    await expect(
      page.getByText(`${seeded.ingredientCount} ingredients`),
    ).toBeVisible();
    await expect(page.getByText(/photo added/i)).toBeVisible();

    const viewLink = page.getByRole("link", { name: /view recipe/i });
    await expect(viewLink).toHaveAttribute(
      "href",
      `/recipe/${seeded.slug}`,
    );

    // Navigate to the detail page and verify the real SSR'd content (this is
    // what the user actually sees after clicking through — backed by the
    // seeded Supabase row).
    await viewLink.click();
    await page.waitForURL(`**/recipe/${seeded.slug}`, { timeout: 15000 });
    await expect(
      page.getByRole("heading", { level: 1, name: seeded.name }),
    ).toBeVisible({ timeout: 10000 });
  });

  test("added recipe shows up in the gallery", async ({ page }) => {
    await submitUrl(page);

    // Wait for the success card so we know router.refresh() has fired.
    await expect(
      page.getByRole("heading", { name: seeded.name }),
    ).toBeVisible({ timeout: 15000 });

    await page.goto("/", { waitUntil: "networkidle" });

    // Gallery cards expose `aria-label="Open <name>"` (RecipeCard.tsx).
    await expect(
      page.getByRole("link", { name: new RegExp(`open ${seeded.name}`, "i") }),
    ).toBeVisible();
  });

  test("partial state when scrape returns hasImage: false", async ({
    page,
  }) => {
    await page.unroute("**/api/scrape");
    await page.route("**/api/scrape", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          recipe: {
            id: seeded.id,
            slug: seeded.slug,
            name: seeded.name,
            servings: seeded.servings,
            ingredientCount: seeded.ingredientCount,
            hasImage: false,
            cuisineTag: seeded.cuisineTag,
          },
        }),
      });
    });

    await submitUrl(page);

    await expect(
      page.getByRole("heading", { name: seeded.name }),
    ).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/no photo found/i)).toBeVisible();
    await expect(
      page.getByText(/recipe saved but no photo was available/i),
    ).toBeVisible();
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

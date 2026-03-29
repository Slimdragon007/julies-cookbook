import { test, expect } from "@playwright/test";

test.describe("Demo Page", () => {
  test("demo loads without auth", async ({ page }) => {
    await page.goto("/demo", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
    // CTA may be below the fold — check it exists in DOM
    await expect(page.getByRole("link", { name: /try it yourself/i })).toBeAttached();
  });

  test("demo has all 4 step buttons", async ({ page }) => {
    await page.goto("/demo", { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: /paste/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /ai/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /recipe/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /grocery/i })).toBeVisible();
  });

  test("step navigation works", async ({ page }) => {
    await page.goto("/demo", { waitUntil: "networkidle" });
    // Click step 3 (Recipe Ready)
    await page.getByRole("button", { name: /recipe/i }).click();
    await page.waitForTimeout(500);
    // Should show recipe-related content
    const heading = page.getByRole("heading", { level: 2 });
    await expect(heading).toBeVisible();
  });

  test("CTA links to signup", async ({ page }) => {
    await page.goto("/demo", { waitUntil: "networkidle" });
    const cta = page.getByRole("link", { name: /try it yourself/i });
    await expect(cta).toHaveAttribute("href", "/signup");
  });
});

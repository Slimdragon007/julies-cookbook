import { test, expect } from "@playwright/test";

test.describe("Page metadata", () => {
  test("login page has correct title", async ({ page }) => {
    await page.goto("/login", { waitUntil: "networkidle" });
    await expect(page).toHaveTitle(/sign in|cookbook/i);
  });

  test("signup page has correct title", async ({ page }) => {
    await page.goto("/signup", { waitUntil: "networkidle" });
    await expect(page).toHaveTitle(/sign up|cookbook/i);
  });

  test("demo page has correct title", async ({ page }) => {
    await page.goto("/demo", { waitUntil: "networkidle" });
    await expect(page).toHaveTitle(/demo|cookbook/i);
  });
});

test.describe("Error handling", () => {
  test("nonexistent pages don't crash", async ({ page }) => {
    const response = await page.goto("/recipe/nonexistent-slug-12345");
    expect(response?.status()).toBeLessThan(500);
  });
});

test.describe("Static pages load", () => {
  test("login returns 200", async ({ page }) => {
    const response = await page.goto("/login");
    expect(response?.status()).toBe(200);
  });

  test("signup returns 200", async ({ page }) => {
    const response = await page.goto("/signup");
    expect(response?.status()).toBe(200);
  });

  test("demo returns 200", async ({ page }) => {
    const response = await page.goto("/demo");
    expect(response?.status()).toBe(200);
  });
});

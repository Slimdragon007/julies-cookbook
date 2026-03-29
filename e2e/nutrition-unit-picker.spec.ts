import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";

test.describe("NutritionTab Unit Picker", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/recipe/e2e-test-pasta", { waitUntil: "networkidle" });
    // Click the Nutrition tab
    await page.getByRole("button", { name: /nutrition/i }).click();
  });

  test("renders portion input and unit dropdown", async ({ page }) => {
    await expect(page.locator("#portion-input")).toBeVisible();
    const unitSelect = page.locator("#portion-input").locator("..").locator("select");
    await expect(unitSelect).toBeVisible();
  });

  test("unit dropdown defaults to servings", async ({ page }) => {
    const unitSelect = page.locator("#portion-input").locator("..").locator("select");
    await expect(unitSelect).toHaveValue("servings");
  });

  test("unit dropdown has all 6 options", async ({ page }) => {
    const unitSelect = page.locator("#portion-input").locator("..").locator("select");
    const options = unitSelect.locator("option");
    await expect(options).toHaveCount(6);
    await expect(options.nth(0)).toHaveText("servings");
    await expect(options.nth(1)).toHaveText("cups");
    await expect(options.nth(2)).toHaveText("oz");
    await expect(options.nth(3)).toHaveText("tbsp");
    await expect(options.nth(4)).toHaveText("tsp");
    await expect(options.nth(5)).toHaveText("grams");
  });

  test("entering a portion amount shows macro calculations", async ({ page }) => {
    await page.locator("#portion-input").fill("1");
    // Should show macro grid (calories, protein, carbs, fat)
    // The test recipe has batch weight so exact macros should appear
    const macroGrid = page.locator(".grid.grid-cols-4").nth(1);
    await expect(macroGrid).toBeVisible();
  });

  test("switching units updates the dropdown value", async ({ page }) => {
    const unitSelect = page.locator("#portion-input").locator("..").locator("select");
    await unitSelect.selectOption("cups");
    await expect(unitSelect).toHaveValue("cups");

    await unitSelect.selectOption("oz");
    await expect(unitSelect).toHaveValue("oz");

    await unitSelect.selectOption("g");
    await expect(unitSelect).toHaveValue("g");
  });

  test("servings placeholder shows 1", async ({ page }) => {
    const input = page.locator("#portion-input");
    await expect(input).toHaveAttribute("placeholder", "1");
  });

  test("non-servings placeholder shows 0", async ({ page }) => {
    const unitSelect = page.locator("#portion-input").locator("..").locator("select");
    await unitSelect.selectOption("cups");
    const input = page.locator("#portion-input");
    await expect(input).toHaveAttribute("placeholder", "0");
  });
});

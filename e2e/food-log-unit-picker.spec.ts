import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";

test.describe("FoodLogForm Unit Picker", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/log", { waitUntil: "networkidle" });
  });

  test("portion field has amount input and unit dropdown", async ({ page }) => {
    // Portion section is identified by its label text
    const portionLabel = page.locator("text=Portion").first();
    const portionSection = portionLabel.locator("..");
    await expect(portionSection.locator("input[type='number']")).toBeVisible();
    await expect(portionSection.locator("select")).toBeVisible();
  });

  test("unit dropdown defaults to servings", async ({ page }) => {
    const portionLabel = page.locator("text=Portion").first();
    const unitSelect = portionLabel.locator("..").locator("select");
    await expect(unitSelect).toHaveValue("servings");
  });

  test("unit dropdown has all 6 options", async ({ page }) => {
    const portionLabel = page.locator("text=Portion").first();
    const options = portionLabel.locator("..").locator("select option");
    await expect(options).toHaveCount(6);
  });

  test("log meal button disabled without recipe and portion", async ({ page }) => {
    const submitBtn = page.getByRole("button", { name: /log meal/i });
    await expect(submitBtn).toBeDisabled();
  });

  test("can submit food log with servings unit", async ({ page }) => {
    // Select recipe by finding the select with "Select a recipe..." placeholder
    const recipeSelect = page.locator("select").filter({ hasText: "Select a recipe..." });
    await recipeSelect.selectOption({ label: "E2E Test Pasta" });

    // Enter portion amount
    const portionLabel = page.locator("text=Portion").first();
    const portionInput = portionLabel.locator("..").locator("input[type='number']");
    await portionInput.fill("1.5");

    // Submit
    await page.getByRole("button", { name: /log meal/i }).click();

    // Verify success
    await expect(page.getByText("Logged!")).toBeVisible({ timeout: 10000 });
  });

  test("logged entry displays user-friendly unit", async ({ page }) => {
    // Select recipe and log with cups
    const recipeSelect = page.locator("select").filter({ hasText: "Select a recipe..." });
    await recipeSelect.selectOption({ label: "E2E Test Pasta" });

    const portionLabel = page.locator("text=Portion").first();
    const portionInput = portionLabel.locator("..").locator("input[type='number']");
    const unitSelect = portionLabel.locator("..").locator("select");

    await portionInput.fill("2");
    await unitSelect.selectOption("cups");
    await page.getByRole("button", { name: /log meal/i }).click();

    await expect(page.getByText("Logged!")).toBeVisible({ timeout: 10000 });

    // Verify entry shows "2 cups" not grams
    await expect(page.getByText("2 cups").first()).toBeVisible();
  });

  test("can switch units before submitting", async ({ page }) => {
    const portionLabel = page.locator("text=Portion").first();
    const unitSelect = portionLabel.locator("..").locator("select");

    await unitSelect.selectOption("oz");
    await expect(unitSelect).toHaveValue("oz");

    await unitSelect.selectOption("tbsp");
    await expect(unitSelect).toHaveValue("tbsp");

    await unitSelect.selectOption("servings");
    await expect(unitSelect).toHaveValue("servings");
  });
});

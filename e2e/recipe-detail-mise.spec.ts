import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";

test.describe("Recipe Detail MISE speed pass", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("recipe detail uses MISE tabs and switches sections", async ({ page }) => {
    await page.goto("/recipe/e2e-test-pasta", { waitUntil: "networkidle" });

    const ingredients = page.getByRole("tab", { name: "Ingredients" });
    await expect(ingredients).toHaveAttribute("aria-selected", "true");
    await expect(ingredients).toHaveClass(/bg-ink/);
    await expect(
      page.getByRole("group", { name: "Ingredient measurement units" }),
    ).toBeVisible();

    const pastaCard = page.getByRole("button", { name: /pasta/i });
    await expect(pastaCard).toBeVisible();
    await expect(pastaCard).toContainText("cup");
    await expect(pastaCard).not.toContainText("/cup");

    await page
      .getByRole("button", { name: "Show ingredient measurements in metric units" })
      .click();
    await expect(pastaCard).toContainText("ml");

    await page
      .getByRole("button", { name: "Show ingredient measurements in us units" })
      .click();
    await expect(pastaCard).toContainText("cup");

    await page.getByRole("tab", { name: "Instructions" }).click();
    await expect(page.getByRole("heading", { name: "Method" })).toBeVisible();

    await page.getByRole("tab", { name: "Nutrition" }).click();
    await expect(page.getByRole("heading", { name: "Nutrition" })).toBeVisible();
    await expect(page.getByLabel("Portion amount")).toBeVisible();
  });
});

import { Page } from "@playwright/test";

const TEST_EMAIL = "e2e-test@julies-cookbook.test";
const TEST_PASSWORD = "E2eTestPass2026!";

export async function login(page: Page) {
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByLabel(/email/i).fill(TEST_EMAIL);
  await page.getByLabel(/password/i).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("/", { timeout: 15000 });
}

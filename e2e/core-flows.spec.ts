import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

async function expectNoSeriousAccessibilityIssues(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);
}

test("guest can browse server-rendered concerts and ticket types", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /your next night/i })).toBeVisible();
  await expect(page.getByText("Midnight City Live")).toBeVisible();
  await page.getByRole("link", { name: /midnight city live/i }).click();
  await expect(page.getByRole("heading", { name: "Midnight City Live" })).toBeVisible();
  await expect(page.getByText("General admission")).toBeVisible();
  await expectNoSeriousAccessibilityIssues(page);
});

test("shared login redirects an administrator to the admin area", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password", { exact: true }).fill("secret12");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: /overview/i })).toBeVisible();
  await expectNoSeriousAccessibilityIssues(page);
});

test("customer can reserve a ticket with one intentional booking request", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Username").fill("listener");
  await page.getByLabel("Password", { exact: true }).fill("secret12");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.goto("/concerts/1");
  await page.getByRole("button", { name: "Add General admission" }).click();
  await page.getByRole("button", { name: "Reserve tickets" }).click();
  await expect(page).toHaveURL(/\/bookings\/101$/);
  await expect(page.getByText("Midnight City Live")).toBeVisible();
});

test("dark mode and mobile navigation remain usable", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile-only responsive check");
  await page.goto("/concerts");
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  await page.getByRole("button", { name: /theme/i }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.keyboard.press("Escape");
  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(hasHorizontalOverflow).toBe(false);
});

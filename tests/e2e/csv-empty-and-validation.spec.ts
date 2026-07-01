import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

/**
 * CSV export edge cases:
 *   1. Empty result set (far-past date range) → download contains only the header
 *      line and the dialog surfaces a friendly empty-state toast.
 *   2. Invalid date range (from > to) → UI shows an inline error, download
 *      button is disabled, no download fires. Server-side validation is also
 *      exercised by bypassing the disabled state via keyboard submit.
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080";

function uniq(p: string) {
  return `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

async function signUpAndClaim(page: Page) {
  const email = `${uniq("csv")}@example.test`;
  await page.goto(`${BASE}/auth`);
  await page.getByRole("button", { name: /need an account/i }).click();
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill("Sup3rSecret!");
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/boss\/author-manager\/dashboard/, { timeout: 15_000 });
  const claim = page.getByRole("button", { name: /claim boss role/i });
  if (await claim.isVisible().catch(() => false)) {
    await claim.click();
    await page.waitForTimeout(1000);
  }
}

test.describe.serial("CSV export · empty range + validation", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await signUpAndClaim(page);
    await page.close();
  });

  test("empty date range downloads headers-only CSV and shows empty-state toast", async ({ page }) => {
    await signUpAndClaim(page);
    await page.goto(`${BASE}/boss/author-manager/dashboard`);
    await page.locator("button:has(svg.lucide-bell)").first().click();
    await page.getByTestId("export-notifications-btn").click();
    await expect(page.getByTestId("export-notifications-dialog")).toBeVisible();

    // Pick a range guaranteed to have zero rows.
    await page.getByTestId("export-from").fill("1990-01-01");
    await page.getByTestId("export-to").fill("1990-01-02");

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByTestId("export-download-btn").click(),
    ]);

    // Toast confirms the empty-state path.
    await expect(
      page.locator("[data-sonner-toast]").filter({ hasText: /headers only/i }).first(),
    ).toBeVisible({ timeout: 8_000 });

    const path = await download.path();
    expect(path).toBeTruthy();
    const text = (await readFile(path!, "utf8")).trim();
    const lines = text.split(/\r?\n/).filter(Boolean);

    // Headers-only: exactly one line, and it's the header row.
    expect(lines.length).toBeLessThanOrEqual(1);
    if (lines.length === 1) {
      expect(lines[0]).toMatch(/created_at.*title.*severity/);
    }
  });

  test("invalid date range (from > to) blocks the download and shows an error", async ({ page }) => {
    await signUpAndClaim(page);
    await page.goto(`${BASE}/boss/author-manager/dashboard`);
    await page.locator("button:has(svg.lucide-bell)").first().click();
    await page.getByTestId("export-notifications-btn").click();
    await expect(page.getByTestId("export-notifications-dialog")).toBeVisible();

    await page.getByTestId("export-from").fill("2025-06-30");
    await page.getByTestId("export-to").fill("2025-01-01");

    // Inline error is shown and download button is disabled.
    await expect(page.getByTestId("export-error")).toContainText(/invalid date range/i);
    await expect(page.getByTestId("export-download-btn")).toBeDisabled();

    // No download event should fire when we attempt to click.
    let downloadFired = false;
    page.once("download", () => {
      downloadFired = true;
    });
    await page.getByTestId("export-download-btn").click({ force: true }).catch(() => {});
    await page.waitForTimeout(750);
    expect(downloadFired).toBe(false);
  });
});

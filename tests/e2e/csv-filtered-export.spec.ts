import { test, expect, type Page, type Download } from "@playwright/test";
import { readFile } from "node:fs/promises";

/**
 * Dedicated coverage for the filtered CSV export flow.
 *
 * Assumes an authenticated boss session already exists (created by the main
 * boss-author-manager suite, which runs before this file alphabetically) and
 * that at least one `release` + `security-scan` audit event was produced
 * today. This spec exercises:
 *
 *   - audit_events CSV filtered by (release, security-scan) actions for a
 *     single-day date range → assert filename format + only expected rows
 *   - notifications CSV for the same range → filename format + rows present
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080";
const today = new Date().toISOString().slice(0, 10);

async function ensureSignedIn(page: Page) {
  // If the dashboard shows a "Sign in" banner, the earlier suite either
  // didn't run or the session was cleared. In that case, skip — this file
  // is a downstream verification, not a bootstrap.
  await page.goto(`${BASE}/boss/author-manager/dashboard`);
  const signInBtn = page.getByRole("link", { name: /sign in/i }).first();
  if (await signInBtn.isVisible().catch(() => false)) {
    test.skip(true, "no authenticated session — run boss-author-manager.spec.ts first");
  }
}

async function downloadCsv(page: Page, click: () => Promise<void>): Promise<{ download: Download; text: string; filename: string }> {
  const [download] = await Promise.all([page.waitForEvent("download"), click()]);
  const path = await download.path();
  expect(path).toBeTruthy();
  const text = await readFile(path!, "utf8");
  return { download, text, filename: download.suggestedFilename() };
}

test.describe("CSV export · filtered by action + date range", () => {
  test("audit_events: only release + security-scan rows, filename encodes filters", async ({ page }) => {
    await ensureSignedIn(page);
    await page.goto(`${BASE}/boss/author-manager/source-code`);

    // Open the scoped audit export dialog (in the right panel or wall header).
    await page.getByTestId("export-audit-btn").first().click();
    await expect(page.getByTestId("export-audit-dialog")).toBeVisible();

    await page.getByTestId("export-from").fill(today);
    await page.getByTestId("export-to").fill(today);

    await page.getByTestId("export-action-release").click();
    await page.getByTestId("export-action-security-scan").click();

    const { text, filename } = await downloadCsv(page, () =>
      page.getByTestId("export-download-btn").click(),
    );

    // Filename format: audit_<entity?>_<idPrefix?>_<from>_to_<to>.csv
    expect(filename).toMatch(/^audit_.*_\d{4}-\d{2}-\d{2}_to_\d{4}-\d{2}-\d{2}\.csv$/);
    expect(filename).toContain(today);

    const [header, ...rows] = text.split(/\r?\n/).filter(Boolean);
    expect(header).toContain("action");
    expect(rows.length, "at least one filtered row").toBeGreaterThan(0);

    const allowed = new Set(["release", "security-scan"]);
    const actionCol = header.split(",").indexOf("action");
    for (const row of rows) {
      // Simple CSV parse: split on commas outside quotes — audit action never contains a comma.
      const cells = row.split(",");
      const action = cells[actionCol]?.replace(/^"|"$/g, "");
      expect(allowed.has(action), `unexpected action "${action}" leaked past filter`).toBeTruthy();
    }
  });

  test("notifications: rows for date range, filename encodes range", async ({ page }) => {
    await ensureSignedIn(page);

    // Bell → global notifications export
    await page.locator("button:has(svg.lucide-bell)").first().click();
    await page.getByTestId("export-notifications-btn").click();
    await expect(page.getByTestId("export-notifications-dialog")).toBeVisible();

    await page.getByTestId("export-from").fill(today);
    await page.getByTestId("export-to").fill(today);

    const { text, filename } = await downloadCsv(page, () =>
      page.getByTestId("export-download-btn").click(),
    );

    expect(filename).toMatch(/^notifications_\d{4}-\d{2}-\d{2}_to_\d{4}-\d{2}-\d{2}\.csv$/);
    expect(filename).toContain(today);

    const [header, ...rows] = text.split(/\r?\n/).filter(Boolean);
    expect(header).toContain("title");
    expect(header).toContain("severity");
    expect(rows.length).toBeGreaterThan(0);
  });
});

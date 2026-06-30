import { test, expect, type Page, type Download } from "@playwright/test";
import { readFile } from "node:fs/promises";

/**
 * End-to-end test for the Author Manager Boss Panel.
 *
 * Covers:
 *   1. Sign up (auto-confirm email is enabled)
 *   2. Claim boss role (idempotent: skipped if a boss already exists)
 *   3. Create / update / delete a product + assert audit events and toasts
 *   4. Link a repo, run a security scan, release a version + assert audit events and toasts
 *
 * Run with:   bunx playwright test tests/e2e/boss-author-manager.spec.ts
 * Base URL:   set PLAYWRIGHT_BASE_URL or rely on the default http://localhost:8080
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080";

function uniq(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

async function signUp(page: Page, email: string, password: string) {
  await page.goto(`${BASE}/auth`);
  await page.getByRole("button", { name: /need an account/i }).click();
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/boss\/author-manager\/dashboard/, { timeout: 15_000 });
}

async function claimBossIfOffered(page: Page) {
  const btn = page.getByRole("button", { name: /claim boss role/i });
  if (await btn.isVisible().catch(() => false)) {
    await btn.click();
    // Either succeeds or shows the "already exists" error — both leave us authenticated.
    await page.waitForTimeout(1500);
  }
}

async function expectToast(page: Page, text: RegExp) {
  await expect(page.locator("[data-sonner-toast]").filter({ hasText: text }).first()).toBeVisible({
    timeout: 8_000,
  });
}

async function expectAudit(page: Page, action: string) {
  await expect(
    page.locator(`[data-testid="audit-event"][data-action="${action}"]`).first(),
  ).toBeVisible({ timeout: 10_000 });
}

test.describe.serial("Boss Panel · Author Manager", () => {
  const email = `${uniq("boss")}@example.test`;
  const password = "Sup3rSecret!";
  const productName = uniq("Product");
  const repoName = uniq("repo");

  test("sign up + claim boss role", async ({ page }) => {
    await signUp(page, email, password);
    await claimBossIfOffered(page);
    // We don't fail if a boss already exists — we just need an authenticated session.
    await expect(page.getByText(/author manager/i).first()).toBeVisible();
  });

  test("product CRUD emits audit + toasts", async ({ page }) => {
    await page.goto(`${BASE}/boss/author-manager/products`);

    // CREATE
    await page.getByRole("button", { name: /new product|link repository|^new/i }).first().click().catch(async () => {
      await page.getByText(/new product/i).first().click();
    });
    await page.getByLabel(/^name$/i).fill(productName);
    await page.getByRole("button", { name: /^create$/i }).click();
    await expectToast(page, new RegExp(`Created "${productName}"`));

    // Open right panel
    await page.getByRole("button", { name: new RegExp(productName) }).first().click();
    await expectAudit(page, "create");

    // UPDATE (Publish)
    await page.getByRole("button", { name: /^publish$/i }).click();
    await expectToast(page, /Updated/i);
    await expectAudit(page, "update");

    // DELETE
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /^delete$/i }).click();
    await expectToast(page, /Deleted/i);
  });

  test("source-code: link, scan, release emit audit + toasts", async ({ page }) => {
    await page.goto(`${BASE}/boss/author-manager/source-code`);

    // LINK
    await page.getByRole("button", { name: /link repository/i }).first().click();
    await page.getByLabel(/^name$/i).fill(repoName);
    await page.getByLabel(/^url$/i).fill(`https://github.com/test/${repoName}`);
    await page.getByRole("button", { name: /^link$/i }).click();
    await expectToast(page, new RegExp(`Linked "${repoName}"`));

    // Open right panel
    await page.getByRole("button", { name: new RegExp(repoName) }).first().click();
    await expect(page.getByTestId("scan-results-panel")).toBeVisible();

    // SCAN
    await page.getByTestId("run-scan-btn").click();
    await expectToast(page, /Scan completed/i);
    await expectAudit(page, "security-scan");

    // RELEASE
    await page.getByPlaceholder("1.2.0").fill("1.0.0");
    await page.getByRole("button", { name: /^release$/i }).click();
    await expectToast(page, /Released v1\.0\.0/i);
    await expectAudit(page, "release");
  });

  test("CSV export: audit (filtered by action + date range) downloads expected rows", async ({ page }) => {
    await page.goto(`${BASE}/boss/author-manager/source-code`);
    await page.getByRole("button", { name: new RegExp(repoName) }).first().click();

    // Open the scoped audit export dialog.
    await page.getByTestId("export-audit-btn").first().click();
    await expect(page.getByTestId("export-audit-dialog")).toBeVisible();

    // Date range = today (covers the rows created in earlier tests in this serial run).
    const today = new Date().toISOString().slice(0, 10);
    await page.getByTestId("export-from").fill(today);
    await page.getByTestId("export-to").fill(today);

    // Filter to security-scan + release actions.
    await page.getByTestId("export-action-security-scan").click();
    await page.getByTestId("export-action-release").click();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByTestId("export-download-btn").click(),
    ]);

    await assertCsvContains(download, {
      filenameIncludes: ["audit", "source-repo", today],
      headerIncludes: ["created_at", "entity", "action", "severity", "summary"],
      actionsRequired: ["security-scan", "release"],
      actionsForbidden: ["create", "update", "delete", "link"],
    });
  });

  test("CSV export: notifications for date range downloads recent rows", async ({ page }) => {
    await page.goto(`${BASE}/boss/author-manager/dashboard`);

    // Open the notifications bell, then the global export dialog.
    await page.locator("button:has(svg.lucide-bell)").first().click();
    await page.getByTestId("export-notifications-btn").click();
    await expect(page.getByTestId("export-notifications-dialog")).toBeVisible();

    const today = new Date().toISOString().slice(0, 10);
    await page.getByTestId("export-from").fill(today);
    await page.getByTestId("export-to").fill(today);

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByTestId("export-download-btn").click(),
    ]);

    await assertCsvContains(download, {
      filenameIncludes: ["notifications", today],
      headerIncludes: ["created_at", "title", "severity"],
      bodyMustMatch: [/security scan/i, /released v/i],
    });
  });
});

async function assertCsvContains(
  download: Download,
  opts: {
    filenameIncludes?: string[];
    headerIncludes?: string[];
    actionsRequired?: string[];
    actionsForbidden?: string[];
    bodyMustMatch?: RegExp[];
  },
) {
  const name = download.suggestedFilename();
  for (const f of opts.filenameIncludes ?? []) {
    expect(name, `filename should include "${f}"`).toContain(f);
  }
  expect(name.endsWith(".csv")).toBeTruthy();

  const path = await download.path();
  expect(path, "download should have a local path").toBeTruthy();
  const text = await readFile(path!, "utf8");
  const [header, ...rows] = text.split(/\r?\n/).filter(Boolean);
  expect(rows.length, "csv should have at least one data row").toBeGreaterThan(0);

  for (const col of opts.headerIncludes ?? []) {
    expect(header, `header should include "${col}"`).toContain(col);
  }
  for (const a of opts.actionsRequired ?? []) {
    expect(rows.some((r) => r.includes(`,${a},`)), `expected action "${a}"`).toBeTruthy();
  }
  for (const a of opts.actionsForbidden ?? []) {
    expect(rows.some((r) => r.includes(`,${a},`)), `unexpected action "${a}"`).toBeFalsy();
  }
  for (const re of opts.bodyMustMatch ?? []) {
    expect(text).toMatch(re);
  }
}

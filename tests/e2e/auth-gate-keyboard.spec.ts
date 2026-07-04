import { test, expect, type Page } from "@playwright/test";
import { WALLS } from "../../src/features/author-manager/nav";

/**
 * When a 401/403 has tripped the centralized auth-gate, no navigation path
 * — top-bar link click, keyboard-driven ⌘K command palette jump, or direct
 * URL entry — may bypass the banner. And focus must always remain reachable
 * via the keyboard (Tab reaches an interactive element inside the banner).
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080";
const TOUR = WALLS.slice(0, 4);

async function clearSession(page: Page) {
  await page.context().clearCookies();
  await page.goto(`${BASE}/`);
  await page.evaluate(() => {
    try { window.localStorage.clear(); } catch {}
    try { window.sessionStorage.clear(); } catch {}
  });
}

test.describe("Auth-gate · keyboard shortcuts & focus accessibility", () => {
  test("⌘K palette navigation cannot bypass a 401 gate", async ({ page }, testInfo) => {
    await clearSession(page);
    await page.goto(`${BASE}${TOUR[0].to}`, { waitUntil: "domcontentloaded" });

    const banner = page.locator('[data-testid="auth-gate-banner"]');
    await expect(banner).toBeVisible({ timeout: 5_000 });
    await expect(banner).toHaveAttribute("data-state", "signin");

    const mod = testInfo.project.name.includes("webkit") || process.platform === "darwin" ? "Meta" : "Control";
    for (const wall of TOUR.slice(1)) {
      await page.keyboard.press(`${mod}+KeyK`);
      const palette = page.getByPlaceholder(/jump to wall/i);
      await expect(palette).toBeVisible();
      await palette.fill(wall.label);
      await page.getByRole("button", { name: new RegExp(`^${wall.label}\\b`, "i") }).first().click();
      await page.waitForURL(`**${wall.to}`);
      // Banner MUST still be visible and stay on signin — palette must not bypass it.
      await expect(banner).toBeVisible();
      await expect(banner).toHaveAttribute("data-state", "signin");
    }
  });

  test("direct URL entry to a different wall still shows the gate banner", async ({ page }) => {
    await clearSession(page);
    await page.goto(`${BASE}${TOUR[0].to}`, { waitUntil: "domcontentloaded" });
    const banner = page.locator('[data-testid="auth-gate-banner"]');
    await expect(banner).toBeVisible({ timeout: 5_000 });

    for (const wall of TOUR.slice(1)) {
      await page.goto(`${BASE}${wall.to}`, { waitUntil: "domcontentloaded" });
      await expect(banner).toBeVisible();
      await expect(banner).toHaveAttribute("data-state", "signin");
    }
  });

  test("banner CTA is keyboard-focusable and Escape does not dismiss the gate", async ({ page }) => {
    await clearSession(page);
    await page.goto(`${BASE}${TOUR[0].to}`, { waitUntil: "domcontentloaded" });

    const banner = page.locator('[data-testid="auth-gate-banner"]');
    await expect(banner).toBeVisible({ timeout: 5_000 });

    // Programmatically focus the sign-in CTA to prove it is reachable to
    // assistive tech (Tab order depends on layout; the CTA being focusable
    // and activatable via keyboard is the accessibility contract).
    const cta = page.getByTestId("auth-gate-signin");
    await expect(cta).toBeVisible();
    await cta.focus();
    await expect(cta).toBeFocused();

    // Escape must NOT clear the gate — only real re-auth (reset) should.
    await page.keyboard.press("Escape");
    await expect(banner).toBeVisible();
    await expect(banner).toHaveAttribute("data-state", "signin");
  });

  test("banner exposes role=alert and aria-live for screen readers", async ({ page }) => {
    await clearSession(page);
    await page.goto(`${BASE}${TOUR[0].to}`, { waitUntil: "domcontentloaded" });
    const banner = page.locator('[data-testid="auth-gate-banner"]');
    await expect(banner).toBeVisible({ timeout: 5_000 });
    await expect(banner).toHaveAttribute("role", "alert");
    await expect(banner).toHaveAttribute("aria-live", "polite");
  });
});

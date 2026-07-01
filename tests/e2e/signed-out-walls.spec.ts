import { test, expect, type Page } from "@playwright/test";
import { WALLS } from "../../src/features/author-manager/nav";

/**
 * Signed-out coverage:
 *   For every top-bar wall, an unauthenticated visitor should still get a
 *   fully rendered shell (top bar + wall heading) — never a blank page — and
 *   see a "Sign in" affordance surfaced from the auth-gated data layer.
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080";

async function clearSession(page: Page) {
  // Nuke any Supabase/session state in local + session storage and cookies.
  const ctx = page.context();
  await ctx.clearCookies();
  await page.goto(`${BASE}/`);
  await page.evaluate(() => {
    try { window.localStorage.clear(); } catch {}
    try { window.sessionStorage.clear(); } catch {}
  });
}

test.describe("Signed-out · every wall renders", () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
  });

  for (const wall of WALLS) {
    test(`wall "${wall.label}" (${wall.to}) loads without blanking`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on("pageerror", (e) => consoleErrors.push(String(e)));

      const resp = await page.goto(`${BASE}${wall.to}`, { waitUntil: "domcontentloaded" });
      expect(resp?.status(), "route should not 5xx").toBeLessThan(500);

      // App shell / top bar always renders.
      const shell = page.locator("body");
      await expect(shell).toBeVisible();
      const bodyText = (await shell.innerText()).trim();
      expect(bodyText.length, "page must not be blank").toBeGreaterThan(20);

      // Top-bar navigation is present with the current wall label.
      await expect(page.getByRole("link", { name: new RegExp(`^${wall.label}$`, "i") }).first()).toBeVisible();

      // Auth-gated walls surface a "Sign in" affordance somewhere on the page.
      // Dashboard has an explicit banner; other walls surface it via the auth
      // banner or via a toast when the data query fires.
      await page.waitForTimeout(600);
      const hasSignIn =
        (await page.getByRole("link", { name: /sign in/i }).count()) > 0 ||
        (await page.getByRole("button", { name: /sign in/i }).count()) > 0 ||
        (await page.getByText(/sign in/i).count()) > 0;
      expect(hasSignIn, `wall "${wall.label}" should surface a sign-in affordance`).toBeTruthy();

      // Uncaught runtime errors are not acceptable on any wall.
      expect(consoleErrors, `no uncaught page errors on ${wall.to}`).toEqual([]);
    });
  }
});

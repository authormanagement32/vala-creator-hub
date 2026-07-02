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

      // Track auth-gated server-fn responses so we can prove APIs are actually blocked.
      const gatedResponses: { url: string; status: number; unauthorized: boolean }[] = [];
      page.on("response", async (resp) => {
        const url = resp.url();
        if (!url.includes("/_serverFn/")) return;
        // whoAmI is deliberately public and returns { authed: false }.
        if (/whoAmI/i.test(url)) return;
        let unauthorized = false;
        try {
          const text = await resp.text();
          unauthorized = /Unauthorized|Forbidden|No authorization header/i.test(text);
        } catch {}
        gatedResponses.push({ url, status: resp.status(), unauthorized });
      });

      const resp = await page.goto(`${BASE}${wall.to}`, { waitUntil: "domcontentloaded" });
      expect(resp?.status(), "route should not 5xx").toBeLessThan(500);

      const shell = page.locator("body");
      await expect(shell).toBeVisible();
      const bodyText = (await shell.innerText()).trim();
      expect(bodyText.length, "page must not be blank").toBeGreaterThan(20);

      await expect(page.getByRole("link", { name: new RegExp(`^${wall.label}$`, "i") }).first()).toBeVisible();

      await page.waitForTimeout(800);
      const hasSignIn =
        (await page.getByRole("link", { name: /sign in/i }).count()) > 0 ||
        (await page.getByRole("button", { name: /sign in/i }).count()) > 0 ||
        (await page.getByText(/sign in/i).count()) > 0;
      expect(hasSignIn, `wall "${wall.label}" should surface a sign-in affordance`).toBeTruthy();

      // If the wall fired any auth-gated server fn, it must have been blocked
      // (either HTTP 401/403 or a serialized Unauthorized error payload).
      if (gatedResponses.length) {
        const blocked = gatedResponses.every(
          (r) => r.status === 401 || r.status === 403 || r.unauthorized,
        );
        expect(
          blocked,
          `wall "${wall.label}" auth-gated APIs must be blocked: ${JSON.stringify(gatedResponses)}`,
        ).toBeTruthy();
      }

      // Blocked APIs must never surface as uncaught runtime errors.
      expect(consoleErrors, `no uncaught page errors on ${wall.to}`).toEqual([]);
    });
  }
});

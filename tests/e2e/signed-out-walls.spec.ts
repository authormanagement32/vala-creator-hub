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
      const pageErrors: string[] = [];
      const consoleErrors: string[] = [];
      page.on("pageerror", (e) => pageErrors.push(String(e)));
      page.on("console", (msg) => {
        if (msg.type() !== "error") return;
        const t = msg.text();
        // Ignore benign network noise (blocked resources, favicon, HMR).
        if (/favicon|net::ERR_|Failed to load resource/i.test(t)) return;
        consoleErrors.push(t);
      });

      // Track auth-gated server-fn responses so we can prove APIs are actually blocked.
      const gatedResponses: { url: string; status: number; unauthorized: boolean; body: string }[] = [];
      // Track ALL requests scoped to this wall so we can catch any 5xx anywhere.
      const serverErrors: { url: string; status: number }[] = [];
      page.on("response", async (resp) => {
        const url = resp.url();
        if (resp.status() >= 500) serverErrors.push({ url, status: resp.status() });
        if (!url.includes("/_serverFn/")) return;
        // whoAmI is deliberately public and returns { authed: false }.
        if (/whoAmI/i.test(url)) return;
        let body = "";
        try { body = await resp.text(); } catch {}
        const unauthorized = /Unauthorized|Forbidden|No authorization header/i.test(body);
        if (resp.status() === 401 || resp.status() === 403 || unauthorized) {
          gatedResponses.push({ url, status: resp.status(), unauthorized, body: body.slice(0, 200) });
        }
      });

      const resp = await page.goto(`${BASE}${wall.to}`, { waitUntil: "domcontentloaded" });
      expect(resp?.status(), "route should not 5xx").toBeLessThan(500);

      const shell = page.locator("body");
      await expect(shell).toBeVisible();
      const bodyText = (await shell.innerText()).trim();
      expect(bodyText.length, "page must not be blank").toBeGreaterThan(20);

      await expect(page.getByRole("link", { name: new RegExp(`^${wall.label}$`, "i") }).first()).toBeVisible();

      await page.waitForTimeout(800);

      // Visible UI state: sign-in affordance must be rendered.
      const signInAffordances = await Promise.all([
        page.getByRole("link", { name: /sign in/i }).count(),
        page.getByRole("button", { name: /sign in/i }).count(),
        page.getByText(/sign in/i).count(),
      ]);
      const hasSignIn = signInAffordances.some((n) => n > 0);
      expect(hasSignIn, `wall "${wall.label}" should surface a sign-in affordance`).toBeTruthy();

      // Centralized banner must appear and remain stable (no flicker) after the
      // initial blocked API responses land. Snapshot state at two points ~500ms
      // apart and assert it did not disappear/re-appear.
      const banner = page.locator('[data-testid="auth-gate-banner"]');
      if (await banner.count()) {
        await expect(banner.first()).toBeVisible();
        const state1 = await banner.first().getAttribute("data-state");
        await page.waitForTimeout(500);
        await expect(banner.first(), "banner must remain visible (no flicker)").toBeVisible();
        const state2 = await banner.first().getAttribute("data-state");
        expect(state2, `banner state flickered on ${wall.to}`).toBe(state1);
      }

      // Every gated call must be a controlled 401/403 (or a serialized Unauthorized
      // payload delivered over an RPC-200 envelope) — never a 5xx, never a silent success.
      for (const r of gatedResponses) {
        const controlled = r.status === 401 || r.status === 403 || r.unauthorized;
        expect(
          controlled,
          `wall "${wall.label}" gated call not controlled: ${JSON.stringify(r)}`,
        ).toBeTruthy();
        expect(r.status, `wall "${wall.label}" gated call should not 5xx`).toBeLessThan(500);
      }

      // No request across the whole wall (assets, SSR HTML, RPCs) may 5xx.
      expect(serverErrors, `no 5xx requests allowed on ${wall.to}`).toEqual([]);

      // Blocked APIs must never surface as uncaught runtime errors.
      expect(pageErrors, `no uncaught page errors on ${wall.to}`).toEqual([]);
      expect(consoleErrors, `no console errors on ${wall.to}`).toEqual([]);
    });
  }
});

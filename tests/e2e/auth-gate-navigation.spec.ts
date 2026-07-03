import { test, expect, type Page } from "@playwright/test";
import { WALLS } from "../../src/features/author-manager/nav";

/**
 * After a blocked 401/403 lands on the first wall, the centralized auth-gate
 * banner should persist as the user navigates across other top-bar walls —
 * no flicker, no downgrade to a stale/empty state, no misclassified message.
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080";
const TOUR = WALLS.slice(0, 6); // sample a spread of walls for the tour

async function clearSession(page: Page) {
  const ctx = page.context();
  await ctx.clearCookies();
  await page.goto(`${BASE}/`);
  await page.evaluate(() => {
    try { window.localStorage.clear(); } catch {}
    try { window.sessionStorage.clear(); } catch {}
  });
}

test.describe("Auth-gate banner · stable across wall navigation", () => {
  test("signin state (blocked 401) persists as user moves between walls", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));

    await clearSession(page);
    await page.goto(`${BASE}${TOUR[0].to}`, { waitUntil: "domcontentloaded" });

    const banner = page.locator('[data-testid="auth-gate-banner"]');
    // Wait for the initial blocked call to trip the gate.
    await expect(banner).toBeVisible({ timeout: 5_000 });
    await expect(banner).toHaveAttribute("data-state", "signin");
    await expect(page.getByTestId("auth-gate-title")).toHaveText(/sign in required/i);

    // Sample banner state on a short interval while we tour the walls;
    // any transition away from "signin" is a flicker/regression.
    const observed: string[] = [];
    let stop = false;
    const sampler = (async () => {
      while (!stop) {
        const state = (await banner.getAttribute("data-state").catch(() => null)) ?? "missing";
        observed.push(state);
        await page.waitForTimeout(75);
      }
    })();

    for (const wall of TOUR.slice(1)) {
      await page.getByRole("link", { name: new RegExp(`^${wall.label}$`, "i") }).first().click();
      await page.waitForURL(`**${wall.to}`);
      await expect(banner, `banner missing on ${wall.to}`).toBeVisible();
      await expect(banner, `banner regressed on ${wall.to}`).toHaveAttribute("data-state", "signin");
      // Title text must never show the forbidden copy while gate is signin.
      await expect(page.getByTestId("auth-gate-title")).toHaveText(/sign in required/i);
      // No stale "Access denied" leaking through.
      await expect(page.getByText(/access denied/i)).toHaveCount(0);
    }

    stop = true;
    await sampler;

    // Every sample must have been "signin" — no flicker to ok/forbidden/missing.
    const bad = observed.filter((s) => s !== "signin");
    expect(bad, `unexpected banner states during navigation: ${bad.join(",")}`).toEqual([]);

    expect(pageErrors).toEqual([]);
  });

  test("forbidden state persists across walls (no downgrade to signin)", async ({ page }) => {
    await clearSession(page);
    await page.goto(`${BASE}${TOUR[0].to}`, { waitUntil: "domcontentloaded" });

    // Drive the gate to 'forbidden' explicitly, then verify it stays there
    // even as background 401s from unauth server-fn calls keep firing.
    await page.evaluate(() => {
      const g = (window as unknown as {
        __lovableAuthGate: {
          resetAuthGate: () => void;
          reportAuthError: (e: unknown) => void;
        };
      }).__lovableAuthGate;
      g.resetAuthGate();
      g.reportAuthError(new Error("Forbidden: boss role required"));
    });

    const banner = page.locator('[data-testid="auth-gate-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toHaveAttribute("data-state", "forbidden");

    for (const wall of TOUR.slice(1)) {
      await page.getByRole("link", { name: new RegExp(`^${wall.label}$`, "i") }).first().click();
      await page.waitForURL(`**${wall.to}`);
      await expect(banner).toBeVisible();
      // "forbidden" must be sticky — background 401s from unauth calls must
      // NOT downgrade it to "signin".
      await expect(banner).toHaveAttribute("data-state", "forbidden");
      await expect(page.getByTestId("auth-gate-title")).toHaveText(/access denied/i);
      await expect(page.getByTestId("auth-gate-signin")).toHaveCount(0);
    }
  });
});

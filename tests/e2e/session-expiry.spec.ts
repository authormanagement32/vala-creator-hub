import { test, expect, type Page } from "@playwright/test";
import { WALLS } from "../../src/features/author-manager/nav";

/**
 * Simulate a Supabase session expiring mid-navigation:
 *  1. Start signed-out to exercise the natural 401 path (equivalent to a
 *     just-expired session with no bearer). The gate must land on `signin`.
 *  2. Tour a few walls and verify the banner stays on `signin` with no
 *     flicker (no `ok` / `forbidden` / missing frames).
 *  3. Simulate re-authentication by resetting the gate — the banner must
 *     disappear cleanly and the page must remain interactive.
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080";
const TOUR = WALLS.slice(0, 5);

async function clearSession(page: Page) {
  await page.context().clearCookies();
  await page.goto(`${BASE}/`);
  await page.evaluate(() => {
    try { window.localStorage.clear(); } catch {}
    try { window.sessionStorage.clear(); } catch {}
  });
}

test.describe("Auth-gate · session expiry & recovery", () => {
  test("expired session shows sign-in banner without flicker; recovers on reset", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));

    await clearSession(page);
    await page.goto(`${BASE}${TOUR[0].to}`, { waitUntil: "domcontentloaded" });

    const banner = page.locator('[data-testid="auth-gate-banner"]');
    await expect(banner).toBeVisible({ timeout: 5_000 });
    await expect(banner).toHaveAttribute("data-state", "signin");

    // Sample state while navigating — any non-'signin' frame is a flicker.
    const observed: string[] = [];
    let stop = false;
    const sampler = (async () => {
      while (!stop) {
        const s = (await banner.getAttribute("data-state").catch(() => null)) ?? "missing";
        observed.push(s);
        await page.waitForTimeout(75);
      }
    })();

    for (const wall of TOUR.slice(1)) {
      await page.getByRole("link", { name: new RegExp(`^${wall.label}$`, "i") }).first().click();
      await page.waitForURL(`**${wall.to}`);
      await expect(banner).toBeVisible();
      await expect(banner).toHaveAttribute("data-state", "signin");
    }
    stop = true;
    await sampler;

    const bad = observed.filter((s) => s !== "signin");
    expect(bad, `flicker states: ${bad.join(",")}`).toEqual([]);

    // Recovery: simulate re-authentication by clearing the gate. The banner
    // must disappear and the page must stay interactive.
    await page.evaluate(() => {
      (window as unknown as {
        __lovableAuthGate: { resetAuthGate: () => void };
      }).__lovableAuthGate.resetAuthGate();
    });
    await expect(banner).toHaveCount(0);

    // Still interactive: navigation still works after recovery.
    const next = TOUR[1];
    await page.getByRole("link", { name: new RegExp(`^${next.label}$`, "i") }).first().click();
    await page.waitForURL(`**${next.to}`);

    expect(pageErrors).toEqual([]);
  });

  test("mid-tour expiry: rate_limited upgrades to signin, never downgrades back", async ({ page }) => {
    await clearSession(page);
    await page.goto(`${BASE}${TOUR[0].to}`, { waitUntil: "domcontentloaded" });

    const banner = page.locator('[data-testid="auth-gate-banner"]');

    // Drive gate to rate_limited first (transient 429), then have the
    // "expired session" 401 arrive — signin must take precedence and stay.
    await page.evaluate(() => {
      const g = (window as unknown as {
        __lovableAuthGate: {
          resetAuthGate: () => void;
          reportAuthError: (e: unknown) => void;
        };
      }).__lovableAuthGate;
      g.resetAuthGate();
      g.reportAuthError(new Error("HTTP 429 Too Many Requests"));
    });
    await expect(banner).toHaveAttribute("data-state", "rate_limited");

    await page.evaluate(() => {
      (window as unknown as {
        __lovableAuthGate: { reportAuthError: (e: unknown) => void };
      }).__lovableAuthGate.reportAuthError(
        new Error("Unauthorized: No authorization header provided"),
      );
    });
    await expect(banner).toHaveAttribute("data-state", "signin");

    // Later 429s must NOT downgrade signin.
    await page.evaluate(() => {
      (window as unknown as {
        __lovableAuthGate: { reportAuthError: (e: unknown) => void };
      }).__lovableAuthGate.reportAuthError(new Error("429 Too Many Requests"));
    });
    await expect(banner).toHaveAttribute("data-state", "signin");
  });
});

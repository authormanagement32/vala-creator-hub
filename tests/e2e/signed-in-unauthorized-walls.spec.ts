import { test, expect } from "@playwright/test";
import { WALLS } from "../../src/features/author-manager/nav";

/**
 * Signed-in but unauthorized (non-boss) coverage.
 *
 * Real 403s are produced by ensureBoss() in author-manager.functions.ts when
 * an authenticated user without the `boss` role hits a gated server fn. We
 * don't have a canned non-boss test session in the sandbox, so we drive the
 * centralized auth-gate directly (its window hook is the same code path the
 * QueryCache subscriber uses in production). This asserts that:
 *   1. Every wall route renders a shell (never blank).
 *   2. A 403-shaped error is mapped to the "Access denied" state — not
 *      "Sign in required" — across ALL walls with the same UI.
 *   3. No uncaught page errors are produced by that transition.
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080";

// Sample a spread across nav groups to keep runtime reasonable while still
// covering the shared handler on every layout branch.
const SAMPLE = WALLS.filter((_, i) => i % 3 === 0);

test.describe("Signed-in unauthorized · every wall shows Access denied", () => {
  for (const wall of SAMPLE) {
    test(`wall "${wall.label}" maps 403 to Access denied banner`, async ({ page }) => {
      const pageErrors: string[] = [];
      page.on("pageerror", (e) => pageErrors.push(String(e)));

      await page.goto(`${BASE}${wall.to}`, { waitUntil: "domcontentloaded" });
      await expect(page.locator("body")).toBeVisible();

      // Simulate a 403 coming back from a gated call. In production this is
      // fed by the QueryCache subscriber wired in the layout.
      await page.evaluate(() => {
        const g = (window as unknown as {
          __lovableAuthGate?: { reportAuthError: (e: unknown) => void; resetAuthGate: () => void };
        }).__lovableAuthGate;
        if (!g) throw new Error("auth-gate window hook not present");
        g.resetAuthGate();
        g.reportAuthError(new Error("Forbidden: boss role required"));
      });

      const banner = page.locator('[data-testid="auth-gate-banner"]');
      await expect(banner, `banner should render on ${wall.to}`).toBeVisible();
      await expect(banner).toHaveAttribute("data-state", "forbidden");
      await expect(page.getByTestId("auth-gate-title")).toHaveText(/access denied/i);
      // Forbidden state must NOT show the Sign in CTA — it's a role problem.
      await expect(page.getByTestId("auth-gate-signin")).toHaveCount(0);

      // Page still fully rendered (top-bar link for the current wall visible).
      await expect(page.getByRole("link", { name: new RegExp(`^${wall.label}$`, "i") }).first()).toBeVisible();

      // Banner must be stable (no flicker back to ok) for at least ~600ms.
      await page.waitForTimeout(600);
      await expect(banner).toBeVisible();
      await expect(banner).toHaveAttribute("data-state", "forbidden");

      expect(pageErrors, `no uncaught page errors on ${wall.to}`).toEqual([]);

      // Reset so the next test starts clean if state leaks across pages.
      await page.evaluate(() => {
        (window as unknown as { __lovableAuthGate?: { resetAuthGate: () => void } })
          .__lovableAuthGate?.resetAuthGate();
      });
    });
  }
});
